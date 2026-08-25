export function generateAppointmentId(appointments) {
  const nums = appointments
    .map((apt) => parseInt(apt.id.replace('APT-', ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1062;
  return `APT-${next}`;
}

export function generatePatientId(appointments) {
  const nums = appointments
    .map((apt) => parseInt(apt.patient.id.replace('PAT-', ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1015;
  return `PAT-${next}`;
}

export function generateScheduleBlockId(doctors) {
  let max = 0;
  doctors.forEach((doc) => {
    doc.schedule.forEach((block) => {
      const num = parseInt(block.id.replace('SCH-', ''), 10);
      if (!Number.isNaN(num)) max = Math.max(max, num);
    });
  });
  return `SCH-${String(max + 1).padStart(3, '0')}`;
}
