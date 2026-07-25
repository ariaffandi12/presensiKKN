import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';
import { formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Tidak terotentikasi.' }, { status: 401 });
  }

  // Get all active attendance titles
  const activeTitles = await prisma.attendanceTitle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // For backward compatibility: first active title or null
  const activeTitle = activeTitles.length > 0 ? activeTitles[0] : null;

  // Get all attendances
  const attendances = await prisma.attendance.findMany({
    include: {
      user: {
        select: { id: true, username: true, role: true },
      },
      title: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all users (except Admin)
  const allUsers = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
  });

  // Filter attendances to ONLY Hadir records with photo for Photo Monitoring section
  const hadirAttendances = attendances.filter(
    (a) => a.status === 'Hadir' && a.photo && a.photo.trim() !== ''
  );

  const now = new Date();
  const todayDateStr = formatIndonesianDate(now);
  const currentHHMM = formatIndonesianTime(now).slice(0, 5);

  const setting = await prisma.setting.findFirst();
  const isGlobalClosed = setting?.attendanceStatus === 'CLOSE' || (setting?.deadline && now > new Date(setting.deadline));

  // Build 17 registered users monitoring structure (Grouped by User -> Date -> Title)
  const usersMonitoring = allUsers.map((userItem) => {
    const userRecords = attendances.filter((a) => a.userId === userItem.id);

    const mappedItems: any[] = userRecords.map((rec) => ({
      attendanceId: rec.id,
      titleId: rec.titleId,
      title: rec.title?.title || 'Judul Presensi',
      status: rec.status,
      date: rec.date,
      time: rec.time,
      photo: rec.photo || null,
      description: rec.description || null,
    }));

    if (activeTitles.length > 0) {
      for (const titleItem of activeTitles) {
        const hasRecord = mappedItems.some((item) => item.titleId === titleItem.id);
        if (!hasRecord) {
          const isTimePassed = titleItem.closingTime && currentHHMM >= titleItem.closingTime;
          const dynamicStatus = (isGlobalClosed || isTimePassed) ? 'Tidak Hadir' : 'Belum Hadir';

          mappedItems.push({
            attendanceId: null,
            titleId: titleItem.id,
            title: titleItem.title,
            status: dynamicStatus,
            date: todayDateStr,
            time: '-',
            photo: null,
            description: null,
          });
        }
      }
    } else if (mappedItems.length === 0) {
      mappedItems.push({
        attendanceId: null,
        titleId: null,
        title: 'Belum ada Judul',
        status: 'Belum Hadir',
        date: todayDateStr,
        time: '-',
        photo: null,
        description: null,
      });
    }

    const dateGroupMap: Record<string, any[]> = {};
    for (const item of mappedItems) {
      const d = item.date || todayDateStr;
      if (!dateGroupMap[d]) dateGroupMap[d] = [];
      dateGroupMap[d].push(item);
    }

    const dates = Object.entries(dateGroupMap).map(([date, titles]) => ({
      date,
      titles,
    }));

    return {
      userId: userItem.id,
      username: userItem.username,
      dates,
      hadirCount: mappedItems.filter((i) => i.status === 'Hadir').length,
      tidakHadirCount: mappedItems.filter((i) => i.status === 'Tidak Hadir').length,
      belumHadirCount: mappedItems.filter((i) => i.status === 'Belum Hadir').length,
    };
  });

  // Flat monitoring list for backward compatibility
  const monitoringList: any[] = [];
  if (activeTitles.length > 0) {
    for (const titleItem of activeTitles) {
      for (const userItem of allUsers) {
        const record = attendances.find(
          (a) => a.userId === userItem.id && a.titleId === titleItem.id
        );
        const isTimePassed = titleItem.closingTime && currentHHMM >= titleItem.closingTime;
        const dynamicStatus = (isGlobalClosed || isTimePassed) ? 'Tidak Hadir' : 'Belum Hadir';

        monitoringList.push({
          userId: userItem.id,
          username: userItem.username,
          title: titleItem.title,
          titleId: titleItem.id,
          status: record ? record.status : dynamicStatus,
          date: record?.date || '-',
          time: record?.time || '-',
          photo: record?.photo || null,
          description: record?.description || null,
          attendanceId: record?.id || null,
        });
      }
    }
  }

  return NextResponse.json({
    attendances,
    hadirAttendances,
    usersMonitoring,
    monitoringList,
    activeTitle,
    activeTitles,
  });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Tidak terotentikasi.' }, { status: 401 });
  }

  // 1. Check Attendance Status OPEN
  const setting = await prisma.setting.findFirst();
  if (setting?.attendanceStatus !== 'OPEN') {
    return NextResponse.json(
      { message: 'Presensi belum dibuka oleh Admin. Silakan tunggu.' },
      { status: 400 }
    );
  }

  // 1b. Check if deadline has passed — just close session, do NOT mark absent
  if (setting.deadline && new Date() > new Date(setting.deadline)) {
    await prisma.setting.update({
      where: { id: setting.id },
      data: { attendanceStatus: 'CLOSE' },
    });
    broadcastEvent('attendance_status_changed', { attendanceStatus: 'CLOSE' });
    return NextResponse.json(
      { message: 'Waktu presensi telah habis. Silakan minta Admin membuka kembali presensi.' },
      { status: 400 }
    );
  }

  const { description, photo, titleId } = await request.json();

  if (!description?.trim() || !photo) {
    return NextResponse.json(
      { message: 'Mohon lengkapi seluruh data presensi (Deskripsi & Foto wajib).' },
      { status: 400 }
    );
  }

  // 2. Find selected or active title
  let targetTitle = null;
  if (titleId) {
    targetTitle = await prisma.attendanceTitle.findFirst({
      where: { id: Number(titleId), isActive: true },
    });
  } else {
    // Fallback to first active title
    targetTitle = await prisma.attendanceTitle.findFirst({
      where: { isActive: true },
    });
  }

  if (!targetTitle) {
    return NextResponse.json(
      { message: 'Judul presensi yang dipilih tidak aktif atau tidak ditemukan.' },
      { status: 400 }
    );
  }

  // Check if title has passed closingTime
  const now = new Date();
  const currentHHMM = formatIndonesianTime(now).slice(0, 5);
  if (targetTitle.closingTime && currentHHMM >= targetTitle.closingTime) {
    return NextResponse.json(
      { message: `Waktu presensi untuk judul "${targetTitle.title}" telah berakhir pada ${targetTitle.closingTime} WIB.` },
      { status: 400 }
    );
  }

  // 3. Check if user already submitted for this active title
  const existing = await prisma.attendance.findFirst({
    where: {
      userId: session.id,
      titleId: targetTitle.id,
    },
  });

  if (existing) {
    return NextResponse.json(
      { message: `Anda sudah melakukan presensi untuk judul "${targetTitle.title}".` },
      { status: 400 }
    );
  }

  // Process photo
  let photoPath = photo;
  if (photo.startsWith('data:image/')) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `attendance_${session.id}_${Date.now()}.jpg`;
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
      photoPath = `/uploads/${filename}`;
    } catch {
      photoPath = photo;
    }
  }

  const dateStr = formatIndonesianDate(now);
  const timeStr = formatIndonesianTime(now);

  const newAttendance = await prisma.attendance.create({
    data: {
      userId: session.id,
      titleId: targetTitle.id,
      photo: photoPath,
      description: description.trim(),
      date: dateStr,
      time: timeStr,
      status: 'Hadir',
    },
    include: {
      user: { select: { username: true } },
      title: { select: { title: true } },
    },
  });

  broadcastEvent('attendance_submitted', {
    attendance: newAttendance,
    username: session.username,
  });

  return NextResponse.json({
    success: true,
    message: 'Presensi berhasil dikirim.',
    attendance: newAttendance,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'ID wajib disertakan.' }, { status: 400 });
  }

  await prisma.attendance.delete({
    where: { id: Number(id) },
  });

  broadcastEvent('attendance_deleted', { id: Number(id) });

  return NextResponse.json({
    success: true,
    message: 'Presensi berhasil dihapus.',
  });
}
