import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseISODate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDaysPastDeadline(deadline?: string) {
  const date = parseISODate(deadline);
  if (!date) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isReminderDue(deadline?: string) {
  const days = getDaysPastDeadline(deadline);
  return days !== null && days >= 1;
  // days >= 1 :: reminder
}

// line off 
