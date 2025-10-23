import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBfH6hzp26TfnCIQuEoDlUreZ_QmTXHUI4",
  authDomain: "timaket-cbc41.firebaseapp.com",
  databaseURL: "https://timaket-cbc41-default-rtdb.firebaseio.com",
  projectId: "timaket-cbc41",
  storageBucket: "timaket-cbc41.firebasestorage.app",
  messagingSenderId: "636471943959",
  appId: "1:636471943959:android:bc7d939f1e0d95a2c40d52"
};

let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

// Initialiser Firebase une seule fois
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

firestore = getFirestore(app);
auth = getAuth(app);

export { app, firestore, auth };
