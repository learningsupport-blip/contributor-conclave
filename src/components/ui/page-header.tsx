import { focusRing } from "@/components/ui/styles";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      <h1 tabIndex={-1} className={`text-3xl font-semibold tracking-tight ${focusRing}`}>
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-ink/75 dark:text-paper/75">{description}</p>
      ) : null}
    </header>
  );
}
