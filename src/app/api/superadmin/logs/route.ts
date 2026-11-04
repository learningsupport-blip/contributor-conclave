import { getCurrentUser } from "@/lib/auth/session";
import { loadApplicationLogs } from "@/lib/superadmin/request-log";
import { parseLogQuery } from "@/lib/superadmin/request-log-model";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const result = await loadApplicationLogs(user.id, parseLogQuery(Object.fromEntries(url.searchParams)));
  if (!result.ok) {
    const status = result.code === "forbidden" ? 403 : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json(result.data);
}
