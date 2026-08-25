import { describe, expect, it } from 'vitest';
import { doctors } from '../data/mockData';
import {
  hasOverlap,
  isWithinShift,
  timeToMinutes,
  validateScheduleAssignment,
} from './scheduling';

const meera = doctors.find((d) => d.id === 'DOC-01');
const sana = doctors.find((d) => d.id === 'DOC-03');
const clinicDate = '2026-08-25';

describe('hasOverlap', () => {
  it('detects overlapping ranges', () => {
    const existing = timeToMinutes('10:30');
    const existingEnd = timeToMinutes('11:00');
    const newStart = timeToMinutes('10:45');
    const newEnd = timeToMinutes('11:15');

    expect(hasOverlap(newStart, newEnd, existing, existingEnd)).toBe(true);
  });

  it('allows adjacent ranges (end equals start)', () => {
    const firstEnd = timeToMinutes('11:00');
    const secondStart = timeToMinutes('11:00');
    const secondEnd = timeToMinutes('11:30');

    expect(hasOverlap(secondStart, secondEnd, timeToMinutes('10:30'), firstEnd)).toBe(false);
    expect(hasOverlap(timeToMinutes('10:30'), firstEnd, secondStart, secondEnd)).toBe(false);
  });

  it('detects containment (new booking inside existing block)', () => {
    const existingStart = timeToMinutes('10:30');
    const existingEnd = timeToMinutes('11:00');
    const newStart = timeToMinutes('10:40');
    const newEnd = timeToMinutes('10:50');

    expect(hasOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });
});

describe('isWithinShift', () => {
  it('rejects start before shift', () => {
    expect(isWithinShift('08:30', '09:00', sana.shiftStart, sana.shiftEnd)).toBe(false);
  });

  it('accepts exact shift-start boundary', () => {
    expect(isWithinShift('10:00', '10:30', sana.shiftStart, sana.shiftEnd)).toBe(true);
  });

  it('rejects end after shift-end', () => {
    expect(isWithinShift('17:30', '18:30', sana.shiftStart, sana.shiftEnd)).toBe(false);
  });
});

describe('validateScheduleAssignment', () => {
  it('rejects overlapping booking with type overlap', () => {
    const result = validateScheduleAssignment({
      doctor: meera,
      start: '10:45',
      end: '11:15',
      existingSchedule: meera.schedule,
      date: clinicDate,
    });

    expect(result.valid).toBe(false);
    expect(result.type).toBe('overlap');
    expect(result.conflictBlockId).toBe('SCH-001');
  });

  it('accepts adjacent booking after SCH-001 (11:00–11:30)', () => {
    const result = validateScheduleAssignment({
      doctor: meera,
      start: '11:00',
      end: '11:30',
      existingSchedule: meera.schedule.filter((b) => b.id !== 'SCH-002'),
      date: clinicDate,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects end-before-start with type invalid', () => {
    const result = validateScheduleAssignment({
      doctor: meera,
      start: '12:00',
      end: '11:30',
      existingSchedule: meera.schedule,
      date: clinicDate,
    });

    expect(result.valid).toBe(false);
    expect(result.type).toBe('invalid');
  });

  it('rejects outside-shift booking with type shift', () => {
    const result = validateScheduleAssignment({
      doctor: meera,
      start: '08:00',
      end: '08:30',
      existingSchedule: meera.schedule,
      date: clinicDate,
    });

    expect(result.valid).toBe(false);
    expect(result.type).toBe('shift');
    expect(result.shiftStart).toBe('09:00');
    expect(result.shiftEnd).toBe('17:00');
  });
});
