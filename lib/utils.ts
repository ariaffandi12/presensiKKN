import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── WIB (Asia/Jakarta - UTC+7) Helpers ─────────────────────────────────────

export function getWIBDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });

  const hour = (map.hour === '24' || map.hour === '00') ? '00' : map.hour;

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: hour,
    minute: map.minute,
    second: map.second,
  };
}

export function getTodayWIBStr(date: Date = new Date()): string {
  const { year, month, day } = getWIBDateParts(date);
  return `${year}-${month}-${day}`;
}

export function formatIndonesianDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatIndonesianTime(date: Date = new Date()): string {
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
  return `${time.replace(/\./g, ':')} WIB`;
}

export function parseWIBTargetTime(targetTime: string, referenceDate: Date = new Date()): Date {
  const todayStr = getTodayWIBStr(referenceDate);
  const isoStr = `${todayStr}T${targetTime}:00+07:00`;
  return new Date(isoStr);
}
