import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Mohon isi username dan password.' },
        { status: 400 }
      );
    }

    // Find user in database case-insensitively or exact match
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.trim(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Username tidak ditemukan atau belum terdaftar.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Password tidak cocok.' },
        { status: 400 }
      );
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role as 'ADMIN' | 'USER',
    };

    await setAuthCookie(sessionData);

    broadcastEvent('login_status', { username: user.username, action: 'login' });

    return NextResponse.json({
      success: true,
      message: 'Login Berhasil',
      user: sessionData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat login.' },
      { status: 500 }
    );
  }
}
