# Luxand Admin Controls, Audit Log, Delete Flow & Status Indicators

Four related upgrades to make Luxand integration manageable, observable, and reversible from inside the app.

## 1. Admin Settings page — manage `LUXAND_API_TOKEN` + connectivity test

**New route** `/admin/settings` (sidebar entry "Settings", `Settings` icon).

The Luxand API token is a server-side secret — it must never be sent to the browser. The page therefore does not display the current value; it only lets an admin **rotate** it and **test** connectivity.

UI:
- "Luxand Cloud" card showing connection status pill (Connected / Not configured / Error) plus last-tested timestamp.
- "Test connection" button → calls a new edge function `luxand-status` which performs a cheap auth-checked call to Luxand (`GET /v2/person?limit=1`) and returns `{ ok, message, person_count }`.
- "Update API token" form (password input + confirm). Submitting calls a new edge function `luxand-set-token` which validates the token against Luxand first, then writes it to the project secret store. If validation fails, the existing token is preserved and the user sees the Luxand error message.

Both functions are admin-only (JWT + `has_role(uid,'admin')`).

Note for the user: rotating the secret from inside the app uses the Lovable Cloud secrets API server-side; if that proves unavailable in this environment we fall back to instructing the admin to update `LUXAND_API_TOKEN` in Cloud → Secrets, and the page still does the validation + status display.

## 2. Audit log for face enrollment / removal

**New table** `face_audit_log`:

```text
id              uuid pk
student_id      uuid
enrollment_no   text
student_name    text
action          text  -- 'enroll' | 'remove' | 'enroll_failed' | 'remove_failed'
luxand_person_uuid text null
admin_user_id   uuid
admin_name      text
error_message   text null
created_at      timestamptz default now()
```

RLS: admin-only SELECT/INSERT. Inserts happen only from edge functions using the service role, so RLS just blocks any direct client access.

**Writers:** `luxand-enroll`, the new `luxand-delete-face`, and the student-delete flow all write one row per attempt (success or failure, with the Luxand error string captured).

**New route** `/admin/audit-log` — paginated table (date, admin, student + enrollment no, action, person_uuid, error). Filter by action / date range / search. Sidebar entry "Audit Log" (`History` icon).

## 3. Luxand delete flow on student deletion + face removal

**New edge function** `luxand-delete-face`:
- Input `{ student_id }`, admin-only.
- Reads the student's `luxand_person_uuid` and `face_image_url` (storage path).
- Calls `DELETE https://api.luxand.cloud/v2/person/{uuid}`.
- Removes the file from the `face-images` bucket.
- Clears `luxand_person_uuid`, sets `face_enrolled=false`, `face_image_url=null`, `enrollment_status='not_enrolled'`, `enrollment_error=null` on the student row.
- Writes a `remove` (or `remove_failed`) row to `face_audit_log`.
- Returns `{ success }`.

**Wiring:**
- `FaceEnrollment.tsx` — add a "Remove face" action on each enrolled student that calls `luxand-delete-face`.
- `StudentManagement.tsx` — when admin deletes a student, if `luxand_person_uuid` is set, call `luxand-delete-face` first; then delete the student row. If Luxand returns "person not found" we treat it as success and proceed.

A `students` row delete that happens via SQL (bulk) won't trigger Luxand cleanup — flag this clearly in the delete confirmation dialog so admins know to use the UI flow.

## 4. Real-time per-student enrollment status

**Schema additions on `students`:**
```text
enrollment_status   text default 'not_enrolled'   -- 'not_enrolled' | 'pending' | 'synced' | 'failed'
enrollment_error    text null
enrollment_synced_at timestamptz null
```

Backfill: rows with `face_enrolled=true` → `synced` (using `created_at` as `enrollment_synced_at`).

**`luxand-enroll` updates:**
- On entry: set status `pending`, clear error.
- On Luxand success: status `synced`, `enrollment_synced_at = now()`, error null.
- On failure: status `failed`, `enrollment_error` = Luxand's message; do NOT flip `face_enrolled`.

Audit-log row written either way.

**UI:**
- Status column on `FaceEnrollment.tsx` and `StudentManagement.tsx` rendering a colored pill: green Synced, amber Pending (spinner), red Failed (with tooltip showing `enrollment_error`), grey Not enrolled. Failed rows get a "Retry" button that re-opens the enrollment modal.
- Subscribe via `supabase.channel('students-enrollment').on('postgres_changes', { event:'UPDATE', schema:'public', table:'students' })` so status flips live as the edge function progresses or other admins act.
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.students;` and `ALTER TABLE public.students REPLICA IDENTITY FULL;`.

## Files touched

```text
NEW  supabase/migrations/<ts>_face_audit_and_status.sql
NEW  supabase/functions/luxand-status/index.ts
NEW  supabase/functions/luxand-set-token/index.ts
NEW  supabase/functions/luxand-delete-face/index.ts
EDIT supabase/functions/luxand-enroll/index.ts        (status updates + audit log)
NEW  src/pages/admin/Settings.tsx
NEW  src/pages/admin/AuditLog.tsx
EDIT src/pages/admin/FaceEnrollment.tsx               (status pill, remove, retry, realtime)
EDIT src/pages/admin/StudentManagement.tsx            (status column, delete flow calls luxand-delete-face)
EDIT src/layouts/AdminLayout.tsx                      (Settings + Audit Log nav items)
EDIT src/App.tsx                                      (two new admin routes)
```

## Out of scope
- Bulk re-sync / "reconcile with Luxand" tool.
- Per-faculty access to audit log.
- Email alerts on `failed` status.
