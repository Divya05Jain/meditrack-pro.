import { ScheduleGrid } from './ScheduleGrid';

export function DoctorSchedule({
  selectedDate,
  requestOpenPanel,
  onPanelOpened,
  specialtyFilter,
}) {
  return (
    <div className="doctor-schedule-page">
      <ScheduleGrid
        selectedDate={selectedDate}
        requestOpenPanel={requestOpenPanel}
        onPanelOpened={onPanelOpened}
        specialtyFilter={specialtyFilter}
      />
    </div>
  );
}
