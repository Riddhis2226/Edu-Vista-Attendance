import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStudentsTool from "./tools/list-students";
import getStudentAttendanceTool from "./tools/get-student-attendance";
import listAttendanceSessionsTool from "./tools/list-attendance-sessions";
import listLectureTargetsTool from "./tools/list-lecture-targets";

// Direct Supabase issuer — required by mcp-js OAuth verifier. The project ref is
// inlined by Vite at build time, keeping this module import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "eduvista-mcp",
  title: "EduVista MCP",
  version: "0.1.0",
  instructions:
    "Tools for the EduVista attendance platform. Use `list_students` to browse the roster, `get_student_attendance` to inspect one student's history and percentage, `list_attendance_sessions` for recent classroom sessions, and `list_lecture_targets` for configured attendance targets. All calls act as the signed-in user (admin or faculty) and respect the app's row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStudentsTool, getStudentAttendanceTool, listAttendanceSessionsTool, listLectureTargetsTool],
});
