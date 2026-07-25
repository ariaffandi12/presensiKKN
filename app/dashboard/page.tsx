'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { RealtimeClock } from '@/components/RealtimeClock';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useRealtime } from '@/hooks/useRealtime';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Camera,
  FileText,
  Lock,
  Wifi,
  Timer,
  Layers,
  History,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string; role: 'ADMIN' | 'USER' } | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'OPEN' | 'CLOSE'>('CLOSE');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [activeTitles, setActiveTitles] = useState<Array<{ id: number; title: string }>>([]);
  const [userAttendances, setUserAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'USER') {
        router.push('/login');
        return;
      }
      setUser(meData.user);

      const settingRes = await fetch('/api/settings');
      const settingData = await settingRes.json();
      const status = settingData.attendanceStatus || 'CLOSE';
      setAttendanceStatus(status);
      setDeadline(settingData.deadline || null);

      if (status === 'OPEN' && settingData.deadline) {
        const isDeadlinePassed = new Date() > new Date(settingData.deadline);
        setIsExpired(isDeadlinePassed);
      } else {
        setIsExpired(false);
      }

      const attRes = await fetch('/api/attendance');
      const attData = await attRes.json();
      setActiveTitles(attData.activeTitles || (attData.activeTitle ? [attData.activeTitle] : []));

      if (meData.user) {
        const myRecords = attData.attendances?.filter(
          (a: any) => a.userId === meData.user.id
        );
        setUserAttendances(myRecords || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useRealtime(
    useCallback(
      (event: string) => {
        if (
          event === 'attendance_status_changed' ||
          event === 'titles_changed' ||
          event === 'attendance_submitted' ||
          event === 'attendance_deleted' ||
          event === 'midnight_reset'
        ) {
          fetchDashboardData();
        }
      },
      [fetchDashboardData]
    )
  );

  const isAttendanceOpen = attendanceStatus === 'OPEN' && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Memuat Dashboard</p>
            <p className="text-xs text-slate-500 mt-0.5">PresensiKu Realtime</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/6 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* ── WELCOME BANNER ── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-blue-950/40 p-5 sm:p-7 shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/30">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-xl">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#020617]"></div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                    Dashboard Pengguna
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.username}</span>!
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Kelompok 6 • PresensiKu Realtime</p>
              </div>
            </div>

            <div className="shrink-0">
              <RealtimeClock variant="detailed" />
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Card: Judul Presensi Aktif & Status */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Status Presensi Hari Ini
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> REALTIME
              </span>
            </div>

            {/* List Active Titles & User Status per active title */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Judul Presensi Aktif ({activeTitles.length})
              </span>

              {activeTitles.length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    const now = new Date();
                    const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                    return activeTitles.map((t) => {
                      const record = userAttendances.find((a) => a.titleId === t.id);
                      const isHadir = record && record.status === 'Hadir';
                    // @ts-ignore - t has closingTime from API
                    const isTimePassed = t.closingTime && currentHHMM >= t.closingTime;
                    const isTidakHadir = (!record && (!isAttendanceOpen || isTimePassed));

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                          isHadir
                            ? 'bg-emerald-950/30 border-emerald-800/40'
                            : isTidakHadir
                            ? 'bg-rose-950/30 border-rose-800/40'
                            : 'bg-slate-950/60 border-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isHadir
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isTidakHadir
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {isHadir ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isTidakHadir ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{t.title}</span>
                        </div>

                        {isHadir ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                            Hadir ({record.time})
                          </span>
                        ) : isTidakHadir ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                            Tidak Hadir
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                            Belum Hadir
                          </span>
                        )}
                      </div>
                    );
                    });
                  })()}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/40 text-center text-slate-500 text-xs font-medium">
                  Belum ada Judul Presensi yang aktif.
                </div>
              )}
            </div>
          </div>

          {/* Card: Sesi Admin & Actions */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sesi Presensi Admin
                </span>
                <div className="flex items-center gap-2">
                  {isAttendanceOpen && deadline && (
                    <CountdownTimer
                      deadline={deadline}
                      variant="user"
                      onExpire={() => {
                        setIsExpired(true);
                        setAttendanceStatus('CLOSE');
                      }}
                    />
                  )}
                  {isAttendanceOpen ? (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      DIBUKA
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      DITUTUP
                    </span>
                  )}
                </div>
              </div>

              {/* Status message */}
              {isAttendanceOpen ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-xs leading-relaxed">
                  <div className="flex items-start gap-2.5 text-emerald-200/80">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-300">Presensi sedang dibuka!</p>
                      <p className="mt-0.5">
                        Terdapat {activeTitles.length} judul presensi aktif. Silakan isi presensi untuk judul yang tersedia.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isExpired && attendanceStatus === 'OPEN' ? (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/30 flex items-start gap-2.5 text-xs">
                  <Timer className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-300">Waktu Presensi Telah Habis</p>
                    <p className="text-rose-200/70 mt-0.5">Batas waktu absensi telah terlewat.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-start gap-2.5 text-xs">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-400">Presensi belum dibuka.</p>
                    <p className="text-slate-600 mt-0.5">Halaman ini akan diperbarui otomatis saat admin membuka sesi.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {isAttendanceOpen && activeTitles.length > 0 ? (
              <Link
                href="/attendance"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Camera className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Isi & Kirim Presensi</span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </Link>
            ) : (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-600 bg-slate-800/30 border border-slate-700/30 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isAttendanceOpen ? 'Belum Ada Judul Aktif' : 'Presensi Belum Dibuka'}
              </button>
            )}
          </div>

        </div>

        {/* ── RIWAYAT LINK ── */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
              <History className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Riwayat Presensi</p>
              <p className="text-xs text-slate-500">Lihat catatan presensi masa lalu Anda</p>
            </div>
          </div>
          <Link
            href="/history"
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs border border-indigo-600/30 hover:border-indigo-500/50 transition flex items-center gap-1.5"
          >
            Lihat Riwayat
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── SUBMITTED ATTENDANCES HISTORY ── */}
        {userAttendances.filter((att) => att.status === 'Hadir' && att.photo).length > 0 && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              Riwayat Presensi Terkirim Anda
            </h3>

            <div className="space-y-4">
              {userAttendances
                .filter((att) => att.status === 'Hadir' && att.photo)
                .map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/40"
                  >
                    {att.photo && (
                      <div className="shrink-0 w-full sm:w-36 h-28 overflow-hidden rounded-xl border border-slate-800">
                        <img
                          src={att.photo}
                          alt="Bukti Presensi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 text-xs flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">{att.title?.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                          {att.date} • {att.time}
                        </span>
                      </div>
                      <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40 mt-1 leading-relaxed">
                        "{att.description}"
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
