ALTER TABLE public.students ADD COLUMN IF NOT EXISTS luxand_person_uuid TEXT;
CREATE INDEX IF NOT EXISTS idx_students_luxand_uuid ON public.students(luxand_person_uuid);