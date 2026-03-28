
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'faculty');
CREATE TYPE public.attendance_method AS ENUM ('ai_photo', 'iot_dataset');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- user_roles RLS
CREATE POLICY "Admins can do everything on user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  branch TEXT,
  year INT,
  face_image_url TEXT,
  face_enrolled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty read students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'faculty'));

-- Attendance sessions table
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  faculty_id UUID REFERENCES auth.users(id) NOT NULL,
  faculty_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method attendance_method NOT NULL,
  total_present INT DEFAULT 0,
  total_absent INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access sessions"
  ON public.attendance_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty manage own sessions"
  ON public.attendance_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'faculty') AND faculty_id = auth.uid());

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) NOT NULL,
  enrollment_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status attendance_status NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access records"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty manage own records"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    session_id IN (SELECT id FROM public.attendance_sessions WHERE faculty_id = auth.uid())
  );

-- Storage bucket for face images
INSERT INTO storage.buckets (id, name, public) VALUES ('face-images', 'face-images', true);

CREATE POLICY "Public read face images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'face-images');

CREATE POLICY "Authenticated upload face images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'face-images');

CREATE POLICY "Authenticated update face images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'face-images');

-- Create trigger for auto-creating user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'faculty'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_students_enrollment ON public.students(enrollment_no);
CREATE INDEX idx_students_branch_year ON public.students(branch, year);
CREATE INDEX idx_sessions_faculty ON public.attendance_sessions(faculty_id);
CREATE INDEX idx_sessions_date ON public.attendance_sessions(date);
CREATE INDEX idx_records_session ON public.attendance_records(session_id);
CREATE INDEX idx_records_student ON public.attendance_records(student_id);
