import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  const activeTitles = await prisma.attendanceTitle.findMany({
    where: { isActive: true },
  });

  const totalUsers = await prisma.user.count({
    where: { role: 'USER' },
  });

  const totalTitles = await prisma.attendanceTitle.count();
  const totalAttendances = await prisma.attendance.count({
    where: { status: 'Hadir' },
  });
  const totalPhotos = await prisma.attendance.count({
    where: {
      photo: { not: '' },
    },
  });

  let totalHadirToday = 0;
  let activeTitleText = 'Tidak ada';

  if (activeTitles.length > 0) {
    const activeIds = activeTitles.map((t) => t.id);
    totalHadirToday = await prisma.attendance.count({
      where: {
        titleId: { in: activeIds },
        status: 'Hadir',
      },
    });
    activeTitleText = activeTitles.map((t) => t.title).join(', ');
  }

  const totalSlotsNeeded = totalUsers * (activeTitles.length || 1);
  const belumHadir = Math.max(0, totalSlotsNeeded - totalHadirToday);

  return NextResponse.json({
    totalUsers,
    totalHadirToday,
    belumHadir,
    totalTitles,
    totalPhotos,
    totalAttendances,
    activeTitle: activeTitleText,
  });
}
