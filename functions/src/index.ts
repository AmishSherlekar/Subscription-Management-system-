import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

export {
  scheduledRecurringBilling,
  triggerRecurringBillingCallable,
} from './billing/recurringBilling';

export { generateInvoiceCallable } from './invoices/generateInvoice';
export { recordPaymentCallable } from './payments/recordPayment';
export { updateSubscriptionLifecycleCallable } from './subscriptions/lifecycle';
export { setUserRoleCallable } from './auth/roles';
