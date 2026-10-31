// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZ_ehNCMipGK8QWk4niP5vghI1rZc2s1c",
  authDomain: "subscription-7a4ab.firebaseapp.com",
  projectId: "subscription-7a4ab",
  storageBucket: "subscription-7a4ab.firebasestorage.app",
  messagingSenderId: "327845037696",
  appId: "1:327845037696:web:eb3d09f8cc12803ffa4865",
  measurementId: "G-3KKTLQ0PDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

