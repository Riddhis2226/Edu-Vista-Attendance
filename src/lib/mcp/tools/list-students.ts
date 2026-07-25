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
  name: "list_students",
  title: "List students",
  description:
    "List students visible to the signed-in user (RLS scoped). Optional filters by batch, program, semester, section, or enrollment_no. Returns up to `limit` rows (default 50, max 200).",
  inputSchema: {
    batch: z.string().optional().describe("Filter by batch (e.g. '2024-CSE')."),
    program: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    enrollment_no: z.string().optional().describe("Exact enrollment number match."),
    search: z.string().optional().describe("Substring match on full_name."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("students")
      .select(
        "id, enrollment_no, full_name, email, program, batch, semester, section, year, face_enrolled, enrollment_status",
      )
      .order("enrollment_no", { ascending: true })
      .limit(input.limit ?? 50);
    if (input.batch) q = q.eq("batch", input.batch);
    if (input.program) q = q.eq("program", input.program);
    if (input.semester) q = q.eq("semester", input.semester);
    if (input.section) q = q.eq("section", input.section);
    if (input.enrollment_no) q = q.eq("enrollment_no", input.enrollment_no);
    if (input.search) q = q.ilike("full_name", `%${input.search}%`);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { students: data ?? [], count: data?.length ?? 0 },
    };
  },
});
