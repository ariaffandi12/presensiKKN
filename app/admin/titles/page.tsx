'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useRealtime } from '@/hooks/useRealtime';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ArrowLeft,
  X,
  Check,
  Zap,
  Radio,
  Hash,
  Calendar,
  PowerOff,
  Clock,
  Timer,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface TitleItem {
  id: number;
  title: string;
  isActive: boolean;
  closingTime?: string | null;
  createdAt: string;
}

export default function AdminTitlesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newClosingTime, setNewClosingTime] = useState('21:00');
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [editingTitle, setEditingTitle] = useState<TitleItem | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [editClosingTimeValue, setEditClosingTimeValue] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setAdminUser(meData.user);

      const res = await fetch('/api/titles');
      const data = await res.json();
      setTitles(data.titles || []);
    } catch {
      toast.error('Gagal memuat daftar judul presensi.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(
    useCallback(
      (event: string) => {
        if (event === 'titles_changed') {
          loadData();
        }
      },
      [loadData]
    )
  );

  const handleAddTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Judul presensi wajib diisi.');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          closingTime: newClosingTime || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal menambahkan judul.');
        return;
      }

      toast.success('Judul presensi berhasil ditambahkan & DIAKTIFKAN untuk seluruh pengguna!');
      setNewTitle('');
      setNewClosingTime('21:00');
      loadData();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: number, targetStatus: boolean, currentClosingTime?: string | null) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/titles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isActive: targetStatus,
          closingTime: currentClosingTime || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal mengubah status judul.');
        return;
      }

      toast.success(
        targetStatus
          ? `Judul presensi DIAKTIFKAN${currentClosingTime ? ` (Batas Waktu Jam ${currentClosingTime} WIB)` : ''}!`
          : 'Judul presensi DINONAKTIFKAN!'
      );
      loadData();
    } catch {
      toast.error('Gagal mengubah status judul.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTitle || !editInputValue.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/titles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTitle.id,
          title: editInputValue,
          closingTime: editClosingTimeValue || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Gagal mengubah judul.');
        return;
      }

      toast.success('Judul presensi berhasil diperbarui!');
      setEditingTitle(null);
      loadData();
    } catch {
      toast.error('Gagal mengubah judul.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTitle = async (id: number, titleText: string) => {
    const result = await Swal.fire({
      title: 'Hapus Judul Presensi?',
      text: `"${titleText}" akan dihapus permanen beserta seluruh data presensinya.`,
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
        const res = await fetch(`/api/titles?id=${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || 'Gagal menghapus judul.');
          return;
        }

        toast.success('Judul presensi berhasil dihapus.');
        loadData();
      } catch {
        toast.error('Gagal menghapus data.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  const activeTitles = titles.filter((t) => t.isActive);

  const TIME_PRESETS = ['12:00', '15:00', '17:00', '21:00', '23:59'];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={adminUser} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">

        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Kelola Judul Presensi</h1>
            <p className="text-xs text-slate-500">Tambah, edit, hapus, atur batas waktu (jam tutup), serta aktifkan/nonaktifkan judul presensi</p>
          </div>
        </div>

        {/* Active Titles Banner */}
        {activeTitles.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 shrink-0 mt-0.5">
                  <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    Judul Aktif Saat Ini ({activeTitles.length})
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {activeTitles.map((at) => (
                      <span
                        key={at.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/40 text-xs font-bold"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                        {at.title}
                        {at.closingTime && (
                          <span className="text-[10px] bg-purple-900/80 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                            Jam {at.closingTime}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 self-end sm:self-center">
                <span className="text-[10px] font-black bg-purple-500 text-white px-2.5 py-1 rounded-full">
                  MULTI-AKTIF
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">

          {/* Add Form */}
          <div className="p-5 border-b border-slate-800/60 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Tambah Judul Presensi & Batas Waktu
            </h2>
            <form onSubmit={handleAddTitle} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Contoh: Rapat Koordinasi Kelompok 6..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                />

                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold text-xs transition hover:from-purple-500 hover:to-violet-400 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 shrink-0"
                >
                  {adding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Tambah
                    </>
                  )}
                </button>
              </div>

              {/* Batas Waktu / Jam Tutup Selector */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Batas Waktu Absensi (Jam Tutup)
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Preset quick buttons */}
                  {TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewClosingTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newClosingTime === t
                          ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      Jam {t}
                    </button>
                  ))}

                  {/* Custom time picker */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-semibold text-slate-500">Kustom:</span>
                    <input
                      type="time"
                      value={newClosingTime}
                      onChange={(e) => setNewClosingTime(e.target.value)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition color-scheme-dark"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Titles List */}
          <div className="divide-y divide-slate-800/40">
            {titles.length > 0 ? (
              titles.map((t) => (
                <div
                  key={t.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 transition-all ${
                    t.isActive
                      ? 'bg-purple-950/20'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      t.isActive
                        ? 'bg-gradient-to-br from-purple-600 to-violet-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {t.isActive ? <CheckCircle className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm truncate">{t.title}</h3>
                        {t.isActive && (
                          <span className="text-[10px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-full shrink-0">
                            AKTIF
                          </span>
                        )}
                        {t.closingTime ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            Tutup: Jam {t.closingTime} WIB
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            Tanpa Batas Jam
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <p className="text-[11px] text-slate-600">
                          Dibuat:{' '}
                          {new Date(t.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Toggle Active Button */}
                    {t.isActive ? (
                      <button
                        onClick={() => handleToggleActive(t.id, false, t.closingTime)}
                        disabled={togglingId === t.id}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 hover:border-rose-700 disabled:opacity-50"
                      >
                        {togglingId === t.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <PowerOff className="w-3.5 h-3.5" />
                        )}
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(t.id, true, t.closingTime)}
                        disabled={togglingId === t.id}
                        className="px-3.5 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 border border-purple-500/40 hover:border-purple-400/60 disabled:opacity-50"
                      >
                        {togglingId === t.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        Aktifkan
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingTitle(t);
                        setEditInputValue(t.title);
                        setEditClosingTimeValue(t.closingTime || '21:00');
                      }}
                      title="Edit Judul & Batas Waktu"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700/60"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTitle(t.id, t.title)}
                      title="Hapus Judul"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 transition border border-rose-500/20 hover:border-rose-500/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-600">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">Belum ada judul presensi.</p>
                <p className="text-xs mt-1 text-slate-700">Tambahkan judul baru menggunakan form di atas.</p>
              </div>
            )}
          </div>

        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/30 text-xs text-indigo-300">
          <div className="p-1 rounded-lg bg-indigo-500/20 shrink-0 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="leading-relaxed">
            <strong className="text-indigo-200">Batas Waktu (Jam Tutup):</strong> Setiap judul presensi dapat diberi jam tutup (misal: <strong className="text-white">Jam 21:00 WIB</strong>). Saat Anda mengeklik <strong className="text-white">Aktifkan</strong>, presensi otomatis dibuka hingga jam tersebut, dan setelah lewat jam tutup, pengguna yang belum absen akan otomatis diberi status <strong className="text-rose-300">Tidak Hadir</strong>.
          </p>
        </div>

      </main>

      {/* ── EDIT TITLE MODAL ── */}
      {editingTitle && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <Edit2 className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-white text-sm">Edit Judul & Batas Waktu</h3>
              </div>
              <button
                onClick={() => setEditingTitle(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Judul Presensi
                </label>
                <input
                  type="text"
                  value={editInputValue}
                  onChange={(e) => setEditInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Batas Waktu (Jam Tutup)
                </label>
                <input
                  type="time"
                  value={editClosingTimeValue}
                  onChange={(e) => setEditClosingTimeValue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition color-scheme-dark"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setEditingTitle(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold text-xs transition hover:from-purple-500 hover:to-violet-400 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
