import { createContext, useCallback, useContext, useReducer, useRef, useState } from 'react';
import { clinicReducer } from '../reducers/clinicReducer';
import { initialClinicState } from '../data/mockData';
import { ACTION_TYPES } from '../reducers/clinicReducer';
import { formatTime } from '../utils/formatters';

const ClinicContext = createContext(null);

const TOAST_DURATION = 3200;

const SCHEDULE_ACTIONS = new Set([
  ACTION_TYPES.CREATE_SCHEDULE_BLOCK,
  ACTION_TYPES.UPDATE_SCHEDULE_BLOCK,
]);

function getValidationToast(validation) {
  const titles = {
    overlap: 'Scheduling conflict',
    shift: 'Outside shift hours',
    invalid: 'Invalid time range',
  };

  return {
    title: titles[validation.type] || 'Schedule validation failed',
    message: validation.reason,
    type: 'warning',
  };
}

function getToastForAction(action, state) {
  switch (action.type) {
    case ACTION_TYPES.CREATE_APPOINTMENT: {
      const apt = action.payload.appointment;
      return { title: 'Appointment created', message: `${apt.patient.name} · ${apt.id}` };
    }
    case ACTION_TYPES.UPDATE_APPOINTMENT: {
      const { id, updates } = action.payload;
      const name = updates?.patient?.name;
      return {
        title: 'Appointment updated',
        message: name ? `${name} · ${id}` : id,
      };
    }
    case ACTION_TYPES.DELETE_APPOINTMENT: {
      const apt = state.appointments.find((a) => a.id === action.payload.id);
      return {
        title: 'Appointment deleted',
        message: apt ? `${apt.patient.name} · ${apt.id}` : undefined,
        type: 'warning',
      };
    }
    case ACTION_TYPES.MOVE_APPOINTMENT: {
      const apt = state.appointments.find((a) => a.id === action.payload.appointmentId);
      return { title: 'Visit updated', message: apt ? `${apt.patient.name} · ${apt.id}` : undefined };
    }
    case ACTION_TYPES.ASSIGN_STAFF: {
      const apt = state.appointments.find((a) => a.id === action.payload.appointmentId);
      return { title: 'Staff assigned', message: apt ? `${apt.patient.name} · ${apt.id}` : undefined };
    }
    case ACTION_TYPES.UPDATE_SUBTASK: {
      const apt = state.appointments.find((a) => a.id === action.payload.appointmentId);
      return { title: 'Visit updated', message: apt ? `${apt.patient.name} · ${apt.id}` : undefined };
    }
    case ACTION_TYPES.CREATE_SCHEDULE_BLOCK: {
      const block = action.payload.block;
      return {
        title: 'Schedule created',
        message: `${block.patientName} · ${formatTime(block.start)}–${formatTime(block.end)}`,
      };
    }
    case ACTION_TYPES.UPDATE_SCHEDULE_BLOCK:
      return { title: 'Schedule updated' };
    case ACTION_TYPES.DELETE_SCHEDULE_BLOCK:
      return { title: 'Booking removed', type: 'warning' };
    default:
      return null;
  }
}

function ToastStack({ toasts, onRemove }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type || 'success'}`} role="status">
          <span className="toast__icon" aria-hidden="true">
            {(toast.type || 'success') === 'success' ? '✓' : '!'}
          </span>
          <div className="toast__body">
            <p className="toast__title">{toast.title}</p>
            {toast.message && <p className="toast__message">{toast.message}</p>}
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onRemove(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function ClinicProvider({ children }) {
  const [state, rawDispatch] = useReducer(clinicReducer, initialClinicState);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-4), { id, ...toast }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast]
  );

  const dispatch = useCallback(
    (action) => {
      const nextState = clinicReducer(state, action);
      rawDispatch(action);

      if (
        SCHEDULE_ACTIONS.has(action.type) &&
        nextState.lastValidationError &&
        nextState.lastValidationError !== state.lastValidationError
      ) {
        showToast(getValidationToast(nextState.lastValidationError));
        return;
      }

      const toast = getToastForAction(action, state);
      if (toast) showToast(toast);
    },
    [state, showToast]
  );

  return (
    <ClinicContext.Provider value={{ state, dispatch }}>
      {children}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinicContext must be used within ClinicProvider');
  }
  return context;
}
