-- Create lecture_targets table
CREATE TABLE public.lecture_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  faculty_id UUID NOT NULL,
  faculty_name TEXT,
  batch TEXT NOT NULL,
  semester TEXT NOT NULL,
  total_lectures INTEGER NOT NULL CHECK (total_lectures BETWEEN 1 AND 200),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate targets
CREATE UNIQUE INDEX idx_lecture_targets_unique
  ON public.lecture_targets (subject, batch, semester);

CREATE INDEX idx_lecture_targets_faculty ON public.lecture_targets (faculty_id);

-- Enable RLS
ALTER TABLE public.lecture_targets ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins full access lecture_targets"
ON public.lecture_targets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Faculty: read all
CREATE POLICY "Faculty read lecture_targets"
ON public.lecture_targets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'faculty'));

-- Faculty: insert own
CREATE POLICY "Faculty insert own lecture_targets"
ON public.lecture_targets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'faculty') AND faculty_id = auth.uid());

-- Faculty: update own
CREATE POLICY "Faculty update own lecture_targets"
ON public.lecture_targets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'faculty') AND faculty_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'faculty') AND faculty_id = auth.uid());

-- Updated_at trigger function (reuse pattern)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lecture_targets_updated_at
BEFORE UPDATE ON public.lecture_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Computed view: student_attendance_summary
-- Joins records → sessions → students (for batch/semester) and LEFT JOIN lecture_targets
CREATE OR REPLACE VIEW public.student_attendance_summary
WITH (security_invoker = true)
AS
WITH session_student AS (
  SELECT
    ar.student_id,
    ar.enrollment_no,
    ar.student_name,
    ar.session_id,
    ar.status,
    s.subject,
    s.faculty_id,
    s.faculty_name,
    s.date,
    st.batch,
    st.semester
  FROM public.attendance_records ar
  JOIN public.attendance_sessions s ON s.id = ar.session_id
  LEFT JOIN public.students st ON st.id = ar.student_id
),
agg AS (
  SELECT
    student_id,
    enrollment_no,
    MAX(student_name) AS student_name,
    subject,
    batch,
    semester,
    MAX(faculty_name) AS faculty_name,
    COUNT(DISTINCT session_id) AS lectures_held,
    COUNT(*) FILTER (WHERE status = 'present') AS lectures_attended
  FROM session_student
  GROUP BY student_id, enrollment_no, subject, batch, semester
)
SELECT
  a.student_id,
  a.enrollment_no,
  a.student_name,
  a.subject,
  a.batch,
  a.semester,
  COALESCE(lt.faculty_name, a.faculty_name) AS faculty_name,
  lt.id AS lecture_target_id,
  COALESCE(lt.total_lectures, 0) AS total_lectures,
  a.lectures_held,
  a.lectures_attended,
  CASE WHEN a.lectures_held > 0
    THEN ROUND((a.lectures_attended::numeric / a.lectures_held) * 100, 2)
    ELSE 0
  END AS attendance_percentage,
  CASE WHEN a.lectures_held > 0
    THEN (a.lectures_attended::numeric / a.lectures_held) < 0.75
    ELSE false
  END AS is_below_threshold,
  CASE
    WHEN a.lectures_held = 0 THEN 0
    WHEN (a.lectures_attended::numeric / a.lectures_held) >= 0.75 THEN 0
    ELSE GREATEST(0, CEIL((0.75 * a.lectures_held - a.lectures_attended) / 0.25))::integer
  END AS lectures_needed,
  GREATEST(0, COALESCE(lt.total_lectures, 0) - a.lectures_held) AS lectures_remaining,
  CASE
    WHEN COALESCE(lt.total_lectures, 0) = 0 THEN true
    ELSE ((a.lectures_attended + GREATEST(0, lt.total_lectures - a.lectures_held))::numeric / lt.total_lectures) >= 0.75
  END AS can_recover
FROM agg a
LEFT JOIN public.lecture_targets lt
  ON lt.subject = a.subject
 AND lt.batch = a.batch
 AND lt.semester = a.semester;

GRANT SELECT ON public.student_attendance_summary TO authenticated;