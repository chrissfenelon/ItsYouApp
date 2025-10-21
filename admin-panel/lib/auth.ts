import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface AdminUser {
  id: string;
  email: string;
  role: 'super-admin' | 'admin';
}

export interface SessionData {
  user: AdminUser;
  expires: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create JWT token
export async function createToken(user: AdminUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(SECRET_KEY);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

// Get session from cookie
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Get session from request
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Set session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Delete session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}

// Require authentication (for API routes)
export async function requireAuth(): Promise<AdminUser> {
  // TEMPORARY: Bypass authentication for testing
  // TODO: Remove this and uncomment the real auth check below
  return {
    id: 'temp-admin',
    email: 'admin@itsyouapp.com',
    role: 'super-admin',
  };

  /* // Real authentication - uncomment when ready
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
  */
}
