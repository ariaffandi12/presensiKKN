import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';

// ─── Helper: format local date as "YYYY-MM-DD" ───────────────────────────────
function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Helper: Indonesian date/time strings ────────────────────────────────────
function formatIndonesianDate(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatIndonesianTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s} WIB`;
}

// markAbsentUsers removed: when session closes, users who haven't attended
// simply remain as 'Belum Hadir'. No auto 'Tidak Hadir' records are created.

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
  const activeTitleIds = new Set(allAttendances.map(a => a.titleId));
  const activeTitles = await prisma.attendanceTitle.findMany({
    where: {
      OR: [
        { isActive: true },
        { id: { in: Array.from(activeTitleIds) } }
      ]
    },
  });
  
  if (activeTitles.length > 0) {
    const allUsers = await prisma.user.findMany({ where: { role: 'USER' } });
    const now = new Date();
    const dateStr = formatIndonesianDate(now); // this will be yesterday's date if called right after midnight, wait... getTodayStr uses now.
    // Let's use the activeDate from the setting just in case, but formatIndonesianDate is fine since it's the date of the record.
    // Actually, setting.activeDate is 'YYYY-MM-DD'. Let's just use `formatIndonesianDate(now)` which might be technically the next day if triggered slightly after 00:00.
    // Let's parse setting.activeDate to Date to get the correct indonesian string!
    
    // Wait, settingId is passed. Let's get setting to know its activeDate.
    const setting = await prisma.setting.findUnique({ where: { id: settingId } });
    const activeDateObj = setting?.activeDate ? new Date(setting.activeDate) : now;
    const historyDateStr = formatIndonesianDate(activeDateObj);
    const historyTimeStr = '-'; // Tidak Hadir doesn't have a time

    const missingRecords = [];
    for (const title of activeTitles) {
      for (const user of allUsers) {
        const hasRecord = allAttendances.some(a => a.userId === user.id && a.titleId === title.id);
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
      activeDate: getTodayStr(),
    },
  });

  // 6. Broadcast realtime event
  broadcastEvent('midnight_reset', {
    message: 'Data presensi telah direset untuk hari baru.',
    date: getTodayStr(),
  });

  console.log('[PresensiKu] Midnight reset complete.');
}

// ─── GET /api/settings ───────────────────────────────────────────────────────
export async function GET() {
  let setting = await prisma.setting.findFirst();
  if (!setting) {
    setting = await prisma.setting.create({
      data: { attendanceStatus: 'CLOSE', activeDate: getTodayStr() },
    });
  }

  const today = getTodayStr();

  // ── Lazy midnight reset: detect if date has changed ──
  if (setting.activeDate && setting.activeDate !== today) {
    // New day detected — archive and reset
    await performMidnightReset(setting.id);
    // Reload setting after reset
    setting = await prisma.setting.findFirst() ?? setting;
  } else if (!setting.activeDate) {
    // First time: set activeDate
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
    broadcastEvent('attendance_status_changed', { attendanceStatus: 'CLOSE', reason: 'deadline_expired' });
  }

  return NextResponse.json({
    attendanceStatus: setting.attendanceStatus,
    durationMinutes: setting.durationMinutes ?? null,
    deadline: setting.deadline ?? null,
    activeDate: setting.activeDate ?? null,
  });
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

  // Hitung deadline saat buka presensi
  let deadline: Date | null = null;
  if (attendanceStatus === 'OPEN') {
    if (targetTime) {
      // Format "HH:mm" (misal: "21:00" atau "17:30")
      const [h, m] = targetTime.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);
      // Jika jam target hari ini sudah lewat, bisa set kebesokan atau tetapkan
      deadline = targetDate;
    } else if (deadlineIso) {
      deadline = new Date(deadlineIso);
    } else if (durationMinutes && durationMinutes > 0) {
      deadline = new Date(Date.now() + durationMinutes * 60 * 1000);
    }
  }

  let setting = await prisma.setting.findFirst();
  const today = getTodayStr();

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
    // When session re-opens, clear any stale auto 'Tidak Hadir' records
    await prisma.attendance.deleteMany({
      where: { status: 'Tidak Hadir' },
    });
  }
  // When session CLOSES: no action needed - users who haven't attended
  // simply remain as 'Belum Hadir'. No auto 'Tidak Hadir' records are created.

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

// ─── POST /api/settings/reset (manual reset for admin) ───────────────────────
// This is exposed via the same route but triggered by ?action=reset query param
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
