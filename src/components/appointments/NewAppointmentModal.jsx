import { useEffect, useMemo, useState } from 'react';
import { useClinic } from '../../hooks/useClinic';
import { ACTION_TYPES } from '../../reducers/clinicReducer';
import { SUBTASK_TYPES } from '../../data/mockData';
import { generateAppointmentId, generatePatientId } from '../../utils/ids';
import { getColumnAppointments } from '../../utils/sequence';

const GENDERS = ['Male', 'Female', 'Other'];
const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];

const DEFAULT_WORKFLOW = {
  triage: true,
  consultation: true,
  diagnostics: false,
  pharmacy: false,
};

function workflowFromSubtasks(subtasks) {
  const steps = { ...DEFAULT_WORKFLOW };
  subtasks.forEach((st) => {
    steps[st.type] = true;
  });
  return steps;
}

function buildSubtasks(appointmentId, enabledSteps, doctorId) {
  return SUBTASK_TYPES.filter(({ type }) => enabledSteps[type]).map(
    ({ type, title }) => ({
      id: `${appointmentId}-ST-${type}`,
      type,
      title,
      status: 'pending',
      staffId: type === 'consultation' ? doctorId : null,
    })
  );
}

function mergeSubtasks(existing, enabledSteps, doctorId, appointmentId) {
  return SUBTASK_TYPES.filter(({ type }) => enabledSteps[type]).map(
    ({ type, title }) => {
      const found = existing.find((st) => st.type === type);
      if (found) {
        return type === 'consultation' && doctorId
          ? { ...found, staffId: doctorId }
          : found;
      }
      return {
        id: `${appointmentId}-ST-${type}`,
        type,
        title,
        status: 'pending',
        staffId: type === 'consultation' ? doctorId : null,
      };
    }
  );
}

const EMPTY_FORM = {
  patientName: '',
  age: '',
  gender: 'Male',
  appointmentTime: '',
  departmentId: '',
  priority: 'normal',
  reason: '',
  doctorId: '',
};

export function AppointmentModal({ isOpen, onClose, editAppointmentId = null }) {
  const { state, dispatch } = useClinic();
  const isEdit = Boolean(editAppointmentId);
  const existing = useMemo(
    () => state.appointments.find((a) => a.id === editAppointmentId),
    [state.appointments, editAppointmentId]
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [workflowSteps, setWorkflowSteps] = useState({ ...DEFAULT_WORKFLOW });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && existing) {
      setForm({
        patientName: existing.patient.name,
        age: String(existing.patient.age),
        gender: existing.patient.gender,
        appointmentTime: existing.appointmentTime,
        departmentId: existing.departmentId,
        priority: existing.priority,
        reason: existing.reason,
        doctorId: existing.doctorId || '',
      });
      setWorkflowSteps(workflowFromSubtasks(existing.subtasks));
    } else if (!isEdit) {
      setForm(EMPTY_FORM);
      setWorkflowSteps({ ...DEFAULT_WORKFLOW });
    }
    setErrors({});
  }, [isOpen, isEdit, existing]);

  const filteredDoctors = useMemo(
    () =>
      form.departmentId
        ? state.doctors.filter((doc) => doc.departmentId === form.departmentId)
        : state.doctors,
    [state.doctors, form.departmentId]
  );

  if (!isOpen) return null;
  if (isEdit && !existing) return null;

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'departmentId') {
        const stillValid = state.doctors.some(
          (doc) => doc.id === prev.doctorId && doc.departmentId === value
        );
        if (!stillValid) next.doctorId = '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleWorkflow = (type) => {
    if (type === 'triage' || type === 'consultation') return;
    setWorkflowSteps((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.patientName.trim()) nextErrors.patientName = 'Required';
    if (!form.age || Number(form.age) <= 0) nextErrors.age = 'Valid age required';
    if (!form.appointmentTime) nextErrors.appointmentTime = 'Required';
    if (!form.departmentId) nextErrors.departmentId = 'Required';
    if (!form.priority) nextErrors.priority = 'Required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setWorkflowSteps({ ...DEFAULT_WORKFLOW });
    setErrors({});
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const doctorId = form.doctorId || filteredDoctors[0]?.id || null;

    if (isEdit) {
      dispatch({
        type: ACTION_TYPES.UPDATE_APPOINTMENT,
        payload: {
          id: editAppointmentId,
          updates: {
            patient: {
              ...existing.patient,
              name: form.patientName.trim(),
              age: Number(form.age),
              gender: form.gender,
            },
            appointmentTime: form.appointmentTime,
            departmentId: form.departmentId,
            priority: form.priority,
            doctorId,
            reason: form.reason.trim() || 'General consultation',
            subtasks: mergeSubtasks(
              existing.subtasks,
              workflowSteps,
              doctorId,
              editAppointmentId
            ),
          },
          activityMessage: `${form.patientName.trim()} appointment updated — ${editAppointmentId}`,
          activityType: 'appointment_updated',
        },
      });
    } else {
      const appointmentId = generateAppointmentId(state.appointments);
      const patientId = generatePatientId(state.appointments);
      const waitingColumn = getColumnAppointments(state.appointments, 'waiting');
      const sequence = waitingColumn.length + 1;

      const appointment = {
        id: appointmentId,
        patient: {
          id: patientId,
          name: form.patientName.trim(),
          age: Number(form.age),
          gender: form.gender,
        },
        appointmentTime: form.appointmentTime,
        departmentId: form.departmentId,
        priority: form.priority,
        status: 'waiting',
        doctorId,
        sequence,
        reason: form.reason.trim() || 'General consultation',
        createdAt: new Date().toISOString(),
        subtasks: buildSubtasks(appointmentId, workflowSteps, doctorId),
      };

      dispatch({ type: ACTION_TYPES.CREATE_APPOINTMENT, payload: { appointment } });
    }

    resetAndClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) resetAndClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="appointment-modal-title">
              {isEdit ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            <p className="modal__subtitle">
              {isEdit
                ? `${editAppointmentId} — update visit details`
                : 'Register a patient visit'}
            </p>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={resetAndClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__body">
            <section className="modal__section">
              <h3 className="modal__section-title">Patient Details</h3>
              <div className="modal__grid">
                <div className="form-field">
                  <label htmlFor="patientName">
                    Patient Name <span className="form-field__req">*</span>
                  </label>
                  <input
                    id="patientName"
                    value={form.patientName}
                    onChange={(e) => updateField('patientName', e.target.value)}
                    className={errors.patientName ? 'form-field--error' : ''}
                  />
                  {errors.patientName && (
                    <span className="form-field__error">{errors.patientName}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="age">
                    Age <span className="form-field__req">*</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="0"
                    value={form.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className={errors.age ? 'form-field--error' : ''}
                  />
                  {errors.age && (
                    <span className="form-field__error">{errors.age}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="appointmentTime">
                    Appointment Time <span className="form-field__req">*</span>
                  </label>
                  <input
                    id="appointmentTime"
                    type="time"
                    value={form.appointmentTime}
                    onChange={(e) => updateField('appointmentTime', e.target.value)}
                    className={errors.appointmentTime ? 'form-field--error' : ''}
                  />
                  {errors.appointmentTime && (
                    <span className="form-field__error">{errors.appointmentTime}</span>
                  )}
                </div>
              </div>
            </section>

            <section className="modal__section">
              <h3 className="modal__section-title">Clinical Details</h3>
              <div className="modal__grid">
                <div className="form-field">
                  <label htmlFor="departmentId">
                    Department <span className="form-field__req">*</span>
                  </label>
                  <select
                    id="departmentId"
                    value={form.departmentId}
                    onChange={(e) => updateField('departmentId', e.target.value)}
                    className={errors.departmentId ? 'form-field--error' : ''}
                  >
                    <option value="">Select department</option>
                    {state.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <span className="form-field__error">{errors.departmentId}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="priority">
                    Priority <span className="form-field__req">*</span>
                  </label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field form-field--full">
                  <label htmlFor="doctorId">Doctor</label>
                  <select
                    id="doctorId"
                    value={form.doctorId}
                    onChange={(e) => updateField('doctorId', e.target.value)}
                  >
                    <option value="">Select doctor</option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field form-field--full">
                  <label htmlFor="reason">Reason for Visit</label>
                  <textarea
                    id="reason"
                    rows={2}
                    value={form.reason}
                    onChange={(e) => updateField('reason', e.target.value)}
                    placeholder="Chief complaint or visit reason"
                  />
                </div>
              </div>
            </section>

            <section className="modal__section">
              <h3 className="modal__section-title">Visit Workflow</h3>
              <div className="workflow-checkboxes workflow-checkboxes--modal">
                {SUBTASK_TYPES.map(({ type, title }) => {
                  const required = type === 'triage' || type === 'consultation';
                  const checked = workflowSteps[type];
                  return (
                    <label
                      key={type}
                      className={`workflow-checkbox workflow-checkbox--modal ${
                        checked ? 'workflow-checkbox--checked' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={required}
                        onChange={() => toggleWorkflow(type)}
                      />
                      <span className="workflow-checkbox__mark">
                        {checked ? '✓' : '○'}
                      </span>
                      <span className="workflow-checkbox__text">
                        {title}
                        {required && (
                          <em className="workflow-checkbox__note"> required</em>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Save Changes' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** @deprecated Use AppointmentModal */
export const NewAppointmentModal = AppointmentModal;
