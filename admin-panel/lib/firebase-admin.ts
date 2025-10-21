import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Lazy initialization - only initialize when actually needed
let firebaseAdmin: admin.app.App | null = null;

function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  if (admin.apps.length > 0) {
    firebaseAdmin = admin.app();
    return firebaseAdmin;
  }

  try {
    // Check if required env vars exist
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.warn('⚠️ FIREBASE_PROJECT_ID is not set - Firebase Admin SDK will not be available');
      throw new Error('FIREBASE_PROJECT_ID is not set in environment variables');
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('⚠️ FIREBASE_CLIENT_EMAIL is not set - Firebase Admin SDK will not be available');
      throw new Error('FIREBASE_CLIENT_EMAIL is not set in environment variables');
    }

    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠️ FIREBASE_PRIVATE_KEY is not set - Firebase Admin SDK will not be available');
      throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
    }

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseAdmin;

  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Export lazy getters that initialize on first access
export const getDb = () => getFirebaseAdmin().firestore();
export const getStorage = () => getFirebaseAdmin().storage();
export const getAuth = () => getFirebaseAdmin().auth();

// For backward compatibility
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    return (getDb() as any)[prop];
  }
});

export const storage = new Proxy({} as admin.storage.Storage, {
  get(target, prop) {
    return (getStorage() as any)[prop];
  }
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    return (getAuth() as any)[prop];
  }
});

export default getFirebaseAdmin;
