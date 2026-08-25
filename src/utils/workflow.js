const STAGE_ORDER = ['triage', 'consultation', 'diagnostics', 'pharmacy'];

const STATUS_STAGE_INDEX = {
  waiting: -1,
  triage: 0,
  consultation: 1,
  diagnostics: 2,
  pharmacy: 3,
  completed: 4,
};

export function syncSubtasksForStatus(subtasks, newStatus) {
  const stageIndex = STATUS_STAGE_INDEX[newStatus];

  return subtasks.map((subtask) => {
    const subtaskIndex = STAGE_ORDER.indexOf(subtask.type);
    if (subtaskIndex === -1) return subtask;

    if (newStatus === 'waiting') {
      return { ...subtask, status: 'pending' };
    }

    if (newStatus === 'completed') {
      return { ...subtask, status: 'completed' };
    }

    if (subtaskIndex < stageIndex) {
      return { ...subtask, status: 'completed' };
    }

    if (subtaskIndex === stageIndex) {
      return { ...subtask, status: 'in-progress' };
    }

    return { ...subtask, status: 'pending' };
  });
}

export function getStatusLabel(status) {
  const labels = {
    waiting: 'Waiting',
    triage: 'Triage',
    consultation: 'Consultation',
    diagnostics: 'Diagnostics',
    pharmacy: 'Pharmacy',
    completed: 'Completed',
  };
  return labels[status] || status;
}
