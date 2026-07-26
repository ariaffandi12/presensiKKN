import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';
import {
  getTodayWIBStr,
  formatIndonesianDate,
  parseWIBTargetTime,
} from '@/lib/utils';

// ─── Core: Midnight reset — archive today's data, reset session ──────────────
async function performMidnightReset(settingId: number) {
  console.log('[PresensiKu] Performing midnight reset...');

  // 1. Get all attendance records with user and title info
  const allAttendances = await prisma.attendance.findMany({
    include: {
      user: { select: { id: true, username: true } },
      title: { select: { title: true } },
    },
  });

  // 2. Archive Hadir records to AttendanceHistory
  if (allAttendances.length > 0) {
    await prisma.attendanceHistory.createMany({
      data: allAttendances.map((a) => ({
        userId: a.userId,
        titleName: a.title.title,
        photo: a.photo,
        description: a.description,
        date: a.date,
        time: a.time,
        status: a.status,
        archivedAt: new Date(),
      })),
    });
  }

  // 2b. Archive Tidak Hadir records for users who didn't attend active/used titles
  const activeTitleIds = new Set(allAttendances.map((a) => a.titleId));
  const activeTitles = await prisma.attendanceTitle.findMany({
    where: {
      OR: [
        { isActive: true },
        { id: { in: Array.from(activeTitleIds) } },
      ],
    },
  });

  if (activeTitles.length > 0) {
    const allUsers = await prisma.user.findMany({ where: { role: 'USER' } });
    const now = new Date();

    const setting = await prisma.setting.findUnique({ where: { id: settingId } });
    const activeDateObj = setting?.activeDate ? new Date(setting.activeDate) : now;
    const historyDateStr = formatIndonesianDate(activeDateObj);
    const historyTimeStr = '-';

    const missingRecords = [];
    for (const title of activeTitles) {
      for (const user of allUsers) {
        const hasRecord = allAttendances.some(
          (a) => a.userId === user.id && a.titleId === title.id
        );
        if (!hasRecord) {
          missingRecords.push({
            userId: user.id,
            titleName: title.title,
            photo: '',
            description: 'Tidak hadir - sesi ditutup',
            date: historyDateStr,
            time: historyTimeStr,
            status: 'Tidak Hadir',
            archivedAt: now,
          });
        }
      }
    }

    if (missingRecords.length > 0) {
      await prisma.attendanceHistory.createMany({
        data: missingRecords,
      });
    }
  }

  // 3. Delete all attendance records (fresh start)
  await prisma.attendance.deleteMany({});

  // 4. Delete all attendance titles so the new day starts fresh
  await prisma.attendanceTitle.deleteMany({});

  // 5. Reset setting: close session, clear deadline, set activeDate to today
  await prisma.setting.update({
    where: { id: settingId },
    data: {
      attendanceStatus: 'CLOSE',
      durationMinutes: null,
      deadline: null,
      activeDate: getTodayWIBStr(),
    },
  });

  // 6. Broadcast realtime event
  broadcastEvent('midnight_reset', {
    message: 'Data presensi telah direset untuk hari baru.',
    date: getTodayWIBStr(),
  });

  console.log('[PresensiKu] Midnight reset complete.');
}

// ─── GET /api/settings ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const today = getTodayWIBStr();
    let setting = await prisma.setting.findFirst();

    if (!setting) {
      setting = await prisma.setting.create({
        data: { attendanceStatus: 'CLOSE', activeDate: today },
      });
    }

    // ── Lazy midnight reset: detect if WIB date has changed ──
    if (setting.activeDate && setting.activeDate !== today) {
      await performMidnightReset(setting.id);
      setting = (await prisma.setting.findFirst()) ?? setting;
    } else if (!setting.activeDate) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: { activeDate: today },
      });
    }

    // ── Auto-expire: if deadline has passed, just close the session ──
    if (
      setting.attendanceStatus === 'OPEN' &&
      setting.deadline &&
      new Date() > new Date(setting.deadline)
    ) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: { attendanceStatus: 'CLOSE' },
      });
      broadcastEvent('attendance_status_changed', {
        attendanceStatus: 'CLOSE',
        reason: 'deadline_expired',
      });
    }

    return NextResponse.json({
      attendanceStatus: setting.attendanceStatus,
      durationMinutes: setting.durationMinutes ?? null,
      deadline: setting.deadline ?? null,
      activeDate: setting.activeDate ?? null,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      attendanceStatus: 'CLOSE',
      durationMinutes: null,
      deadline: null,
      activeDate: null,
      error: 'Database connection failed'
    }, { status: 500 });
  }
}

// ─── POST /api/settings ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const body = await request.json();
  const { attendanceStatus, durationMinutes, targetTime, deadlineIso } = body;

  if (!['OPEN', 'CLOSE'].includes(attendanceStatus)) {
    return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
  }

  // Calculate deadline
  let deadline: Date | null = null;
  if (attendanceStatus === 'OPEN') {
    if (targetTime) {
      deadline = parseWIBTargetTime(targetTime);
    } else if (deadlineIso) {
      deadline = new Date(deadlineIso);
    } else if (durationMinutes && durationMinutes > 0) {
      deadline = new Date(Date.now() + durationMinutes * 60 * 1000);
    }
  }

  let setting = await prisma.setting.findFirst();
  const today = getTodayWIBStr();

  if (setting) {
    setting = await prisma.setting.update({
      where: { id: setting.id },
      data: {
        attendanceStatus,
        durationMinutes: attendanceStatus === 'OPEN' ? (durationMinutes ?? null) : null,
        deadline: attendanceStatus === 'OPEN' ? deadline : null,
        activeDate: today,
      },
    });
  } else {
    setting = await prisma.setting.create({
      data: {
        attendanceStatus,
        durationMinutes: durationMinutes ?? null,
        deadline,
        activeDate: today,
      },
    });
  }

  if (attendanceStatus === 'OPEN') {
    await prisma.attendance.deleteMany({
      where: { status: 'Tidak Hadir' },
    });
  }

  broadcastEvent('attendance_status_changed', {
    attendanceStatus: setting.attendanceStatus,
    deadline: setting.deadline,
  });

  return NextResponse.json({
    success: true,
    attendanceStatus: setting.attendanceStatus,
    durationMinutes: setting.durationMinutes,
    deadline: setting.deadline,
    message: `Presensi berhasil ${setting.attendanceStatus === 'OPEN' ? 'DIBUKA' : 'DITUTUP'}`,
  });
}

// ─── DELETE /api/settings (manual reset for admin) ───────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const setting = await prisma.setting.findFirst();
  if (!setting) {
    return NextResponse.json({ message: 'Setting tidak ditemukan.' }, { status: 404 });
  }

  await performMidnightReset(setting.id);

  return NextResponse.json({
    success: true,
    message: 'Reset presensi harian berhasil dilakukan.',
  });
}
