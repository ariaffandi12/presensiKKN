import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'PresensiKu Realtime - Kelompok 6',
  description: 'Sistem Presensi Digital Kelompok 6 Berbasis Web dengan Foto, Monitoring Realtime, dan Manajemen Sesi Presensi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased`}>
        <Toaster position="top-right" richColors />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
