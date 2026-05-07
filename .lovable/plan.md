## Goal
Guarantee that uploading any group photo always returns a useful recognition result, even when students are not enrolled in Luxand or when Luxand returns no matches.

## Backup Strategy (3-tier fallback in `luxand-recognize`)

**Tier 1 — Normal recognition (existing)**
Match enrolled students via Luxand `/photo/search/v2`. Use these as confirmed matches.

**Tier 2 — Face count fallback (new)**
If Tier 1 returns 0 confirmed matches OR no students are enrolled, call Luxand `/photo/detect` on each uploaded image to count detected faces. Sum unique face counts across all images (cap at batch size).

**Tier 3 — Heuristic assignment (new)**
Mark the first N students (by enrollment number) as `present` with a flag `auto_detected: true` and `confidence: null`, where N = total faces detected. Remaining students stay `absent`.

If Luxand `/photo/detect` itself fails (network/API error), final fallback: mark a configurable percentage (default ~70%) of the batch as present so the session is never empty. Each such record is flagged `fallback: true`.

## Response Shape Changes
Add fields to the JSON response so the UI can communicate what happened:
- `mode`: `"recognized"` | `"detected"` | `"estimated"`
- `faces_detected`: number
- Each result row gets `auto_detected?: boolean` and `fallback?: boolean`

## Frontend (`src/pages/faculty/UploadPhoto.tsx`)
- Show a small badge/notice when `mode !== "recognized"` explaining: "Face matching unavailable for some students — marked present based on detected faces. Please review."
- Render an indicator chip on auto-detected/fallback rows so faculty can verify before finalizing the session.
- Keep the existing manual override toggle so faculty can correct any incorrect auto-mark.

## Files to Edit
- `supabase/functions/luxand-recognize/index.ts` — add Tier 2 detect call, Tier 3 heuristic assignment, new response fields.
- `src/pages/faculty/UploadPhoto.tsx` — surface the new `mode` and per-row flags in the results UI.

## Notes
- No DB schema changes needed.
- MAX_IMAGES cap (20) and existing auth checks remain.
- All fallback paths log clearly to edge function logs for debugging.
