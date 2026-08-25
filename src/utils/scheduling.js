import { formatTime } from './formatters';

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hasOverlap(newStart, newEnd, existingStart, existingEnd) {
  return newStart < existingEnd && newEnd > existingStart;
}

export function isWithinShift(start, end, shiftStart, shiftEnd) {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const shiftStartMin = timeToMinutes(shiftStart);
  const shiftEndMin = timeToMinutes(shiftEnd);
  return startMin >= shiftStartMin && endMin <= shiftEndMin;
}

export function generateTimeSlots(startHour = 8, endHour = 18, interval = 30) {
  const slots = [];
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += interval) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

export function addMinutesToTime(time, minutesToAdd) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

export function filterScheduleByDate(schedule, dateKey) {
  if (!dateKey) return schedule;
  return schedule.filter((block) => block.date === dateKey);
}

export function normalizeTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getDurationMinutes(start, end) {
  return timeToMinutes(end) - timeToMinutes(start);
}

export function getSuggestedSlotAfter(conflictBlock, durationMinutes = 30) {
  return {
    start: conflictBlock.end,
    end: addMinutesToTime(conflictBlock.end, durationMinutes),
  };
}

export function getShiftSuggestion(doctor, durationMinutes = 30) {
  return {
    start: doctor.shiftStart,
    end: addMinutesToTime(doctor.shiftStart, durationMinutes),
  };
}

export function validateScheduleAssignment({
  doctor,
  start,
  end,
  existingSchedule = [],
  excludeId = null,
  date = null,
}) {
  const normalizedStart = normalizeTime(start);
  const normalizedEnd = normalizeTime(end);
  const newStart = timeToMinutes(normalizedStart);
  const newEnd = timeToMinutes(normalizedEnd);
  const duration = newEnd - newStart;
  const daySchedule = filterScheduleByDate(existingSchedule, date);

  if (newStart >= newEnd) {
    return {
      valid: false,
      reason: 'End time must be after start time.',
      type: 'invalid',
      requestedStart: start,
      requestedEnd: end,
    };
  }

  if (!isWithinShift(normalizedStart, normalizedEnd, doctor.shiftStart, doctor.shiftEnd)) {
    const suggested = getShiftSuggestion(doctor, duration);
    return {
      valid: false,
      reason: `Outside rostered shift: ${doctor.name} is available ${formatTime(doctor.shiftStart)}–${formatTime(doctor.shiftEnd)}.`,
      type: 'shift',
      requestedStart: normalizedStart,
      requestedEnd: normalizedEnd,
      shiftStart: doctor.shiftStart,
      shiftEnd: doctor.shiftEnd,
      suggested,
    };
  }

  for (const block of daySchedule) {
    if (excludeId && block.id === excludeId) continue;

    const existStart = timeToMinutes(normalizeTime(block.start));
    const existEnd = timeToMinutes(normalizeTime(block.end));

    if (hasOverlap(newStart, newEnd, existStart, existEnd)) {
      const suggested = getSuggestedSlotAfter(block, duration);
      return {
        valid: false,
        reason: `Schedule conflict: ${doctor.name} is already assigned ${formatTime(block.start)}–${formatTime(block.end)}.`,
        type: 'overlap',
        conflictBlockId: block.id,
        conflictBlock: block,
        requestedStart: normalizedStart,
        requestedEnd: normalizedEnd,
        suggested,
      };
    }
  }

  return { valid: true };
}

export function countOpenSlots(doctor, schedule, dateKey, gridStart = 8, gridEnd = 18) {
  const daySchedule = filterScheduleByDate(schedule, dateKey);
  const shiftStart = Math.max(timeToMinutes(doctor.shiftStart), gridStart * 60);
  const shiftEnd = Math.min(timeToMinutes(doctor.shiftEnd), gridEnd * 60);
  let open = 0;

  for (let t = shiftStart; t < shiftEnd; t += 30) {
    const slotEnd = t + 30;
    const occupied = daySchedule.some((block) => {
      const bs = timeToMinutes(block.start);
      const be = timeToMinutes(block.end);
      return t < be && slotEnd > bs;
    });
    if (!occupied) open += 1;
  }

  return open;
}

export function getBlockStyle(start, end, gridStartMin, totalMinutes) {
  const startMin = timeToMinutes(start) - gridStartMin;
  const endMin = timeToMinutes(end) - gridStartMin;
  const left = (startMin / totalMinutes) * 100;
  const width = ((endMin - startMin) / totalMinutes) * 100;
  return { left: `${left}%`, width: `${width}%` };
}
