import { describe, it, expect } from 'vitest';
import { HoursKind } from '@prisma/client';
import {
  getZonedTime,
  isHoursOpenNow,
  isOpenNow,
  isDeliveringNow,
  getDispensaryHoursToday,
} from '@/server/dispensaries';

describe('Dispensary Hours & Timezone Evaluation (T-HRS-01, T-DLH-01)', () => {
  describe('Zoned Time & DST (America/New_York)', () => {
    it('converts UTC to America/New_York standard time (EST, UTC-5 in winter)', () => {
      // 2026-01-15 17:00:00 UTC -> 12:00:00 EST (Thursday)
      const winterDate = new Date('2026-01-15T17:00:00Z');
      const zoned = getZonedTime(winterDate, 'America/New_York');

      expect(zoned.dayOfWeek).toBe(4); // Thursday
      expect(zoned.timeString).toBe('12:00');
      expect(zoned.hour).toBe(12);
      expect(zoned.minute).toBe(0);
    });

    it('converts UTC to America/New_York daylight saving time (EDT, UTC-4 in summer)', () => {
      // 2026-07-15 16:00:00 UTC -> 12:00:00 EDT (Wednesday)
      const summerDate = new Date('2026-07-15T16:00:00Z');
      const zoned = getZonedTime(summerDate, 'America/New_York');

      expect(zoned.dayOfWeek).toBe(3); // Wednesday
      expect(zoned.timeString).toBe('12:00');
      expect(zoned.hour).toBe(12);
      expect(zoned.minute).toBe(0);
    });

    it('handles DST spring-forward boundary (March 8, 2026)', () => {
      // 06:59:00 UTC -> 01:59 EST (before jump)
      const beforeJump = new Date('2026-03-08T06:59:00Z');
      const zonedBefore = getZonedTime(beforeJump, 'America/New_York');
      expect(zonedBefore.timeString).toBe('01:59');

      // 07:01:00 UTC -> 03:01 EDT (jumped over 2 AM)
      const afterJump = new Date('2026-03-08T07:01:00Z');
      const zonedAfter = getZonedTime(afterJump, 'America/New_York');
      expect(zonedAfter.timeString).toBe('03:01');
    });

    it('handles DST fall-back boundary (November 1, 2026)', () => {
      // 05:30:00 UTC -> 01:30 EDT (before fall-back)
      const beforeFallBack = new Date('2026-11-01T05:30:00Z');
      const zonedBefore = getZonedTime(beforeFallBack, 'America/New_York');
      expect(zonedBefore.timeString).toBe('01:30');

      // 06:30:00 UTC -> 01:30 EST (after fall-back repeat of 1 AM hour)
      const afterFallBack = new Date('2026-11-01T06:30:00Z');
      const zonedAfter = getZonedTime(afterFallBack, 'America/New_York');
      expect(zonedAfter.timeString).toBe('01:30');
    });
  });

  describe('Standard Hours Window', () => {
    const regularHours = [
      {
        kind: HoursKind.STORE,
        dayOfWeek: 1, // Monday
        opensAt: '09:00',
        closesAt: '21:00',
        isClosed: false,
      },
    ];

    it('reports open during operating window', () => {
      // Monday 14:00 NY time (19:00 UTC)
      const mondayAfternoon = new Date('2026-01-19T19:00:00Z');
      expect(isOpenNow(regularHours, mondayAfternoon)).toBe(true);
    });

    it('reports closed before opening time', () => {
      // Monday 08:30 NY time (13:30 UTC)
      const mondayMorning = new Date('2026-01-19T13:30:00Z');
      expect(isOpenNow(regularHours, mondayMorning)).toBe(false);
    });

    it('reports closed at or after closing time', () => {
      // Monday 21:00 NY time (02:00 UTC Tuesday)
      const mondayNight = new Date('2026-01-20T02:00:00Z');
      expect(isOpenNow(regularHours, mondayNight)).toBe(false);
    });
  });

  describe('Past-Midnight Closing (T-HRS-01)', () => {
    // Friday (day 5) opens 18:00, closes 02:00 (Saturday morning)
    // Saturday (day 6) opens 12:00, closes 23:00
    const pastMidnightHours = [
      {
        kind: HoursKind.STORE,
        dayOfWeek: 5, // Friday
        opensAt: '18:00',
        closesAt: '02:00',
        isClosed: false,
      },
      {
        kind: HoursKind.STORE,
        dayOfWeek: 6, // Saturday
        opensAt: '12:00',
        closesAt: '23:00',
        isClosed: false,
      },
    ];

    it('reports open on Friday late evening (23:30 NY time)', () => {
      // Friday 2026-01-16 23:30 NY (04:30 UTC Saturday)
      const fridayNight = new Date('2026-01-17T04:30:00Z');
      expect(isOpenNow(pastMidnightHours, fridayNight)).toBe(true);
    });

    it('reports open on Saturday early morning before 02:00 (01:30 NY time)', () => {
      // Saturday 2026-01-17 01:30 NY (06:30 UTC Saturday)
      const saturdayEarlyMorning = new Date('2026-01-17T06:30:00Z');
      expect(isOpenNow(pastMidnightHours, saturdayEarlyMorning)).toBe(true);
    });

    it('reports closed on Saturday morning after 02:00 and before 12:00 (02:30 NY time)', () => {
      // Saturday 2026-01-17 02:30 NY (07:30 UTC Saturday)
      const saturdayPostClose = new Date('2026-01-17T07:30:00Z');
      expect(isOpenNow(pastMidnightHours, saturdayPostClose)).toBe(false);
    });

    it('reports open on Saturday afternoon during Saturday shift (15:00 NY time)', () => {
      // Saturday 2026-01-17 15:00 NY (20:00 UTC Saturday)
      const saturdayAfternoon = new Date('2026-01-17T20:00:00Z');
      expect(isOpenNow(pastMidnightHours, saturdayAfternoon)).toBe(true);
    });
  });

  describe('Closed Days & 24-Hour Shifts', () => {
    it('returns false when day is explicitly marked isClosed', () => {
      const closedSunday = [
        {
          kind: HoursKind.STORE,
          dayOfWeek: 0, // Sunday
          opensAt: '10:00',
          closesAt: '18:00',
          isClosed: true,
        },
      ];
      // Sunday 14:00 NY time
      const sunday = new Date('2026-01-18T19:00:00Z');
      expect(isOpenNow(closedSunday, sunday)).toBe(false);
      expect(getDispensaryHoursToday(closedSunday, HoursKind.STORE, sunday)).toBeNull();
    });

    it('returns true throughout day for 24-hour open store', () => {
      const store24h = [
        {
          kind: HoursKind.STORE,
          dayOfWeek: 2, // Tuesday
          opensAt: '00:00',
          closesAt: '24:00',
          isClosed: false,
        },
      ];
      // Tuesday 03:15 NY time
      const earlyTuesday = new Date('2026-01-20T08:15:00Z');
      expect(isOpenNow(store24h, earlyTuesday)).toBe(true);
    });
  });

  describe('Delivery Hours Independence (T-DLH-01)', () => {
    const splitHours = [
      // STORE: 09:00 - 22:00
      {
        kind: HoursKind.STORE,
        dayOfWeek: 3, // Wednesday
        opensAt: '09:00',
        closesAt: '22:00',
        isClosed: false,
      },
      // DELIVERY: 11:00 - 20:00
      {
        kind: HoursKind.DELIVERY,
        dayOfWeek: 3, // Wednesday
        opensAt: '11:00',
        closesAt: '20:00',
        isClosed: false,
      },
    ];

    it('open for pickup at 10:00 but NOT yet delivering', () => {
      // Wednesday 10:00 NY (15:00 UTC)
      const wednesday10am = new Date('2026-01-21T15:00:00Z');
      expect(isOpenNow(splitHours, wednesday10am)).toBe(true);
      expect(isDeliveringNow(splitHours, wednesday10am)).toBe(false);
    });

    it('open for both pickup and delivery at 14:00', () => {
      // Wednesday 14:00 NY (19:00 UTC)
      const wednesday2pm = new Date('2026-01-21T19:00:00Z');
      expect(isOpenNow(splitHours, wednesday2pm)).toBe(true);
      expect(isDeliveringNow(splitHours, wednesday2pm)).toBe(true);
    });

    it('open for pickup at 21:00 but delivery has closed for the day', () => {
      // Wednesday 21:00 NY (02:00 UTC Thursday)
      const wednesday9pm = new Date('2026-01-22T02:00:00Z');
      expect(isOpenNow(splitHours, wednesday9pm)).toBe(true);
      expect(isDeliveringNow(splitHours, wednesday9pm)).toBe(false);
    });

    it('retrieves distinct hours today for STORE vs DELIVERY', () => {
      const wednesday = new Date('2026-01-21T19:00:00Z');
      const storeHours = getDispensaryHoursToday(splitHours, HoursKind.STORE, wednesday);
      const deliveryHours = getDispensaryHoursToday(splitHours, HoursKind.DELIVERY, wednesday);

      expect(storeHours).toEqual({ opensAt: '09:00', closesAt: '22:00' });
      expect(deliveryHours).toEqual({ opensAt: '11:00', closesAt: '20:00' });
    });
  });
});

