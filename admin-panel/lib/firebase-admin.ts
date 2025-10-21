import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // Check if required env vars exist
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is not set in environment variables');
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_CLIENT_EMAIL is not set in environment variables');
    }

    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Initialize the app
const firebaseAdmin = initializeFirebaseAdmin();

// Export convenient references
export const db = firebaseAdmin.firestore();
export const storage = firebaseAdmin.storage();
export const auth = firebaseAdmin.auth();

export default firebaseAdmin;
