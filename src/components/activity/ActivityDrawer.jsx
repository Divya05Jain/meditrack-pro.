import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { formatActivityTime } from '../../utils/formatters';

const TYPE_DOT_CLASS = {
  appointment_created: 'activity-timeline__dot--create',
  appointment_moved: 'activity-timeline__dot--move',
  appointment_reordered: 'activity-timeline__dot--move',
  staff_assigned: 'activity-timeline__dot--assign',
  schedule_created: 'activity-timeline__dot--schedule',
  subtask_status_changed: 'activity-timeline__dot--subtask',
  priority_changed: 'activity-timeline__dot--priority',
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
      <aside className="drawer drawer--activity">
        <div className="drawer__header">
          <div>
            <h2 className="drawer__title">Activity Log</h2>
            <p className="drawer__subtitle">
              {state.activity.length} recent operations
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
          <ul className="activity-timeline">
            {state.activity.map((entry) => {
              const { primary, secondary } = splitMessage(entry.message);
              const dotClass = TYPE_DOT_CLASS[entry.type] || '';

              return (
                <li key={entry.id} className="activity-timeline__item">
                  <div className="activity-timeline__time">
                    {formatActivityTime(entry.timestamp)}
                  </div>
                  <div
                    className={`activity-timeline__dot ${dotClass}`.trim()}
                  />
                  <div className="activity-timeline__content">
                    <p className="activity-timeline__message">{primary}</p>
                    {secondary && (
                      <p className="activity-timeline__secondary">{secondary}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
