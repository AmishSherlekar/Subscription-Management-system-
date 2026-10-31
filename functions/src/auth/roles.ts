import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Assign custom role claims (admin, staff, customer) to Firebase Auth users
 * Only accessible by verified Admin
 */
export const setUserRoleCallable = onCall(async (request) => {
  const callerRole = request.auth?.token?.role;
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can assign user roles.');
  }

  const { targetUid, role, customerId } = request.data;
  if (!targetUid || !['admin', 'staff', 'customer'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid target user ID or role.');
  }

  const claims: Record<string, any> = { role };
  if (role === 'customer' && customerId) {
    claims.customerId = customerId;
  }

  await admin.auth().setCustomUserClaims(targetUid, claims);

  // Sync to users collection
  await admin.firestore().collection('users').doc(targetUid).set(
    {
      role,
      customerId: customerId || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { success: true, uid: targetUid, role };
});
