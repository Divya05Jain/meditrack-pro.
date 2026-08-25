import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { formatDisplayDate, formatScheduleDate } from '../../utils/formatters';

export function Topbar({
  searchValue,
  onSearchChange,
  onNewAppointment,
  scheduleDate,
  onScheduleDateChange,
  onOpenSchedulePanel,
  specialtyFilter,
  onSpecialtyFilterChange,
  specialties,
}) {
  const { state, dispatch } = useClinic();
  const isSchedule = state.activeView === 'schedule';

  const shiftDate = (days) => {
    const next = new Date(scheduleDate);
    next.setDate(next.getDate() + days);
    onScheduleDateChange(next);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">
          {isSchedule ? 'Doctor Schedule' : 'Clinical Operations'}
        </h1>
        <p className="topbar__subtitle">
          {isSchedule
            ? 'Daily clinical coverage and consultation assignments'
            : formatDisplayDate()}
        </p>
      </div>

      <div className="topbar__actions">
        {isSchedule ? (
          <>
            <div className="topbar__date-nav" aria-label="Schedule date">
              <button
                type="button"
                className="topbar__date-btn"
                onClick={() => shiftDate(-1)}
                aria-label="Previous day"
              >
                ‹
              </button>
              <span className="topbar__date-label">
                {formatScheduleDate(scheduleDate)}
              </span>
              <button
                type="button"
                className="topbar__date-btn"
                onClick={() => shiftDate(1)}
                aria-label="Next day"
              >
                ›
              </button>
            </div>

            <select
              className="topbar__filter-select"
              value={specialtyFilter}
              onChange={(e) => onSpecialtyFilterChange(e.target.value)}
              aria-label="Filter by specialty"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn--primary"
              onClick={onOpenSchedulePanel}
            >
              + Schedule Consultation
            </button>
          </>
        ) : (
          <>
            <div className="topbar__search">
              <span className="topbar__search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                className="topbar__search-input"
                placeholder="Search patients..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search patients"
              />
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={onNewAppointment}
            >
              + New Appointment
            </button>
          </>
        )}

        <button
          type="button"
          className={`btn btn--ghost topbar__activity-btn ${
            state.isActivityOpen ? 'btn--active' : ''
          }`}
          onClick={() => dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY })}
          aria-label={`Activity log, ${state.activity.length} events`}
        >
          <span className="topbar__activity-label">Activity</span>
          <span className="topbar__activity-count">{state.activity.length}</span>
        </button>
      </div>
    </header>
  );
}
