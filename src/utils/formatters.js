const CLINIC_NOW = new Date('2026-08-25T11:10:00');

export function formatDisplayDate(date = CLINIC_NOW) {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const rest = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${weekday} · ${rest}`;
}

export function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(CLINIC_NOW);
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatActivityTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getWaitMinutes(appointmentTime) {
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const aptDate = new Date(CLINIC_NOW);
  aptDate.setHours(hours, minutes, 0, 0);
  const diffMs = CLINIC_NOW - aptDate;
  return Math.max(0, Math.round(diffMs / 60000));
}

export function getStatusLabel(status) {
  const labels = {
    waiting: 'Waiting',
    triage: 'In Triage',
    consultation: 'In Consultation',
    diagnostics: 'In Diagnostics',
    pharmacy: 'At Pharmacy',
    completed: 'Completed',
  };
  return labels[status] || status;
}

export function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getClinicNow() {
  return CLINIC_NOW;
}

export function isNoShow(appointment, now = CLINIC_NOW, graceMinutes = 5) {
  if (!appointment || appointment.status !== 'waiting') return false;
  const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(hours, minutes, 0, 0);
  return now.getTime() - scheduled.getTime() > graceMinutes * 60000;
}

export function isScheduleNoShow(block, appointment, now = CLINIC_NOW) {
  if (!appointment) return false;
  const [hours, minutes] = block.start.split(':').map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(hours, minutes, 0, 0);
  const inWaiting = appointment.status === 'waiting';
  return inWaiting && now.getTime() - scheduled.getTime() > 5 * 60000;
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatScheduleDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatScheduleDateShort(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatHourAxis(hour) {
  const date = new Date(CLINIC_NOW);
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)}–${formatTime(end)}`;
}
