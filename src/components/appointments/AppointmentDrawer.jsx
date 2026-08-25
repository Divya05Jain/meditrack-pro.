import { useState } from 'react';
import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { Badge } from '../common/Badge';
import { formatTime, capitalize } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_LABELS = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

function getStaffOptions(subtaskType, state) {
  switch (subtaskType) {
    case 'triage':
      return state.staff.filter((s) => s.role === 'nurse');
    case 'consultation':
      return state.doctors;
    case 'diagnostics':
      return state.staff.filter((s) => s.role === 'lab');
    case 'pharmacy':
      return state.staff.filter((s) => s.role === 'pharmacy');
    default:
      return [];
  }
}

function resolveStaffName(staffId, getStaffById, getDoctorById) {
  if (!staffId) return null;
  const staffMember = getStaffById(staffId);
  if (staffMember) return staffMember.name;
  const doctor = getDoctorById(staffId);
  if (doctor) return doctor.name;
  return null;
}

export function AppointmentDrawer({ onEdit }) {
  const {
    state,
    selectedAppointment,
    dispatch,
    getDoctorById,
    getStaffById,
    getDepartmentById,
  } = useClinic();

  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingMode, setEditingMode] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!selectedAppointment) return null;

  const doctor = getDoctorById(selectedAppointment.doctorId);
  const department = getDepartmentById(selectedAppointment.departmentId);

  const handleClose = () => {
    setEditingSubtaskId(null);
    setEditingMode(null);
    setConfirmDelete(false);
    dispatch({ type: ACTION_TYPES.CLOSE_APPOINTMENT });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleStatusChange = (subtaskId, status) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_SUBTASK,
      payload: {
        appointmentId: selectedAppointment.id,
        subtaskId,
        updates: { status },
      },
    });
  };

  const handleStaffChange = (subtaskId, staffId) => {
    dispatch({
      type: ACTION_TYPES.ASSIGN_STAFF,
      payload: {
        appointmentId: selectedAppointment.id,
        subtaskId,
        staffId: staffId || null,
      },
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    dispatch({
      type: ACTION_TYPES.DELETE_APPOINTMENT,
      payload: { id: selectedAppointment.id },
    });
  };

  const startEditing = (subtaskId, mode) => {
    setEditingSubtaskId(subtaskId);
    setEditingMode(mode);
  };

  const stopEditing = () => {
    setEditingSubtaskId(null);
    setEditingMode(null);
  };

  return (
    <div className="drawer-overlay" onClick={handleBackdropClick}>
      <aside className="drawer drawer--appointment" role="dialog" aria-label="Appointment details">
        <div className="drawer__header">
          <div className="drawer__header-main">
            <div className="drawer__header-top">
              <h2 className="drawer__title">{selectedAppointment.patient.name}</h2>
              <Badge variant={selectedAppointment.priority}>
                {capitalize(selectedAppointment.priority)}
              </Badge>
            </div>
            <p className="drawer__subtitle">{selectedAppointment.id}</p>
          </div>
          <div className="drawer__header-actions">
            {onEdit && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onEdit(selectedAppointment.id)}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              className="drawer__close"
              onClick={handleClose}
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="drawer__body">
          <div className="drawer__section">
            <h3 className="drawer__section-title">Visit Details</h3>
            <div className="visit-details">
              <p className="visit-details__meta">
                {selectedAppointment.patient.age} yrs · {selectedAppointment.patient.gender}
              </p>
              <p className="visit-details__dept">{department?.name}</p>
              <div className="visit-details__schedule">
                <span className="visit-details__time">
                  {formatTime(selectedAppointment.appointmentTime)}
                </span>
                <span className="visit-details__doctor">{doctor?.name}</span>
              </div>
            </div>
          </div>

          <div className="drawer__section">
            <h3 className="drawer__section-title">Reason for Visit</h3>
            <p className="drawer__reason">{selectedAppointment.reason}</p>
          </div>

          <div className="drawer__section">
            <h3 className="drawer__section-title">Visit Workflow</h3>
            <ol className="workflow-timeline">
              {selectedAppointment.subtasks.map((subtask, index) => {
                const staffOptions = getStaffOptions(subtask.type, state);
                const staffName = resolveStaffName(
                  subtask.staffId,
                  getStaffById,
                  getDoctorById
                );
                const isLast = index === selectedAppointment.subtasks.length - 1;
                const isEditing = editingSubtaskId === subtask.id;

                return (
                  <li
                    key={subtask.id}
                    className={`workflow-timeline__item workflow-timeline__item--${subtask.status}`}
                  >
                    <div className="workflow-timeline__marker" aria-hidden="true">
                      <span className="workflow-timeline__dot" />
                      {!isLast && <span className="workflow-timeline__line" />}
                    </div>

                    <div className="workflow-timeline__content">
                      <div className="workflow-timeline__head">
                        <span className="workflow-timeline__title">{subtask.title}</span>
                        <span className="workflow-timeline__status">
                          {STATUS_LABELS[subtask.status]}
                        </span>
                      </div>

                      {staffName ? (
                        <p className="workflow-timeline__staff">{staffName}</p>
                      ) : (
                        <p className="workflow-timeline__staff workflow-timeline__staff--unassigned">
                          Assign staff
                        </p>
                      )}

                      {!isEditing ? (
                        <div className="workflow-timeline__actions">
                          <button
                            type="button"
                            className="workflow-timeline__action-btn"
                            onClick={() => startEditing(subtask.id, 'status')}
                          >
                            Change status
                          </button>
                          <button
                            type="button"
                            className="workflow-timeline__action-btn"
                            onClick={() => startEditing(subtask.id, 'staff')}
                          >
                            Reassign
                          </button>
                        </div>
                      ) : (
                        <div className="workflow-timeline__controls">
                          {editingMode === 'status' && (
                            <select
                              className="workflow-timeline__select"
                              value={subtask.status}
                              onChange={(e) =>
                                handleStatusChange(subtask.id, e.target.value)
                              }
                              aria-label={`${subtask.title} status`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {editingMode === 'staff' && (
                            <select
                              className="workflow-timeline__select"
                              value={subtask.staffId || ''}
                              onChange={(e) =>
                                handleStaffChange(subtask.id, e.target.value)
                              }
                              aria-label={`Assign staff for ${subtask.title}`}
                            >
                              <option value="">Assign staff</option>
                              {staffOptions.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--full"
                            onClick={stopEditing}
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="drawer__section drawer__section--actions">
            <button
              type="button"
              className={`btn ${confirmDelete ? 'btn--danger' : 'btn--ghost'} btn--full`}
              onClick={handleDelete}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete appointment'}
            </button>
            {confirmDelete && (
              <button
                type="button"
                className="btn btn--ghost btn--full drawer__cancel-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
