import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_TAX_RULES,
  INITIAL_DISCOUNT_RULES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_USERS,
} from '../src/services/mockData';

const firebaseConfig = {
  apiKey: "AIzaSyCZ_ehNCMipGK8QWk4niP5vghI1rZc2s1c",
  authDomain: "subscription-7a4ab.firebaseapp.com",
  projectId: "subscription-7a4ab",
  storageBucket: "subscription-7a4ab.firebasestorage.app",
  messagingSenderId: "327845037696",
  appId: "1:327845037696:web:eb3d09f8cc12803ffa4865",
  measurementId: "G-3KKTLQ0PDP"
};

async function main() {
  console.log('Connecting to Firebase Project:', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Checking current collections in Firestore...');

  try {
    const custSnap = await getDocs(collection(db, 'customers'));
    console.log(`Current 'customers' collection size in Firestore: ${custSnap.size}`);

    if (custSnap.size > 0) {
      console.log('Firestore already contains customer data.');
    } else {
      console.log('Firestore is empty. Starting seed process...');
    }

    console.log('Uploading all initial collections to Firestore (Spark Free Tier)...');
    const batch = writeBatch(db);

    // 1. Users
    for (const u of INITIAL_USERS) {
      batch.set(doc(db, 'users', u.uid), u, { merge: true });
    }

    // 2. Customers
    for (const c of INITIAL_CUSTOMERS) {
      batch.set(doc(db, 'customers', c.id), c, { merge: true });
    }

    // 3. Products
    for (const p of INITIAL_PRODUCTS) {
      batch.set(doc(db, 'products', p.id), p, { merge: true });
    }

    // 4. Plans
    for (const pl of INITIAL_PLANS) {
      batch.set(doc(db, 'plans', pl.id), pl, { merge: true });
    }

    // 5. Tax Rules
    for (const t of INITIAL_TAX_RULES) {
      batch.set(doc(db, 'taxRules', t.id), t, { merge: true });
    }

    // 6. Discount Rules
    for (const d of INITIAL_DISCOUNT_RULES) {
      batch.set(doc(db, 'discountRules', d.id), d, { merge: true });
    }

    // 7. Subscriptions
    for (const s of INITIAL_SUBSCRIPTIONS) {
      batch.set(doc(db, 'subscriptions', s.id), s, { merge: true });
    }

    // 8. Invoices
    for (const i of INITIAL_INVOICES) {
      batch.set(doc(db, 'invoices', i.id), i, { merge: true });
    }

    // 9. Payments
    for (const pay of INITIAL_PAYMENTS) {
      batch.set(doc(db, 'payments', pay.id), pay, { merge: true });
    }

    await batch.commit();
    console.log('SUCCESS! All seed data successfully uploaded to Firebase Cloud Firestore:');
    console.log(`- ${INITIAL_USERS.length} Users`);
    console.log(`- ${INITIAL_CUSTOMERS.length} Customers`);
    console.log(`- ${INITIAL_PRODUCTS.length} Products`);
    console.log(`- ${INITIAL_PLANS.length} Plans`);
    console.log(`- ${INITIAL_TAX_RULES.length} Tax Rules`);
    console.log(`- ${INITIAL_DISCOUNT_RULES.length} Discount Rules`);
    console.log(`- ${INITIAL_SUBSCRIPTIONS.length} Subscriptions`);
    console.log(`- ${INITIAL_INVOICES.length} Invoices`);
    console.log(`- ${INITIAL_PAYMENTS.length} Payments`);
  } catch (err: any) {
    console.error('Firestore operation status:', err?.code || err?.message || err);
  }
}

main();
