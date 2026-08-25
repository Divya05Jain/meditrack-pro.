import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import {
  formatTime,
  getWaitMinutes,
  getStatusLabel,
  capitalize,
  isNoShow,
} from '../../utils/formatters';

const SHORT_LABELS = {
  triage: 'Triage',
  consultation: 'Doctor',
  diagnostics: 'Lab',
  pharmacy: 'Pharmacy',
};

const SUBTASK_ICONS = {
  completed: '✓',
  'in-progress': '●',
  pending: '○',
};

function WorkflowStrip({ subtasks }) {
  return (
    <div className="appointment-card__workflow">
      {subtasks.map((subtask) => (
        <span
          key={subtask.id}
          className={`appointment-card__workflow-step appointment-card__workflow-step--${subtask.status}`}
          title={subtask.title}
        >
          <span className="appointment-card__workflow-icon">
            {SUBTASK_ICONS[subtask.status]}
          </span>
          <span className="appointment-card__workflow-label">
            {SHORT_LABELS[subtask.type] || subtask.title.split(' ')[0]}
          </span>
        </span>
      ))}
    </div>
  );
}

export function AppointmentCard({ appointment, isDragging, onDragStart }) {
  const { dispatch, getDoctorById, getDepartmentById } = useClinic();
  const doctor = getDoctorById(appointment.doctorId);
  const department = getDepartmentById(appointment.departmentId);
  const waitMinutes = getWaitMinutes(appointment.appointmentTime);
  const noShow = isNoShow(appointment);

  const handleClick = () => {
    dispatch({
      type: ACTION_TYPES.SELECT_APPOINTMENT,
      payload: appointment.id,
    });
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/appointment-id', appointment.id);
    e.dataTransfer.setData('text/from-status', appointment.status);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(appointment.id);
  };

  const footerText = noShow
    ? 'Doctor available'
    : appointment.status === 'waiting'
      ? `Waiting ${waitMinutes}m`
      : appointment.status === 'completed'
        ? 'Visit complete'
        : getStatusLabel(appointment.status);

  return (
    <article
      className={`appointment-card appointment-card--${appointment.priority} ${
        isDragging ? 'appointment-card--dragging' : ''
      } ${noShow ? 'appointment-card--noshow' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="appointment-card__header">
        {noShow ? (
          <span className="appointment-card__noshow-badge">No-show</span>
        ) : (
          <span className={`priority-badge priority-badge--${appointment.priority}`}>
            {capitalize(appointment.priority)}
          </span>
        )}
        <span className="appointment-card__time">
          {formatTime(appointment.appointmentTime)}
        </span>
      </div>

      <h4 className="appointment-card__name">{appointment.patient.name}</h4>
      <p className="appointment-card__meta">
        <span className="appointment-card__id">{appointment.id}</span>
        <span className="appointment-card__sep">·</span>
        <span>{appointment.patient.age} yrs</span>
      </p>

      <div className="appointment-card__clinical">
        <span className="appointment-card__dept">
          <span className="appointment-card__dept-dot" />
          {department?.name}
        </span>
        <span className="appointment-card__doctor">{doctor?.name}</span>
      </div>

      <WorkflowStrip subtasks={appointment.subtasks} />

      <div className="appointment-card__footer">
        <span
          className={`appointment-card__status ${noShow ? 'appointment-card__status--noshow' : ''}`}
        >
          {footerText}
        </span>
      </div>
    </article>
  );
}
