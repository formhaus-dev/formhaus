import { afterAll, describe, expect, it } from 'vitest';
import { fromDate, toDate } from '../../src/fields';

const zone = process.env.TZ;

afterAll(() => {
  process.env.TZ = zone;
});

describe.each([
  ['America/New_York', '2026-01-05T09:07', '2026-01-05T14:07:00.000Z'],
  ['Asia/Kolkata', '2026-01-05T09:07', '2026-01-05T03:37:00.000Z'],
  ['Pacific/Kiritimati', '2026-01-05T00:30', '2026-01-04T10:30:00.000Z'],
])('date values in %s', (name, local, instant) => {
  it('reads and writes local wall time', () => {
    process.env.TZ = name;
    const date = toDate(local)!;
    expect(date.toISOString()).toBe(instant);
    expect([fromDate(date), fromDate(date, 'datetime'), fromDate(date, 'time')]).toEqual([local.slice(0, 10), local, local.slice(11)]);
    expect(toDate('2026-01-05T09:07Z')!.toISOString()).toBe('2026-01-05T09:07:00.000Z');
  });
});

describe('a local time that does not exist', () => {
  it('moves forward across the spring-forward gap, as Date does', () => {
    process.env.TZ = 'America/New_York';
    const date = toDate('2026-03-08T02:30')!;
    expect(date.toISOString()).toBe('2026-03-08T07:30:00.000Z');
    expect(fromDate(date, 'datetime')).toBe('2026-03-08T03:30');
  });
});
