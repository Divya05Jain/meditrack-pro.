import { useState } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { EmptyState } from '../common/EmptyState';

const COLUMN_EMPTY = {
  waiting: {
    title: 'No patients in this stage',
    description: 'New appointments appear here while awaiting triage.',
  },
  triage: {
    title: 'No patients in this stage',
    description: 'Patients moved to triage will appear here.',
  },
  consultation: {
    title: 'No patients in this stage',
    description: 'Active consultations will appear here.',
  },
  diagnostics: {
    title: 'No patients in this stage',
    description: 'Lab and imaging visits appear here.',
  },
  pharmacy: {
    title: 'No patients in this stage',
    description: 'Dispensing queue appears here.',
  },
  completed: {
    title: 'No patients in this stage',
    description: 'Completed visits appear here.',
  },
};

export function BoardColumn({
  column,
  appointments,
  onDrop,
  draggingId,
  onDragStart,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const empty = COLUMN_EMPTY[column.id] || COLUMN_EMPTY.waiting;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setIsDragOver(false);
    const appointmentId = e.dataTransfer.getData('text/appointment-id');
    const fromStatus = e.dataTransfer.getData('text/from-status');
    if (!appointmentId) return;
    onDrop({ appointmentId, fromStatus, toStatus: column.id, toIndex: dropIndex });
  };

  const handleColumnDrop = (e) => {
    handleDrop(e, appointments.length);
  };

  return (
    <div
      className={`board-column board-column--${column.id} ${
        isDragOver ? 'board-column--drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleColumnDrop}
    >
      <div className="board-column__header">
        <div className="board-column__header-text">
          <div className="board-column__title-row">
            <h3 className="board-column__title">{column.label}</h3>
            <span className="board-column__count">{appointments.length}</span>
          </div>
          {column.description && (
            <p className="board-column__desc">{column.description}</p>
          )}
        </div>
      </div>

      <div className="board-column__body">
        {appointments.length === 0 ? (
          <EmptyState title={empty.title} description={empty.description} />
        ) : (
          appointments.map((appointment, index) => (
            <div
              key={appointment.id}
              className="board-column__card-wrap"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, index);
              }}
            >
              <AppointmentCard
                appointment={appointment}
                isDragging={draggingId === appointment.id}
                onDragStart={onDragStart}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
