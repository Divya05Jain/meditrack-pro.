import { useState } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ClinicalBoard } from './components/board/ClinicalBoard';
import { DoctorSchedule } from './components/schedule/DoctorSchedule';
import { AppointmentDrawer } from './components/appointments/AppointmentDrawer';
import { ActivityDrawer } from './components/activity/ActivityDrawer';
import { NewAppointmentModal } from './components/appointments/NewAppointmentModal';
import { useClinic } from './hooks/useClinic';

import './styles/globals.css';
import './styles/layout.css';
import './styles/board.css';
import './styles/components.css';
import './styles/schedule.css';

function AppContent() {
  const { state } = useClinic();
  const [searchValue, setSearchValue] = useState('');
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar />
      <div className="app__main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNewAppointment={() => setIsNewAppointmentOpen(true)}
        />
        <main className="app__content">
          {state.activeView === 'board' ? (
            <ClinicalBoard
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          ) : (
            <DoctorSchedule />
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
