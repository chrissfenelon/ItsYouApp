/**
 * Script to create the first admin user in Firestore
 * Run with: npx tsx scripts/create-admin.ts
 */

import { db } from '../lib/firebase-admin';
import { hashPassword } from '../lib/auth';

async function createAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@itsyouapp.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('Creating admin user...');
    console.log('Email:', email);

    // Check if admin already exists
    const existingAdmin = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      console.log('❌ Admin user already exists with this email!');
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const adminRef = await db.collection('admins').add({
      email,
      passwordHash,
      role: 'super-admin',
      createdAt: new Date(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('Admin ID:', adminRef.id);
    console.log('\nLogin credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n⚠️  IMPORTANT: Change your password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
