'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RealtimeClock } from './RealtimeClock';
import { LogOut, User as UserIcon, Shield, Sparkles, History } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface NavbarProps {
  user?: {
    username: string;
    role: 'ADMIN' | 'USER';
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar dari PresensiKu?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (result.isConfirmed) {
      setIsLoggingOut(true);
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        toast.success('Berhasil keluar sistem.');
        router.push('/login');
        router.refresh();
      } catch {
        toast.error('Gagal melakukan logout.');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo & Brand */}
          <Link
            href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">
                  Presensi<span className="text-blue-400">Ku</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full border border-blue-500/30">
                  Realtime
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-600 leading-none mt-0.5">Kelompok 6</p>
            </div>
          </Link>

          {/* Center Clock */}
          <div className="hidden md:block flex-1 flex justify-center">
            <RealtimeClock variant="compact" />
          </div>

          {/* History Nav Link */}
          {user && (
            <Link
              href={user.role === 'ADMIN' ? '/admin/history' : '/history'}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-white text-xs font-bold border border-slate-800/60 hover:border-slate-700 transition-all"
            >
              <History className="w-3.5 h-3.5" />
              Riwayat
            </Link>
          )}

          {/* User Area */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* User pill */}
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/60">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${
                  user.role === 'ADMIN'
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                }`}>
                  {user.role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{user.username}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5 ${
                    user.role === 'ADMIN' ? 'text-indigo-400' : 'text-blue-400'
                  }`}>
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Keluar"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 border border-slate-800/60 hover:border-rose-800/60 transition-all active:scale-95"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </header>
  );
}
