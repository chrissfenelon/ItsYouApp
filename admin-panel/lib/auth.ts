import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface AdminUser {
  email: string;
  name: string;
}

export interface SessionData {
  user: AdminUser;
}

// Verify simple session cookie
function verifySessionData(sessionJson: string): SessionData | null {
  try {
    const data = JSON.parse(sessionJson);

    // Basic validation
    if (!data.email || !data.name || !data.loginTime) {
      return null;
    }

    // Check if session is not expired (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - data.loginTime > maxAge) {
      return null;
    }

    return {
      user: {
        email: data.email,
        name: data.name
      }
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

// Get session from cookie
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    return verifySessionData(sessionCookie);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Get session from request (for middleware)
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    return verifySessionData(sessionCookie);
  } catch (error) {
    console.error('Error getting session from request:', error);
    return null;
  }
}

// Delete session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

// Require authentication (for API routes)
export async function requireAuth(): Promise<AdminUser> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
}
