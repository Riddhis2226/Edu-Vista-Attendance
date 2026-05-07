
-- 1) Realtime authorization: restrict realtime.messages subscriptions to admins
--    for sensitive table topics. Realtime postgres_changes publishes to topics
--    like "realtime:public:students" / "realtime:public:face_audit_log".
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sensitive realtime topics" ON realtime.messages;
CREATE POLICY "Admins read sensitive realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() IN (
      'realtime:public:students',
      'realtime:public:face_audit_log'
    )
      THEN public.has_role(auth.uid(), 'admin'::public.app_role)
    ELSE true
  END
);

-- 2) Make face_audit_log write rules explicit: admins only (writes still go
--    through service role from edge functions, which bypasses RLS).
DROP POLICY IF EXISTS "Admins write face_audit_log" ON public.face_audit_log;
CREATE POLICY "Admins write face_audit_log"
ON public.face_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles.
--    RLS policies and triggers still invoke them as the function owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
