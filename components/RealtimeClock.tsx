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
      <div className="animate-pulse bg-[#0a0a0a] border border-cyan-900/50 h-8 w-48 rounded-md"></div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-xs font-digital font-bold text-slate-300 bg-[#0a0a0a]/80 px-3 py-1.5 rounded-md border border-cyan-900/40 shadow-[0_0_10px_rgba(0,240,255,0.05)]">
        <Clock className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
        <span className="tracking-widest">{formatIndonesianDate(now)}</span>
        <span className="text-cyan-900 mx-1">|</span>
        <span className="text-cyan-400 tracking-wider text-glow">
          {formatIndonesianTime(now)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0a0a0a]/90 p-4 rounded-xl border border-cyan-900/50 shadow-[0_0_20px_rgba(0,240,255,0.1)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 bg-cyan-500 h-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
      
      <div className="flex items-center gap-2 text-slate-300 font-digital pl-2">
        <Calendar className="w-4 h-4 text-cyan-500" />
        <span className="text-sm font-bold tracking-widest">{formatIndonesianDate(now)}</span>
      </div>
      
      <div className="hidden sm:block text-cyan-900/50 text-xl font-light">/</div>
      
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl tracking-widest font-digital text-glow">
        <Clock className="w-5 h-5 text-cyan-500 animate-pulse drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
        <span>{formatIndonesianTime(now)}</span>
      </div>
    </div>
  );
}
