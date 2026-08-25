import { useState } from 'react';
import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { getClinicNow, formatScheduleDate } from '../../utils/formatters';
import { ScheduleGrid } from './ScheduleGrid';

export function DoctorSchedule() {
  const { dispatch } = useClinic();
  const [selectedDate, setSelectedDate] = useState(getClinicNow());
  const [requestOpenPanel, setRequestOpenPanel] = useState(false);

  const shiftDate = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <div className="doctor-schedule-page">
      <header className="doctor-schedule-page__header">
        <div className="doctor-schedule-page__header-left">
          <h1 className="doctor-schedule-page__title">Doctor Schedule</h1>
          <p className="doctor-schedule-page__subtitle">
            Daily clinical coverage and consultation assignments
          </p>
        </div>

        <div className="doctor-schedule-page__header-right">
          <div className="doctor-schedule-page__date-nav" aria-label="Schedule date">
            <button
              type="button"
              className="doctor-schedule-page__date-btn"
              onClick={() => shiftDate(-1)}
              aria-label="Previous day"
            >
              ‹
            </button>
            <span className="doctor-schedule-page__date-label">
              {formatScheduleDate(selectedDate)}
            </span>
            <button
              type="button"
              className="doctor-schedule-page__date-btn"
              onClick={() => shiftDate(1)}
              aria-label="Next day"
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setRequestOpenPanel(true)}
          >
            + Schedule Appointment
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY })}
          >
            Activity
          </button>
        </div>
      </header>

      <ScheduleGrid
        selectedDate={selectedDate}
        requestOpenPanel={requestOpenPanel}
        onPanelOpened={() => setRequestOpenPanel(false)}
      />
    </div>
  );
}
