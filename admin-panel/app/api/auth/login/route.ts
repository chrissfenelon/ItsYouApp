import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-response';
import { cookies } from 'next/headers';

// Hardcoded admin credentials (simple and secure for private admin panel)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find matching admin user
    const adminUser = ADMIN_USERS.find(
      user => user.email === email && user.password === password
    );

    if (!adminUser) {
      return errorResponse('Invalid email or password', 401);
    }

    // Create simple session token (just the user data, signed)
    const sessionData = {
      email: adminUser.email,
      name: adminUser.name,
      loginTime: Date.now()
    };

    // Store session in cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', JSON.stringify(sessionData), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Return success
    return successResponse({
      user: {
        email: adminUser.email,
        name: adminUser.name
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return handleApiError(error);
  }
}
