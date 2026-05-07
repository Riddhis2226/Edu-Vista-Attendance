-- Face audit log
CREATE TABLE public.face_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_no text,
  student_name text,
  action text NOT NULL,
  luxand_person_uuid text,
  admin_user_id uuid,
  admin_name text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.face_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read face_audit_log"
ON public.face_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_face_audit_log_created_at ON public.face_audit_log (created_at DESC);
CREATE INDEX idx_face_audit_log_student ON public.face_audit_log (student_id);

-- Enrollment status columns on students
ALTER TABLE public.students
  ADD COLUMN enrollment_status text NOT NULL DEFAULT 'not_enrolled',
  ADD COLUMN enrollment_error text,
  ADD COLUMN enrollment_synced_at timestamptz;

UPDATE public.students
SET enrollment_status = 'synced',
    enrollment_synced_at = created_at
WHERE face_enrolled = true;

-- Realtime
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.face_audit_log;