import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { format } from 'date-fns';

const db = admin.firestore();

/**
 * Cloud Function to update subscription status (pause, resume, cancel, renew)
 */
export const updateSubscriptionLifecycleCallable = onCall(async (request) => {
  const role = request.auth?.token?.role;
  if (!role || (role !== 'admin' && role !== 'staff')) {
    throw new HttpsError('permission-denied', 'Unauthorized to modify subscription lifecycle.');
  }

  const { subscriptionId, action, reason } = request.data;
  if (!subscriptionId || !action) {
    throw new HttpsError('invalid-argument', 'subscriptionId and action are required.');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const subRef = db.collection('subscriptions').doc(subscriptionId);
  const subDoc = await subRef.get();

  if (!subDoc.exists) {
    throw new HttpsError('not-found', 'Subscription not found.');
  }

  const sub = subDoc.data()!;

  if (action === 'pause') {
    if (!sub.allowPause) {
      throw new HttpsError('failed-precondition', 'Plan does not permit pausing.');
    }
    const pauseRecord = { pausedAt: today, reason: reason || 'Staff paused' };
    await subRef.update({
      status: 'paused',
      pauseHistory: admin.firestore.FieldValue.arrayUnion(pauseRecord),
      history: admin.firestore.FieldValue.arrayUnion({
        action: 'Subscription Paused',
        timestamp: new Date().toISOString(),
        performedBy: request.auth?.token?.name || 'Staff',
        details: reason || '',
      }),
      updatedAt: today,
    });
    return { success: true, status: 'paused' };
  }

  if (action === 'resume') {
    await subRef.update({
      status: 'active',
      history: admin.firestore.FieldValue.arrayUnion({
        action: 'Subscription Resumed',
        timestamp: new Date().toISOString(),
        performedBy: request.auth?.token?.name || 'Staff',
      }),
      updatedAt: today,
    });
    return { success: true, status: 'active' };
  }

  if (action === 'cancel') {
    if (!sub.allowEarlyClosure && sub.status === 'active') {
      throw new HttpsError('failed-precondition', 'Early closure not permitted on this plan.');
    }
    await subRef.update({
      status: 'cancelled',
      cancellationReason: reason || 'Cancelled by staff',
      history: admin.firestore.FieldValue.arrayUnion({
        action: 'Subscription Cancelled',
        timestamp: new Date().toISOString(),
        performedBy: request.auth?.token?.name || 'Staff',
        details: reason || '',
      }),
      updatedAt: today,
    });
    return { success: true, status: 'cancelled' };
  }

  throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
});
