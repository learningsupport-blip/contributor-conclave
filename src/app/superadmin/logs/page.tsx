import { LogsDashboard } from "@/components/superadmin/logs-dashboard";
import { ErrorState } from "@/components/ui/error-state";
import { requireScreen } from "@/lib/auth/authorization";
import { loadApplicationLogs } from "@/lib/superadmin/request-log";
import { parseLogQuery, serializeLogQuery } from "@/lib/superadmin/request-log-model";

export const metadata = { title: "Application Logs" };

export default async function ApplicationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    time?: string;
    role?: string;
    area?: string;
    outcome?: string;
    method?: string;
    slow?: string;
    show?: string;
    page?: string;
  }>;
}) {
  const actor = await requireScreen("logs");
  const params = await searchParams;
  const query = parseLogQuery(params);
  const result = await loadApplicationLogs(actor.id, query);

  return (
    <main className="flex flex-col gap-6">
      {result.ok ? (
        <LogsDashboard key={serializeLogQuery(query)} initial={result.data} query={query} />
      ) : (
        <ErrorState title="Application logs unavailable" message={result.message} />
      )}
    </main>
  );
}
