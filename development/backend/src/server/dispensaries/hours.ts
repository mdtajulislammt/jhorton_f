import { HoursKind } from '@prisma/client';
import { HoursWindowDto } from './types';

const WEEKDAYS_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface DispensaryHoursRecord {
  kind: HoursKind;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface ZonedTimeInfo {
  dayOfWeek: number;
  timeString: string;
  hour: number;
  minute: number;
}

/**
 * Converts a UTC Date into the dispensary's wall-clock time and day of week.
 * Uses Intl.DateTimeFormat to correctly account for Daylight Saving Time (DST)
 * in America/New_York (or specified IANA timezone).
 */
export function getZonedTime(
  date: Date = new Date(),
  timeZone: string = 'America/New_York'
): ZonedTimeInfo {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  let weekday = '';
  let hourStr = '00';
  let minuteStr = '00';

  for (const part of parts) {
    if (part.type === 'weekday') weekday = part.value;
    if (part.type === 'hour') hourStr = part.value;
    if (part.type === 'minute') minuteStr = part.value;
  }

  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const dayOfWeek = WEEKDAYS_MAP[weekday] ?? 0;
  const timeString = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;

  return {
    dayOfWeek,
    timeString,
    hour,
    minute,
  };
}

/**
 * Evaluates whether a set of hours records for a given kind (STORE or DELIVERY)
 * is open right now, correctly handling:
 * - Past-midnight closing shifts (e.g., opens 18:00, closes 02:00)
 * - DST spring-forward and fall-back clock transitions
 * - Closed days (isClosed = true or missing records)
 */
export function isHoursOpenNow(
  hoursRecords: DispensaryHoursRecord[],
  kind: HoursKind,
  now: Date = new Date(),
  timeZone: string = 'America/New_York'
): boolean {
  if (!hoursRecords || hoursRecords.length === 0) {
    return false;
  }

  const zoned = getZonedTime(now, timeZone);
  const todayDay = zoned.dayOfWeek;
  const yesterdayDay = (todayDay + 6) % 7;
  const currentTime = zoned.timeString;

  // 1. Check if open from today's shift
  const today = hoursRecords.find((h) => h.kind === kind && h.dayOfWeek === todayDay);
  if (today && !today.isClosed) {
    // 24-hour open store
    if (
      today.opensAt === '00:00' &&
      (today.closesAt === '24:00' || today.closesAt === '00:00')
    ) {
      return true;
    }

    if (today.opensAt < today.closesAt) {
      // Standard daytime window, e.g. 09:00 - 22:00
      if (currentTime >= today.opensAt && currentTime < today.closesAt) {
        return true;
      }
    } else if (today.opensAt > today.closesAt) {
      // Past-midnight shift starting today, e.g. 18:00 - 02:00
      // Open from 18:00 to 23:59:59
      if (currentTime >= today.opensAt) {
        return true;
      }
    }
  }

  // 2. Check if open from yesterday's shift that crossed midnight into today
  const yesterday = hoursRecords.find(
    (h) => h.kind === kind && h.dayOfWeek === yesterdayDay
  );
  if (yesterday && !yesterday.isClosed) {
    if (yesterday.opensAt > yesterday.closesAt) {
      // Yesterday crossed midnight (e.g. 18:00 - 02:00)
      // If current time is before yesterday's closing time, store is still open
      if (currentTime < yesterday.closesAt) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns the scheduled opening/closing window for today.
 * Returns null if closed today or no record exists.
 */
export function getDispensaryHoursToday(
  hoursRecords: DispensaryHoursRecord[],
  kind: HoursKind,
  now: Date = new Date(),
  timeZone: string = 'America/New_York'
): HoursWindowDto | null {
  if (!hoursRecords || hoursRecords.length === 0) {
    return null;
  }

  const zoned = getZonedTime(now, timeZone);
  const today = hoursRecords.find((h) => h.kind === kind && h.dayOfWeek === zoned.dayOfWeek);

  if (!today || today.isClosed) {
    return null;
  }

  return {
    opensAt: today.opensAt,
    closesAt: today.closesAt,
  };
}

/**
 * Evaluates whether a dispensary is currently open for in-store pickup (STORE hours).
 */
export function isOpenNow(
  hoursRecords: DispensaryHoursRecord[],
  now: Date = new Date(),
  timeZone: string = 'America/New_York'
): boolean {
  return isHoursOpenNow(hoursRecords, HoursKind.STORE, now, timeZone);
}

/**
 * Evaluates whether a dispensary is currently delivering (DELIVERY hours, independent of STORE).
 */
export function isDeliveringNow(
  hoursRecords: DispensaryHoursRecord[],
  now: Date = new Date(),
  timeZone: string = 'America/New_York'
): boolean {
  return isHoursOpenNow(hoursRecords, HoursKind.DELIVERY, now, timeZone);
}

