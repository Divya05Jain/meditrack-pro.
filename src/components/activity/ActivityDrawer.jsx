import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { formatActivityTime } from '../../utils/formatters';

const TYPE_CONFIG = {
  appointment_created: { dot: 'activity-timeline__dot--create', category: 'Appointment' },
  appointment_deleted: { dot: 'activity-timeline__dot--priority', category: 'Appointment' },
  appointment_moved: { dot: 'activity-timeline__dot--move', category: 'Workflow' },
  appointment_reordered: { dot: 'activity-timeline__dot--move', category: 'Workflow' },
  staff_assigned: { dot: 'activity-timeline__dot--assign', category: 'Staff' },
  schedule_created: { dot: 'activity-timeline__dot--schedule', category: 'Schedule' },
  schedule_updated: { dot: 'activity-timeline__dot--schedule', category: 'Schedule' },
  schedule_deleted: { dot: 'activity-timeline__dot--schedule', category: 'Schedule' },
  subtask_status_changed: { dot: 'activity-timeline__dot--subtask', category: 'Workflow' },
  priority_changed: { dot: 'activity-timeline__dot--priority', category: 'Appointment' },
};

function splitMessage(message) {
  const moveMatch = message.match(/^(.+?) moved from (.+?) to (.+)$/);
  if (moveMatch) {
    return {
      primary: `${moveMatch[1]} moved`,
      secondary: `${moveMatch[2]} → ${moveMatch[3]}`,
    };
  }

  const assignMatch = message.match(/^(.+?) assigned to (.+)$/);
  if (assignMatch) {
    return {
      primary: `${assignMatch[1]} assigned`,
      secondary: assignMatch[2],
    };
  }

  const createdMatch = message.match(/^(.+?) appointment created — (.+)$/);
  if (createdMatch) {
    return {
      primary: `${createdMatch[1]} appointment created`,
      secondary: createdMatch[2],
    };
  }

  const deletedMatch = message.match(/^(.+?) appointment deleted — (.+)$/);
  if (deletedMatch) {
    return {
      primary: 'Appointment deleted',
      secondary: `${deletedMatch[1]} · ${deletedMatch[2]}`,
    };
  }

  return { primary: message, secondary: null };
}

export function ActivityDrawer() {
  const { state, dispatch } = useClinic();

  if (!state.isActivityOpen) return null;

  const handleClose = () => {
    dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY, payload: false });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div className="drawer-overlay" onClick={handleBackdropClick}>
      <aside className="drawer drawer--activity" role="dialog" aria-label="Activity log">
        <div className="drawer__header">
          <div>
            <h2 className="drawer__title">Activity</h2>
            <p className="drawer__subtitle">
              {state.activity.length} session event{state.activity.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={handleClose}
            aria-label="Close activity drawer"
          >
            ×
          </button>
        </div>

        <div className="drawer__body">
          {state.activity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true">○</div>
              <p className="empty-state__title">No activity yet</p>
              <p className="empty-state__description">
                Actions you take will appear here in real time.
              </p>
            </div>
          ) : (
            <ul className="activity-timeline">
              {state.activity.map((entry) => {
                const { primary, secondary } = splitMessage(entry.message);
                const config = TYPE_CONFIG[entry.type] || { dot: '', category: 'System' };

                return (
                  <li key={entry.id} className="activity-timeline__item">
                    <div className="activity-timeline__time">
                      {formatActivityTime(entry.timestamp)}
                    </div>
                    <div className={`activity-timeline__dot ${config.dot}`.trim()} />
                    <div className="activity-timeline__content">
                      <p className="activity-timeline__category">{config.category}</p>
                      <p className="activity-timeline__message">{primary}</p>
                      {secondary && (
                        <p className="activity-timeline__secondary">{secondary}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
