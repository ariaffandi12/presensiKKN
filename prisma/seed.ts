import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const usersList = [
  'Ari',
  'Radit',
  'Ima',
  'Alifa',
  'Sheila',
  'Natasya',
  'Aisyah',
  'Rahma',
  'Nabil',
  'Noval',
  'Nazril',
  'Alfian',
  'Ravika',
  'Ghifari',
  'Fauzi',
  'Aal',
  'Astrid',
];

async function main() {
  console.log('Seeding Database...');

  // Reset database tables
  await prisma.attendanceHistory.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceTitle.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Admin Account
  const hashedAdminPassword = await bcrypt.hash('0000', 10);
  await prisma.user.create({
    data: {
      username: 'Admin',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  // Seed 17 User Accounts
  const hashedUserPassword = await bcrypt.hash('12345678', 10);
  for (const username of usersList) {
    await prisma.user.create({
      data: {
        username: username,
        password: hashedUserPassword,
        role: 'USER',
      },
    });
  }

  // Seed Initial Attendance Setting
  await prisma.setting.create({
    data: {
      attendanceStatus: 'CLOSE',
    },
  });

  // Seed Initial Attendance Titles
  const titles = [
    { title: 'Praktikum Basis Data', isActive: true },
    { title: 'Pertemuan 1', isActive: false },
    { title: 'Presentasi Project', isActive: false },
    { title: 'Seminar Proposal', isActive: false },
    { title: 'Rapat Kelompok', isActive: false },
  ];

  for (const t of titles) {
    await prisma.attendanceTitle.create({
      data: t,
    });
  }

  console.log('Seeding complete! Admin & 17 Users created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
