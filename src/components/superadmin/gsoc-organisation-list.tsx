"use client";

import { useActionState, useId, useRef } from "react";

import {
  approveGsocOrganisationAction,
  disapproveGsocOrganisationAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { Pager } from "@/components/admin/pager";
import { SubmitButton } from "@/components/auth/submit-button";
import { buttonCorners, controlClass, focusRing } from "@/components/ui/styles";

function resourcesHref(page: number, query: string): string {
  const search = new URLSearchParams();
  if (query) {
    search.set("q", query);
  }
  if (page > 1) {
    search.set("page", String(page));
  }
  const value = search.toString();
  return value ? `/superadmin/resources?${value}` : "/superadmin/resources";
}

export type GsocOrganisationRow = {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  imageBackground: string;
  technologies: string[];
  sourceTechnologies: string[];
  topics: string[];
  years: number[];
  websiteUrl: string;
  codeRepositoryUrl: string;
  projectsUrl: string;
  ideasUrl: string;
  guideUrl: string;
  projectCount: number;
  approved: boolean;
};

const PREVIEW_TECHNOLOGIES = 4;

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper text-ink backdrop:bg-ink/60 dark:border-paper/15 dark:bg-ink dark:text-paper";

function ChipList({ items, className }: { items: Array<string | number>; className: string }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {items.map((item) => (
        <li key={item} className={`px-2 py-1 text-xs font-medium ${className}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DetailLink({ href, label }: { href: string; label: string }) {
  if (!href) {
    return null;
  }
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="mt-1 break-words">
        <a
          href={href}
          className={`underline underline-offset-4 ${focusRing}`}
          target="_blank"
          rel="noreferrer"
        >
          {href}
        </a>
      </dd>
    </div>
  );
}

function OrganisationMark({ organisation }: { organisation: GsocOrganisationRow }) {
  return (
    <div
      className="flex h-28 items-center justify-center border-b border-ink/10 px-4 dark:border-paper/10"
      style={organisation.imageBackground ? { backgroundColor: organisation.imageBackground } : undefined}
    >
      {organisation.imageUrl ? (
        <img src={organisation.imageUrl} alt="" className="max-h-20 max-w-full object-contain" />
      ) : (
        <span aria-hidden="true" className="text-2xl font-semibold tracking-tight">
          {organisation.name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}

function Decision({ organisation }: { organisation: GsocOrganisationRow }) {
  if (organisation.approved) {
    return <DisapproveButton name={organisation.name} />;
  }
  return <ApproveButton name={organisation.name} />;
}

function ApproveButton({ name }: { name: string }) {
  const [state, action, pending] = useActionState(submit, undefined);

  async function submit(previous: OrganisationFormState | undefined, formData: FormData) {
    return approveGsocOrganisationAction(previous, formData);
  }

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input type="hidden" name="name" value={name} />
      <SubmitButton pending={pending} pendingLabel="Approving…" accessibleName={`Approve ${name}`}>
        Approve
      </SubmitButton>
      {state?.formError ? <Alert message={state.formError} /> : null}
    </form>
  );
}

function DisapproveButton({ name }: { name: string }) {
  const [state, action, pending] = useActionState(submit, undefined);

  async function submit(previous: OrganisationFormState | undefined, formData: FormData) {
    return disapproveGsocOrganisationAction(previous, formData);
  }

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input type="hidden" name="name" value={name} />
      <p className="text-sm font-medium">Approved</p>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        aria-label={`Disapprove ${name}`}
        className={`inline-flex h-11 items-center justify-center border border-ink/20 px-5 text-sm font-medium dark:border-paper/25 disabled:opacity-60 ${buttonCorners} ${focusRing}`}
      >
        {pending ? "Disapproving…" : "Disapprove"}
      </button>
      {state?.formError ? <Alert message={state.formError} /> : null}
    </form>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

function OrganisationCard({ organisation }: { organisation: GsocOrganisationRow }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const preview = organisation.sourceTechnologies.slice(0, PREVIEW_TECHNOLOGIES);
  const hiddenCount = organisation.sourceTechnologies.length - preview.length;

  function openDetails() {
    dialogRef.current?.showModal();
    titleRef.current?.focus();
  }

  return (
    <li className="flex flex-col border border-ink/10 bg-paper shadow-sm dark:border-paper/10 dark:bg-ink">
      <OrganisationMark organisation={organisation} />
      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-4 text-center">
        <p className="text-lg font-semibold">{organisation.name}</p>
        {organisation.category ? (
          <span className="bg-amber-700 px-2 py-1 text-xs font-medium text-white">{organisation.category}</span>
        ) : null}
        {organisation.description ? <p className="line-clamp-4 text-sm">{organisation.description}</p> : null}
        {organisation.years.length > 0 ? (
          <ChipList items={organisation.years} className="bg-moss-800 text-white dark:bg-moss-300 dark:text-moss-950" />
        ) : null}
        {preview.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {preview.map((technology) => (
              <li
                key={technology}
                className="border border-amber-700 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-200 dark:text-amber-100"
              >
                {technology}
              </li>
            ))}
            {hiddenCount > 0 ? (
              <li>
                <button
                  type="button"
                  className={`border border-amber-700 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-200 dark:text-amber-100 ${buttonCorners} ${focusRing}`}
                  aria-label={`${hiddenCount} more technologies for ${organisation.name}`}
                  onClick={openDetails}
                >
                  {hiddenCount} more
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
        <button
          type="button"
          className={`inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`}
          aria-label={`View details for ${organisation.name}`}
          onClick={openDetails}
        >
          View details
        </button>
        <Decision organisation={organisation} />
      </div>
      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogClass}>
        <OrganisationMark organisation={organisation} />
        <div className="flex flex-col items-center gap-3 px-5 py-5 text-center">
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className={`text-2xl font-semibold ${focusRing}`}>
            {organisation.name}
          </h2>
          {organisation.category ? (
            <span className="bg-amber-700 px-2 py-1 text-xs font-medium text-white">{organisation.category}</span>
          ) : null}
          {organisation.description ? <p className="text-sm">{organisation.description}</p> : null}
          {organisation.years.length > 0 ? (
            <ChipList items={organisation.years} className="bg-moss-800 text-white dark:bg-moss-300 dark:text-moss-950" />
          ) : null}
          {organisation.sourceTechnologies.length > 0 ? (
            <ChipList
              items={organisation.sourceTechnologies}
              className="border border-amber-700 text-amber-800 dark:border-amber-200 dark:text-amber-100"
            />
          ) : null}
          {organisation.topics.length > 0 ? (
            <p className="text-sm text-ink/70 dark:text-paper/70">{organisation.topics.join(", ")}</p>
          ) : null}
          <dl className="grid w-full gap-3 text-left text-sm">
            <DetailLink href={organisation.websiteUrl} label="Organisation URL" />
            <DetailLink href={organisation.codeRepositoryUrl} label="Github/Gitlab URL" />
            <DetailLink href={organisation.ideasUrl} label="Ideas" />
            <DetailLink href={organisation.guideUrl} label="Guide" />
            <DetailLink href={organisation.projectsUrl} label="Projects" />
          </dl>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {organisation.projectCount === 1 ? "1 project" : `${organisation.projectCount} projects`}
          </p>
          <form method="dialog">
            <button
              type="submit"
              className={`inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`}
            >
              Close
            </button>
          </form>
        </div>
      </dialog>
    </li>
  );
}

export function GsocOrganisationList({
  year,
  organisations,
  page,
  total,
  pageSize,
  query,
}: {
  year: number;
  organisations: GsocOrganisationRow[];
  page: number;
  total: number;
  pageSize: number;
  query: string;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="gsoc-organisations-heading">
      <div className="flex flex-col gap-2">
        <h2 id="gsoc-organisations-heading" className="text-xl font-semibold">
          GSoC organisations, {year}
        </h2>
        <p className="max-w-2xl text-sm text-ink/75 dark:text-paper/75">
          Twelve organisations are shown at a time from the saved GSoC list. Approve any organisation to add it here. Students see it when it shares a tech stack they choose. Disapprove removes it from that list.
        </p>
      </div>
      <form method="get" action="/superadmin/resources" className="flex max-w-sm flex-col gap-2">
        <label htmlFor="gsoc-organisation-search" className="text-sm font-medium">
          Search organisations
        </label>
        <input
          id="gsoc-organisation-search"
          name="q"
          defaultValue={query}
          type="search"
          className={controlClass}
        />
        <button
          type="submit"
          className={`inline-flex h-10 w-fit items-center justify-center border border-ink/20 px-4 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`}
        >
          Search
        </button>
      </form>
      {organisations.length === 0 ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">No organisations matched your search.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organisations.map((organisation) => (
            <OrganisationCard key={organisation.name} organisation={organisation} />
          ))}
        </ul>
      )}
      <Pager
        page={page}
        total={total}
        pageSize={pageSize}
        href={(nextPage) => resourcesHref(nextPage, query)}
      />
    </section>
  );
}
