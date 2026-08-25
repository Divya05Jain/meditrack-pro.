import { createActivityEntry, prependActivity } from '../utils/audit';
import { formatTime } from '../utils/formatters';
import { validateScheduleAssignment } from '../utils/scheduling';
import {
  moveAppointment,
  normalizeColumnSequences,
  reorderAppointments,
  getColumnAppointments,
} from '../utils/sequence';
import { syncSubtasksForStatus, getStatusLabel } from '../utils/workflow';

export const ACTION_TYPES = {
  SELECT_APPOINTMENT: 'SELECT_APPOINTMENT',
  CLOSE_APPOINTMENT: 'CLOSE_APPOINTMENT',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  TOGGLE_ACTIVITY: 'TOGGLE_ACTIVITY',
  CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
  MOVE_APPOINTMENT: 'MOVE_APPOINTMENT',
  REORDER_APPOINTMENTS: 'REORDER_APPOINTMENTS',
  UPDATE_SUBTASK: 'UPDATE_SUBTASK',
  ASSIGN_STAFF: 'ASSIGN_STAFF',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  CREATE_SCHEDULE_BLOCK: 'CREATE_SCHEDULE_BLOCK',
  UPDATE_SCHEDULE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  DELETE_SCHEDULE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
};

function updateAppointmentById(appointments, id, updates) {
  return appointments.map((apt) =>
    apt.id === id ? { ...apt, ...updates } : apt
  );
}

function findAppointment(appointments, id) {
  return appointments.find((apt) => apt.id === id);
}

export function clinicReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SELECT_APPOINTMENT:
      return { ...state, selectedAppointmentId: action.payload };

    case ACTION_TYPES.CLOSE_APPOINTMENT:
      return { ...state, selectedAppointmentId: null };

    case ACTION_TYPES.SET_ACTIVE_VIEW:
      return { ...state, activeView: action.payload };

    case ACTION_TYPES.TOGGLE_ACTIVITY:
      return {
        ...state,
        isActivityOpen: action.payload ?? !state.isActivityOpen,
      };

    case ACTION_TYPES.CREATE_APPOINTMENT: {
      const { appointment } = action.payload;
      const activity = createActivityEntry({
        type: 'appointment_created',
        message: `${appointment.patient.name} appointment created — ${appointment.id}`,
        metadata: { appointmentId: appointment.id },
      });

      return {
        ...state,
        appointments: [...state.appointments, appointment],
        activity: prependActivity(state.activity, activity),
      };
    }

    case ACTION_TYPES.UPDATE_APPOINTMENT: {
      const { id, updates, activityMessage, activityType, metadata } =
        action.payload;
      const next = {
        ...state,
        appointments: updateAppointmentById(state.appointments, id, updates),
      };

      if (activityMessage) {
        next.activity = prependActivity(
          state.activity,
          createActivityEntry({
            type: activityType || 'appointment_updated',
            message: activityMessage,
            metadata: metadata || { appointmentId: id },
          })
        );
      }

      return next;
    }

    case ACTION_TYPES.DELETE_APPOINTMENT: {
      const { id } = action.payload;
      const appointment = findAppointment(state.appointments, id);
      if (!appointment) return state;

      const doctors = state.doctors.map((doc) => ({
        ...doc,
        schedule: doc.schedule.filter((block) => block.appointmentId !== id),
      }));

      const activity = prependActivity(
        state.activity,
        createActivityEntry({
          type: 'appointment_deleted',
          message: `${appointment.patient.name} appointment deleted — ${id}`,
          metadata: { appointmentId: id },
        })
      );

      return {
        ...state,
        appointments: state.appointments.filter((apt) => apt.id !== id),
        doctors,
        selectedAppointmentId:
          state.selectedAppointmentId === id ? null : state.selectedAppointmentId,
        activity,
      };
    }

    case ACTION_TYPES.MOVE_APPOINTMENT: {
      const { appointmentId, fromStatus, toStatus, toIndex } = action.payload;
      const appointment = findAppointment(state.appointments, appointmentId);
      if (!appointment) return state;

      const syncedSubtasks = syncSubtasksForStatus(
        appointment.subtasks,
        toStatus
      );

      let appointments = state.appointments.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, subtasks: syncedSubtasks }
          : apt
      );

      appointments = moveAppointment(
        appointments,
        appointmentId,
        fromStatus,
        toStatus,
        toIndex
      );

      const activity = createActivityEntry({
        type: 'appointment_moved',
        message: `${appointment.patient.name} moved from ${getStatusLabel(fromStatus)} to ${getStatusLabel(toStatus)}`,
        metadata: {
          appointmentId,
          fromStatus,
          toStatus,
        },
      });

      return {
        ...state,
        appointments,
        activity: prependActivity(state.activity, activity),
      };
    }

    case ACTION_TYPES.REORDER_APPOINTMENTS: {
      const { status, orderedIds, patientName } = action.payload;
      const appointments = reorderAppointments(
        state.appointments,
        status,
        orderedIds
      );

      const activity = createActivityEntry({
        type: 'appointment_reordered',
        message: `${patientName} priority reordered in ${getStatusLabel(status)}`,
        metadata: { status, orderedIds },
      });

      return {
        ...state,
        appointments,
        activity: prependActivity(state.activity, activity),
      };
    }

    case ACTION_TYPES.UPDATE_SUBTASK: {
      const { appointmentId, subtaskId, updates } = action.payload;
      const appointment = findAppointment(state.appointments, appointmentId);
      const subtask = appointment?.subtasks.find((st) => st.id === subtaskId);

      const appointments = state.appointments.map((apt) => {
        if (apt.id !== appointmentId) return apt;
        return {
          ...apt,
          subtasks: apt.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, ...updates } : st
          ),
        };
      });

      let activity = state.activity;
      if (updates.status && subtask) {
        activity = prependActivity(
          state.activity,
          createActivityEntry({
            type: 'subtask_status_changed',
            message: `${subtask.title} marked as ${updates.status} for ${appointment.patient.name}`,
            metadata: { appointmentId, subtaskId, status: updates.status },
          })
        );
      }

      return { ...state, appointments, activity };
    }

    case ACTION_TYPES.ASSIGN_STAFF: {
      const { appointmentId, subtaskId, staffId } = action.payload;
      const appointment = findAppointment(state.appointments, appointmentId);
      const subtask = appointment?.subtasks.find((st) => st.id === subtaskId);

      const staffMember =
        state.staff.find((s) => s.id === staffId) ||
        state.doctors.find((d) => d.id === staffId);

      const appointments = state.appointments.map((apt) => {
        if (apt.id !== appointmentId) return apt;
        return {
          ...apt,
          subtasks: apt.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, staffId } : st
          ),
        };
      });

      const activity = prependActivity(
        state.activity,
        createActivityEntry({
          type: 'staff_assigned',
          message: `${staffMember?.name || 'Staff'} assigned to ${subtask?.title || 'subtask'} — ${appointment?.patient.name}`,
          metadata: { appointmentId, subtaskId, staffId },
        })
      );

      return { ...state, appointments, activity };
    }

    case ACTION_TYPES.CREATE_SCHEDULE_BLOCK: {
      const { doctorId, block } = action.payload;
      const doctor = state.doctors.find((d) => d.id === doctorId);
      if (!doctor) return state;

      const validation = validateScheduleAssignment({
        doctor,
        start: block.start,
        end: block.end,
        existingSchedule: doctor.schedule,
        date: block.date,
      });

      if (!validation.valid) return state;

      const doctors = state.doctors.map((doc) =>
        doc.id === doctorId
          ? { ...doc, schedule: [...doc.schedule, block] }
          : doc
      );

      const activity = prependActivity(
        state.activity,
        createActivityEntry({
          type: 'schedule_created',
          message: `${doctor.name} scheduled for ${block.patientName} — ${formatTime(block.start)} to ${formatTime(block.end)}`,
          metadata: { doctorId, blockId: block.id, appointmentId: block.appointmentId },
        })
      );

      return { ...state, doctors, activity };
    }

    case ACTION_TYPES.UPDATE_SCHEDULE_BLOCK: {
      const { doctorId, blockId, updates } = action.payload;
      const doctor = state.doctors.find((d) => d.id === doctorId);
      const existingBlock = doctor?.schedule.find((b) => b.id === blockId);
      if (!doctor || !existingBlock) return state;

      const start = updates.start ?? existingBlock.start;
      const end = updates.end ?? existingBlock.end;
      const date = updates.date ?? existingBlock.date;

      const validation = validateScheduleAssignment({
        doctor,
        start,
        end,
        existingSchedule: doctor.schedule,
        excludeId: blockId,
        date,
      });

      if (!validation.valid) return state;

      const doctors = state.doctors.map((doc) =>
        doc.id === doctorId
          ? {
              ...doc,
              schedule: doc.schedule.map((block) =>
                block.id === blockId ? { ...block, ...updates } : block
              ),
            }
          : doc
      );

      const activity = prependActivity(
        state.activity,
        createActivityEntry({
          type: 'schedule_updated',
          message: `${doctor.name} schedule updated — ${formatTime(start)} to ${formatTime(end)}`,
          metadata: { doctorId, blockId },
        })
      );

      return { ...state, doctors, activity };
    }

    case ACTION_TYPES.DELETE_SCHEDULE_BLOCK: {
      const { doctorId, blockId } = action.payload;
      const doctor = state.doctors.find((d) => d.id === doctorId);
      const block = doctor?.schedule.find((b) => b.id === blockId);
      if (!doctor || !block) return state;

      const doctors = state.doctors.map((doc) =>
        doc.id === doctorId
          ? { ...doc, schedule: doc.schedule.filter((b) => b.id !== blockId) }
          : doc
      );

      const activity = prependActivity(
        state.activity,
        createActivityEntry({
          type: 'schedule_deleted',
          message: `${doctor.name} booking removed — ${block.patientName} (${formatTime(block.start)}–${formatTime(block.end)})`,
          metadata: { doctorId, blockId, appointmentId: block.appointmentId },
        })
      );

      return { ...state, doctors, activity };
    }

    case ACTION_TYPES.ADD_ACTIVITY:
      return {
        ...state,
        activity: prependActivity(state.activity, action.payload),
      };

    default:
      return state;
  }
}

export { getColumnAppointments, normalizeColumnSequences };
