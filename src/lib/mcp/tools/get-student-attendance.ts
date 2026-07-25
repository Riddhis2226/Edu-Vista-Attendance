import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_student_attendance",
  title: "Get student attendance summary",
  description:
    "Return recent attendance records and computed present/absent totals for a single student, looked up by enrollment_no. RLS applies.",
  inputSchema: {
    enrollment_no: z.string().min(1).describe("Student enrollment number."),
    limit: z.number().int().min(1).max(500).optional().describe("Max records to return (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ enrollment_no, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, enrollment_no, full_name, program, batch, semester, section")
      .eq("enrollment_no", enrollment_no)
      .maybeSingle();
    if (sErr) return { content: [{ type: "text", text: sErr.message }], isError: true };
    if (!student) return { content: [{ type: "text", text: `No student found with enrollment_no ${enrollment_no}` }], isError: true };

    const { data: records, error: rErr } = await supabase
      .from("attendance_records")
      .select("id, status, confidence, created_at, session_id")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (rErr) return { content: [{ type: "text", text: rErr.message }], isError: true };

    const total = records?.length ?? 0;
    const present = records?.filter((r) => r.status === "present").length ?? 0;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : null;

    const summary = { student, totals: { total, present, absent, percentage }, records: records ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
