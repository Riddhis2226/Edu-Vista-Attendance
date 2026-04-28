## Goal

Replace the stubbed face features with real face recognition powered by **Luxand Cloud**:
- Admin enrolls each student's face (one photo, upload or webcam)
- Faculty uploads classroom photo(s) → system detects all faces, matches them to enrolled students, marks present/absent

## What you need to provide

1. Sign up at https://dashboard.luxand.cloud/ (free tier = 500 calls/month)
2. Copy your **API token** from the dashboard
3. I'll prompt you to paste it as a secret called `LUXAND_API_TOKEN` — it stays server-side only

## Database changes

One migration on the `students` table:
- Add `luxand_person_uuid TEXT` — stores Luxand's person ID returned at enrollment. Nullable. Used later to identify matches in classroom photos.

Existing `face_enrolled` (bool) and `face_image_url` (text) columns are kept — `face_enrolled` flips to `true` after successful enrollment, `face_image_url` stores the photo we uploaded to the existing `face-images` storage bucket so admins can see who's enrolled.

## Backend: two new edge functions

Both are JWT-verified (admin/faculty only), validate input with Zod, and use `LUXAND_API_TOKEN` from secrets.

### `luxand-enroll`
- Input: `{ student_id, image_base64 }`
- Uploads image to `face-images` bucket → gets a public URL
- Calls `POST https://api.luxand.cloud/v2/person` with the student's name + photo URL
- On success: updates `students` row with `luxand_person_uuid`, `face_enrolled = true`, `face_image_url`
- Returns `{ success, person_uuid }`
- Handles Luxand errors: "no face detected", "multiple faces", quota exceeded → returns clean 400 with message

### `luxand-recognize`
- Input: `{ batch, image_base64_list[] }`
- For each image: calls `POST https://api.luxand.cloud/photo/search/v2` (multi-face search against your collection)
- Aggregates matched `person_uuid`s across all photos, dedupes
- Loads all students for the batch, joins matches by `luxand_person_uuid`
- Returns `{ results: [{ student_id, enrollment_no, student_name, status: 'present'|'absent', confidence }] }` — students not matched in any photo = absent

## Frontend changes

### `src/pages/admin/FaceEnrollment.tsx`
- Re-wire `handleEnroll`: convert preview to base64, call `supabase.functions.invoke('luxand-enroll', ...)`, show success/failure, refresh student list
- Show specific error messages from Luxand (e.g. "No face detected — please retake")

### `src/pages/faculty/UploadPhoto.tsx`
- Re-wire `startRecognition`: convert all selected photos to base64, call `supabase.functions.invoke('luxand-recognize', ...)`
- Drive the existing 5-step `StepProgress` from real phases (upload → API call → results)
- Render the returned results in the existing results table (no UI rebuild needed)
- `saveAttendance` already works — keep as-is

### Landing page text
Update the small "AI Engine" / "Isolated Recognition Service" labels in `HeroSection`, `TechnologySection`, `SecuritySection`, `HowItWorksSection`, `DemoWalkthroughModal` to reference "Luxand Cloud face recognition" so the marketing copy matches reality.

## Files touched

```text
NEW  supabase/migrations/<ts>_add_luxand_person_uuid.sql
NEW  supabase/functions/luxand-enroll/index.ts
NEW  supabase/functions/luxand-recognize/index.ts
EDIT src/pages/admin/FaceEnrollment.tsx        (wire handleEnroll)
EDIT src/pages/faculty/UploadPhoto.tsx         (wire startRecognition)
EDIT src/components/landing/*.tsx              (text only — Luxand branding)
```

## Out of scope (ask later if you want them)

- Removing a student's face from Luxand when deleted (can add a `luxand-delete` function later)
- Re-enrollment with multiple photos per student for higher accuracy (Luxand supports it; we'll start with one)
- Quota usage dashboard

## Order of operations once you approve

1. Ask you for the `LUXAND_API_TOKEN` secret — **stop and wait until you provide it**
2. Run the DB migration
3. Create the two edge functions (auto-deployed)
4. Update the two pages + landing text
5. You test enrollment on one student, then a classroom photo
