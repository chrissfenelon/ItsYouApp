/**
 * Script to create Firebase Auth users for admin panel
 * Run: npx ts-node scripts/create-admin-firebase-users.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmFNE6FF6ZLxvNSXnTIb-Tp0qWL8YJWVw",
  authDomain: "timaket-cbc41.firebaseapp.com",
  databaseURL: "https://timaket-cbc41-default-rtdb.firebaseio.com",
  projectId: "timaket-cbc41",
  storageBucket: "timaket-cbc41.firebasestorage.app",
  messagingSenderId: "636471943959",
  appId: "1:636471943959:web:6f7b8cd507158661c40d52"
};

// Admin users to create
const ADMIN_USERS = [
  {
    email: 'chrissfenelon@gmail.com',
    password: 'admin123',
    name: 'Chris Fenelon'
  },
  {
    email: 'acapellaudios@gmail.com',
    password: 'admin456',
    name: 'Acapella Admin'
  }
];

async function createAdminUsers() {
  console.log('🔧 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  console.log('👤 Creating admin users in Firebase Auth...\n');

  for (const admin of ADMIN_USERS) {
    try {
      console.log(`Creating user: ${admin.email}...`);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        admin.email,
        admin.password
      );

      console.log(`✅ Successfully created: ${admin.email}`);
      console.log(`   UID: ${userCredential.user.uid}`);
      console.log(`   Email: ${userCredential.user.email}\n`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User already exists: ${admin.email}\n`);
      } else {
        console.error(`❌ Error creating ${admin.email}:`, error.message, '\n');
      }
    }
  }

  console.log('✅ Admin user creation completed!');
  console.log('\nYou can now log in to the admin panel with these credentials.');
  process.exit(0);
}

// Run the script
createAdminUsers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
