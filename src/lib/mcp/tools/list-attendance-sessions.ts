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
  name: "list_attendance_sessions",
  title: "List attendance sessions",
  description:
    "List attendance sessions visible to the signed-in user (RLS scoped). Optional filters by batch, subject, and date range.",
  inputSchema: {
    batch: z.string().optional(),
    subject: z.string().optional(),
    from_date: z.string().optional().describe("ISO date lower bound, inclusive."),
    to_date: z.string().optional().describe("ISO date upper bound, inclusive."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("attendance_sessions")
      .select("id, date, subject, batch, faculty_name, method, total_present, total_absent, created_at")
      .order("date", { ascending: false })
      .limit(input.limit ?? 50);
    if (input.batch) q = q.eq("batch", input.batch);
    if (input.subject) q = q.eq("subject", input.subject);
    if (input.from_date) q = q.gte("date", input.from_date);
    if (input.to_date) q = q.lte("date", input.to_date);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { sessions: data ?? [], count: data?.length ?? 0 },
    };
  },
});
