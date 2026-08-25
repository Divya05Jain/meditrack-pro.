import { describe, expect, it } from 'vitest';
import { appointments as mockAppointments } from '../data/mockData';
import {
  getColumnAppointments,
  moveAppointment,
  normalizeColumnSequences,
  reorderAppointments,
} from './sequence';

function cloneAppointments() {
  return mockAppointments.map((apt) => ({ ...apt }));
}

describe('moveAppointment', () => {
  it('preserves all appointment IDs when moving between columns', () => {
    const before = cloneAppointments();
    const beforeIds = before.map((apt) => apt.id).sort();

    const moved = moveAppointment(before, 'APT-1049', 'waiting', 'triage', 0);
    const afterIds = moved.map((apt) => apt.id).sort();

    expect(afterIds).toEqual(beforeIds);
    expect(new Set(afterIds).size).toBe(afterIds.length);
  });

  it('renormalizes destination column sequences to contiguous 1..n', () => {
    const base = cloneAppointments();
    const moved = moveAppointment(base, 'APT-1049', 'waiting', 'triage', 0);
    const triageColumn = getColumnAppointments(moved, 'triage');
    const sequences = triageColumn.map((apt) => apt.sequence);

    expect(sequences).toEqual([...Array(triageColumn.length)].map((_, i) => i + 1));
  });

  it('renormalizes source column sequences after removal', () => {
    const base = cloneAppointments();
    const moved = moveAppointment(base, 'APT-1049', 'waiting', 'triage', 0);
    const waitingColumn = getColumnAppointments(moved, 'waiting');
    const sequences = waitingColumn.map((apt) => apt.sequence);

    expect(sequences).toEqual([...Array(waitingColumn.length)].map((_, i) => i + 1));
  });
});

describe('reorderAppointments', () => {
  it('produces contiguous sequences matching the new order within a column', () => {
    const consultation = getColumnAppointments(cloneAppointments(), 'consultation');
    const reversedIds = [...consultation].reverse().map((apt) => apt.id);

    const reordered = reorderAppointments(cloneAppointments(), 'consultation', reversedIds);
    const updatedColumn = getColumnAppointments(reordered, 'consultation');

    expect(updatedColumn.map((apt) => apt.id)).toEqual(reversedIds);
    expect(updatedColumn.map((apt) => apt.sequence)).toEqual(
      reversedIds.map((_, index) => index + 1)
    );
  });
});

describe('normalizeColumnSequences', () => {
  it('makes sequences contiguous 1..n for the target status', () => {
    const withGaps = cloneAppointments().map((apt) =>
      apt.status === 'waiting' ? { ...apt, sequence: apt.id === 'APT-1049' ? 1 : 5 } : apt
    );

    const normalized = normalizeColumnSequences(withGaps, 'waiting');
    const waitingColumn = getColumnAppointments(normalized, 'waiting');

    expect(waitingColumn.map((apt) => apt.sequence)).toEqual(
      waitingColumn.map((_, index) => index + 1)
    );
  });

  it('leaves appointments outside the target status untouched', () => {
    const before = cloneAppointments();
    const normalized = normalizeColumnSequences(before, 'waiting');
    const nonWaiting = before.filter((apt) => apt.status !== 'waiting');

    nonWaiting.forEach((apt) => {
      const after = normalized.find((item) => item.id === apt.id);
      expect(after.sequence).toBe(apt.sequence);
      expect(after.status).toBe(apt.status);
    });
  });
});
