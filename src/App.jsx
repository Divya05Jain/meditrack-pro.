import { useState, useEffect, useMemo } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ClinicalBoard } from './components/board/ClinicalBoard';
import { DoctorSchedule } from './components/schedule/DoctorSchedule';
import { AppointmentDrawer } from './components/appointments/AppointmentDrawer';
import { ActivityDrawer } from './components/activity/ActivityDrawer';
import { AppointmentModal } from './components/appointments/NewAppointmentModal';
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
  const [appointmentModal, setAppointmentModal] = useState({ open: false, editId: null });
  const [scheduleDate, setScheduleDate] = useState(getClinicNow());
  const [requestSchedulePanel, setRequestSchedulePanel] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const specialties = useMemo(
    () => [...new Set(state.doctors.map((d) => d.specialty))].sort(),
    [state.doctors]
  );

  const openCreateModal = () => setAppointmentModal({ open: true, editId: null });
  const openEditModal = (id) => setAppointmentModal({ open: true, editId: id });
  const closeModal = () => setAppointmentModal({ open: false, editId: null });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (appointmentModal.open) {
        closeModal();
      } else if (state.selectedAppointmentId) {
        dispatch({ type: ACTION_TYPES.CLOSE_APPOINTMENT });
      } else if (state.isActivityOpen) {
        dispatch({ type: ACTION_TYPES.TOGGLE_ACTIVITY, payload: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appointmentModal.open, state.selectedAppointmentId, state.isActivityOpen, dispatch]);

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="app__main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNewAppointment={openCreateModal}
          scheduleDate={scheduleDate}
          onScheduleDateChange={setScheduleDate}
          onOpenSchedulePanel={() => setRequestSchedulePanel(true)}
          specialtyFilter={specialtyFilter}
          onSpecialtyFilterChange={setSpecialtyFilter}
          specialties={specialties}
        />
        <main className="app__content">
          <div key={state.activeView} className="app__view">
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
          </div>
        </main>
      </div>

      <AppointmentDrawer onEdit={openEditModal} />
      <ActivityDrawer />
      <AppointmentModal
        isOpen={appointmentModal.open}
        editAppointmentId={appointmentModal.editId}
        onClose={closeModal}
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
