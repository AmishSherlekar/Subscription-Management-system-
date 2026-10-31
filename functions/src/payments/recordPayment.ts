import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { format } from 'date-fns';

const db = admin.firestore();

/**
 * Cloud Function to record payments against invoices safely with atomic updates.
 */
export const recordPaymentCallable = onCall(async (request) => {
  const role = request.auth?.token?.role;
  if (!role || (role !== 'admin' && role !== 'staff')) {
    throw new HttpsError('permission-denied', 'Only staff and admin can record payments.');
  }

  const { invoiceId, amount, paymentMethod, transactionReference, notes } = request.data;
  if (!invoiceId || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Valid invoiceId and positive amount are required.');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  return await db.runTransaction(async (transaction) => {
    const invRef = db.collection('invoices').doc(invoiceId);
    const invDoc = await transaction.get(invRef);
    if (!invDoc.exists) {
      throw new HttpsError('not-found', 'Invoice not found.');
    }

    const inv = invDoc.data()!;
    if (inv.status === 'paid') {
      throw new HttpsError('failed-precondition', 'Invoice is already paid in full.');
    }
    if (inv.status === 'cancelled') {
      throw new HttpsError('failed-precondition', 'Cannot accept payment for cancelled invoice.');
    }
    if (amount > inv.outstandingBalance) {
      throw new HttpsError('invalid-argument', `Payment amount exceeds invoice balance.`);
    }

    // Generate payment number
    const counterRef = db.collection('system').doc('counters');
    const counterDoc = await transaction.get(counterRef);
    let payNum = 1;
    if (counterDoc.exists) {
      payNum = (counterDoc.data()?.paymentNumber || 0) + 1;
      transaction.update(counterRef, { paymentNumber: payNum });
    } else {
      transaction.set(counterRef, { paymentNumber: 1 });
    }

    const paymentNumber = `PAY-2026-${String(payNum).padStart(4, '0')}`;
    const newPaymentRef = db.collection('payments').doc();

    const paymentData = {
      paymentNumber,
      invoiceId,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount,
      paymentMethod,
      paymentDate: today,
      transactionReference: transactionReference || `TXN-${Date.now()}`,
      notes: notes || '',
      recordedByUid: request.auth?.uid || 'staff',
      recordedByName: request.auth?.token?.name || 'Staff User',
      createdAt: today,
    };

    transaction.set(newPaymentRef, paymentData);

    const newAmountPaid = (inv.amountPaid || 0) + amount;
    const newOutstanding = Math.max(0, inv.grandTotal - newAmountPaid);
    const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

    transaction.update(invRef, {
      amountPaid: newAmountPaid,
      outstandingBalance: newOutstanding,
      status: newStatus,
      paymentIds: admin.firestore.FieldValue.arrayUnion(newPaymentRef.id),
      updatedAt: today,
    });

    return {
      success: true,
      paymentNumber,
      amountPaid: newAmountPaid,
      outstandingBalance: newOutstanding,
      status: newStatus,
    };
  });
});
