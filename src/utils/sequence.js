export function getColumnAppointments(appointments, status) {
  return appointments
    .filter((apt) => apt.status === status)
    .sort((a, b) => a.sequence - b.sequence);
}

export function normalizeColumnSequences(appointments, status) {
  const column = getColumnAppointments(appointments, status);
  const sequenceMap = Object.fromEntries(
    column.map((apt, index) => [apt.id, index + 1])
  );

  return appointments.map((apt) =>
    apt.status === status
      ? { ...apt, sequence: sequenceMap[apt.id] ?? apt.sequence }
      : apt
  );
}

export function moveAppointment(
  appointments,
  appointmentId,
  fromStatus,
  toStatus,
  toIndex
) {
  let updated = appointments.map((apt) =>
    apt.id === appointmentId ? { ...apt, status: toStatus } : apt
  );

  updated = normalizeColumnSequences(updated, fromStatus);

  const destItems = getColumnAppointments(updated, toStatus);
  const movedItem = destItems.find((apt) => apt.id === appointmentId);
  const others = destItems.filter((apt) => apt.id !== appointmentId);
  const clampedIndex = Math.max(0, Math.min(toIndex, others.length));
  others.splice(clampedIndex, 0, movedItem);

  const sequenceMap = Object.fromEntries(
    others.map((apt, index) => [apt.id, index + 1])
  );

  return updated.map((apt) =>
    apt.status === toStatus
      ? { ...apt, sequence: sequenceMap[apt.id] ?? apt.sequence }
      : apt
  );
}

export function reorderAppointments(appointments, status, orderedIds) {
  const sequenceMap = Object.fromEntries(
    orderedIds.map((id, index) => [id, index + 1])
  );

  return appointments.map((apt) =>
    apt.status === status
      ? { ...apt, sequence: sequenceMap[apt.id] ?? apt.sequence }
      : apt
  );
}
