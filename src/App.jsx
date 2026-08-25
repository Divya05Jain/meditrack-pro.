import { useState, useEffect, useMemo } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ClinicalBoard } from './components/board/ClinicalBoard';
import { DoctorSchedule } from './components/schedule/DoctorSchedule';
import { AppointmentDrawer } from './components/appointments/AppointmentDrawer';
import { ActivityDrawer } from './components/activity/ActivityDrawer';
import { NewAppointmentModal } from './components/appointments/NewAppointmentModal';
import { useClinic } from './hooks/useClinic';
import { getClinicNow } from './utils/formatters';
import { ACTION_TYPES } from './reducers/clinicReducer';

import './styles/globals.css';
import './styles/layout.css';
import './styles/board.css';
import './styles/components.css';
import './styles/schedule.css';

function AppContent() {
  const { state, dispatch } = useClinic();
  const [searchValue, setSearchValue] = useState('');
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getClinicNow());
  const [requestSchedulePanel, setRequestSchedulePanel] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const specialties = useMemo(
    () => [...new Set(state.doctors.map((d) => d.specialty))].sort(),
    [state.doctors]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (state.selectedAppointmentId) {
        dispatch({ type: ACTION_TYPES.CLOSE_APPOINTMENT });
      } else if (state.isActivityOpen) {
        dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY, payload: false });
      } else if (isNewAppointmentOpen) {
        setIsNewAppointmentOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedAppointmentId, state.isActivityOpen, isNewAppointmentOpen, dispatch]);

  return (
    <div className="app">
      <Sidebar />
      <div className="app__main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNewAppointment={() => setIsNewAppointmentOpen(true)}
          scheduleDate={scheduleDate}
          onScheduleDateChange={setScheduleDate}
          onOpenSchedulePanel={() => setRequestSchedulePanel(true)}
          specialtyFilter={specialtyFilter}
          onSpecialtyFilterChange={setSpecialtyFilter}
          specialties={specialties}
        />
        <main className="app__content">
          {state.activeView === 'board' ? (
            <ClinicalBoard
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : (
            <DoctorSchedule
              selectedDate={scheduleDate}
              requestOpenPanel={requestSchedulePanel}
              onPanelOpened={() => setRequestSchedulePanel(false)}
              specialtyFilter={specialtyFilter}
            />
          )}
        </main>
      </div>

      <AppointmentDrawer />
      <ActivityDrawer />
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}
