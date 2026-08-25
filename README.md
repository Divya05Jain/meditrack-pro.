# MediTrack Pro

**Clinic & Appointment Workflow Dashboard**

A high-density React frontend application designed for multi-specialty clinic operations. MediTrack Pro allows front-desk teams and clinic managers to coordinate patient consultations, manage clinical workflow stages, assign medical staff, schedule doctors, detect scheduling conflicts, prioritize patient queues, and maintain a reactive operational audit history.

## Live Demo

https://meditrack-pro-two.vercel.app/

## Repository

https://github.com/Divya05Jain/MediTrack-Pro

---

## Overview

This application was built as a frontend technical assessment focused on:

- state architecture and predictable mutations
- operational clinical workflows
- scheduling validation (overlap and roster boundaries)
- drag-and-drop data integrity
- reusable React components
- professional responsive UI for laptop/desktop environments
- in-memory audit tracking

---

## Core Features

### 1. Patient Appointment Workflow

- Create and edit master patient appointments
- Select urgency: **Normal**, **Urgent**, **Critical**
- Select department and assigning doctor
- Capture visit reason
- Configure clinical workflow steps at creation time

### 2. Consultation Sub-Task Engine

Clinical visits decompose into specialized steps:

- Initial Triage
- Doctor Consultation
- Lab Diagnostics
- Pharmacy Dispensing

Each step can be assigned independently:

| Step | Typical staff |
|------|----------------|
| Initial Triage | Nurse |
| Doctor Consultation | Doctor |
| Lab Diagnostics | Lab technician |
| Pharmacy Dispensing | Pharmacist |

### 3. Clinical Operations Board

Six workflow stages:

**Waiting → Triage → Consultation → Diagnostics → Pharmacy → Completed**

Capabilities:

- Search and filter by patient, department, and priority
- Drag appointments between workflow stages
- Reorder within a stage
- Automatic subtask synchronization on stage moves

### 4. Drag-and-Drop Sequence Integrity

Queue ordering is stored in local operational state. After every cross-column move or same-column reorder:

- source column sequences are normalized
- destination column sequences are normalized
- sequence values remain contiguous
- no appointment is duplicated or lost

### 5. Doctor Scheduling

- Daily doctor resource timeline
- Shift visualization (on-shift vs off-shift)
- Date navigation with per-day booking filter
- Duration-based booking blocks
- Specialty filter
- Schedule consultation side panel

### 6. Scheduling Conflict Detection

Overlap rule:

```js
newStart < existingEnd && newEnd > existingStart
```

This detects overlapping intervals while allowing adjacent appointments.

| Existing | Attempt | Result |
|----------|---------|--------|
| 10:30–11:00 | 10:45–11:15 | Rejected |
| 10:30–11:00 | 11:00–11:30 | Allowed (adjacent) |

The UI highlights the conflicting booking, overlays the attempted range, and suggests the next available slot.

### 7. Roster / Shift Validation

A consultation must start at or after the doctor's shift start and end at or before the shift end.

Example — Dr. Sana Khan, roster `10:00–18:00`:

| Attempt | Result |
|---------|--------|
| 09:00–09:30 | Rejected — outside roster |
| 10:00–10:30 | Allowed |

The schedule drawer shows a contextual blocker and suggested valid time.

### 8. Operational Audit Feed

Meaningful state-changing actions generate structured session audit events:

- appointment created / updated / deleted
- appointment moved / reordered
- staff assigned
- subtask updated
- doctor scheduled / updated / removed

Events appear newest-first in the Activity drawer.

---

## Technical Stack

- React 19
- Vite 6
- JavaScript (ES modules)
- React Context + `useReducer`
- Custom React hooks
- Standard CSS (design tokens, no UI framework)
- Native HTML5 Drag and Drop

---

## Architecture

### State Management

React Context + `useReducer` centralizes operational state transitions.

Benefits:

- predictable, immutable updates
- centralized audit logging
- shared state across board, scheduler, and drawers

### Custom Hooks

- `useClinic` — state, dispatch, selected appointment, entity lookups
- `useAppointmentFilters` — board search/department/priority filtering

### Pure Utilities

| Module | Responsibility |
|--------|----------------|
| `scheduling.js` | Overlap detection, shift validation, slot suggestions |
| `sequence.js` | Column move/reorder and sequence normalization |
| `workflow.js` | Subtask sync on status transitions |
| `audit.js` | Structured activity entry creation |
| `formatters.js` | Time, date, and display formatting |
| `ids.js` | ID generation for appointments and schedule blocks |

---

## Project Structure

```text
src/
├── components/
│   ├── activity/       ActivityDrawer
│   ├── appointments/   AppointmentDrawer, AppointmentModal
│   ├── board/          ClinicalBoard, BoardColumn, AppointmentCard
│   ├── common/         Badge, EmptyState, Avatar
│   ├── layout/         Sidebar, Topbar
│   └── schedule/       ScheduleGrid, SchedulePanel, BookingPopover
├── context/            ClinicProvider (state + toast feedback)
├── data/               mockData.js (initial state)
├── hooks/              useClinic, useAppointmentFilters
├── reducers/           clinicReducer.js
├── styles/             globals, layout, board, components, schedule
├── utils/              scheduling, sequence, workflow, audit, formatters
├── App.jsx
└── main.jsx
```

---

## Key Engineering Decisions

### Why `useReducer`?

The application has many related operational mutations — appointment CRUD, workflow movement, scheduling, staff assignment, and audit events. `useReducer` keeps these transitions centralized instead of spreading dependent state across many independent `useState` calls.

### Why Pure Scheduling Utilities?

Scheduling rules live outside presentation components so overlap and roster validation remain deterministic, testable, and independently understandable.

### Why Native Drag and Drop?

The assessment targets desktop/laptop operational usage under a strict time constraint. Native HTML5 drag-and-drop avoids a large dependency while meeting the requirement.

### Why In-Memory State?

The assessment focuses on frontend interaction and state management. No backend was required, so operational session data intentionally remains in React memory.

---

## Responsive Design

Optimized for laptop and desktop environments:

| Viewport | Support |
|----------|---------|
| 1024×768 | Functional — icon sidebar, horizontal board scroll |
| 1152×720 | Compact sidebar rail |
| 1280×720 / 1280×800 | Primary laptop targets |
| 1366×768 | Primary laptop target |
| 1440×900 | Full layout |
| 1536×864 / 1600×900 / 1920×1080 | Full layout with comfortable spacing |

Features:

- Responsive sidebar (full → compact → icon rail)
- Horizontal board scrolling with edge fade
- Sticky schedule doctor column
- Viewport-aware drawers and modals (`max-height: calc(100dvh - 32px)`)

Mobile optimization was outside assessment scope.

---

## Accessibility

- Semantic `<button>` elements for interactive controls
- Form labels associated with inputs
- `aria-label` on icon-only actions
- Visible keyboard focus styles (`:focus-visible`)
- `Escape` closes drawers and modals
- Priority indicated by badge text, not color alone
- `aria-live` toast region for action feedback

---

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone https://github.com/Divya05Jain/MediTrack-Pro.git
cd MediTrack-Pro
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Manual Testing Guide

### Test 1 — Create Appointment

1. Open **Clinical Board**
2. Click **+ New Appointment**
3. Enter patient data, department, priority, and workflow
4. Click **Create Appointment**

**Expected:** Appointment appears in Waiting; Activity and toast update.

### Test 2 — Edit Appointment

1. Click an appointment card
2. Click **Edit** in the drawer
3. Change priority and reason
4. Click **Save Changes**

**Expected:** Board and drawer reflect changes; appointment ID unchanged; audit event logged.

### Test 3 — Drag Between Workflow Stages

1. Drag an appointment from Waiting to Triage or Consultation

**Expected:** Status changes, sequences normalize, subtasks sync, audit event appears.

### Test 4 — Same-Column Reordering

Reorder patients within one stage.

**Expected:** Order changes; sequence indexes remain valid.

### Test 5 — Scheduling Overlap

**Doctor:** Dr. Meera Kapoor  
**Existing:** 10:30–11:00 (Aarav Sharma)

1. Open **Doctor Schedule**
2. Click **+ Schedule Consultation**
3. Select Dr. Meera Kapoor
4. Attempt **10:45–11:15**

**Expected:** Rejected; conflicting booking highlighted; requested range overlaid; drawer shows conflict with suggested **11:00–11:30**; schedule unchanged.

### Test 6 — Adjacent Appointment

**Existing:** 10:30–11:00  
**Attempt:** 11:00–11:30

**Expected:** Accepted.

### Test 7 — Outside Shift

**Doctor:** Dr. Sana Khan  
**Roster:** 10:00–18:00  
**Attempt:** 09:00–09:30

**Expected:** Rejected; outside-roster explanation; attempted range highlighted; **10:00–10:30** suggested.

### Test 8 — Activity Feed

Perform create, edit, move, assign, and schedule actions. Open **Activity**.

**Expected:** Newest structured events appear first.

---

## Trade-offs / Scope Decisions

- **Session-only data** — Backend persistence was outside assessment scope; all state is intentionally in-memory.
- **Daily schedule view** — Scheduler focuses on single-day operational planning rather than a full multi-day calendar.
- **Native drag-and-drop** — Prioritized for laptop/desktop clinic operations interfaces under the assessment timebox.
- **Manual test documentation** — Automated test suite was deprioritized; critical workflows are documented through reproducible manual scenarios above.

---

## Future Enhancements

- Backend persistence and API integration
- Authentication and role-based permissions
- Multi-day calendar scheduling
- Automated test suite (unit + integration)
- Real-time multi-user updates

---

## Author

**Divya Jain**  
Frontend Developer
