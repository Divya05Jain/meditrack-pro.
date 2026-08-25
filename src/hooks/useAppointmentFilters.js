import { useMemo } from 'react';

export function useAppointmentFilters(appointments, filters) {
  const { search, departmentId, priority } = filters;

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((apt) => {
      const matchesSearch =
        !query ||
        apt.patient.name.toLowerCase().includes(query) ||
        apt.id.toLowerCase().includes(query);

      const matchesDepartment =
        !departmentId || apt.departmentId === departmentId;

      const matchesPriority = !priority || apt.priority === priority;

      return matchesSearch && matchesDepartment && matchesPriority;
    });
  }, [appointments, search, departmentId, priority]);

  const appointmentsByStatus = useMemo(() => {
    const grouped = {
      waiting: [],
      triage: [],
      consultation: [],
      diagnostics: [],
      pharmacy: [],
      completed: [],
    };

    filteredAppointments.forEach((apt) => {
      if (grouped[apt.status]) {
        grouped[apt.status].push(apt);
      }
    });

    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => a.sequence - b.sequence);
    });

    return grouped;
  }, [filteredAppointments]);

  return { filteredAppointments, appointmentsByStatus };
}
