"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import { Pager } from "@/components/admin/pager";
import { buttonCorners, controlClass, focusRing } from "@/components/ui/styles";
import {
  AREA_LABELS,
  LOG_AREAS,
  LOG_METHODS,
  LOG_ROLES,
  ROLE_LABELS,
  formatDuration,
  formatLogTime,
  serializeLogQuery,
  type LogArea,
  type LogQuery,
  type LogRole,
  type LogsDashboard,
} from "@/lib/superadmin/request-log-model";

const ROLE_COLORS: Record<LogRole, string> = {
  STUDENT: "#3b82f6",
  MENTOR: "#f97316",
  ADMIN: "#22c55e",
  SUPERADMIN: "#eab308",
};

const AREA_COLORS: Record<LogArea, string> = {
  AUTH: "#6366f1",
  MENTORSHIP: "#14b8a6",
  REVIEWS: "#f97316",
  COLLABORATE: "#84cc16",
  STUDENT: "#3b82f6",
  MENTOR: "#22c55e",
  SUBMISSIONS: "#eab308",
  CHAT: "#a855f7",
  ADMIN: "#64748b",
  ACCESS: "#0ea5e9",
  PROFILE: "#ec4899",
  OTHER: "#94a3b8",
};

function logsHref(query: LogQuery, patch: Partial<LogQuery> = {}): string {
  const next = { ...query, page: 1, ...patch };
  const search = serializeLogQuery(next);
  return search ? `/superadmin/logs?${search}` : "/superadmin/logs";
}

export function LogsDashboard({ initial, query }: { initial: LogsDashboard; query: LogQuery }) {
  const [data, setData] = useState(initial);
  const captionId = useId();
  const search = serializeLogQuery(query);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    let ignore = false;
    const refresh = async () => {
      const response = await fetch(`/api/superadmin/logs${search ? `?${search}` : ""}`);
      if (!response.ok || ignore) {
        return;
      }
      const payload = (await response.json()) as LogsDashboard;
      if (!ignore) {
        setData(payload);
      }
    };
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, [search]);

  const peak = data.peak
    ? `Distinct users per hour (IST). Peak ${data.peak.count} at ${data.peak.label}.`
    : "Distinct users per hour (IST). No signed-in actions in the last 24 hours.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="flex flex-col gap-2">
          <h1 tabIndex={-1} className={`text-3xl font-semibold tracking-tight ${focusRing}`}>
            Application Logs
          </h1>
          <p className="max-w-2xl text-ink/75 dark:text-paper/75">
            Who is doing what, and how the application is holding up. Times are IST; logs are kept for 7 days.
          </p>
          <p aria-live="polite" className="text-sm text-ink/70 dark:text-paper/70">
            Updated {formatLogTime(new Date(data.updatedAt))} · refreshes every 15s
          </p>
        </header>
        <button
          type="button"
          className={`inline-flex h-10 items-center border border-ink/20 px-4 text-sm dark:border-paper/25 ${buttonCorners} ${focusRing}`}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      <section aria-label="Performance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active now" value={String(data.performance.activeNow)} detail="Users with an action in the last 15 minutes" />
        <Stat label="Requests (24h)" value={String(data.performance.requests24h)} detail="Signed-in and sign-in requests" />
        <Stat
          label="Error rate (24h)"
          value={`${data.performance.errorRate.toFixed(1)}%`}
          detail={`${data.performance.errors24h} ${data.performance.errors24h === 1 ? "error" : "errors"}`}
        />
        <Stat label="Average duration (24h)" value={formatDuration(data.performance.averageMs)} detail="From request start to response" />
      </section>

      <section className="rounded-2xl border border-ink/10 p-4 dark:border-paper/15">
        <h2 className="text-lg font-semibold">Active users, last 24 hours</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{peak}</p>
        <HourChart points={data.hours} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink/10 p-4 dark:border-paper/15">
          <h2 className="text-lg font-semibold">Accounts by role</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">Every account on the platform. Pick a role to filter Activity.</p>
          <Donut
            label="Accounts by role"
            slices={data.roles.map((role) => ({
              key: role.role,
              name: role.name,
              count: role.count,
              color: ROLE_COLORS[role.role],
              href: logsHref(query, { role: query.role === role.role ? "all" : role.role }),
              current: query.role === role.role,
            }))}
          />
        </section>
        <section className="rounded-2xl border border-ink/10 p-4 dark:border-paper/15">
          <h2 className="text-lg font-semibold">Operations by area (24h)</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">Where signed-in actions happened. Pick an area to filter Activity.</p>
          {data.areas.length === 0 ? (
            <p className="mt-6 text-sm text-ink/70 dark:text-paper/70">No signed-in actions in the last 24 hours.</p>
          ) : (
            <Donut
              label="Operations by area"
              slices={data.areas.map((area) => ({
                key: area.area,
                name: area.label,
                count: area.count,
                color: AREA_COLORS[area.area],
                href: logsHref(query, { area: query.area === area.area ? "all" : area.area }),
                current: query.area === area.area,
              }))}
            />
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Activity</h2>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {data.activity.total} {data.activity.total === 1 ? "action" : "actions"} · {data.activity.failed} failed ·{" "}
            {formatDuration(data.activity.averageMs)} avg
          </p>
        </div>
        <form action="/superadmin/logs" className="grid gap-3 rounded-2xl border border-ink/10 p-4 md:grid-cols-2 xl:grid-cols-3 dark:border-paper/15">
          <label className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
            <span className="text-sm font-medium">Search</span>
            <input
              name="q"
              defaultValue={query.search}
              placeholder="Name, email, operation, path or area"
              className={controlClass}
            />
          </label>
          <Select name="time" label="Time" defaultValue={query.window} onChangeSubmit>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </Select>
          <Select name="role" label="Role" defaultValue={query.role} onChangeSubmit>
            <option value="all">All roles</option>
            {LOG_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
          <Select name="area" label="Area" defaultValue={query.area} onChangeSubmit>
            <option value="all">All areas</option>
            {LOG_AREAS.map((area) => (
              <option key={area} value={area}>
                {AREA_LABELS[area]}
              </option>
            ))}
          </Select>
          <Select name="outcome" label="Outcome" defaultValue={query.outcome} onChangeSubmit>
            <option value="all">All outcomes</option>
            <option value="ok">Succeeded</option>
            <option value="failed">Failed</option>
          </Select>
          <Select name="method" label="Method" defaultValue={query.method} onChangeSubmit>
            <option value="all">All methods</option>
            {LOG_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Select name="show" label="Show" defaultValue={String(query.pageSize)} onChangeSubmit>
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </Select>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              name="slow"
              value="1"
              defaultChecked={query.slow}
              className={focusRing}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            />
            Slower than 1s
          </label>
          <div className="flex items-center gap-3 self-end">
            <button type="submit" className={`inline-flex h-10 items-center bg-ink px-4 text-sm text-paper dark:bg-paper dark:text-ink ${buttonCorners} ${focusRing}`}>
              Search
            </button>
            <a href="/superadmin/logs" className={`text-sm underline underline-offset-4 ${focusRing}`}>
              Reset
            </a>
          </div>
        </form>

        <div tabIndex={0} role="region" aria-labelledby={captionId} className={`overflow-x-auto ${focusRing}`}>
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <caption id={captionId} className="sr-only">
              Activity
            </caption>
            <thead>
              <tr className="border-b border-ink/15 text-xs tracking-wide uppercase dark:border-paper/15">
                <th scope="col" className="px-3 py-3 font-medium">Time (IST)</th>
                <th scope="col" className="px-3 py-3 font-medium">User</th>
                <th scope="col" className="px-3 py-3 font-medium">Role</th>
                <th scope="col" className="px-3 py-3 font-medium">Operation</th>
                <th scope="col" className="px-3 py-3 font-medium">Status</th>
                <th scope="col" className="px-3 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.activity.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-ink/70 dark:text-paper/70">
                    No actions match these filters. Open a page while signed in, then refresh.
                  </td>
                </tr>
              ) : (
                data.activity.rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink/10 dark:border-paper/10">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <time dateTime={row.createdAt}>{formatLogTime(new Date(row.createdAt))}</time>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{row.actorName}</div>
                      {row.actorEmail ? <div className="text-ink/70 dark:text-paper/70">{row.actorEmail}</div> : null}
                    </td>
                    <td className="px-3 py-3">{row.role ? ROLE_LABELS[row.role] : "Guest"}</td>
                    <td className="px-3 py-3">
                      <div>{row.operation}</div>
                      <div className="text-ink/70 dark:text-paper/70">
                        {row.areaLabel} · {row.method} {row.path}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusCode code={row.statusCode} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDuration(row.durationMs)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager
          page={data.activity.page}
          total={data.activity.total}
          pageSize={data.activity.pageSize}
          href={(page) => logsHref(query, { page })}
        />
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-ink/10 p-4 dark:border-paper/15">
      <h2 className="text-sm font-medium text-ink/70 dark:text-paper/70">{label}</h2>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{detail}</p>
    </article>
  );
}

function Select({
  name,
  label,
  defaultValue,
  onChangeSubmit,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  onChangeSubmit?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={controlClass}
        onChange={onChangeSubmit ? (event) => event.currentTarget.form?.requestSubmit() : undefined}
      >
        {children}
      </select>
    </label>
  );
}

function StatusCode({ code }: { code: number }) {
  const tone =
    code >= 500
      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      : code >= 400
        ? "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
        : "bg-moss-100 text-moss-900 dark:bg-moss-900 dark:text-moss-100";
  return <span className={`inline-flex min-w-10 justify-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{code}</span>;
}

function HourChart({ points }: { points: LogsDashboard["hours"] }) {
  const max = Math.max(4, ...points.map((point) => point.count));
  const width = 640;
  const height = 180;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - (point.count / max) * (height - 16) - 8;
    return `${x},${y}`;
  });

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Active users for each hour" className="h-48 w-full">
        {[0, 0.5, 1].map((fraction) => {
          const y = 8 + (1 - fraction) * (height - 16);
          return <line key={fraction} x1="0" x2={width} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.15" />;
        })}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={coords.join(" ")} />
      </svg>
      <figcaption className="sr-only">
        {points.map((point) => `${point.label} ${point.count}`).join(", ")}
      </figcaption>
      <div className="flex justify-between text-xs text-ink/70 dark:text-paper/70">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </figure>
  );
}

function Donut({
  label,
  slices,
}: {
  label: string;
  slices: { key: string; name: string; count: number; color: string; href: string; current: boolean }[];
}) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" role="img" aria-label={label} className="size-36 shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="14" />
        {total > 0
          ? slices.map((slice) => {
              const length = (slice.count / total) * circumference;
              const circle = (
                <circle
                  key={slice.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                />
              );
              offset += length;
              return circle;
            })
          : null}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {slices.map((slice) => {
          const percent = total === 0 ? 0 : Math.round((slice.count / total) * 100);
          return (
            <li key={slice.key}>
              <a
                href={slice.href}
                aria-current={slice.current ? "true" : undefined}
                className={`inline-flex items-center gap-2 rounded-md px-1 ${focusRing} ${slice.current ? "font-semibold underline" : ""}`}
              >
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span>{slice.name}</span>
                <span className="text-ink/70 dark:text-paper/70">
                  {slice.count} · {percent}%
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
