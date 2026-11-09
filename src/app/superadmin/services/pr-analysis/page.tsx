import Link from "next/link";

import { AnalysisServiceForm } from "@/components/superadmin/analysis-service-form";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { focusRing } from "@/components/ui/styles";
import { requireScreen } from "@/lib/auth/authorization";
import { getAnalysisServiceSettings } from "@/lib/superadmin/analysis-service-settings";
import { readPullRequestAnalysisConfig } from "@/lib/superadmin/pull-request-analysis";

export const metadata = { title: "PR Analysis" };

export default async function PullRequestAnalysisSettingsPage() {
  const actor = await requireScreen("services");
  const settings = await getAnalysisServiceSettings(actor.id);
  const connection = readPullRequestAnalysisConfig();

  return (
    <main className="flex flex-col gap-6">
      <p className="text-sm">
        <Link className={`underline underline-offset-4 ${focusRing}`} href="/superadmin/services">
          Services
        </Link>
      </p>
      <PageHeader
        title="PR Analysis"
        description="The server sends the pull request to the analysis service. The address and token are not edited here."
      />
      {settings.ok ? (
        <AnalysisServiceForm
          settings={settings.data}
          addressConfigured={connection !== null}
          tokenConfigured={Boolean(connection?.token)}
        />
      ) : (
        <ErrorState title="Settings unavailable" message={settings.message} />
      )}
    </main>
  );
}
