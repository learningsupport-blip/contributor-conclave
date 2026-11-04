"use client";

import { useActionState } from "react";

import { startWorkingAction } from "@/app/actions/student-opportunities";
import { SubmitButton } from "@/components/auth/submit-button";

export function StartProjectForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(startWorkingAction, undefined);

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton pending={pending} pendingLabel="Starting…">
        Start working
      </SubmitButton>
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
