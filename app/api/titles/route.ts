import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/realtime-bus';
import { getTodayWIBStr, parseWIBTargetTime } from '@/lib/utils';

export async function GET() {
  const titles = await prisma.attendanceTitle.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ titles });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const { title, closingTime } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ message: 'Judul presensi wajib diisi.' }, { status: 400 });
  }

  // Create title as ACTIVE by default so users can immediately attend
  const newTitle = await prisma.attendanceTitle.create({
    data: {
      title: title.trim(),
      isActive: true,
      closingTime: closingTime || null,
    },
  });

  // Calculate deadline if closingTime is provided
  let deadlineDate: Date | null = null;
  if (closingTime) {
    deadlineDate = parseWIBTargetTime(closingTime);
  }

  // Auto-open session in settings
  let setting = await prisma.setting.findFirst();
  const today = getTodayWIBStr();

  if (setting) {
    setting = await prisma.setting.update({
      where: { id: setting.id },
      data: {
        attendanceStatus: 'OPEN',
        deadline: deadlineDate ?? setting.deadline,
        activeDate: today,
      },
    });
  } else {
    setting = await prisma.setting.create({
      data: {
        attendanceStatus: 'OPEN',
        deadline: deadlineDate,
        activeDate: today,
      },
    });
  }

  // Clear any previous auto-generated 'Tidak Hadir' records so users can attend
  await prisma.attendance.deleteMany({
    where: { status: 'Tidak Hadir' },
  });

  broadcastEvent('titles_changed', { action: 'created', title: newTitle });
  broadcastEvent('attendance_status_changed', {
    attendanceStatus: 'OPEN',
    deadline: setting.deadline,
  });

  return NextResponse.json({ success: true, title: newTitle });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const { id, title, isActive, closingTime } = await request.json();
  if (!id) {
    return NextResponse.json({ message: 'ID tidak valid.' }, { status: 400 });
  }

  const updatedTitle = await prisma.attendanceTitle.update({
    where: { id: Number(id) },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(closingTime !== undefined && { closingTime: closingTime || null }),
    },
  });

  // If title was activated, ensure overall setting is OPEN and set deadline if closingTime exists
  if (isActive === true) {
    let deadlineDate: Date | null = null;
    const finalClosingTime = updatedTitle.closingTime || closingTime;

    if (finalClosingTime) {
      deadlineDate = parseWIBTargetTime(finalClosingTime);
    }

    let setting = await prisma.setting.findFirst();
    const today = getTodayWIBStr();

    if (setting) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: {
          attendanceStatus: 'OPEN',
          deadline: deadlineDate ?? setting.deadline,
          activeDate: today,
        },
      });
    } else {
      setting = await prisma.setting.create({
        data: {
          attendanceStatus: 'OPEN',
          deadline: deadlineDate,
          activeDate: today,
        },
      });
    }

    broadcastEvent('attendance_status_changed', {
      attendanceStatus: 'OPEN',
      deadline: setting.deadline,
    });
  } else if (isActive === false) {
    // If no active titles left, close setting
    const activeCount = await prisma.attendanceTitle.count({ where: { isActive: true } });
    if (activeCount === 0) {
      let setting = await prisma.setting.findFirst();
      if (setting) {
        await prisma.setting.update({
          where: { id: setting.id },
          data: { attendanceStatus: 'CLOSE', deadline: null },
        });
        broadcastEvent('attendance_status_changed', { attendanceStatus: 'CLOSE', deadline: null });
      }
    }
  }

  broadcastEvent('titles_changed', { action: 'updated', title: updatedTitle });

  return NextResponse.json({ success: true, title: updatedTitle });
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

  await prisma.attendanceTitle.delete({
    where: { id: Number(id) },
  });

  const activeCount = await prisma.attendanceTitle.count({ where: { isActive: true } });
  if (activeCount === 0) {
    let setting = await prisma.setting.findFirst();
    if (setting) {
      await prisma.setting.update({
        where: { id: setting.id },
        data: { attendanceStatus: 'CLOSE', deadline: null },
      });
      broadcastEvent('attendance_status_changed', { attendanceStatus: 'CLOSE', deadline: null });
    }
  }

  broadcastEvent('titles_changed', { action: 'deleted', id: Number(id) });

  return NextResponse.json({ success: true });
}
