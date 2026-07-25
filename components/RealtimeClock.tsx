'use client';

import { useState, useEffect } from 'react';
import { formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface RealtimeClockProps {
  variant?: 'compact' | 'detailed';
}

export function RealtimeClock({ variant = 'detailed' }: RealtimeClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-8 w-48 rounded-lg"></div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
        <Clock className="w-4 h-4 text-blue-500 animate-spin-slow" />
        <span>{formatIndonesianDate(now)}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {formatIndonesianTime(now)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/10 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-md">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="text-base font-semibold">{formatIndonesianDate(now)}</span>
      </div>
      <div className="hidden sm:block text-slate-300 dark:text-slate-600">|</div>
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg tracking-wider font-mono">
        <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
        <span>{formatIndonesianTime(now)}</span>
      </div>
    </div>
  );
}
