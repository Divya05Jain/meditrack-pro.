import { useMemo, useState } from 'react';
import { useClinic } from '../../hooks/useClinic';
import { useAppointmentFilters } from '../../hooks/useAppointmentFilters';
import { WORKFLOW_COLUMNS } from '../../data/mockData';
import { getWaitMinutes } from '../../utils/formatters';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { getColumnAppointments } from '../../utils/sequence';
import { BoardFilters } from './BoardFilters';
import { BoardColumn } from './BoardColumn';

function BoardSummary({ appointments, doctors }) {
  const metrics = useMemo(() => {
    const activeVisits = appointments.filter(
      (apt) => apt.status !== 'completed'
    ).length;

    const urgentCases = appointments.filter(
      (apt) =>
        (apt.priority === 'urgent' || apt.priority === 'critical') &&
        apt.status !== 'completed'
    ).length;

    const waitingAppointments = appointments.filter(
      (apt) => apt.status === 'waiting'
    );

    const avgWait =
      waitingAppointments.length > 0
        ? Math.round(
            waitingAppointments.reduce(
              (sum, apt) => sum + getWaitMinutes(apt.appointmentTime),
              0
            ) / waitingAppointments.length
          )
        : 0;

    return {
      activeVisits,
      doctorsOnDuty: doctors.length,
      urgentCases,
      avgWait,
    };
  }, [appointments, doctors]);

  return (
    <div className="board-summary">
      <div className="board-summary__item">
        <span className="board-summary__value">{metrics.activeVisits}</span>
        <span className="board-summary__label">Active Visits</span>
      </div>
      <div className="board-summary__divider" />
      <div className="board-summary__item">
        <span className="board-summary__value">{metrics.doctorsOnDuty}</span>
        <span className="board-summary__label">Doctors On Duty</span>
      </div>
      <div className="board-summary__divider" />
      <div className="board-summary__item board-summary__item--urgent">
        <span className="board-summary__value board-summary__value--warning">
          {metrics.urgentCases}
        </span>
        <span className="board-summary__label">
          <span className="board-summary__indicator board-summary__indicator--warning" />
          Urgent
        </span>
      </div>
      <div className="board-summary__divider" />
      <div className="board-summary__item">
        <span className="board-summary__value">
          {metrics.avgWait > 0 ? `${metrics.avgWait}m` : '—'}
        </span>
        <span className="board-summary__label">Avg. Wait</span>
      </div>
    </div>
  );
}

export function ClinicalBoard({ searchValue, onSearchChange }) {
  const { state, dispatch } = useClinic();
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('');
  const [draggingId, setDraggingId] = useState(null);

  const filters = {
    search: searchValue,
    departmentId,
    priority,
  };

  const { filteredAppointments, appointmentsByStatus } = useAppointmentFilters(
    state.appointments,
    filters
  );

  const handleDrop = ({ appointmentId, fromStatus, toStatus, toIndex }) => {
    setDraggingId(null);

    if (fromStatus === toStatus) {
      const column = getColumnAppointments(state.appointments, fromStatus);
      const currentIndex = column.findIndex((apt) => apt.id === appointmentId);
      if (currentIndex === -1 || currentIndex === toIndex) return;

      const reordered = [...column];
      const [moved] = reordered.splice(currentIndex, 1);
      const insertIndex = currentIndex < toIndex ? toIndex - 1 : toIndex;
      reordered.splice(insertIndex, 0, moved);

      dispatch({
        type: ACTION_TYPES.REORDER_APPOINTMENTS,
        payload: {
          status: fromStatus,
          orderedIds: reordered.map((apt) => apt.id),
          patientName: moved.patient.name,
        },
      });
      return;
    }

    dispatch({
      type: ACTION_TYPES.MOVE_APPOINTMENT,
      payload: {
        appointmentId,
        fromStatus,
        toStatus,
        toIndex,
      },
    });
  };

  return (
    <div
      className="clinical-board"
      onDragEnd={() => setDraggingId(null)}
    >
      <BoardSummary
        appointments={state.appointments}
        doctors={state.doctors}
      />

      <BoardFilters
        search={searchValue}
        departmentId={departmentId}
        priority={priority}
        departments={state.departments}
        totalCount={filteredAppointments.length}
        onSearchChange={onSearchChange}
        onDepartmentChange={setDepartmentId}
        onPriorityChange={setPriority}
        onClear={() => {
          onSearchChange('');
          setDepartmentId('');
          setPriority('');
        }}
      />

      <div className="clinical-board__columns">
        {WORKFLOW_COLUMNS.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            appointments={appointmentsByStatus[column.id]}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
