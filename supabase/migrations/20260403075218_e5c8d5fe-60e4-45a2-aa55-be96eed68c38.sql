
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS program text,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS school_institute text,
  ADD COLUMN IF NOT EXISTS batch text;
