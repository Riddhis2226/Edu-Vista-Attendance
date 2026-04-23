-- 1. Add batch column to attendance_sessions
ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS batch text;

-- Backfill batch from students table where possible (most common batch per session)
UPDATE public.attendance_sessions s
SET batch = sub.batch
FROM (
  SELECT ar.session_id, st.batch, COUNT(*) AS c,
         ROW_NUMBER() OVER (PARTITION BY ar.session_id ORDER BY COUNT(*) DESC) AS rn
  FROM public.attendance_records ar
  JOIN public.students st ON st.id = ar.student_id
  WHERE st.batch IS NOT NULL
  GROUP BY ar.session_id, st.batch
) sub
WHERE sub.session_id = s.id AND sub.rn = 1 AND s.batch IS NULL;

-- For any remaining NULLs, set placeholder so we can enforce NOT NULL
UPDATE public.attendance_sessions SET batch = 'Unspecified' WHERE batch IS NULL;

ALTER TABLE public.attendance_sessions ALTER COLUMN batch SET NOT NULL;

-- 2 + 4. Recreate the view with NULLIF guard and semester-scoped join
DROP VIEW IF EXISTS public.student_attendance_summary;

CREATE VIEW public.student_attendance_summary
WITH (security_invoker = true)
AS
WITH session_student AS (
  SELECT
    ar.student_id,
    ar.enrollment_no,
    ar.student_name,
    ar.status,
    s.id AS session_id,
    s.subject,
    s.batch AS session_batch,
    s.faculty_name,
    st.semester AS student_semester,
    st.batch AS student_batch
  FROM public.attendance_records ar
  JOIN public.attendance_sessions s ON s.id = ar.session_id
  LEFT JOIN public.students st ON st.id = ar.student_id
),
agg AS (
  SELECT
    student_id,
    enrollment_no,
    student_name,
    subject,
    session_batch AS batch,
    student_semester AS semester,
    MAX(faculty_name) AS faculty_name,
    COUNT(DISTINCT session_id) AS lectures_held,
    COUNT(DISTINCT CASE WHEN status = 'present' THEN session_id END) AS lectures_attended
  FROM session_student
  GROUP BY student_id, enrollment_no, student_name, subject, session_batch, student_semester
)
SELECT
  a.student_id,
  a.enrollment_no,
  a.student_name,
  a.subject,
  a.batch,
  a.semester,
  a.faculty_name,
  lt.id AS lecture_target_id,
  lt.total_lectures,
  a.lectures_held,
  a.lectures_attended,
  CASE
    WHEN a.lectures_held = 0 THEN 0
    ELSE ROUND((a.lectures_attended::numeric / NULLIF(a.lectures_held, 0)::numeric) * 100, 2)
  END AS attendance_percentage,
  CASE
    WHEN a.lectures_held = 0 THEN false
    ELSE (a.lectures_attended::numeric / NULLIF(a.lectures_held, 0)::numeric) * 100 < 75
  END AS is_below_threshold,
  CASE
    WHEN a.lectures_held = 0 THEN NULL
    WHEN (a.lectures_attended::numeric / NULLIF(a.lectures_held, 0)::numeric) * 100 >= 75 THEN 0
    ELSE CEIL((0.75 * a.lectures_held - a.lectures_attended) / 0.25)::int
  END AS lectures_needed,
  CASE
    WHEN lt.total_lectures IS NULL THEN NULL
    ELSE lt.total_lectures - a.lectures_held
  END AS lectures_remaining,
  CASE
    WHEN lt.total_lectures IS NULL THEN NULL
    WHEN lt.total_lectures = 0 THEN false
    ELSE ((a.lectures_attended + GREATEST(lt.total_lectures - a.lectures_held, 0))::numeric / lt.total_lectures::numeric) >= 0.75
  END AS can_recover
FROM agg a
LEFT JOIN public.lecture_targets lt
  ON lt.subject = a.subject
 AND lt.batch = a.batch
 AND lt.semester = a.semester;

GRANT SELECT ON public.student_attendance_summary TO authenticated;