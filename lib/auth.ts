import { cookies } from 'next/headers';

export interface AuthSession {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER';
}

const COOKIE_NAME = 'presensiku_session';

export async function setAuthCookie(session: AuthSession) {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(session)).toString('base64');
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    
    const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8');
    return JSON.parse(decoded) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
