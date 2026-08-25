import { useMemo, useState, useEffect } from 'react';
import { useClinic } from '../../hooks/useClinic';
import { useDragScroll } from '../../hooks/useDragScroll';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import {
  validateScheduleAssignment,
  generateTimeSlots,
  timeToMinutes,
  filterScheduleByDate,
  getBlockStyle,
  countOpenSlots,
} from '../../utils/scheduling';
import { generateScheduleBlockId } from '../../utils/ids';
import {
  formatHourAxis,
  formatTimeRange,
  formatTime,
  toDateKey,
  isScheduleNoShow,
} from '../../utils/formatters';
import { SchedulePanel } from './SchedulePanel';
import { BookingPopover, useBookingActions } from './BookingPopover';

const GRID_START = 8;
const GRID_END = 18;
const SLOT_MINUTES = 30;
const TIME_SLOTS = generateTimeSlots(GRID_START, GRID_END, SLOT_MINUTES);
const GRID_START_MIN = GRID_START * 60;
const GRID_END_MIN = GRID_END * 60;
const TOTAL_MINUTES = GRID_END_MIN - GRID_START_MIN;
const HOUR_MARKS = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => GRID_START + i);

function getInitials(name) {
  return name
    .split(' ')
    .slice(1)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getSlotMinutes(slot) {
  return timeToMinutes(slot) - GRID_START_MIN;
}

function getBlockTier(start, end) {
  const minutes = timeToMinutes(end) - timeToMinutes(start);
  if (minutes >= 45) return 'wide';
  if (minutes >= 25) return 'medium';
  return 'narrow';
}

function getFirstName(fullName) {
  return fullName.split(' ')[0];
}

export function ScheduleGrid({ selectedDate, requestOpenPanel, onPanelOpened, specialtyFilter = '' }) {
  const { state, dispatch, getDepartmentById } = useClinic();
  const { viewAppointment } = useBookingActions();
  const dateKey = toDateKey(selectedDate);

  const filteredDoctors = useMemo(() => {
    if (!specialtyFilter) return state.doctors;
    return state.doctors.filter((d) => d.specialty === specialtyFilter);
  }, [state.doctors, specialtyFilter]);

  const [panelState, setPanelState] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [attemptedRange, setAttemptedRange] = useState(null);
  const [popover, setPopover] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const timelineRef = useDragScroll({
    ignoreSelector: 'button, a, input, select, textarea, [data-no-drag-scroll]',
  });

  const stats = useMemo(() => {
    let bookings = 0;
    let openWindows = 0;
    let urgent = 0;

    state.doctors.forEach((doc) => {
      if (specialtyFilter && doc.specialty !== specialtyFilter) return;
      const daySchedule = filterScheduleByDate(doc.schedule, dateKey);
      bookings += daySchedule.length;
      openWindows += countOpenSlots(doc, doc.schedule, dateKey);

      daySchedule.forEach((block) => {
        const apt = state.appointments.find((a) => a.id === block.appointmentId);
        if (apt && (apt.priority === 'urgent' || apt.priority === 'critical')) {
          urgent += 1;
        }
      });
    });

    return {
      doctorsOnDuty: filteredDoctors.length,
      bookings,
      openWindows,
      urgent,
    };
  }, [state.doctors, state.appointments, dateKey, specialtyFilter, filteredDoctors.length]);

  const openPanel = (doctor, startTime = null, editingBlock = null) => {
    setValidationError(null);
    setAttemptedRange(null);
    setPanelState({ doctor, startTime, editingBlock, suggestedTimes: null });
  };

  const closePanel = () => {
    setPanelState(null);
    setValidationError(null);
    setAttemptedRange(null);
  };

  useEffect(() => {
    if (requestOpenPanel && !panelState && filteredDoctors.length > 0) {
      openPanel(filteredDoctors[0], '09:00');
      onPanelOpened?.();
    }
  }, [requestOpenPanel, panelState, filteredDoctors, onPanelOpened]);

  const handleSchedule = ({ doctorId, start, end, appointmentId, blockId }) => {
    const doctor = state.doctors.find((d) => d.id === doctorId);
    const appointment = state.appointments.find((a) => a.id === appointmentId);

    const validation = validateScheduleAssignment({
      doctor,
      start,
      end,
      existingSchedule: doctor.schedule,
      excludeId: blockId,
      date: dateKey,
    });

    if (!validation.valid) {
      setValidationError(validation);
      setAttemptedRange({ doctorId, start, end });
      return;
    }

    if (blockId) {
      dispatch({
        type: ACTION_TYPES.UPDATE_SCHEDULE_BLOCK,
        payload: {
          doctorId,
          blockId,
          updates: {
            start,
            end,
            appointmentId,
            patientName: appointment?.patient.name || 'Walk-in',
            date: dateKey,
          },
        },
      });
    } else {
      dispatch({
        type: ACTION_TYPES.CREATE_SCHEDULE_BLOCK,
        payload: {
          doctorId,
          block: {
            id: generateScheduleBlockId(state.doctors),
            appointmentId,
            patientName: appointment?.patient.name || 'Walk-in',
            start,
            end,
            date: dateKey,
          },
        },
      });
    }

    closePanel();
  };

  const isOutsideShift = (doctor, slotTime) => {
    const slotMin = timeToMinutes(slotTime);
    return (
      slotMin < timeToMinutes(doctor.shiftStart) ||
      slotMin >= timeToMinutes(doctor.shiftEnd)
    );
  };

  const isSlotInBlock = (doctor, slotTime) => {
    const daySchedule = filterScheduleByDate(doctor.schedule, dateKey);
    const slotMin = timeToMinutes(slotTime);
    return daySchedule.some((block) => {
      const start = timeToMinutes(block.start);
      const end = timeToMinutes(block.end);
      return slotMin >= start && slotMin < end;
    });
  };

  const handleBlockClick = (e, block, doctor) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 300;
    const popoverHeight = 320;
    const padding = 12;

    let top = rect.bottom + 8;
    let left = rect.left;

    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }
    left = Math.max(padding, left);

    if (top + popoverHeight > window.innerHeight - padding) {
      top = Math.max(padding, rect.top - popoverHeight - 8);
    }

    setPopover({
      block,
      doctor,
      position: { top, left },
    });
    setSelectedBlockId(block.id);
  };

  return (
    <div className="resource-schedule">
      <div className="resource-schedule__stats">
        <div className="resource-schedule__stat">
          <span className="resource-schedule__stat-value">{stats.doctorsOnDuty}</span>
          <span className="resource-schedule__stat-label">On Duty</span>
        </div>
        <div className="resource-schedule__stat-divider" />
        <div className="resource-schedule__stat">
          <span className="resource-schedule__stat-value">{stats.bookings}</span>
          <span className="resource-schedule__stat-label">Consultations</span>
        </div>
        <div className="resource-schedule__stat-divider" />
        <div className="resource-schedule__stat">
          <span className="resource-schedule__stat-value">{stats.openWindows}</span>
          <span className="resource-schedule__stat-label">Open Windows</span>
        </div>
        <div className="resource-schedule__stat-divider" />
        <div className="resource-schedule__stat">
          <span className="resource-schedule__stat-value resource-schedule__stat-value--urgent">
            {stats.urgent}
          </span>
          <span className="resource-schedule__stat-label">Urgent</span>
        </div>

        <div className="resource-schedule__legend">
          <span className="resource-schedule__legend-item">
            <span className="resource-schedule__legend-swatch resource-schedule__legend-swatch--available" />
            Available
          </span>
          <span className="resource-schedule__legend-item">
            <span className="resource-schedule__legend-swatch resource-schedule__legend-swatch--booked" />
            Booked
          </span>
          <span className="resource-schedule__legend-item">
            <span className="resource-schedule__legend-swatch resource-schedule__legend-swatch--off" />
            Off shift
          </span>
          <span className="resource-schedule__legend-item">
            <span className="resource-schedule__legend-swatch resource-schedule__legend-swatch--noshow" />
            No-show
          </span>
        </div>
      </div>

      <div className="resource-schedule__panel resource-schedule__panel--fade" key={dateKey}>
        <div className="resource-timeline drag-scroll" ref={timelineRef}>
          <div className="resource-timeline__header">
            <div className="resource-timeline__resource-col">Doctor</div>
            <div className="resource-timeline__axis">
              {HOUR_MARKS.map((hour, i) => (
                <div
                  key={hour}
                  className={`resource-timeline__hour ${i % 2 === 1 ? 'resource-timeline__hour--alt' : ''}`}
                  style={{
                    left: `${((hour * 60 - GRID_START_MIN) / TOTAL_MINUTES) * 100}%`,
                    width: `${(60 / TOTAL_MINUTES) * 100}%`,
                  }}
                >
                  {formatHourAxis(hour)}
                </div>
              ))}
            </div>
          </div>

          {filteredDoctors.map((doctor) => {
            const daySchedule = filterScheduleByDate(doctor.schedule, dateKey);

            return (
              <div key={doctor.id} className="resource-timeline__row">
                <div className="resource-timeline__resource">
                  <div className="resource-timeline__avatar">{getInitials(doctor.name)}</div>
                  <div className="resource-timeline__resource-info">
                    <div className="resource-timeline__name">{doctor.name}</div>
                    <div className="resource-timeline__specialty">{doctor.specialty}</div>
                    <div className="resource-timeline__shift">
                      {doctor.shiftStart}–{doctor.shiftEnd}
                    </div>
                    <span className="resource-timeline__status">On Duty</span>
                  </div>
                </div>

                <div className="resource-timeline__track">
                  <div className="resource-timeline__grid" aria-hidden="true">
                    {HOUR_MARKS.map((hour, i) => (
                      <div
                        key={hour}
                        className={`resource-timeline__band ${i % 2 === 1 ? 'resource-timeline__band--alt' : ''}`}
                        style={{
                          left: `${((hour * 60 - GRID_START_MIN) / TOTAL_MINUTES) * 100}%`,
                          width: `${(60 / TOTAL_MINUTES) * 100}%`,
                        }}
                      />
                    ))}
                    {TIME_SLOTS.map((slot) => (
                      <span
                        key={slot}
                        className={`resource-timeline__line ${slot.endsWith(':00') ? 'resource-timeline__line--hour' : 'resource-timeline__line--half'}`}
                        style={{ left: `${(getSlotMinutes(slot) / TOTAL_MINUTES) * 100}%` }}
                      />
                    ))}
                  </div>

                  {TIME_SLOTS.map((slot) => {
                    const outside = isOutsideShift(doctor, slot);
                    const inBlock = isSlotInBlock(doctor, slot);
                    if (inBlock) return null;

                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`resource-timeline__slot ${outside ? 'resource-timeline__slot--off' : 'resource-timeline__slot--available'}`}
                        style={{
                          left: `${(getSlotMinutes(slot) / TOTAL_MINUTES) * 100}%`,
                          width: `${(SLOT_MINUTES / TOTAL_MINUTES) * 100}%`,
                        }}
                        onClick={() => !outside && openPanel(doctor, slot)}
                      >
                        <span className="resource-timeline__slot-hint">+</span>
                      </button>
                    );
                  })}

                  {attemptedRange?.doctorId === doctor.id && validationError && (
                    <div
                      className="resource-timeline__attempt"
                      style={getBlockStyle(
                        attemptedRange.start,
                        attemptedRange.end,
                        GRID_START_MIN,
                        TOTAL_MINUTES
                      )}
                    />
                  )}

                  {daySchedule.map((block) => {
                    const apt = state.appointments.find((a) => a.id === block.appointmentId);
                    const isConflict =
                      validationError?.type === 'overlap' &&
                      validationError.conflictBlockId === block.id &&
                      attemptedRange?.doctorId === doctor.id;
                    const priority = apt?.priority || 'normal';
                    const noShow = isScheduleNoShow(block, apt);
                    const tier = getBlockTier(block.start, block.end);
                    const deptName =
                      getDepartmentById(apt?.departmentId)?.name || doctor.specialty;
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={`resource-timeline__block resource-timeline__block--${priority} resource-timeline__block--${tier} ${isConflict ? 'resource-timeline__block--conflict' : ''} ${noShow ? 'resource-timeline__block--noshow' : ''} ${isSelected ? 'resource-timeline__block--selected' : ''}`}
                        style={getBlockStyle(block.start, block.end, GRID_START_MIN, TOTAL_MINUTES)}
                        onClick={(e) => handleBlockClick(e, block, doctor)}
                        aria-label={`${block.patientName}, ${formatTimeRange(block.start, block.end)}`}
                      >
                        <span className="resource-timeline__block-content">
                          {isConflict && <span className="resource-timeline__block-warn">⚠</span>}
                          {noShow && (
                            <span className="resource-timeline__noshow-badge">No-show</span>
                          )}
                          {priority !== 'normal' && !noShow && (
                            <span
                              className={`resource-timeline__priority-dot resource-timeline__priority-dot--${priority}`}
                            />
                          )}
                          <span className="resource-timeline__block-name">
                            {tier === 'narrow' ? getFirstName(block.patientName) : block.patientName}
                          </span>
                          {tier === 'wide' && !noShow && (
                            <span className="resource-timeline__block-type">
                              {deptName} consultation
                            </span>
                          )}
                          {(tier === 'medium' || tier === 'wide') && (
                            <span className="resource-timeline__block-time">
                              {formatTimeRange(block.start, block.end)}
                            </span>
                          )}
                          {tier === 'narrow' && (
                            <span className="resource-timeline__block-time resource-timeline__block-time--compact">
                              {formatTime(block.start)}
                            </span>
                          )}
                        </span>

                        {tier !== 'wide' && (
                          <span className="resource-timeline__block-hover" aria-hidden="true">
                            {noShow && (
                              <span className="resource-timeline__noshow-badge">No-show</span>
                            )}
                            {priority !== 'normal' && !noShow && (
                              <span
                                className={`resource-timeline__priority-dot resource-timeline__priority-dot--${priority}`}
                              />
                            )}
                            <span className="resource-timeline__block-name">{block.patientName}</span>
                            <span className="resource-timeline__block-time">
                              {formatTimeRange(block.start, block.end)}
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {stats.bookings === 0 && filteredDoctors.length > 0 && (
          <div className="resource-schedule__empty" role="status">
            No consultations scheduled — roster is available for booking
          </div>
        )}
      </div>

      {panelState && (
        <SchedulePanel
          key={`${panelState.doctor.id}-${panelState.startTime}-${panelState.suggestedTimes?.start || 'new'}`}
          doctor={panelState.doctor}
          startTime={panelState.suggestedTimes?.start || panelState.startTime}
          selectedDate={selectedDate}
          appointments={state.appointments}
          editingBlock={
            panelState.editingBlock
              ? {
                  ...panelState.editingBlock,
                  start: panelState.suggestedTimes?.start || panelState.editingBlock.start,
                  end: panelState.suggestedTimes?.end || panelState.editingBlock.end,
                }
              : null
          }
          validationError={validationError}
          onClose={closePanel}
          onSchedule={handleSchedule}
          onUseSuggested={(suggested) => {
            setValidationError(null);
            setAttemptedRange(null);
            setPanelState((prev) => ({ ...prev, suggestedTimes: suggested }));
          }}
          onFieldChange={() => {
            setValidationError(null);
            setAttemptedRange(null);
          }}
        />
      )}

      {popover && (
        <BookingPopover
          block={popover.block}
          doctor={popover.doctor}
          appointment={state.appointments.find((a) => a.id === popover.block.appointmentId)}
          department={getDepartmentById(
            state.appointments.find((a) => a.id === popover.block.appointmentId)?.departmentId
          )}
          position={popover.position}
          onClose={() => {
            setPopover(null);
            setSelectedBlockId(null);
          }}
          onView={() => {
            viewAppointment(popover.block.appointmentId);
            setPopover(null);
          }}
          onEdit={() => {
            setPopover(null);
            openPanel(popover.doctor, popover.block.start, popover.block);
          }}
          onDelete={() => {
            dispatch({
              type: ACTION_TYPES.DELETE_SCHEDULE_BLOCK,
              payload: {
                doctorId: popover.doctor.id,
                blockId: popover.block.id,
              },
            });
            setPopover(null);
          }}
        />
      )}
    </div>
  );
}
