import { logoutAction } from "@/app/actions/auth";
import { buttonCorners } from "@/components/ui/styles";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`inline-flex h-11 items-center justify-center border border-zinc-300 px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:border-zinc-700 dark:focus-visible:outline-zinc-50 ${buttonCorners}`}
      >
        Log out
      </button>
    </form>
  );
}
