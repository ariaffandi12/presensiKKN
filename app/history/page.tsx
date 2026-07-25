'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  History,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Inbox,
  Image as ImageIcon,
} from 'lucide-react';

interface HistoryItem {
  id: number;
  titleName: string;
  photo: string;
  description: string;
  date: string;
  time: string;
  status: string;
  archivedAt: string;
}

export default function UserHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [grouped, setGrouped] = useState<Record<string, HistoryItem[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'USER') {
        router.push('/login');
        return;
      }
      setUser(meData.user);

      const res = await fetch('/api/history');
      const data = await res.json();
      setGrouped(data.grouped || {});
      setTotal(data.total || 0);

      // Auto-expand the most recent date
      const dates = Object.keys(data.grouped || {});
      if (dates.length > 0) {
        setExpandedDates(new Set([dates[0]]));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-400">Memuat Riwayat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/6 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={user} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Riwayat Presensi Saya
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {total} total catatan presensi tersimpan
            </p>
          </div>
        </div>

        {/* Stats row */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Catatan',
                value: total,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
              },
              {
                label: 'Hadir',
                value: Object.values(grouped).flat().filter(i => i.status === 'Hadir').length,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                label: 'Tidak Hadir',
                value: Object.values(grouped).flat().filter(i => i.status === 'Tidak Hadir').length,
                color: 'text-rose-400',
                bg: 'bg-rose-500/10 border-rose-500/20',
              },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border ${s.bg} p-4 text-center`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* History grouped by date */}
        {sortedDates.length > 0 ? (
          <div className="space-y-3">
            {sortedDates.map((date) => {
              const items = grouped[date];
              const isExpanded = expandedDates.has(date);
              const hadirCount = items.filter(i => i.status === 'Hadir').length;

              return (
                <div key={date} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                  {/* Date header — clickable to expand */}
                  <button
                    onClick={() => toggleDate(date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/20">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{date}</p>
                        <p className="text-[11px] text-slate-500">
                          {items.length} presensi • {hadirCount} hadir
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        hadirCount === items.length
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : hadirCount === 0
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {hadirCount}/{items.length}
                      </span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-500" />
                        : <ChevronRight className="w-4 h-4 text-slate-500" />
                      }
                    </div>
                  </button>

                  {/* Expandable items */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
                      {items.map((item) => (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4">
                          {/* Photo thumbnail */}
                          {item.photo ? (
                            <div
                              className="shrink-0 w-full sm:w-24 h-20 overflow-hidden rounded-xl border border-slate-800 cursor-pointer hover:border-blue-500/40 transition group"
                              onClick={() => setSelectedPhoto(item)}
                            >
                              <img
                                src={item.photo}
                                alt="Foto presensi"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="shrink-0 w-full sm:w-24 h-20 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-700" />
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-white">{item.titleName}</p>
                              <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                item.status === 'Hadir'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}>
                                {item.status === 'Hadir'
                                  ? <CheckCircle2 className="w-3 h-3" />
                                  : <XCircle className="w-3 h-3" />
                                }
                                {item.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.time}
                              </span>
                            </div>

                            {item.status === 'Hadir' && item.description && (
                              <p className="text-[12px] text-slate-400 bg-slate-950/40 rounded-lg px-3 py-2 border border-slate-800/40 leading-relaxed line-clamp-2">
                                <FileText className="w-3 h-3 inline mr-1 text-slate-500" />
                                {item.description}
                              </p>
                            )}
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
            <h3 className="text-base font-bold text-slate-400">Belum Ada Riwayat</h3>
            <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">
              Riwayat presensi akan muncul di sini setelah data harian direset pada pukul 00.00.
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
            className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">{selectedPhoto.titleName}</h3>
              <p className="text-xs text-slate-500">{selectedPhoto.date} • {selectedPhoto.time}</p>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.photo}
                alt="Preview"
                className="w-full rounded-xl border border-slate-800 max-h-[55vh] object-contain bg-slate-950"
              />
              {selectedPhoto.description && (
                <p className="text-xs text-slate-400 mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/40 leading-relaxed">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
