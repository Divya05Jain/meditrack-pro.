import { describe, expect, it } from 'vitest';
import { SUBTASK_TYPES } from '../data/mockData';
import { syncSubtasksForStatus } from './workflow';

function createTestSubtasks() {
  return SUBTASK_TYPES.map(({ type, title }) => ({
    id: `ST-${type}`,
    type,
    title,
    status: 'pending',
    staffId: null,
  }));
}

describe('syncSubtasksForStatus', () => {
  it('marks prior stages completed, current in-progress, and later stages pending', () => {
    const subtasks = createTestSubtasks();
    const synced = syncSubtasksForStatus(subtasks, 'diagnostics');

    expect(synced.find((st) => st.type === 'triage').status).toBe('completed');
    expect(synced.find((st) => st.type === 'consultation').status).toBe('completed');
    expect(synced.find((st) => st.type === 'diagnostics').status).toBe('in-progress');
    expect(synced.find((st) => st.type === 'pharmacy').status).toBe('pending');
  });

  it('marks all subtasks completed when moving to completed', () => {
    const subtasks = createTestSubtasks();
    const synced = syncSubtasksForStatus(subtasks, 'completed');

    synced.forEach((subtask) => {
      expect(subtask.status).toBe('completed');
    });
  });

  it('resets all subtasks to pending when moving to waiting', () => {
    const subtasks = createTestSubtasks().map((subtask, index) => ({
      ...subtask,
      status: index === 0 ? 'completed' : index === 1 ? 'in-progress' : 'pending',
    }));

    const synced = syncSubtasksForStatus(subtasks, 'waiting');

    synced.forEach((subtask) => {
      expect(subtask.status).toBe('pending');
    });
  });
});
