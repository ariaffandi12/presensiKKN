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
      confirmButtonColor: '#00f0ff',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: '#0a0a0a',
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
    <header className="sticky top-0 z-50 w-full border-b border-cyan-900/40 bg-[#050505]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo & Brand */}
          <Link
            href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg border border-cyan-500/50 bg-[#0a0a0a] p-0 shadow-[0_0_15px_rgba(0,240,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-all flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
            </div>
            <div className="hidden sm:block font-digital">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-widest">
                  PRESENSI <span className="text-cyan-400 text-glow">DIGITAL</span>
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest leading-none mt-1">SYS.06</p>
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0a0a0a] hover:bg-cyan-950/30 text-slate-400 hover:text-cyan-400 text-xs font-digital font-bold border border-cyan-900/30 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all"
            >
              <History className="w-3.5 h-3.5" />
              LOG DATA
            </Link>
          )}

          {/* User Area */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* User pill */}
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-md border bg-[#0a0a0a] ${
                user.role === 'ADMIN' ? 'border-pink-900/40' : 'border-cyan-900/40'
              }`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                  user.role === 'ADMIN'
                    ? 'border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(255,0,106,0.2)] bg-pink-950/30'
                    : 'border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)] bg-cyan-950/30'
                }`}>
                  {user.role === 'ADMIN' ? (
                    <Shield className="w-4 h-4 drop-shadow-[0_0_3px_rgba(255,0,106,0.8)]" />
                  ) : (
                    <UserIcon className="w-4 h-4 drop-shadow-[0_0_3px_rgba(0,240,255,0.8)]" />
                  )}
                </div>
                <div className="hidden sm:block font-digital">
                  <p className="text-xs font-bold text-white tracking-wider leading-none">{user.username}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mt-1 ${
                    user.role === 'ADMIN' ? 'text-pink-400 text-glow-pink' : 'text-cyan-400 text-glow'
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
                className="p-2 rounded-md bg-[#0a0a0a] hover:bg-pink-950/30 text-slate-500 hover:text-pink-400 border border-slate-800 hover:border-pink-500/50 hover:shadow-[0_0_10px_rgba(255,0,106,0.2)] transition-all active:scale-95"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-slate-500/30 border-t-pink-400 rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </header>
  );
}
