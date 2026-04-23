

# Lecture Target Management — Implementation Plan

A complete feature spanning database, Admin dashboard, and Faculty dashboard so admins can set total planned lectures per subject/batch and faculty can track student recovery toward the 75% threshold.

## 1. Database (Migration)

**New table `lecture_targets`**
- `id uuid PK default gen_random_uuid()`
- `subject text not null`
- `faculty_id uuid` (stores `auth.uid()` — matches existing convention in `attendance_sessions`; no FK to `user_roles.id` to stay consistent)
- `faculty_name text`
- `batch text not null`
- `semester text not null`
- `total_lectures int not null check (total_lectures between 1 and 200)`
- `created_by uuid`
- `created_at`, `updated_at` timestamps (with trigger for `updated_at`)
- Unique index on `(subject, batch, semester)` to prevent duplicates

**RLS policies**
- Admin: full ALL access via `has_role(auth.uid(),'admin')`
- Faculty SELECT: any authenticated faculty can read all targets
- Faculty INSERT/UPDATE: only when `faculty_id = auth.uid()`
- No DELETE for faculty

**Computed metrics — implemented as a SQL view `student_attendance_summary`**

The view joins `attendance_records` → `attendance_sessions` → `lecture_targets` (LEFT JOIN on subject+batch+semester derived from session) and aggregates per `(student_id, subject, batch, semester)`:
- `lectures_held` = COUNT(DISTINCT session_id) for subject/batch
- `lectures_attended` = COUNT(*) where status='present'
- `attendance_percentage` = ROUND(attended/held*100, 2)
- `is_below_threshold` = pct < 75
- `lectures_needed` = CASE when pct≥75 then 0 else CEIL((0.75*held - attended)/0.25) END
- `lectures_remaining` = total_lectures - lectures_held
- `can_recover` = (attended + remaining) / total_lectures >= 0.75

Since `attendance_sessions` has no `batch`/`semester` columns, we resolve batch/semester from `students.batch` & `students.semester` joined via `attendance_records.student_id`. Targets match on `subject + batch + semester`.

View is grant-selectable to authenticated; row visibility inherits from underlying RLS-protected tables.

## 2. Admin Dashboard

**New route** `/admin/lecture-targets` registered in `src/App.tsx`. New sidebar entry with `Target` icon (lucide) added to `adminNav` in `src/layouts/AdminLayout.tsx`.

**New page `src/pages/admin/LectureTargets.tsx`**
- Header with "+ Add Lecture Target" button (orange shimmer)
- Filter row: Semester / Batch / Subject dropdowns (populated from distinct `lecture_targets` + `attendance_sessions`), search input, Clear button
- Table columns: Subject · Faculty · Batch · Semester · Total Lectures · Lectures Held (live count) · Completion % (animated thin bar, color-coded) · Actions (Edit/Delete)
- Row hover: lift + orange left border
- Framer Motion staggered row fade-in; skeleton loader while fetching

**Add/Edit Modal** (`Dialog` with glass + backdrop blur)
- Subject autocomplete (existing subjects from sessions + targets)
- Faculty Select (from `user_roles` where role='faculty')
- Batch & Semester text inputs with suggestion datalists (pulled from `students` distinct values)
- Total Lectures number input with +/- stepper (1–200)
- Live preview line: "Students need to attend at least ⌈0.75 × N⌉ lectures…"
- Edit mode: pre-filled; warning banner if reducing below `lectures_held`
- Save → upsert with sonner success toast; Delete → confirm with shake animation

**Admin Overview enhancement** (`AdminOverview.tsx`)
- New stat card "Cannot Recover" (red, pulsing dot) — counts distinct students from `student_attendance_summary` where `can_recover=false`. Click → navigate to `/admin/attendance-logs?recovery=cannot_recover`.

**Attendance Logs enhancement** (`AttendanceLogs.tsx`)
- New "Recovery Status" Select filter: All / Safe / At Risk / Cannot Recover (reads URL param on mount)
- "Cannot Recover" rows get faint red bg
- CSV export extended with `total_lectures, lectures_held, attendance_percentage, lectures_needed, recovery_possible` columns (joined from summary view per student)

## 3. Faculty Dashboard

**Faculty Overview** (`FacultyOverview.tsx`) — new "Semester Lecture Targets" section
- Row of compact cards (one per faculty's subject/batch from `lecture_targets` where `faculty_id = auth.uid()`)
- Each card: subject (bold), batch & semester (muted), animated SVG circular ring (held/total %, color-coded green/amber/blue), centered "X / Y", "lectures conducted" label, "X lectures remaining"
- Amber placeholder card for subjects faculty has run sessions on but no target set

**Faculty Analytics** (`FacultyAnalytics.tsx`) — new top section "Attendance Recovery Tracker"
- Subtitle + filter row: Subject dropdown (faculty's subjects), Batch dropdown, "Show All / At-Risk Only" toggle
- Table fed by `student_attendance_summary` filtered to faculty's subjects:
  - Columns: Student · Enrollment · Attended/Held · Attendance % (colored pill: green ≥75 / amber 60–74 / red <60) · Status dot label · Lectures Needed (orange highlight + tooltip; "On Track ✓" if 0) · Recovery Possible (green ✓ Can Recover / red ✗ Cannot Recover with red bg + glow) · Actions (eye icon)
- Default sort by attendance % asc, animated re-sort, pulse animation on first render
- Summary bar: "X safe · Y at risk · Z cannot recover" color-coded

**Student Detail Modal** (new component `StudentDetailModal.tsx`)
- Header: name, enrollment, branch/year
- Subject/batch/semester/faculty meta
- Attendance Summary card: large animated ring + "X attended out of Y" + "Z total lectures this semester"
- Recovery Information card (3 states):
  - Safe (green): buffer = `attended - CEIL(0.75 * held)`
  - At-risk + can recover (amber): animated count-up "Needs X more consecutive lectures", explanation, mini horizontal recovery bar (current orange / needed striped / remaining muted) with 75% marker line
  - At-risk + cannot recover (red): max reachable %, formula display, condonation recommendation
- Collapsible session-by-session history table with running attendance %; absent rows have red left border

**Faculty History** (`FacultyHistory.tsx`) — Lecture context badge
- Per session row, show muted pill "Lecture X of Y" (X = sequential index of session within subject/batch ordered by date; Y = `total_lectures` from matching target). If no target: "Lecture X". Computed client-side after fetch.

## 4. Animations & Polish

- All circular rings: animate `strokeDasharray` 0→value over 1s ease-out
- Count-up component (existing `CountUp.tsx`) reused for "Lectures Needed"
- Recovery badges: one-time pulse on mount (Framer Motion `animate` keyframe)
- Mini recovery bar: `motion.div` width animation left→right
- Diagonal stripe pattern via repeating-linear-gradient + `animation: stripe-scroll 2s linear infinite` (added to `index.css`)
- "Cannot Recover" badges: `box-shadow: 0 0 8px rgba(255,77,109,0.4)`
- All modals: `Dialog` with backdrop-blur; framer scale+fade
- Skeleton loaders for tables and ring grids
- Empty state: floating illustration + "No lecture targets configured. Ask your administrator…"

## 5. Files Touched

**Created**
- Migration for `lecture_targets` + view + RLS
- `src/pages/admin/LectureTargets.tsx`
- `src/components/admin/LectureTargetModal.tsx`
- `src/components/faculty/StudentDetailModal.tsx`
- `src/components/faculty/AttendanceRing.tsx` (reusable animated ring)

**Modified**
- `src/App.tsx` (route)
- `src/layouts/AdminLayout.tsx` (sidebar item)
- `src/pages/admin/AdminOverview.tsx` (Cannot Recover stat card)
- `src/pages/admin/AttendanceLogs.tsx` (recovery filter + CSV columns)
- `src/pages/faculty/FacultyOverview.tsx` (Semester Lecture Targets section)
- `src/pages/faculty/FacultyAnalytics.tsx` (Recovery Tracker section)
- `src/pages/faculty/FacultyHistory.tsx` (Lecture X of Y badge)
- `src/index.css` (stripe animation, glow utility)

