'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import {
  History,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Inbox,
  Users,
  FileSpreadsheet,
  Maximize2,
  X,
  Trash2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface HistoryItem {
  id: number;
  userId: number;
  username: string;
  titleName: string;
  photo: string;
  description: string;
  date: string;
  time: string;
  status: string;
  archivedAt: string;
}

export default function AdminHistoryPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [usersHistory, setUsersHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Hadir' | 'Tidak Hadir'>('ALL');
  const [resetting, setResetting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setAdminUser(meData.user);

      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.history || []);
      setUsersHistory(data.usersHistory || []);
      setTotal(data.total || 0);

      // Auto-expand all users initially or maybe just the first one?
      // Let's not auto expand all, too much clutter.
    } catch {
      toast.error('Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleUser = (username: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  // Filter
  const filteredUsers = useMemo(() => {
    return usersHistory.map(user => {
      // If a user has dates, filter their titles based on search and status
      const matchUserName = user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const filteredDates = user.dates.map((d: any) => {
        const filteredTitles = d.titles.filter((t: any) => {
          const matchTitle = t.titleName.toLowerCase().includes(searchQuery.toLowerCase());
          const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
          return (matchUserName || matchTitle) && matchStatus;
        });
        return { ...d, titles: filteredTitles };
      }).filter((d: any) => d.titles.length > 0);

      return { ...user, dates: filteredDates };
    }).filter(user => user.dates.length > 0); // Only keep users who have at least one matching date
  }, [usersHistory, searchQuery, statusFilter]);

  // Manual reset trigger
  const handleManualReset = async () => {
    const result = await Swal.fire({
      title: 'Reset Presensi Harian?',
      html: `
        <div style="text-align:left; font-size: 13px; color: #94a3b8; line-height: 1.7">
          Tindakan ini akan:<br/>
          • Memindahkan semua data presensi hari ini ke Riwayat<br/>
          • Menonaktifkan semua judul presensi<br/>
          • Menutup sesi presensi<br/><br/>
          <span style="color: #f87171">Tindakan ini tidak dapat dibatalkan.</span>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Reset Sekarang',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (!result.isConfirmed) return;

    setResetting(true);
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal melakukan reset.');
        return;
      }
      toast.success('Reset presensi harian berhasil! Data dipindahkan ke riwayat.');
      fetchHistory();
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAllHistory = async () => {
    const result = await Swal.fire({
      title: 'Hapus Semua Riwayat?',
      html: `
        <div style="text-align:left; font-size: 13px; color: #94a3b8; line-height: 1.7">
          Tindakan ini akan:<br/>
          • Menghapus SELURUH data riwayat presensi secara permanen.<br/><br/>
          <span style="color: #f87171">Tindakan ini tidak dapat dibatalkan.</span>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal menghapus riwayat.');
        setLoading(false);
        return;
      }
      toast.success('Semua riwayat berhasil dihapus!');
      fetchHistory();
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
      setLoading(false);
    }
  };

  const totalHadir = history.filter(i => i.status === 'Hadir').length;
  const totalTidakHadir = history.filter(i => i.status === 'Tidak Hadir').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-400">Memuat Riwayat Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/6 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={adminUser} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition border border-slate-700/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Riwayat Presensi Admin
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {total} total catatan tersimpan dari semua pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteAllHistory}
              disabled={resetting || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 font-bold text-xs border border-slate-700/60 hover:border-rose-500/50 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Semua
            </button>
            <button
              onClick={handleManualReset}
              disabled={resetting || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-600/30 hover:border-rose-500/50 transition disabled:opacity-50"
            >
              {resetting
                ? <div className="w-3.5 h-3.5 border-2 border-rose-300/30 border-t-rose-300 rounded-full animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />
              }
              Reset Manual
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/30 text-xs text-indigo-300">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-indigo-200">Reset Otomatis:</strong> Data presensi aktif akan otomatis dipindahkan ke halaman ini setiap pukul <strong className="text-white">00.00</strong> (dideteksi saat request pertama di hari baru). Tombol "Reset Manual" dapat digunakan admin untuk memaksa reset.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Catatan', value: total, color: 'text-white', bg: 'bg-slate-800/60 border-slate-700/60' },
            { label: 'Total Pengguna', value: usersHistory.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Total Hadir', value: totalHadir, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Tidak Hadir', value: totalTidakHadir, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border ${s.bg} p-4 text-center`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama pengguna atau judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2.5 px-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
            </select>
          </div>
        )}

        {/* History grouped by User Accordion */}
        {filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUsers.has(user.username);

              return (
                <div key={user.userId} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl transition-all">
                  {/* User Accordion Header */}
                  <button
                    onClick={() => toggleUser(user.username)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-500/20 shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{user.username}</p>
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
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />
                        : <ChevronRight className="w-4 h-4 text-slate-500 ml-2" />
                      }
                    </div>
                  </button>

                  {/* Expandable Content: Dates and Titles */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/60 p-5 space-y-4 bg-slate-950/40">
                      {user.dates.map((dateObj: any) => (
                        <div key={dateObj.date} className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/60 inline-flex">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Tanggal: <strong className="text-white">{dateObj.date}</strong></span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 border-l-2 border-slate-800 ml-1.5 mt-2">
                            {dateObj.titles.map((t: any, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (t.photo) setSelectedPhoto({ ...t, username: user.username, date: dateObj.date });
                                }}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:scale-[1.01] ${
                                  t.status === 'Hadir'
                                    ? 'bg-emerald-950/20 border-emerald-800/30 hover:border-emerald-500/50 cursor-pointer'
                                    : 'bg-rose-950/20 border-rose-800/30 hover:border-rose-500/50 cursor-default'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold text-white truncate">{t.titleName}</p>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t.time}</p>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                  {t.status === 'Hadir' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                      <CheckCircle2 className="w-3 h-3" /> Hadir
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                      <XCircle className="w-3 h-3" /> Tidak Hadir
                                    </span>
                                  )}

                                  {t.photo && (
                                    <button
                                      title="Lihat Foto"
                                      className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 hover:text-sky-400 transition border border-sky-500/20"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-base font-bold text-slate-400">
              {total === 0 ? 'Belum Ada Riwayat' : 'Tidak Ada Hasil'}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">
              {total === 0
                ? 'Riwayat presensi akan muncul setelah data harian direset pada pukul 00.00.'
                : 'Coba ubah filter pencarian untuk menemukan data yang dicari.'}
            </p>
          </div>
        )}
      </main>

      {/* Photo Preview Modal */}
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
                  Foto Bukti: <span className="text-indigo-400">{selectedPhoto.username}</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedPhoto.date} • {selectedPhoto.time} • {selectedPhoto.titleName}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[55vh] flex items-center justify-center">
                <img
                  src={selectedPhoto.photo}
                  alt="Preview"
                  className="max-h-[55vh] w-auto object-contain"
                />
              </div>
              {selectedPhoto.description && (
                <p className="text-xs text-slate-400 mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/40 leading-relaxed">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
