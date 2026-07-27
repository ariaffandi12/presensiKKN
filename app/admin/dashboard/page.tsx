'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { RealtimeClock } from '@/components/RealtimeClock';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useRealtime } from '@/hooks/useRealtime';
import {
  Users,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Search,
  Trash2,
  Maximize2,
  X,
  Layers,
  Calendar,
  Clock,
  ShieldCheck,
  Timer,
  RefreshCw,
  ChevronDown,
  Zap,
  TrendingUp,
  History,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: number | string;
  icon: any;
  gradient: string;
  glow: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'OPEN' | 'CLOSE'>('CLOSE');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 17,
    totalHadirToday: 0,
    belumHadir: 17,
    totalTitles: 0,
    totalPhotos: 0,
    totalAttendances: 0,
    activeTitle: 'Tidak ada',
  });
  const [monitoringList, setMonitoringList] = useState<any[]>([]);
  const [usersMonitoring, setUsersMonitoring] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingSession, setTogglingSession] = useState(false);

  // Duration / Target Time modal states
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedTargetTime, setSelectedTargetTime] = useState<string | null>(null);
  const [customTargetTime, setCustomTargetTime] = useState('');

  // Table Search Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Hadir' | 'Tidak Hadir' | 'Belum Hadir'>('ALL');

  // Photo Modal Preview State
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setAdminUser(meData.user);

      const settingRes = await fetch('/api/settings');
      const settingData = await settingRes.json();
      setAttendanceStatus(settingData.attendanceStatus || 'CLOSE');
      setDeadline(settingData.deadline || null);

      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const attRes = await fetch('/api/attendance');
      const attData = await attRes.json();
      setMonitoringList(attData.monitoringList || []);
      setUsersMonitoring(attData.usersMonitoring || []);
      // Filter photo monitoring to ONLY Hadir records with photos
      setAttendances(
        attData.hadirAttendances ||
          (attData.attendances || []).filter((a: any) => a.status === 'Hadir' && a.photo && a.photo.trim() !== '')
      );
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useRealtime(
    useCallback(
      (event: string) => {
        if (
          event === 'attendance_status_changed' ||
          event === 'titles_changed' ||
          event === 'attendance_submitted' ||
          event === 'attendance_deleted' ||
          event === 'login_status' ||
          event === 'midnight_reset'
        ) {
          fetchAdminData();
        }
      },
      [fetchAdminData]
    )
  );

  // Handle opening attendance - show duration modal
  const handleOpenAttendance = () => {
    setShowDurationModal(true);
  };

  // Confirm open with selected target time
  const handleConfirmOpen = async () => {
    const targetTime = selectedTargetTime || (customTargetTime || null);

    setShowDurationModal(false);
    setTogglingSession(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceStatus: 'OPEN',
          targetTime: targetTime || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal membuka presensi.');
        return;
      }

      setAttendanceStatus('OPEN');
      setDeadline(data.deadline || null);
      toast.success(targetTime
        ? `Presensi DIBUKA hingga pukul ${targetTime} WIB!`
        : 'Presensi DIBUKA tanpa batas waktu!'
      );
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setTogglingSession(false);
      setSelectedTargetTime(null);
      setCustomTargetTime('');
    }
  };

  // Close attendance
  const handleCloseAttendance = async () => {
    const result = await Swal.fire({
      title: 'Tutup Presensi?',
      text: 'Sesi presensi akan ditutup. Pengguna tidak bisa lagi mengirim presensi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Tutup Sekarang',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (!result.isConfirmed) return;

    setTogglingSession(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceStatus: 'CLOSE' }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal menutup presensi.');
        return;
      }

      setAttendanceStatus('CLOSE');
      setDeadline(null);
      toast.success('Presensi berhasil DITUTUP!');
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setTogglingSession(false);
    }
  };

  // Reopen attendance (without duration modal)
  const handleReopenAttendance = () => {
    setShowDurationModal(true);
  };

  // Delete Attendance Record with SweetAlert2
  const handleDeleteAttendance = async (attendanceId: number) => {
    const result = await Swal.fire({
      title: 'Hapus Presensi?',
      text: 'Data presensi ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/attendance?id=${attendanceId}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || 'Gagal menghapus presensi.');
          return;
        }

        toast.success('Presensi berhasil dihapus.');
        fetchAdminData();
      } catch {
        toast.error('Gagal menghapus data.');
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return usersMonitoring
      .map((user) => {
        const matchesUserName = user.username.toLowerCase().includes(searchQuery.toLowerCase());

        const filteredDates = user.dates
          .map((d: any) => {
            const filteredTitles = d.titles.filter((t: any) => {
              const matchesTitleName = t.title.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesSearch = matchesUserName || matchesTitleName;
              const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
              return matchesSearch && matchesStatus;
            });
            return { ...d, titles: filteredTitles };
          })
          .filter((d: any) => d.titles.length > 0);

        if (matchesUserName || filteredDates.length > 0) {
          return { ...user, dates: filteredDates };
        }
        return null;
      })
      .filter(Boolean);
  }, [usersMonitoring, searchQuery, statusFilter]);

  const filteredMonitoring = useMemo(() => {
    return monitoringList.filter((item) => {
      const matchesSearch =
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [monitoringList, searchQuery, statusFilter]);

  const hadirCount = monitoringList.filter(m => m.status === 'Hadir').length;
  const totalCount = monitoringList.length;
  const hadirPercent = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Memuat Dashboard Admin</p>
            <p className="text-xs text-slate-500 mt-0.5">Realtime Monitoring System</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: 'Total Pengguna',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.totalHadirToday,
      icon: UserCheck,
      gradient: 'from-emerald-600 to-teal-500',
      glow: 'shadow-emerald-500/20',
    },
    {
      label: 'Belum Hadir',
      value: stats.belumHadir,
      icon: UserX,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Total Judul',
      value: stats.totalTitles,
      icon: Layers,
      gradient: 'from-purple-600 to-violet-500',
      glow: 'shadow-purple-500/20',
    },
    {
      label: 'Total Foto',
      value: stats.totalPhotos,
      icon: ImageIcon,
      gradient: 'from-sky-600 to-blue-400',
      glow: 'shadow-sky-500/20',
    },
    {
      label: 'Total Presensi',
      value: stats.totalAttendances,
      icon: FileSpreadsheet,
      gradient: 'from-indigo-600 to-purple-500',
      glow: 'shadow-indigo-500/20',
    },
  ];

  const TIME_PRESETS = [
    { label: '12:00 (Siang)', time: '12:00' },
    { label: '15:00 (Sore)', time: '15:00' },
    { label: '17:00 (Sore)', time: '17:00' },
    { label: '21:00 (Malam)', time: '21:00' },
    { label: '23:59 (Tutup Hari Ini)', time: '23:59' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>

      <Navbar user={adminUser} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">

        {/* ── HEADER PANEL ── */}
        <div className="glass-card p-6">
          {/* Decorative top bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_10px_rgba(255,0,106,0.5)]"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Left: Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  Admin Control Panel
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase font-digital">
                Dashboard Monitoring{' '}
                <span className="text-pink-400 text-glow-pink">
                  Realtime
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <p className="text-xs text-slate-400">
                  Judul Aktif:{' '}
                  <span className="text-white font-semibold">{stats.activeTitle}</span>
                </p>
                {attendanceStatus === 'OPEN' && deadline && (
                  <CountdownTimer
                    deadline={deadline}
                    variant="admin"
                    onExpire={() => {
                      setAttendanceStatus('CLOSE');
                      setDeadline(null);
                      toast.warning('Waktu presensi telah habis! Sesi otomatis ditutup.');
                      fetchAdminData();
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Session Status Pill */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${
                attendanceStatus === 'OPEN'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${attendanceStatus === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                {attendanceStatus === 'OPEN' ? 'SESI DIBUKA' : 'SESI DITUTUP'}
              </div>

              {/* Riwayat Admin Button */}
              <Link
                href="/admin/history"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-bold text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2 hover:border-slate-600"
              >
                <History className="w-4 h-4 text-indigo-400" />
                Riwayat
              </Link>

              {/* Kelola Judul Button */}
              <Link
                href="/admin/titles"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-bold text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2 hover:border-slate-600"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                Kelola Judul
              </Link>

              {/* Primary Action Button */}
              {attendanceStatus === 'CLOSE' ? (
                <button
                  onClick={handleOpenAttendance}
                  disabled={togglingSession}
                  className="relative px-5 py-2.5 rounded-xl font-bold text-xs text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Buka Presensi
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleCloseAttendance}
                  disabled={togglingSession}
                  className="relative px-5 py-2.5 rounded-xl font-bold text-xs text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-red-500 group-hover:from-rose-500 group-hover:to-red-400 transition-all"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-red-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative flex items-center gap-2">
                    <StopCircle className="w-4 h-4" />
                    Tutup Presensi
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {attendanceStatus === 'OPEN' && totalCount > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Progress Kehadiran
                </span>
                <span className="text-xs font-bold text-emerald-400">{hadirCount}/{totalCount} ({hadirPercent}%)</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${hadirPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div
                key={idx}
                className={`relative overflow-hidden p-4 rounded-xl border border-cyan-900/40 bg-[#050505]/80 backdrop-blur-xl hover:-translate-y-1 transition-all duration-200 shadow-[0_0_15px_rgba(0,240,255,0.05)] cursor-default group`}
              >
                <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative">
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.gradient} bg-opacity-20 mb-3`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400 text-glow tabular-nums font-digital">{card.value}</div>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase font-digital">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MONITORING KEHADIRAN REALTIME (17 USER LIST & DATE GROUPS) ── */}
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                Monitoring Kehadiran Realtime
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 ml-9">
                Daftar 17 mahasiswa terdaftar & status presensi per tanggal (Klik status/nama untuk detail absensi & foto)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa / judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="ALL">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Belum Hadir">Belum Hadir</option>
              </select>
            </div>
          </div>

          {/* 17 Registered Users List */}
          <div className="p-5 space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <div
                  key={user.userId}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 space-y-3 transition-all hover:border-slate-700"
                >
                  {/* User Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-indigo-500/20 shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{user.username}</h3>
                        <p className="text-[11px] text-slate-500">Mahasiswa Terdaftar</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {user.hadirCount} Hadir
                      </span>
                      {user.tidakHadirCount > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {user.tidakHadirCount} Tidak Hadir
                        </span>
                      )}
                      {user.belumHadirCount > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {user.belumHadirCount} Belum
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates & Titles per date */}
                  <div className="space-y-3 pt-1">
                    {user.dates.map((dateObj: any) => (
                      <div key={dateObj.date} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/60">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Tanggal: <strong className="text-white">{dateObj.date}</strong></span>
                        </div>

                        {/* Title rows */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                          {dateObj.titles.map((t: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedPhoto({ ...t, username: user.username })}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                                t.status === 'Hadir'
                                  ? 'bg-emerald-950/20 border-emerald-800/30 hover:border-emerald-500/50'
                                  : t.status === 'Tidak Hadir'
                                  ? 'bg-rose-950/20 border-rose-800/30 hover:border-rose-500/50'
                                  : 'bg-slate-900/40 border-slate-800/40 hover:border-slate-700'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-white truncate">{t.title}</p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t.time}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {t.status === 'Hadir' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    <CheckCircle className="w-3 h-3" /> Hadir
                                  </span>
                                ) : t.status === 'Tidak Hadir' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                    <XCircle className="w-3 h-3" /> Tidak Hadir
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                    <Clock className="w-3 h-3" /> Belum
                                  </span>
                                )}

                                {t.attendanceId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttendance(t.attendanceId);
                                    }}
                                    title="Hapus Presensi"
                                    className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/20"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-600 font-medium">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Tidak ada data mahasiswa yang sesuai.
              </div>
            )}
          </div>
        </div>

        {/* ── MONITORING FOTO PRESENSI (HANYA YANG HADIR) ── */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-cyan-900/40">
            <div className="p-1.5 rounded-lg bg-sky-500/20">
              <ImageIcon className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Monitoring Foto Presensi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Foto dokumentasi & bukti absensi mahasiswa yang statusnya <strong className="text-emerald-400">Hadir</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {attendances.length > 0 ? (
              attendances.map((att) => (
                <div
                  key={att.id}
                  onClick={() => setSelectedPhoto(att)}
                  className="group relative bg-slate-950/80 rounded-2xl overflow-hidden border border-slate-800/60 hover:border-indigo-500/50 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={att.photo}
                      alt={`Foto Presensi ${att.user?.username || att.username}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/10 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                        <Maximize2 className="w-3 h-3" /> Lihat Detail
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full">
                        Hadir
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm truncate">
                        {att.user?.username || att.username}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 shrink-0 ml-1">
                        {att.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{att.title?.title || att.title}</p>
                    {att.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                        "{att.description}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-slate-600">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada foto presensi terkirim untuk status Hadir.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ── SET CLOSING TIME MODAL ── */}
      {showDurationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <Timer className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Buka Sesi Presensi</h3>
                  <p className="text-[11px] text-slate-400">Pilih jam tutup / batas waktu absensi</p>
                </div>
              </div>
              <button
                onClick={() => { setShowDurationModal(false); setSelectedTargetTime(null); setCustomTargetTime(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preset Time Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Pilihan Jam Tutup
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.time}
                      onClick={() => { setSelectedTargetTime(preset.time); setCustomTargetTime(''); }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${
                        selectedTargetTime === preset.time
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80'
                      }`}
                    >
                      <span>Jam {preset.time}</span>
                      <span className="text-[10px] opacity-70 font-normal">{preset.label.split('(')[1]?.replace(')', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom time picker input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Atur Jam Tutup Kustom
                </label>
                <input
                  type="time"
                  value={customTargetTime}
                  onChange={(e) => { setCustomTargetTime(e.target.value); setSelectedTargetTime(null); }}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition color-scheme-dark"
                />
              </div>

              {/* No limit option */}
              <button
                onClick={() => { setSelectedTargetTime(null); setCustomTargetTime(''); }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedTargetTime === null && !customTargetTime
                    ? 'bg-slate-700/80 border-slate-500 text-slate-200'
                    : 'bg-slate-800/30 border-slate-700/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                Tanpa Batas Waktu
              </button>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => { setShowDurationModal(false); setSelectedTargetTime(null); setCustomTargetTime(''); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOpen}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs transition hover:from-emerald-500 hover:to-teal-400 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <Zap className="w-3.5 h-3.5" />
                Buka Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO & ABSENSI PREVIEW MODAL ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Detail Absensi Mahasiswa:{' '}
                  <span className="text-indigo-400">{selectedPhoto.username || selectedPhoto.user?.username}</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedPhoto.date} • Jam: {selectedPhoto.time}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Status Kehadiran</span>
                {selectedPhoto.status === 'Hadir' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle className="w-3.5 h-3.5" /> Hadir
                  </span>
                ) : selectedPhoto.status === 'Tidak Hadir' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <XCircle className="w-3.5 h-3.5" /> Tidak Hadir
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    <Clock className="w-3.5 h-3.5" /> Belum Hadir
                  </span>
                )}
              </div>

              {/* Photo Image container */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[160px] max-h-[50vh] flex items-center justify-center">
                {selectedPhoto.photo ? (
                  <img
                    src={selectedPhoto.photo}
                    alt="Foto Bukti Absensi"
                    className="max-h-[50vh] w-auto object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">
                      {selectedPhoto.status === 'Tidak Hadir'
                        ? 'Status: Tidak Hadir (Melewati Batas Waktu Absensi - Tidak Ada Foto)'
                        : 'Belum Melakukan Absensi / Tidak Ada Foto Bukti'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Judul Presensi</span>
                  <p className="text-sm font-bold text-white mt-0.5">{typeof selectedPhoto.title === 'object' ? selectedPhoto.title?.title : selectedPhoto.title}</p>
                </div>
                {selectedPhoto.description && (
                  <div>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">Deskripsi Kegiatan</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedPhoto.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
