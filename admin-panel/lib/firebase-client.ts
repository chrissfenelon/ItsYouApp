// Firebase Client Configuration for ItsYou Admin Panel
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  where,
  limit,
  Timestamp,
  writeBatch,
  getDoc,
  setDoc,
  startAfter
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Firebase Configuration for ItsYou App
const firebaseConfig = {
  apiKey: "AIzaSyAmFNE6FF6ZLxvNSXnTIb-Tp0qWL8YJWVw",
  authDomain: "timaket-cbc41.firebaseapp.com",
  databaseURL: "https://timaket-cbc41-default-rtdb.firebaseio.com",
  projectId: "timaket-cbc41",
  storageBucket: "timaket-cbc41.firebasestorage.app",
  messagingSenderId: "636471943959",
  appId: "1:636471943959:web:6f7b8cd507158661c40d52"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, Timestamp };
export type {
  QueryDocumentSnapshot,
  DocumentData,
  CollectionReference,
  Query
} from 'firebase/firestore';

// Export Firebase functions
export {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  where,
  limit,
  writeBatch,
  getDoc,
  setDoc,
  startAfter,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
