import Link from "next/link";

import { StudentRegisterForm } from "@/components/auth/student-register-form";
import { focusRing } from "@/components/ui/styles";
import { registrationOptions } from "@/lib/superadmin/catalog";

export default async function StudentRegisterPage() {
  const options = await registrationOptions();

  return (
    <main className="w-full flex-1 px-6 py-16">
      <div className="ml-auto flex w-[min(42rem,100%)] flex-col gap-6">
        <h1 tabIndex={-1} className={`text-3xl font-semibold tracking-tight ${focusRing}`}>
          Student registration
        </h1>
        <StudentRegisterForm universities={options.universities} batches={options.batches} />
        <p className="text-sm">
          <Link className={`underline underline-offset-4 ${focusRing}`} href="/register/mentor">
            Register as a mentor
          </Link>{" "}
          or{" "}
          <Link className={`underline underline-offset-4 ${focusRing}`} href="/login">
            log in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
