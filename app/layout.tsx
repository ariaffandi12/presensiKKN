import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'Presensi Digital - Kelompok 6',
  description: 'Sistem Presensi Digital Kelompok 6 Berbasis Web dengan Foto, Monitoring Realtime, dan Manajemen Sesi Presensi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-[#050505] text-slate-100 flex flex-col antialiased bg-grid relative`}>
        <Toaster position="top-right" richColors theme="dark" />
        <main className="flex-1 relative z-10">{children}</main>
      </body>
    </html>
  );
}
