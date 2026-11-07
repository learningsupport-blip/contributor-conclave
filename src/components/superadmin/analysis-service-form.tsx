"use client";

import { useActionState } from "react";

import { saveAnalysisServiceAction, type OrganisationFormState } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { focusRing } from "@/components/ui/styles";
import type { AnalysisServiceSettings } from "@/lib/superadmin/analysis-rubric";

const aspects = [
  { name: "quality", label: "Quality", text: "Score whether the pull request matches the linked issue and the changed files." },
  { name: "mergeReadiness", label: "Merge readiness", text: "Score how ready the pull request is to merge." },
  { name: "checks", label: "Checks and guidelines", text: "Read CI and name the guideline a failing check did not follow." },
  { name: "coaching", label: "Coaching", text: "Add the next steps a student can take." },
] as const;

const weights = [
  { name: "issueMatch", label: "Issue match" },
  { name: "fileMatch", label: "File match" },
  { name: "description", label: "Description" },
  { name: "checksWeight", label: "Checks" },
  { name: "size", label: "Size" },
] as const;

function Switch({
  name,
  label,
  text,
  defaultChecked,
}: {
  name: string;
  label: string;
  text: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3 border border-ink/10 px-3 py-3 dark:border-paper/15">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} className={`mt-1 size-4 ${focusRing}`} />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-sm text-ink/70 dark:text-paper/70">{text}</span>
      </span>
    </label>
  );
}

export function AnalysisServiceForm({
  settings,
  addressConfigured,
  tokenConfigured,
}: {
  settings: AnalysisServiceSettings;
  addressConfigured: boolean;
  tokenConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const weightValues = {
    issueMatch: settings.weights.issueMatch,
    fileMatch: settings.weights.fileMatch,
    description: settings.weights.description,
    checksWeight: settings.weights.checks,
    size: settings.weights.size,
  };

  async function saveSettings(previous: OrganisationFormState | undefined, formData: FormData) {
    return saveAnalysisServiceAction(previous, formData);
  }

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <p className="border border-ink/10 px-3 py-3 text-sm dark:border-paper/15">
          Service address: {addressConfigured ? "Set in the server environment" : "Not set"}
        </p>
        <p className="border border-ink/10 px-3 py-3 text-sm dark:border-paper/15">
          Service token: {tokenConfigured ? "Set in the server environment" : "Not set"}
        </p>
      </section>
      <Switch
        name="enabled"
        label="Service enabled"
        text="AI Analysis runs only when this is on and the server has the service address."
        defaultChecked={settings.enabled}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-semibold">Aspects</legend>
        {aspects.map((aspect) => (
          <Switch
            key={aspect.name}
            name={aspect.name}
            label={aspect.label}
            text={aspect.text}
            defaultChecked={settings.aspects[aspect.name]}
          />
        ))}
        <Switch
          name="suggestScores"
          label="Suggested scores"
          text="Let the service fill clarity, scope, evidence, and outcome. Saving still requires Save score."
          defaultChecked={settings.suggestScores}
        />
      </fieldset>
      <fieldset>
        <legend className="text-lg font-semibold">Weights</legend>
        <p className="mt-1 mb-3 text-sm text-ink/70 dark:text-paper/70">Each weight is a whole number from 0 to 10.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {weights.map((weight) => (
            <label key={weight.name} className="flex flex-col gap-1 text-sm font-medium">
              {weight.label}
              <input
                name={weight.name}
                type="number"
                min={0}
                max={10}
                step={1}
                required
                defaultValue={weightValues[weight.name]}
                className={`h-10 border border-ink/15 bg-white px-3 dark:border-paper/20 dark:bg-ink ${focusRing}`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
      {state?.saved ? <p role="status" className="text-sm text-moss-800 dark:text-moss-200">Settings saved.</p> : null}
      <div>
        <SubmitButton pending={pending} pendingLabel="Saving…">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
