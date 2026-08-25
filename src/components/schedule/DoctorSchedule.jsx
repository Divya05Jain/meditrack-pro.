import { ScheduleGrid } from './ScheduleGrid';

export function DoctorSchedule({
  selectedDate,
  requestOpenPanel,
  onPanelOpened,
}) {
  return (
    <div className="doctor-schedule-page">
      <ScheduleGrid
        selectedDate={selectedDate}
        requestOpenPanel={requestOpenPanel}
        onPanelOpened={onPanelOpened}
      />
    </div>
  );
}
