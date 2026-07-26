import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Tidak terotentikasi.' }, { status: 401 });
  }

  if (session.role === 'ADMIN') {
    // Admin: return all history with user info
    const history = await prisma.attendanceHistory.findMany({
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { archivedAt: 'desc' },
    });

    // Group by User
    const groupedByUser: Record<number, any> = {};
    for (const item of history) {
      if (!groupedByUser[item.userId]) {
        groupedByUser[item.userId] = {
          userId: item.userId,
          username: item.user.username,
          hadirCount: 0,
          tidakHadirCount: 0,
          dates: {}
        };
      }
      
      const userGroup = groupedByUser[item.userId];
      if (item.status === 'Hadir') userGroup.hadirCount++;
      if (item.status === 'Tidak Hadir') userGroup.tidakHadirCount++;
      
      if (!userGroup.dates[item.date]) {
        userGroup.dates[item.date] = [];
      }
      userGroup.dates[item.date].push({
        id: item.id,
        titleName: item.titleName,
        photo: item.photo,
        description: item.description,
        time: item.time,
        status: item.status,
      });
    }

    const usersHistory = Object.values(groupedByUser)
      .map((u: any) => ({
        ...u,
        dates: Object.entries(u.dates)
          .map(([date, titles]) => ({ date, titles }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a: any, b: any) => a.username.localeCompare(b.username));

    return NextResponse.json({
      history,
      usersHistory,
      total: history.length,
    });
  } else {
    // Regular user: only their own history
    const history = await prisma.attendanceHistory.findMany({
      where: { userId: session.id },
      orderBy: { archivedAt: 'desc' },
    });

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const item of history) {
      const key = item.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: item.id,
        titleName: item.titleName,
        photo: item.photo,
        description: item.description,
        date: item.date,
        time: item.time,
        status: item.status,
        archivedAt: item.archivedAt,
      });
    }

    return NextResponse.json({
      history,
      grouped,
      total: history.length,
    });
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak terotentikasi atau akses ditolak.' }, { status: 401 });
  }

  await prisma.attendanceHistory.deleteMany({});
  
  return NextResponse.json({
    success: true,
    message: 'Semua riwayat berhasil dihapus.'
  });
}
