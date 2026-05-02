
-- 1) Fix self-assign admin: hardcode role to faculty in trigger (ignore client metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role, name, email)
  VALUES (
    NEW.id,
    'faculty'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Ensure the trigger is in place on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Make face-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'face-images';

-- Drop the existing storage policies on face-images and recreate them tightened
DROP POLICY IF EXISTS "Public read face images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload face images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update face images" ON storage.objects;

-- Only admins and faculty can read face images (signed URLs will be used)
CREATE POLICY "Admins and faculty read face images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-images'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'faculty'::app_role))
);

-- Only admins can upload face images
CREATE POLICY "Admins upload face images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update / overwrite face images
CREATE POLICY "Admins update face images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'face-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete face images
CREATE POLICY "Admins delete face images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3) Tighten students SELECT for faculty: only students in batches the faculty teaches
DROP POLICY IF EXISTS "Faculty read students" ON public.students;
CREATE POLICY "Faculty read students in own batches"
ON public.students FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'faculty'::app_role)
  AND batch IN (
    SELECT DISTINCT s.batch
    FROM public.attendance_sessions s
    WHERE s.faculty_id = auth.uid()
    UNION
    SELECT DISTINCT lt.batch
    FROM public.lecture_targets lt
    WHERE lt.faculty_id = auth.uid()
  )
);

-- 4) Tighten lecture_targets SELECT for faculty to own rows
DROP POLICY IF EXISTS "Faculty read lecture_targets" ON public.lecture_targets;
CREATE POLICY "Faculty read own lecture_targets"
ON public.lecture_targets FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'faculty'::app_role)
  AND faculty_id = auth.uid()
);

-- 5) Lock down SECURITY DEFINER functions: revoke EXECUTE from public/anon/authenticated.
-- They are still callable internally from RLS policies (which run as a privileged role).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
