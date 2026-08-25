export function BoardFilters({
  search,
  departmentId,
  priority,
  departments,
  totalCount,
  onSearchChange,
  onDepartmentChange,
  onPriorityChange,
  onClear,
}) {
  const hasFilters = search || departmentId || priority;

  return (
    <div className="board-toolbar">
      <div className="board-toolbar__controls">
        <div className="board-toolbar__search-wrap">
          <span className="board-toolbar__search-icon" aria-hidden="true">⌕</span>
          <input
            id="filter-search"
            type="search"
            className="board-toolbar__input board-toolbar__input--search"
            placeholder="Search patient or appointment"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search patient or appointment"
          />
        </div>

        <select
          id="filter-department"
          className="board-toolbar__select"
          value={departmentId}
          onChange={(e) => onDepartmentChange(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="">Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          id="filter-priority"
          className="board-toolbar__select"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">Priority</option>
          <option value="critical">Critical</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
        </select>

        {hasFilters && (
          <button type="button" className="board-toolbar__clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <span className="board-toolbar__count">
        {totalCount} appointment{totalCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
