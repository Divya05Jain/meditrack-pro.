import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { BrandLogo } from '../common/BrandLogo';

const NAV_ITEMS = [
  {
    id: 'board',
    label: 'Clinical Board',
    tooltip: 'Clinical Board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Doctor Schedule',
    tooltip: 'Doctor Schedule',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="3.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 7.5h14" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 10.5l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar({ collapsed = false, onToggleCollapse }) {
  const { state, dispatch } = useClinic();

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        <BrandLogo variant={collapsed ? 'icon' : 'full'} />
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-tooltip={item.tooltip}
            className={`sidebar__nav-item ${
              state.activeView === item.id ? 'sidebar__nav-item--active' : ''
            }`}
            onClick={() => dispatch({ type: ACTION_TYPES.SET_ACTIVE_VIEW, payload: item.id })}
            aria-current={state.activeView === item.id ? 'page' : undefined}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user" title="Clinic Manager">
          <div className="sidebar__user-avatar">CM</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">Clinic Manager</div>
            <div className="sidebar__user-role">Operations Admin</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="sidebar__edge-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        data-tooltip={collapsed ? 'Expand' : 'Collapse'}
      >
        <span className="sidebar__edge-toggle-rail" aria-hidden="true" />
        <span className="sidebar__edge-toggle-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect
              x="1.75"
              y="2.25"
              width="10.5"
              height="9.5"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path
              d="M5.25 2.25v9.5"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path
              className="sidebar__edge-toggle-chevron"
              d="M5.75 6.25 4.25 7 5.75 7.75"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </aside>
  );
}
