import { useMemo } from 'react';
import { useClinicContext } from '../context/ClinicContext';

export function useClinic() {
  const { state, dispatch } = useClinicContext();

  const selectedAppointment = useMemo(
    () =>
      state.appointments.find((apt) => apt.id === state.selectedAppointmentId) ??
      null,
    [state.appointments, state.selectedAppointmentId]
  );

  const getDoctorById = (id) => state.doctors.find((doc) => doc.id === id);
  const getStaffById = (id) => state.staff.find((member) => member.id === id);
  const getDepartmentById = (id) =>
    state.departments.find((dept) => dept.id === id);

  return {
    state,
    dispatch,
    selectedAppointment,
    getDoctorById,
    getStaffById,
    getDepartmentById,
  };
}
