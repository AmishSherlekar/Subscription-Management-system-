import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase configuration provided in workspace
export const firebaseConfig = {
  apiKey: "AIzaSyCZ_ehNCMipGK8QWk4niP5vghI1rZc2s1c",
  authDomain: "subscription-7a4ab.firebaseapp.com",
  projectId: "subscription-7a4ab",
  storageBucket: "subscription-7a4ab.firebasestorage.app",
  messagingSenderId: "327845037696",
  appId: "1:327845037696:web:eb3d09f8cc12803ffa4865",
  measurementId: "G-3KKTLQ0PDP"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization warning:', error);
}

export { app, auth, db, storage };
