import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get admin user from Firestore
    const adminsSnapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (adminsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const adminDoc = adminsSnapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password
    const isValid = await verifyPassword(password, adminData.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const user = {
      id: adminDoc.id,
      email: adminData.email,
      role: adminData.role || 'admin',
    };

    const token = await createToken(user);

    // Set cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
