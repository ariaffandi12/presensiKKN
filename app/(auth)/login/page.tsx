'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, User, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Mohon isi username dan password.');
      toast.error('Mohon isi username dan password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'Login gagal.');
        toast.error(data.message || 'Login gagal.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Login Berhasil');
      toast.success('Login Berhasil');

      setTimeout(() => {
        if (data.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }, 500);
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan.');
      toast.error('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  };

  const fillQuickCredentials = (usr: string, pass: string, r: 'USER' | 'ADMIN') => {
    setRole(r);
    setUsername(usr);
    setPassword(pass);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">

      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-2xl shadow-blue-500/30 mb-4 transform hover:scale-105 transition">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Presensi<span className="text-blue-400">Ku</span> Realtime
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Sistem Presensi Digital Kelompok 6
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-card p-8 shadow-2xl backdrop-blur-2xl border border-slate-800/80 bg-slate-900/80">

          {/* Role Switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('USER');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${role === 'USER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <User className="w-4 h-4" /> Pengguna (Mahasiswa)
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${role === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Shield className="w-4 h-4" /> Administrator
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-sm font-medium flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Username {role === 'ADMIN' ? 'Admin' : 'Pengguna'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'Contoh: Admin' : 'Contoh: Ari'}
                  className="w-full pl-11 pr-4 py-3 glass-input text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-11 pr-4 py-3 glass-input text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${role === 'ADMIN'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
                } disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Masuk Sekarang <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Pilih Akun Demo Cepat
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredentials('Ari', '12345678', 'USER')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition"
              >
                <div className="font-bold text-blue-400">User: Ari</div>
                <div className="text-[10px] text-slate-400">Pass: 12345678</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('Admin', '0000', 'ADMIN')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition"
              >
                <div className="font-bold text-indigo-400">Admin</div>
                <div className="text-[10px] text-slate-400">Pass: 0000</div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 PresensiKu Realtime • Kelompok 6
        </p>

      </div>
    </div>
  );
}
