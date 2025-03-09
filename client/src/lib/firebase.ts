import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
console.log('Initializing Firebase app with config:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
}); // Log config without sensitive data

let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);

  console.log('Initializing Firebase auth...');
  auth = getAuth(app);

  console.log('Initializing Firebase firestore...');
  db = getFirestore(app);

  console.log('Initializing Firebase storage...');
  storage = getStorage(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error; // Re-throw to prevent app from starting with invalid Firebase config
}

export { app, auth, db, storage };