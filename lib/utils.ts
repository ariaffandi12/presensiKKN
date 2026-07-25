import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// WIB = UTC+7. This always returns the correct WIB time regardless of server timezone.
export function getNowWIB(): Date {
  const now = new Date();
  // Offset in ms: WIB is UTC+7
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + WIB_OFFSET_MS);
}

export function formatIndonesianDate(date: Date = getNowWIB()): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Use UTC methods on the WIB-shifted date to get correct values
  const dayName = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

export function formatIndonesianTime(date: Date = getNowWIB()): string {
  // Use UTC methods on the WIB-shifted date
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds} WIB`;
}

// Returns current WIB time as "HH:mm" string for closingTime comparison
export function getCurrentHHMMWIB(): string {
  const wib = getNowWIB();
  const h = String(wib.getUTCHours()).padStart(2, '0');
  const m = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Returns today's date string "YYYY-MM-DD" in WIB
export function getTodayWIB(): string {
  const wib = getNowWIB();
  const y = wib.getUTCFullYear();
  const mo = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
