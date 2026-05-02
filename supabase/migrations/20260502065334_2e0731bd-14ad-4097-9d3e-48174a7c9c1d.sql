
DROP POLICY IF EXISTS "Admins and faculty read face images" ON storage.objects;

CREATE POLICY "Admins and scoped faculty read face images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      public.has_role(auth.uid(), 'faculty'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.students st
        WHERE st.id::text = (storage.foldername(name))[1]
          AND st.batch IN (
            SELECT s.batch FROM public.attendance_sessions s WHERE s.faculty_id = auth.uid()
            UNION
            SELECT lt.batch FROM public.lecture_targets lt WHERE lt.faculty_id = auth.uid()
          )
      )
    )
  )
);
