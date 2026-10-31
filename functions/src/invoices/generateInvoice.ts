import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { addDays, format } from 'date-fns';

const db = admin.firestore();

/**
 * Cloud Function to generate an invoice for a specific subscription idempotently.
 */
export const generateInvoiceCallable = onCall(async (request) => {
  const role = request.auth?.token?.role;
  if (!role || (role !== 'admin' && role !== 'staff')) {
    throw new HttpsError('permission-denied', 'Unauthorized. Staff or admin role required.');
  }

  const { subscriptionId } = request.data;
  if (!subscriptionId) {
    throw new HttpsError('invalid-argument', 'subscriptionId is required.');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  return await db.runTransaction(async (transaction) => {
    const subRef = db.collection('subscriptions').doc(subscriptionId);
    const subDoc = await transaction.get(subRef);
    if (!subDoc.exists) {
      throw new HttpsError('not-found', 'Subscription not found.');
    }

    const sub = subDoc.data()!;
    if (sub.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Cannot invoice a non-active subscription.');
    }

    const periodStart = sub.nextBillingDate || today;
    const periodEnd = format(addDays(new Date(periodStart), 30), 'yyyy-MM-dd');
    const billingPeriodKey = `${subscriptionId}_${periodStart}_${periodEnd}`;

    // Idempotency check
    const existing = await transaction.get(
      db.collection('invoices').where('billingPeriodKey', '==', billingPeriodKey).limit(1)
    );
    if (!existing.empty) {
      throw new HttpsError('already-exists', 'An invoice for this billing period already exists.');
    }

    // Next sequential invoice number
    const counterRef = db.collection('system').doc('counters');
    const counterDoc = await transaction.get(counterRef);
    let invNum = 1;
    if (counterDoc.exists) {
      invNum = (counterDoc.data()?.invoiceNumber || 0) + 1;
      transaction.update(counterRef, { invoiceNumber: invNum });
    } else {
      transaction.set(counterRef, { invoiceNumber: 1 });
    }

    const invoiceNumber = `INV-2026-${String(invNum).padStart(4, '0')}`;
    const newInvoiceRef = db.collection('invoices').doc();

    const invoiceData = {
      invoiceNumber,
      customerId: sub.customerId,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      customerCompany: sub.customerCompany,
      subscriptionId,
      subscriptionNumber: sub.subscriptionNumber,
      billingPeriodKey,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      invoiceDate: today,
      dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
      items: sub.items || [],
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
      notes: `Invoice for ${sub.planName}`,
      paymentIds: [],
      createdAt: today,
      updatedAt: today,
    };

    transaction.set(newInvoiceRef, invoiceData);
    return { success: true, invoiceId: newInvoiceRef.id, invoiceNumber };
  });
});
