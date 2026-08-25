import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';

const NAV_ITEMS = [
  {
    id: 'board',
    label: 'Clinical Board',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Doctor Schedule',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { state, dispatch } = useClinic();

  const handleNav = (viewId) => {
    dispatch({ type: ACTION_TYPES.SET_ACTIVE_VIEW, payload: viewId });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v12M4.5 5.5h7M4.5 10.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="sidebar__title">MediTrack</div>
          <div className="sidebar__subtitle">Clinic Operations</div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__nav-item ${
              state.activeView === item.id ? 'sidebar__nav-item--active' : ''
            }`}
            onClick={() => handleNav(item.id)}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">CM</div>
          <div>
            <div className="sidebar__user-name">Clinic Manager</div>
            <div className="sidebar__user-role">Operations Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
