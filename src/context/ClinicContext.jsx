import { createContext, useContext, useReducer } from 'react';
import { clinicReducer } from '../reducers/clinicReducer';
import { initialClinicState } from '../data/mockData';

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const [state, dispatch] = useReducer(clinicReducer, initialClinicState);

  return (
    <ClinicContext.Provider value={{ state, dispatch }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinicContext must be used within ClinicProvider');
  }
  return context;
}
