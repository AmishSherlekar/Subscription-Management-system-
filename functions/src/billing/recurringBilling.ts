import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

const db = admin.firestore();

function getNextDate(startDateStr: string, frequency: string): string {
  const d = new Date(startDateStr);
  let next: Date;
  switch (frequency) {
    case 'daily': next = addDays(d, 1); break;
    case 'weekly': next = addWeeks(d, 1); break;
    case 'monthly': next = addMonths(d, 1); break;
    case 'yearly': next = addYears(d, 1); break;
    default: next = addMonths(d, 1);
  }
  return format(next, 'yyyy-MM-dd');
}

function getPeriodEnd(startDateStr: string, frequency: string): string {
  const next = getNextDate(startDateStr, frequency);
  const end = addDays(new Date(next), -1);
  return format(end, 'yyyy-MM-dd');
}

/**
 * Scheduled Cloud Function running daily at 00:00 UTC
 * Processes active subscriptions in controlled batches of 50 to prevent memory spikes & timeouts.
 */
export const scheduledRecurringBilling = onSchedule('0 0 * * *', async (event) => {
  await runRecurringBillingBatch();
});

/**
 * Callable Function for Staff / Admin to trigger or test on-demand batch billing
 */
export const triggerRecurringBillingCallable = onCall(async (request) => {
  // Enforce staff/admin permission
  const role = request.auth?.token?.role;
  if (!role || (role !== 'admin' && role !== 'staff')) {
    throw new HttpsError('permission-denied', 'Only authorized staff or admin can trigger billing jobs.');
  }
  return await runRecurringBillingBatch();
});

export async function runRecurringBillingBatch() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const logs: string[] = [];
  let evaluated = 0;
  let created = 0;
  let errors = 0;

  logs.push(`[START] Recurring billing batch executed for date: ${today}`);

  // Query active subscriptions where nextBillingDate <= today in batches of 50
  const subsSnapshot = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .where('nextBillingDate', '<=', today)
    .limit(50)
    .get();

  evaluated = subsSnapshot.size;
  logs.push(`Found ${evaluated} active subscriptions eligible for renewal.`);

  for (const doc of subsSnapshot.docs) {
    const sub = doc.data();
    const periodStart = sub.nextBillingDate || today;
    const periodEnd = getPeriodEnd(periodStart, sub.billingFrequency || 'monthly');
    const billingPeriodKey = `${doc.id}_${periodStart}_${periodEnd}`;

    try {
      await db.runTransaction(async (transaction) => {
        // 1. Idempotency Check: Verify if invoice with billingPeriodKey already exists
        const existingInvQuery = await transaction.get(
          db.collection('invoices').where('billingPeriodKey', '==', billingPeriodKey).limit(1)
        );

        if (!existingInvQuery.empty) {
          logs.push(`[SKIP] Idempotency: Subscription ${sub.subscriptionNumber} already has invoice for period ${periodStart} - ${periodEnd}`);
          return;
        }

        // 2. Fetch invoice counter for concurrency-safe sequential invoice number
        const counterRef = db.collection('system').doc('counters');
        const counterDoc = await transaction.get(counterRef);
        let currentInvNumber = 1;
        if (counterDoc.exists) {
          currentInvNumber = (counterDoc.data()?.invoiceNumber || 0) + 1;
          transaction.update(counterRef, { invoiceNumber: currentInvNumber });
        } else {
          transaction.set(counterRef, { invoiceNumber: 1 });
        }

        const invoiceNumber = `INV-2026-${String(currentInvNumber).padStart(4, '0')}`;
        const newInvoiceRef = db.collection('invoices').doc();

        // 3. Snapshot line items, tax and price in integer paise
        const invoiceLines = (sub.items || []).map((it: any) => {
          const taxable = it.lineSubtotal || 0;
          const taxAmt = Math.round((taxable * (sub.taxRatePercent || 0)) / 100);
          return {
            productId: it.productId,
            variantId: it.variantId || null,
            productName: it.productName,
            variantName: it.variantName || null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineSubtotal: it.lineSubtotal,
            discountAmount: 0,
            taxableAmount: taxable,
            taxRatePercent: sub.taxRatePercent || 0,
            taxAmount: taxAmt,
            totalAmount: taxable + taxAmt,
          };
        });

        const invoiceData = {
          invoiceNumber,
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          customerCompany: sub.customerCompany,
          subscriptionId: doc.id,
          subscriptionNumber: sub.subscriptionNumber,
          billingPeriodKey,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          invoiceDate: today,
          dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
          items: invoiceLines,
          subtotal: sub.subtotal,
          discountTotal: sub.discountAmount || 0,
          taxableAmount: (sub.subtotal || 0) - (sub.discountAmount || 0),
          taxRatePercent: sub.taxRatePercent || 0,
          taxRuleName: (sub.taxRatePercent || 0) > 0 ? 'GST 18%' : 'Exempt',
          taxTotal: sub.taxAmount || 0,
          grandTotal: sub.totalAmount || 0,
          amountPaid: 0,
          outstandingBalance: sub.totalAmount || 0,
          status: 'confirmed',
          notes: `Automated scheduled billing for period ${periodStart} to ${periodEnd}`,
          paymentIds: [],
          createdAt: today,
          updatedAt: today,
        };

        transaction.set(newInvoiceRef, invoiceData);

        // 4. Advance nextBillingDate on the subscription
        const nextNextBilling = getNextDate(periodStart, sub.billingFrequency || 'monthly');
        transaction.update(doc.ref, {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          nextBillingDate: nextNextBilling,
          updatedAt: today,
        });

        created++;
        logs.push(`[SUCCESS] Created ${invoiceNumber} for Subscription ${sub.subscriptionNumber}`);
      });
    } catch (err: any) {
      errors++;
      logs.push(`[ERROR] Processing subscription ${doc.id}: ${err?.message || err}`);
    }
  }

  // 5. Store billing execution job record in Firestore
  const jobRecord = {
    runAt: new Date().toISOString(),
    type: 'scheduled_batch',
    subscriptionsEvaluated: evaluated,
    invoicesCreated: created,
    errorsCount: errors,
    status: errors > 0 ? 'partial' : created > 0 ? 'completed' : 'no_actions_needed',
    details: logs,
  };

  await db.collection('billingJobs').add(jobRecord);
  return jobRecord;
}
