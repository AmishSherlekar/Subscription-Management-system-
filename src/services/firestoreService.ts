import {
  collection,
  doc,
  getDocs,
  setDoc,
  runTransaction,
  writeBatch,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type UserCredential,
} from 'firebase/auth';
import { auth, db } from './firebase';
import type {
  Product,
  SubscriptionPlan,
  TaxRule,
  DiscountRule,
  Customer,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  UserProfile,
  BillingExecutionJob,
} from '../types';

/**
 * Validate password requirements as mandated by Brightloop:
 * - More than 8 characters.
 * - At least one uppercase letter.
 * - At least one lowercase letter.
 * - At least one special character.
 */
export function validatePasswordRequirements(password: string): { valid: boolean; error?: string } {
  if (password.length <= 8) {
    return { valid: false, error: 'Password must be more than 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

/**
 * Test direct Cloud Firestore connectivity
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    if (!db) {
      return { connected: false, message: 'Firebase Firestore is not initialized.' };
    }
    const testDocRef = doc(db, 'system', 'connectionCheck');
    await setDoc(testDocRef, {
      lastChecked: new Date().toISOString(),
      status: 'operational',
    });
    return { connected: true, message: 'Successfully connected to Firebase Cloud Firestore!' };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Failed to connect to Firebase Firestore. Check rules/permissions.',
    };
  }
}

/**
 * Push full Brightloop data collections directly to live Cloud Firestore (100% Free Tier)
 */
export async function pushAllToFirestore(data: {
  customers: Customer[];
  products: Product[];
  plans: SubscriptionPlan[];
  taxRules: TaxRule[];
  discountRules: DiscountRule[];
  quotations: Quotation[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
}): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Firestore not available' };
  }

  try {
    const batch = writeBatch(db);

    // Customers
    data.customers.forEach((c) => {
      batch.set(doc(db, 'customers', c.id), c, { merge: true });
    });

    // Products
    data.products.forEach((p) => {
      batch.set(doc(db, 'products', p.id), p, { merge: true });
    });

    // Plans
    data.plans.forEach((pl) => {
      batch.set(doc(db, 'plans', pl.id), pl, { merge: true });
    });

    // Tax Rules
    data.taxRules.forEach((t) => {
      batch.set(doc(db, 'taxRules', t.id), t, { merge: true });
    });

    // Discount Rules
    data.discountRules.forEach((d) => {
      batch.set(doc(db, 'discountRules', d.id), d, { merge: true });
    });

    // Subscriptions
    data.subscriptions.forEach((s) => {
      batch.set(doc(db, 'subscriptions', s.id), s, { merge: true });
    });

    // Invoices
    data.invoices.forEach((i) => {
      batch.set(doc(db, 'invoices', i.id), i, { merge: true });
    });

    // Payments
    data.payments.forEach((pay) => {
      batch.set(doc(db, 'payments', pay.id), pay, { merge: true });
    });

    await batch.commit();

    return {
      success: true,
      message: `Successfully synchronized all Brightloop records to Cloud Firestore!`,
    };
  } catch (err: any) {
    console.error('Firestore sync error:', err);
    return {
      success: false,
      message: `Firestore write error: ${err?.message || err}. (Note: If using fresh Firestore, ensure read/write rules are published in Firebase Console)`,
    };
  }
}

/**
 * Register user with email and password via Firebase Auth
 */
export async function registerWithFirebase(
  email: string,
  pass: string,
  displayName: string,
  role: 'admin' | 'staff' | 'customer'
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const check = validatePasswordRequirements(pass);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  try {
    const cred: UserCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || email.split('@')[0],
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Save profile to Firestore
    if (db) {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    }

    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

/**
 * Login user via Firebase Auth
 */
export async function loginWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, uid: cred.user.uid };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
}

/**
 * Send password reset email via Firebase Auth
 */
export async function sendResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send reset link.' };
  }
}

/**
 * Logout
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn(e);
  }
}
