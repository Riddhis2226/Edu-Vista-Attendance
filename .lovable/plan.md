## EduVista — AI-Powered Smart Attendance System

### Complete & Updated Build Plan

---

## 🎨 Design Foundation

**Color Palette**

- Background: `#0B1320` (midnight navy)
- Primary Accent: `#FF6B2B` (electric orange)
- Secondary: `#00C2FF` (sky blue)
- Success: `#00E5A0` (mint green)
- Warning: `#FFD166` (amber)
- Danger: `#FF4D6D` (rose red)
- Card surface: `#112240` (dark navy)
- Border: `rgba(255,107,43,0.2)` (faint orange)
- Text primary: `#FFFFFF`
- Text muted: `#6B7A99`

**Typography & Components**

- Font: **Inter** (Google Fonts)
- Glassmorphism cards: `backdrop-blur-md`, `bg-white/5`, gradient border `1px solid rgba(255,107,43,0.15)`
- All components from **shadcn/ui** (dark mode configured)
- **Framer Motion** for all animations
- **Recharts** for all charts
- **React Dropzone** for all file upload zones
- **React Webcam** for camera capture
- **Papa Parse** for CSV parsing

---

## ✨ Animation System


| Element               | Animation                                                                |
| --------------------- | ------------------------------------------------------------------------ |
| Login page            | Floating orbs (CSS keyframes), logo glow pulse                           |
| Dashboard cards       | Stagger fade-in + `translateY(20px → 0)`, 80ms delay each                |
| Page titles           | Typewriter effect on every route load                                    |
| Stat numbers          | Count-up animation from 0 to value on mount                              |
| Charts                | Bars grow from bottom, lines draw left to right on entry                 |
| Sidebar active item   | Orange left-border indicator slides vertically between items             |
| Table rows            | Sequential fade-in on load, hover lifts with shadow                      |
| Buttons (primary)     | Shimmer sweep on hover                                                   |
| Buttons (destructive) | Shake animation on confirm                                               |
| File upload zone      | Dashed border dash-offset scroll on drag-over, solid green on valid drop |
| Step progress         | Connector line fills with orange as each step completes                  |
| Toast notifications   | Spring slide-in from top-right, auto-dismiss with progress bar           |
| Empty states          | Illustrated SVG with gentle float animation                              |
| Modals                | Backdrop blur overlay with fade-in scale                                 |
| Page transitions      | Fade + slight Y shift between all routes                                 |
| 404 page              | Animated floating illustration                                           |
| Mobile sheets         | Slide-up drawer with spring physics                                      |
| Skeleton loaders      | Shimmer skeleton on every table and card while loading                   |


---

## 🔐 Authentication & Role System

**Login Page (**`/login`**)**

- Animated floating orbs background (CSS keyframes, 6 orbs different sizes/speeds)
- EduVista logo with glow pulse animation
- Glassmorphism login card centered
- Email + password fields with animated focus states
- Login button with shimmer hover + spinner on submit
- Error toast on invalid credentials
- Auto-redirect based on role after login

**Role System**

- Supabase Auth (email/password)
- Separate `user_roles` table (not in `auth.users` metadata)
- RLS security definer function `get_user_role()` to safely expose role
- On login: fetch role → redirect to `/admin` or `/faculty`
- Protected routes: middleware checks role, redirects to `/login` if unauthenticated or wrong role
- Persistent session via Supabase session listener

---

## 🗄️ Supabase Schema

```
user_roles
  id            uuid PRIMARY KEY
  user_id       uuid REFERENCES auth.users(id) UNIQUE
  role          enum('admin', 'faculty')
  name          text
  email         text
  created_at    timestamp

students
  id            uuid PRIMARY KEY
  enrollment_no text UNIQUE NOT NULL
  full_name     text NOT NULL
  email         text
  branch        text
  year          int
  face_image_url text
  face_enrolled  boolean DEFAULT false
  created_at    timestamp

attendance_sessions
  id            uuid PRIMARY KEY
  subject       text NOT NULL
  faculty_id    uuid REFERENCES user_roles(id)
  faculty_name  text
  date          date NOT NULL
  method        enum('ai_photo', 'iot_dataset')
  total_present int DEFAULT 0
  total_absent  int DEFAULT 0
  created_at    timestamp

attendance_records
  id            uuid PRIMARY KEY
  session_id    uuid REFERENCES attendance_sessions(id)
  student_id    uuid REFERENCES students(id)
  enrollment_no text NOT NULL
  student_name  text NOT NULL
  status        enum('present', 'absent')
  confidence    float (for AI method — Azure confidence score)
  created_at    timestamp

```

**RLS Policies**

- Admin: full SELECT, INSERT, UPDATE, DELETE on all tables
- Faculty: SELECT/INSERT/UPDATE only on `attendance_sessions` and `attendance_records` where `faculty_id = auth.uid()`
- Faculty: SELECT only on `students` (read-only, cannot modify student data)
- Faculty: no access to `user_roles` table

**Supabase Storage**

- Bucket: `face-images` (public read, authenticated write)
- File validation: max 5MB, accepted types: `jpg`, `png`, `webp` only
- Naming convention: `students/{enrollment_no}/{timestamp}.jpg`

---

## 👨‍💼 Admin Dashboard

**Layout**

- Collapsible sidebar (icon + label, collapses to icon-only on toggle)
- EduVista logo top-left (graduation cap icon with orange glow)
- Bottom nav on mobile (Home, Students, Logs, Faculty icons)
- User avatar + name + logout button at sidebar bottom

---

### Page 1 — Overview (`/admin`)

**Stat Cards (animated count-up, stagger on load)**

- Total Students enrolled
- Total Faculty registered
- Today's Attendance % (across all sessions today)
- Active Sessions today

**Charts**

- Line chart: 30-day attendance trend (Recharts, animated draw)
- Bar chart: Department-wise attendance % (Recharts, animated grow)

**Low Attendance Alerts**

- Table of students below 75% attendance
- Pulsing red badge next to each name
- Click row to view student full attendance history

**Real-Time Updates**

- Supabase real-time subscription on `attendance_records`
- Today's Attendance % card updates live without page refresh whenever a new record is inserted

---

### Page 2 — Student Management (`/admin/students`)

**Table**

- Columns: Enrollment No., Full Name, Branch, Year, Email, Face Enrolled (green ✓ / red ✗ badge), Actions
- Search by name or enrollment number
- Filter by Branch and Year dropdowns
- Pagination (10 rows per page)
- Sequential row fade-in on load, hover lift with shadow

**Actions**

- **Add Student** button → opens modal with form (all fields)
- **Edit** per row → pre-filled modal
- **Delete** per row → confirm dialog with shake animation
- **Bulk CSV Upload** button → opens drag-drop modal with:
  - File drop zone (animated dashed border)
  - CSV preview table (first 5 rows shown)
  - Column mapping step: faculty maps CSV columns to `enrollment_no`, `full_name`, `branch`, `year`, `email`
  - Animated progress bar during import
  - Success toast with count of students imported

---

### Page 3 — Face Enrollment (`/admin/face-enrollment`)

**Student List**

- Same searchable table as Student Management
- Each row shows Face Enrolled status badge
- Click row to open Face Enrollment panel

**Enrollment Panel**

- Student info summary at top
- Two options: **Upload Photo** or **Use Camera**
- Upload: drag-drop zone, accepts jpg/png/webp, max 5MB
- Camera: live webcam preview using React Webcam, capture button
- Circular crop preview of captured/uploaded image
- **Enroll Face** button → uploads to Supabase Storage → calls Azure Face API to add face to PersonGroup → updates `face_enrolled = true` in students table
- Animated checkmark with green glow on successful enrollment
- Error state if Azure API rejects the image (face not detected)

**PersonGroup Management (Admin Only)**

- Hidden section at bottom of page
- **Train PersonGroup** button → triggers edge function to call Azure `PersonGroup - Train` endpoint
- Training status indicator (Pending / Running / Succeeded / Failed)
- Must be run after bulk face enrollments before recognition will work
- Warning banner if PersonGroup has not been trained since last enrollment

---

### Page 4 — Attendance Logs (`/admin/attendance-logs`)

**Filters**

- Date range picker
- Subject dropdown
- Faculty dropdown
- Method filter (AI Photo / IoT Dataset / All)

**Sessions Table**

- Columns: Date, Subject, Faculty, Method badge, Present, Absent, Total, Actions
- Click row → expands to show full student-level attendance list
- Hover lift animation on rows

**Export**

- Per session: **Download CSV** and **Export to Google Sheet** buttons
- Google Sheet export: calls `export-to-sheet` edge function → returns shareable Google Sheets link → opens in new tab

---

### Page 5 — Faculty Management (`/admin/faculty`)

**Table**

- Columns: Name, Email, Subjects Assigned, Role badge, Actions
- Add Faculty → creates Supabase Auth user + assigns `faculty` role in `user_roles`
- Edit → update name, email, subjects
- Delete → removes from `user_roles` (auth user remains but loses access)

---

## 👩‍🏫 Faculty Dashboard

**Layout**

- Same collapsible sidebar structure as Admin
- Orange accent replaced with sky blue (`#00C2FF`) for Faculty-specific UI elements
- Mobile bottom nav: Home, Upload, History, Analytics

---

### Page 1 — Overview (`/faculty`)

- Today's date and greeting with faculty name
- Today's class schedule (cards showing subject, time, room)
- Two large quick-action cards: **📷 Upload via Photos** and **📂 Upload via Dataset** with hover glow animations
- Recent Sessions list (last 5 sessions with subject, date, method, present count)
- Upcoming reminder if no attendance uploaded for today's class

---

### Page 2 — Upload: Photo Method (`/faculty/upload-photo`)

**Step 1 — Upload Photos**

- Large drag-drop zone (full width, tall)
- Accepts: jpg, jpeg, png, webp, heic, bmp (any common image format)
- Animated dashed border on drag-over, solid green on valid drop
- Thumbnail grid preview of uploaded images with remove button per image
- Subject name input field
- **Start Recognition** button (disabled until at least 1 photo uploaded and subject filled)

**Step 2 — Animated 5-Step Progress**

- Animated connector line fills orange between steps as they complete
- Step 1: **Uploading Photos** — file upload progress bar
- Step 2: **Sending to Azure Face API** — spinner
- Step 3: **Detecting Faces** — animated face scan icon
- Step 4: **Matching Students** — animated matching lines
- Step 5: **Generating Report** — checkmark animation
- Each completed step shows green checkmark + timestamp

**Step 3 — Results**

- Attendance summary table slides in: Name, Enrollment No., Status (Present ✓ / Absent ✗), Confidence %
- Summary bar: X Present, Y Absent, Z Unrecognized
- Unrecognized faces section: shows cropped face thumbnails that could not be matched — faculty can manually assign to a student
- **Save Attendance** button → saves session + records to Supabase
- **Download CSV** and **Export to Google Sheet** buttons appear after save

---

### Page 3 — Upload: Dataset Method (`/faculty/upload-dataset`)

**Step 1 — Upload File**

- Drag-drop zone for CSV or Google Sheet (exported as CSV)
- Animated file parse progress bar on drop
- Subject name input

**Step 2 — Column Mapping**

- After parse: show detected column headers
- Faculty maps columns to: `Enrollment No.`, `Student Name`, `Status (Present/Absent)`, `Date` (optional)
- Live preview updates as mapping changes

**Step 3 — Validation**

- Table preview of parsed + mapped data
- Rows with missing enrollment numbers highlighted in red
- Rows with unrecognized enrollment numbers (not in students DB) flagged in amber with warning icon
- Error count badge at top
- **Fix Errors** option: faculty can manually correct flagged rows inline

**Step 4 — Save**

- **Save Attendance** button with confirmation animation
- Saves session (method: `iot_dataset`) + all records to Supabase
- **Download CSV** and **Export to Google Sheet** buttons appear after save

---

### Page 4 — Attendance History (`/faculty/history`)

- List of all sessions created by this faculty member
- Columns: Date, Subject, Method badge (📷 AI Photo / 📂 IoT Dataset), Present, Absent, Total
- Click row → expands with full student-level list
- Per session: **Download CSV** and **Export to Google Sheet** buttons
- Filter by date range and subject

---

### Page 5 — Analytics (`/faculty/analytics`)

**Student Attendance Rings**

- Grid of student cards, each with animated circular progress ring showing their attendance %
- Color: green (≥75%), amber (50–74%), red (<50%)
- Click card → modal with session-by-session breakdown

**Subject Bar Chart**

- Attendance % per subject (Recharts, animated)

**Heatmap Calendar**

- GitHub-style contribution heatmap
- Each day colored by attendance % that day
- Hover tooltip showing date, subject, present count

**Low Attendance List**

- Students below 75% with pulsing red badge
- Click to view full history

---

## 🔗 Supabase Edge Functions

### `recognize-faces`

```
Input:  Array of base64 image strings + subject name + faculty_id
Process:
  1. For each image:
     a. Call Azure Face API /detect endpoint → get face rectangles + faceIds
     b. Call Azure Face API /identify endpoint against PersonGroup 'eduvista-students'
     c. Filter results where confidence >= 0.7
     d. Map faceId → personId → enrollment_no via students table
  2. Deduplicate (student may appear in multiple photos)
  3. All students NOT found = absent
Output: Array of { enrollment_no, student_name, status, confidence }

```

### `export-to-sheet`

```
Input:  session_id
Process:
  1. Fetch all attendance_records for session from Supabase
  2. Use Google Sheets API with service account credentials (stored as Supabase secret)
  3. Create new spreadsheet titled "EduVista — {Subject} — {Date}"
  4. Populate headers: Enrollment No., Student Name, Status, Confidence, Date, Subject, Faculty
  5. Populate rows from records
  6. Set sheet sharing to "anyone with link can view"
Output: { spreadsheet_url }

```

### `train-persongroup`

```
Input:  none (admin only)
Process:
  1. Call Azure Face API PersonGroup - Train endpoint
  2. Poll training status every 3 seconds
  3. Update training_status in a config table (pending/running/succeeded/failed)
Output: { status }

```

---

## 📱 Responsive Design


| Screen              | Behavior                                        |
| ------------------- | ----------------------------------------------- |
| Desktop (>1024px)   | Full sidebar expanded                           |
| Tablet (768–1024px) | Sidebar icon-only (collapsed)                   |
| Mobile (<768px)     | Sidebar hidden, bottom nav with 4 icons         |
| Mobile modals       | Slide-up sheet drawers (shadcn Sheet component) |
| Mobile tables       | Horizontal scroll with sticky first column      |
| Mobile charts       | Simplified single-series charts                 |


---

## 🛣️ All Routes

```
/login                     → Animated login page
/admin                     → Admin overview
/admin/students            → Student management + CSV upload
/admin/face-enrollment     → Face enrollment + PersonGroup train
/admin/attendance-logs     → Full attendance log history
/admin/faculty             → Faculty management
/faculty                   → Faculty overview
/faculty/upload-photo      → Photo method attendance upload
/faculty/upload-dataset    → Dataset method attendance upload
/faculty/history           → Attendance history
/faculty/analytics         → Analytics & charts
*                          → Animated 404 page

```

---