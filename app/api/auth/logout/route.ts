import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';

export async function POST() {
  const session = await getAuthSession();
  if (session) {
    broadcastEvent('login_status', { username: session.username, action: 'logout' });
  }
  await clearAuthCookie();
  return NextResponse.json({ success: true, message: 'Logout berhasil' });
}
