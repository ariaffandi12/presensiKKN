'use client';

import { useState, useEffect } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string | null;
  onExpire?: () => void;
  variant?: 'admin' | 'user';
}

export function CountdownTimer({ deadline, onExpire, variant = 'user' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const target = new Date(deadline).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(0);
        setExpired(true);
        onExpire?.();
      } else {
        setTimeLeft(diff);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  if (!deadline) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft !== null && timeLeft < 5 * 60 * 1000; // < 5 menit
  const isWarning = timeLeft !== null && timeLeft < 10 * 60 * 1000; // < 10 menit

  if (expired || timeLeft === 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
        variant === 'admin'
          ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
      }`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Waktu Habis!
      </div>
    );
  }

  if (timeLeft === null) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all ${
      isUrgent
        ? 'bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse'
        : isWarning
        ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
        : variant === 'admin'
        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
    }`}>
      <Timer className="w-3.5 h-3.5" />
      {formatTime(timeLeft)}
    </div>
  );
}
