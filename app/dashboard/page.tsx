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
      let settingData: any = {};
      try {
        settingData = await settingRes.json();
      } catch (e) {
        console.error('Failed to parse settings JSON', e);
      }
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
      let attData: any = {};
      try {
        attData = await attRes.json();
      } catch (e) {
        console.error('Failed to parse attendance JSON', e);
      }
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
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-900/40"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
          </div>
          <div className="text-center font-digital">
            <p className="text-sm font-bold text-cyan-400 text-glow">INITIALIZING DASHBOARD</p>
            <p className="text-xs text-slate-500 mt-0.5 tracking-widest">SYS.06</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col">
      {/* Ambient backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px]"></div>
      </div>

      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* ── WELCOME BANNER ── */}
        <div className="glass-card p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-[#050505] flex items-center justify-center text-cyan-400 font-digital font-black text-2xl text-glow">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#050505] shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
              </div>

              <div className="font-digital">
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">
                    Dashboard Pengguna
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase">
                  WELCOME, <span className="text-cyan-400 text-glow">{user?.username}</span>
                </h1>
                <p className="text-[10px] text-slate-500 mt-1 tracking-widest uppercase">SYS.06 • ONLINE</p>
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
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between font-digital">
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Status Hari Ini
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-sm bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <Wifi className="w-2.5 h-2.5 animate-pulse" /> LIVE
              </span>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-digital font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
                Judul Presensi Aktif ({activeTitles.length})
              </span>

              {activeTitles.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {(() => {
                    const now = new Date();
                    const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                    return activeTitles.map((t) => {
                      const record = userAttendances.find((a) => a.titleId === t.id);
                      const isHadir = record && record.status === 'Hadir';
                      // @ts-ignore
                      const isTimePassed = t.closingTime && currentHHMM >= t.closingTime;
                      const isDeadlinePassed = deadline ? new Date() > new Date(deadline) : false;
                      const isTidakHadir = !record && (isTimePassed || isDeadlinePassed);

                      return (
                        <div
                          key={t.id}
                          className={`p-3 rounded-lg flex items-center justify-between border transition-all ${
                            isHadir
                              ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                              : isTidakHadir
                              ? 'bg-pink-950/20 border-pink-500/40 shadow-[0_0_10px_rgba(255,0,106,0.1)]'
                              : 'bg-[#050505] border-cyan-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 rounded-md shrink-0 border ${
                              isHadir
                                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'
                                : isTidakHadir
                                ? 'bg-pink-900/30 text-pink-400 border-pink-500/50'
                                : 'bg-[#0a0a0a] text-slate-500 border-slate-700'
                            }`}>
                              {isHadir ? (
                                <CheckCircle2 className="w-4 h-4 drop-shadow-[0_0_3px_rgba(0,240,255,0.8)]" />
                              ) : isTidakHadir ? (
                                <XCircle className="w-4 h-4 drop-shadow-[0_0_3px_rgba(255,0,106,0.8)]" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-[11px] font-digital font-bold text-white truncate tracking-wider">{t.title}</span>
                          </div>

                          {isHadir ? (
                            <span className="text-[9px] font-digital font-bold px-2 py-0.5 rounded-sm bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shrink-0">
                              HADIR ({record.time})
                            </span>
                          ) : isTidakHadir ? (
                            <span className="text-[9px] font-digital font-bold px-2 py-0.5 rounded-sm bg-pink-900/30 text-pink-400 border border-pink-500/50 shrink-0">
                              TIDAK HADIR
                            </span>
                          ) : (
                            <span className="text-[9px] font-digital font-bold px-2 py-0.5 rounded-sm bg-[#050505] text-slate-400 border border-slate-700 shrink-0">
                              BELUM HADIR
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#050505] border border-cyan-900/30 text-center text-slate-500 text-[10px] font-digital font-bold tracking-widest">
                  TIDAK ADA DATA AKTIF
                </div>
              )}
            </div>
          </div>

          {/* Card: Sesi Admin & Actions */}
          <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 font-digital">
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                  Status Sesi
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
                    <span className="text-[10px] font-bold px-3 py-1 rounded-sm bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_rgba(0,240,255,0.8)]"></span>
                      DIBUKA
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-3 py-1 rounded-sm bg-pink-900/30 text-pink-400 border border-pink-500/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                      DITUTUP
                    </span>
                  )}
                </div>
              </div>

              {/* Status message */}
              {isAttendanceOpen ? (
                <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/40 text-[11px] leading-relaxed shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  <div className="flex items-start gap-3 text-cyan-100/80">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 drop-shadow-[0_0_3px_rgba(0,240,255,0.8)]" />
                    <div className="font-digital">
                      <p className="font-bold text-cyan-400 tracking-wider">SESI AKTIF</p>
                      <p className="mt-1 text-slate-300">
                        Sistem mendeteksi {activeTitles.length} modul aktif. Silakan lakukan inisialisasi presensi.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isExpired && attendanceStatus === 'OPEN' ? (
                <div className="p-4 rounded-lg bg-pink-950/20 border border-pink-500/40 flex items-start gap-3 text-[11px]">
                  <Timer className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 drop-shadow-[0_0_3px_rgba(255,0,106,0.8)]" />
                  <div className="font-digital">
                    <p className="font-bold text-pink-400 tracking-wider">TIMEOUT</p>
                    <p className="text-slate-300 mt-1">Batas waktu sesi ini telah berakhir.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#050505] border border-slate-800 flex items-start gap-3 text-[11px]">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="font-digital">
                    <p className="font-bold text-slate-400 tracking-wider">TERKUNCI</p>
                    <p className="text-slate-500 mt-1">Sistem menunggu otorisasi admin untuk membuka sesi.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {isAttendanceOpen && activeTitles.length > 0 ? (
              <Link
                href="/attendance"
                className="neon-button w-full py-3 mt-4 text-[11px] font-digital tracking-widest"
              >
                <Camera className="w-4 h-4 mr-2" />
                INITIALIZE PRESENSI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <button
                disabled
                className="w-full py-3 mt-4 rounded-lg font-digital font-bold text-[11px] tracking-widest text-slate-600 bg-[#050505] border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {isAttendanceOpen ? 'NO ACTIVE MODULE' : 'SYSTEM LOCKED'}
              </button>
            )}
          </div>

        </div>

        {/* ── RIWAYAT LINK ── */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
              <History className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-digital">
              <p className="text-xs font-bold text-white tracking-widest">LOG DATA</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Akses catatan riwayat sistem</p>
            </div>
          </div>
          <Link
            href="/history"
            className="px-4 py-2 rounded-md bg-[#050505] hover:bg-cyan-900/20 text-cyan-400 font-digital font-bold text-[10px] tracking-widest border border-cyan-900/50 hover:border-cyan-400 transition flex items-center gap-2"
          >
            LIHAT LOG
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ── SUBMITTED ATTENDANCES HISTORY ── */}
        {userAttendances.filter((att) => att.status === 'Hadir' && att.photo).length > 0 && (
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-[11px] font-digital font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 border-b border-cyan-900/30 pb-3">
              <div className="p-1.5 rounded-md bg-cyan-900/30 border border-cyan-500/30">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              Transmisi Data Berhasil
            </h3>

            <div className="space-y-4">
              {userAttendances
                .filter((att) => att.status === 'Hadir' && att.photo)
                .map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-[#050505] border border-cyan-900/40 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 bg-cyan-500 h-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                    
                    {att.photo && (
                      <div className="shrink-0 w-full sm:w-36 h-28 overflow-hidden rounded-md border border-cyan-900/50 relative group">
                        <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-transparent transition-colors z-10"></div>
                        <img
                          src={att.photo}
                          alt="Bukti Presensi"
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        {/* Scanline effect over image */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,240,255,0.1)_50%)] bg-[length:100%_4px] z-20 pointer-events-none mix-blend-overlay opacity-50"></div>
                      </div>
                    )}
                    <div className="space-y-2 text-xs flex-1 font-digital w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white tracking-widest">{att.title?.title}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_5px_rgba(0,240,255,0.2)] whitespace-nowrap">
                          {att.date} • {att.time}
                        </span>
                      </div>
                      <p className="text-slate-300 bg-[#0a0a0a] p-3 rounded-md border border-cyan-900/30 mt-2 text-[10px] tracking-wider leading-relaxed">
                        &gt; "{att.description}"
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
