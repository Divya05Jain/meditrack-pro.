import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { Badge } from '../common/Badge';
import {
  formatTimeRange,
  capitalize,
  isScheduleNoShow,
} from '../../utils/formatters';

export function BookingPopover({
  block,
  doctor,
  appointment,
  department,
  position,
  onClose,
  onView,
  onEdit,
  onDelete,
}) {
  const priority = appointment?.priority || 'normal';
  const noShow = isScheduleNoShow(block, appointment);

  return (
    <>
      <div className="booking-popover__backdrop" onClick={onClose} />
      <div
        className="booking-popover"
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-label="Booking details"
      >
        <div className="booking-popover__header">
          <div className="booking-popover__header-main">
            <h3 className="booking-popover__name">{block.patientName}</h3>
            <p className="booking-popover__id">{block.appointmentId || 'Walk-in'}</p>
          </div>
          <div className="booking-popover__header-badges">
            {noShow && (
              <span className="booking-popover__noshow-badge">No-show</span>
            )}
            <Badge variant={priority}>{capitalize(priority)}</Badge>
            <button
              type="button"
              className="booking-popover__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {noShow && (
          <p className="booking-popover__noshow-note">
            Patient has not arrived. Doctor is available for this slot.
          </p>
        )}

        <div className="booking-popover__meta">
          <p>{department?.name || doctor.specialty}</p>
          <p>{doctor.name}</p>
          <p className="booking-popover__time">
            {formatTimeRange(block.start, block.end)}
          </p>
        </div>

        {appointment?.reason && (
          <div className="booking-popover__reason">
            <span className="booking-popover__reason-label">Reason</span>
            <p>{appointment.reason}</p>
          </div>
        )}

        <div className="booking-popover__actions">
          <div className="booking-popover__actions-row">
            <button type="button" className="btn btn--ghost" onClick={onView}>
              View Visit
            </button>
            <button type="button" className="btn btn--primary" onClick={onEdit}>
              Edit
            </button>
          </div>
          <button type="button" className="btn btn--danger btn--full" onClick={onDelete}>
            Delete booking
          </button>
        </div>
      </div>
    </>
  );
}

export function useBookingActions() {
  const { dispatch } = useClinic();

  const viewAppointment = (appointmentId) => {
    if (!appointmentId) return;
    dispatch({ type: ACTION_TYPES.SELECT_APPOINTMENT, payload: appointmentId });
  };

  return { viewAppointment };
}
