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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-transparent text-slate-100 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-[#050505] p-0 mb-4 transform hover:scale-105 transition">
            <Sparkles className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-digital">
            Presensi<span className="text-cyan-400 text-glow"> Digital</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 font-digital">
            Sistem Presensi Digital Kelompok 6
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-card p-8 bg-[#0a0a0a]/90 backdrop-blur-2xl">
          {/* Role Switcher */}
          <div className="flex bg-[#050505]/80 p-1.5 rounded-lg border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('USER');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === 'USER'
                  ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <User className="w-4 h-4" /> Pengguna
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === 'ADMIN'
                  ? 'bg-pink-900/40 text-pink-400 border border-pink-500/50 shadow-[0_0_10px_rgba(255,0,106,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Shield className="w-4 h-4" /> Administrator
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-lg bg-pink-950/20 border border-pink-500/50 text-pink-400 text-sm font-medium flex items-start gap-3 animate-shake shadow-[0_0_10px_rgba(255,0,106,0.1)]">
              <AlertCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/50 text-cyan-400 text-sm font-medium flex items-center gap-3 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-digital font-bold text-cyan-500 uppercase tracking-widest mb-2">
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
                  className="w-full pl-11 pr-4 py-3 glass-input text-sm font-digital"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-digital font-bold text-cyan-500 uppercase tracking-widest mb-2">
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
                  className="w-full pl-11 pr-4 py-3 glass-input text-sm font-digital"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 mt-2 font-digital text-sm ${
                role === 'ADMIN' ? 'neon-button-danger' : 'neon-button'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  INITIALIZE SYSTEM <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-xs font-digital text-slate-600 mt-6 tracking-widest">
          © 2026 PRESENSIKU • SYS.06
        </p>
      </div>
    </div>
  );
}
