import { useState } from 'react';
import { addMinutesToTime, getDurationMinutes } from '../../utils/scheduling';
import {
  formatScheduleDateShort,
  formatTimeRange,
} from '../../utils/formatters';

const DURATION_OPTIONS = [15, 30, 45, 60];

export function SchedulePanel({
  doctor,
  startTime,
  selectedDate,
  appointments,
  editingBlock,
  validationError,
  onClose,
  onSchedule,
  onUseSuggested,
  onFieldChange,
}) {
  const [appointmentId, setAppointmentId] = useState(
    editingBlock?.appointmentId || ''
  );
  const [start, setStart] = useState(editingBlock?.start || startTime || '09:00');
  const [end, setEnd] = useState(
    editingBlock?.end || (startTime ? addMinutesToTime(startTime, 30) : '09:30')
  );

  const handleStartChange = (value) => {
    setStart(value);
    const duration = getDurationMinutes(start, end) || 30;
    setEnd(addMinutesToTime(value, duration));
    onFieldChange?.();
  };

  const handleEndChange = (value) => {
    setEnd(value);
    onFieldChange?.();
  };

  const handleDuration = (minutes) => {
    setEnd(addMinutesToTime(start, minutes));
    onFieldChange?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSchedule({
      doctorId: doctor.id,
      start,
      end,
      appointmentId,
      blockId: editingBlock?.id,
    });
  };

  return (
    <>
      <div className="schedule-panel__backdrop" onClick={onClose} />
      <aside className="schedule-panel" role="dialog" aria-modal="true" aria-label="Schedule consultation">
        <div className="schedule-panel__header">
          <div>
            <h2 className="schedule-panel__title">Schedule Consultation</h2>
            <p className="schedule-panel__subtitle">Assign a consultation window</p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="schedule-panel__body" onSubmit={handleSubmit}>
          <div className="schedule-panel__doctor-card">
            <div className="schedule-panel__doctor-avatar">
              {doctor.name
                .split(' ')
                .slice(1)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="schedule-panel__doctor-name">{doctor.name}</div>
              <div className="schedule-panel__doctor-meta">
                {doctor.specialty} · {doctor.shiftStart}–{doctor.shiftEnd}
              </div>
            </div>
          </div>

          {validationError && (
            <div
              className={`schedule-panel__alert schedule-panel__alert--${validationError.type}`}
              role="alert"
            >
              <div className="schedule-panel__alert-icon">⚠</div>
              <div className="schedule-panel__alert-content">
                <strong className="schedule-panel__alert-title">
                  {validationError.type === 'overlap'
                    ? 'Scheduling conflict'
                    : validationError.type === 'shift'
                      ? 'Outside rostered shift'
                      : 'Invalid time'}
                </strong>

                <div className="schedule-panel__alert-row">
                  <span className="schedule-panel__alert-label">Requested</span>
                  <span className="schedule-panel__alert-value">
                    <strong>
                      {formatTimeRange(
                        validationError.requestedStart,
                        validationError.requestedEnd
                      )}
                    </strong>
                  </span>
                </div>

                {validationError.conflictBlock && (
                  <div className="schedule-panel__alert-row">
                    <span className="schedule-panel__alert-label">Conflicts with</span>
                    <span className="schedule-panel__alert-value">
                      <strong>{validationError.conflictBlock.patientName}</strong>
                      {validationError.conflictBlock.appointmentId && (
                        <> · {validationError.conflictBlock.appointmentId}</>
                      )}
                      <br />
                      {formatTimeRange(
                        validationError.conflictBlock.start,
                        validationError.conflictBlock.end
                      )}
                    </span>
                  </div>
                )}

                {validationError.type === 'shift' && (
                  <div className="schedule-panel__alert-row">
                    <span className="schedule-panel__alert-label">Roster</span>
                    <span className="schedule-panel__alert-value">
                      {formatTimeRange(validationError.shiftStart, validationError.shiftEnd)}
                    </span>
                  </div>
                )}

                {validationError.suggested && (
                  <div className="schedule-panel__alert-suggested">
                    <div className="schedule-panel__alert-row">
                      <span className="schedule-panel__alert-label">
                        {validationError.type === 'shift' ? 'Earliest valid' : 'Next available'}
                      </span>
                      <span className="schedule-panel__alert-value">
                        <strong>
                          {formatTimeRange(
                            validationError.suggested.start,
                            validationError.suggested.end
                          )}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="schedule-panel__suggest-btn"
                      onClick={() => onUseSuggested(validationError.suggested)}
                    >
                      Use {formatTimeRange(
                        validationError.suggested.start,
                        validationError.suggested.end
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="schedule-appointment">Patient</label>
            <select
              id="schedule-appointment"
              value={appointmentId}
              onChange={(e) => {
                setAppointmentId(e.target.value);
                onFieldChange?.();
              }}
            >
              <option value="">Select appointment</option>
              {appointments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient.name} — {apt.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Date</label>
            <div className="schedule-panel__date-readonly">
              {formatScheduleDateShort(selectedDate)}
            </div>
          </div>

          <div className="schedule-panel__time-row">
            <div className="form-field">
              <label htmlFor="schedule-start">Start</label>
              <input
                id="schedule-start"
                type="time"
                value={start}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="schedule-end">End</label>
              <input
                id="schedule-end"
                type="time"
                value={end}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>
          </div>

          <div className="schedule-panel__durations">
            <span className="schedule-panel__durations-label">Duration</span>
            <div className="schedule-panel__duration-btns">
              {DURATION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`schedule-panel__duration-btn ${
                    getDurationMinutes(start, end) === mins
                      ? 'schedule-panel__duration-btn--active'
                      : ''
                  }`}
                  onClick={() => handleDuration(mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-panel__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingBlock ? 'Save Changes' : 'Schedule Consultation'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
