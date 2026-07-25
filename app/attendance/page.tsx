'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CameraCapture } from '@/components/CameraCapture';
import { CountdownTimer } from '@/components/CountdownTimer';
import { formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  Send,
  Sparkles,
  Camera,
  Layers,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const attendanceSchema = z.object({
  titleId: z.string().min(1, 'Pilih salah satu Judul Presensi.'),
  description: z.string().min(1, 'Deskripsi wajib diisi.'),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [availableTitles, setAvailableTitles] = useState<Array<{ id: number; title: string }>>([]);
  const [allActiveCount, setAllActiveCount] = useState<number>(0);
  const [attendanceStatus, setAttendanceStatus] = useState<'OPEN' | 'CLOSE'>('CLOSE');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    setCurrentDateTimeStr(`${formatIndonesianDate(now)} • ${formatIndonesianTime(now)}`);
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentDateTimeStr(`${formatIndonesianDate(d)} • ${formatIndonesianTime(d)}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
  });

  const loadInitialData = useCallback(async () => {
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
      setAttendanceStatus(settingData.attendanceStatus || 'CLOSE');
      setDeadline(settingData.deadline || null);

      const isExpired = settingData.deadline && new Date() > new Date(settingData.deadline);

      if (settingData.attendanceStatus !== 'OPEN' || isExpired) {
        toast.warning('Presensi belum dibuka atau waktu telah habis.');
        router.push('/dashboard');
        return;
      }

      const attRes = await fetch('/api/attendance');
      const attData = await attRes.json();
      const rawActiveTitles: Array<{ id: number; title: string }> =
        attData.activeTitles || (attData.activeTitle ? [attData.activeTitle] : []);

      setAllActiveCount(rawActiveTitles.length);

      // Filter titles that current user HAS NOT submitted yet and that are NOT past closingTime
      const now = new Date();
      const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      const submittedTitleIds = (attData.attendances || [])
        .filter((a: any) => a.userId === meData.user.id)
        .map((a: any) => a.titleId);

      const filteredTitles = rawActiveTitles.filter(
        (t) => {
          if (submittedTitleIds.includes(t.id)) return false;
          // @ts-ignore - t has closingTime from API
          if (t.closingTime && currentHHMM >= t.closingTime) return false;
          return true;
        }
      );

      setAvailableTitles(filteredTitles);

      if (filteredTitles.length > 0) {
        setValue('titleId', String(filteredTitles[0].id));
      }
    } catch {
      toast.error('Gagal memuat form presensi.');
    } finally {
      setLoading(false);
    }
  }, [router, setValue]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const onSubmit = async (data: AttendanceFormData) => {
    setPhotoError(false);

    if (!capturedPhoto) {
      setPhotoError(true);
      toast.error('Foto bukti wajib diambil sebelum submit.');
      return;
    }

    if (!data.titleId) {
      toast.error('Pilih salah satu Judul Presensi.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleId: Number(data.titleId),
          description: data.description,
          photo: capturedPhoto,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        toast.error(resData.message || 'Gagal mengirim presensi.');
        setSubmitting(false);
        return;
      }

      await Swal.fire({
        title: '✅ Presensi Berhasil!',
        text: 'Bukti presensi Anda telah berhasil dikirim.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Kembali ke Dashboard',
        background: '#0f172a',
        color: '#f1f5f9',
      });

      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Terjadi kesalahan saat mengirim presensi.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={user} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 relative z-10">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 p-2 pr-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white text-xs font-bold border border-slate-700/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <div className="flex items-center gap-2">
            {deadline && (
              <CountdownTimer
                deadline={deadline}
                variant="user"
                onExpire={() => {
                  toast.error('Waktu presensi telah habis!');
                  router.push('/dashboard');
                }}
              />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              SESI DIBUKA
            </span>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 pb-5 border-b border-slate-800/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Form Presensi Digital
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Isi Presensi Kehadiran
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Pilih judul presensi aktif yang belum Anda isi, berikan deskripsi kegiatan, dan ambil foto bukti.
              </p>
            </div>

            {availableTitles.length > 0 ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Judul Presensi Select Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Pilih Judul Presensi (Belum Diisi) <span className="text-rose-400">*</span>
                  </label>

                  <div className="relative">
                    <select
                      {...register('titleId')}
                      className="w-full py-3 px-4 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition cursor-pointer appearance-none"
                    >
                      {availableTitles.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          ✓ {t.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>

                  {errors.titleId && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.titleId.message}
                    </p>
                  )}
                </div>

                {/* Tanggal & Jam */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tanggal & Jam Presensi
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentDateTimeStr}
                    className="w-full py-3 px-4 bg-slate-950/60 border border-slate-800/60 rounded-xl text-blue-400 font-mono font-bold text-sm cursor-not-allowed select-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Deskripsi Kegiatan
                    <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Tuliskan deskripsi kegiatan atau keterangan presensi Anda..."
                    className="w-full p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition resize-y"
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Camera */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    Foto Bukti Kehadiran
                    <span className="text-rose-400">*</span>
                  </label>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                    <CameraCapture onCapture={(photoUrl) => {
                      setCapturedPhoto(photoUrl);
                      if (photoUrl) setPhotoError(false);
                    }} />
                  </div>

                  {photoError && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Foto bukti wajib diambil sebelum submit.
                    </p>
                  )}

                  {capturedPhoto && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Foto berhasil diambil. Siap dikirim!
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm text-slate-400 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-2 flex-grow py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Kirim Presensi</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Semua Presensi Telah Diisi!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    {allActiveCount > 0
                      ? 'Anda telah sukses mengisi presensi untuk seluruh judul presensi yang aktif saat ini.'
                      : 'Belum ada Judul Presensi yang diaktifkan oleh Admin.'}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
