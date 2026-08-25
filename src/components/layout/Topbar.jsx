import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { formatDisplayDate } from '../../utils/formatters';

export function Topbar({ searchValue, onSearchChange, onNewAppointment }) {
  const { state, dispatch } = useClinic();

  if (state.activeView === 'schedule') {
    return null;
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">Clinical Operations</h1>
        <p className="topbar__subtitle">{formatDisplayDate()}</p>
      </div>

      <div className="topbar__actions">
        <div className="topbar__search">
          <span className="topbar__search-icon" aria-hidden="true">⌕</span>
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
          className={`btn btn--ghost topbar__activity-btn ${
            state.isActivityOpen ? 'btn--active' : ''
          }`}
          onClick={() => dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY })}
        >
          Activity
          <span className="topbar__activity-count">{state.activity.length}</span>
        </button>

        <button
          type="button"
          className="btn btn--primary"
          onClick={onNewAppointment}
        >
          + New Appointment
        </button>
      </div>
    </header>
  );
}
