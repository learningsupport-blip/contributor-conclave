export const APPLICATION_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const APPLICATION_LOG_DAY_MS = 24 * 60 * 60 * 1000;
export const APPLICATION_LOG_ACTIVE_MS = 15 * 60 * 1000;
export const APPLICATION_TIME_ZONE = "Asia/Kolkata";

export const LOG_ROLES = ["STUDENT", "MENTOR", "ADMIN", "SUPERADMIN"] as const;
export type LogRole = (typeof LOG_ROLES)[number];

export const LOG_AREAS = [
  "AUTH",
  "MENTORSHIP",
  "REVIEWS",
  "COLLABORATE",
  "STUDENT",
  "MENTOR",
  "SUBMISSIONS",
  "CHAT",
  "ADMIN",
  "ACCESS",
  "PROFILE",
  "OTHER",
] as const;
export type LogArea = (typeof LOG_AREAS)[number];

export const LOG_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type LogMethod = (typeof LOG_METHODS)[number];

export const TIME_WINDOWS = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": APPLICATION_LOG_DAY_MS,
  "7d": APPLICATION_LOG_RETENTION_MS,
} as const;
export type TimeWindow = keyof typeof TIME_WINDOWS;

export const PAGE_SIZES = [25, 50, 100] as const;

export const AREA_LABELS: Record<LogArea, string> = {
  AUTH: "Auth",
  MENTORSHIP: "Mentorship",
  REVIEWS: "Reviews",
  COLLABORATE: "Collaborate",
  STUDENT: "Students",
  MENTOR: "Mentors",
  SUBMISSIONS: "Submissions",
  CHAT: "Chat",
  ADMIN: "Admin",
  ACCESS: "Application Access",
  PROFILE: "Profile",
  OTHER: "Other",
};

export const ROLE_LABELS: Record<LogRole, string> = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  ADMIN: "Admin",
  SUPERADMIN: "Super admin",
};

const ROUTES: { prefix: string; area: LogArea; operation: string }[] = [
  { prefix: "/superadmin/universities", area: "OTHER", operation: "Viewed university management" },
  { prefix: "/superadmin/batches", area: "OTHER", operation: "Viewed batch management" },
  { prefix: "/superadmin/resources", area: "OTHER", operation: "Viewed resource management" },
  { prefix: "/superadmin/logs", area: "ACCESS", operation: "Viewed application logs" },
  { prefix: "/superadmin/users", area: "ACCESS", operation: "Viewed users" },
  { prefix: "/superadmin/roles", area: "ACCESS", operation: "Viewed roles" },
  { prefix: "/superadmin", area: "ACCESS", operation: "Viewed overview" },
  { prefix: "/admin/students", area: "STUDENT", operation: "Viewed students" },
  { prefix: "/admin/mentors", area: "MENTOR", operation: "Viewed mentors" },
  { prefix: "/admin/submissions", area: "SUBMISSIONS", operation: "Viewed submissions" },
  { prefix: "/admin/assignments", area: "ADMIN", operation: "Viewed assignments" },
  { prefix: "/admin/tech-stacks", area: "ADMIN", operation: "Viewed tech stacks" },
  { prefix: "/admin/approvals", area: "ADMIN", operation: "Viewed mentor approvals" },
  { prefix: "/admin/audit", area: "ADMIN", operation: "Viewed audit logs" },
  { prefix: "/admin", area: "ADMIN", operation: "Viewed admin overview" },
  { prefix: "/student/overview", area: "STUDENT", operation: "Viewed student overview" },
  { prefix: "/student/organisations", area: "STUDENT", operation: "Viewed organisations" },
  { prefix: "/student/activity", area: "STUDENT", operation: "Viewed GitHub activity" },
  { prefix: "/student/repositories", area: "STUDENT", operation: "Viewed repositories" },
  { prefix: "/student/pull-requests", area: "STUDENT", operation: "Viewed pull requests" },
  { prefix: "/student/submissions", area: "SUBMISSIONS", operation: "Viewed submissions" },
  { prefix: "/student/mentor", area: "MENTOR", operation: "Viewed mentor" },
  { prefix: "/student/chat", area: "CHAT", operation: "Viewed chat" },
  { prefix: "/student/profile", area: "PROFILE", operation: "Viewed profile" },
  { prefix: "/student", area: "STUDENT", operation: "Viewed student overview" },
  { prefix: "/mentor/students", area: "MENTOR", operation: "Viewed assigned students" },
  { prefix: "/mentor/pull-requests", area: "MENTOR", operation: "Viewed assigned pull requests" },
  { prefix: "/mentor/reviews", area: "REVIEWS", operation: "Viewed pending reviews" },
  { prefix: "/mentor/history", area: "REVIEWS", operation: "Viewed review history" },
  { prefix: "/mentor/tech-stack", area: "MENTOR", operation: "Viewed tech stack" },
  { prefix: "/mentor/chat", area: "CHAT", operation: "Viewed chat" },
  { prefix: "/mentor/profile", area: "PROFILE", operation: "Viewed profile" },
  { prefix: "/mentor", area: "MENTOR", operation: "Viewed mentor overview" },
  { prefix: "/mentorship", area: "MENTORSHIP", operation: "Viewed mentorship" },
  { prefix: "/reviews", area: "REVIEWS", operation: "Viewed reviews" },
  { prefix: "/collaborate", area: "COLLABORATE", operation: "Viewed collaborate" },
  { prefix: "/login", area: "AUTH", operation: "Viewed sign in" },
  { prefix: "/signup", area: "AUTH", operation: "Viewed sign up" },
];

export type LogQuery = {
  search: string;
  window: TimeWindow;
  role: LogRole | "all";
  area: LogArea | "all";
  outcome: "all" | "ok" | "failed";
  method: LogMethod | "all";
  slow: boolean;
  page: number;
  pageSize: (typeof PAGE_SIZES)[number];
};

export type HourPoint = { label: string; count: number };

export type LogsDashboard = {
  updatedAt: string;
  performance: {
    activeNow: number;
    requests24h: number;
    errors24h: number;
    errorRate: number;
    averageMs: number;
  };
  hours: HourPoint[];
  peak: { count: number; label: string } | null;
  roles: { role: LogRole; name: string; count: number }[];
  areas: { area: LogArea; label: string; count: number }[];
  activity: {
    total: number;
    failed: number;
    averageMs: number;
    page: number;
    pageSize: number;
    rows: {
      id: string;
      createdAt: string;
      actorName: string;
      actorEmail: string;
      role: LogRole | null;
      operation: string;
      area: LogArea;
      areaLabel: string;
      method: string;
      path: string;
      statusCode: number;
      durationMs: number;
    }[];
  };
};

export function safeRequestPath(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return normalized.slice(0, 300);
}

export function shouldRecordRequest(input: {
  path: string;
  prefetch: boolean;
  serverAction: boolean;
}): boolean {
  if (input.prefetch || input.serverAction) {
    return false;
  }

  const path = safeRequestPath(input.path);
  if (path.startsWith("/_next") || path.startsWith("/api/")) {
    return false;
  }

  return path.length > 1 || path === "/";
}

export function classifyRequest(path: string): { area: LogArea; operation: string } {
  const pathname = safeRequestPath(path);
  if (pathname === "/") {
    return { area: "OTHER", operation: "Viewed home" };
  }

  const match = ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
  if (match) {
    return { area: match.area, operation: match.operation };
  }

  return { area: "OTHER", operation: "Viewed a page" };
}

export function sanitizeMethod(method: string): LogMethod {
  const upper = method.toUpperCase();
  return LOG_METHODS.find((item) => item === upper) ?? "GET";
}

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}

export function parseLogQuery(params: {
  q?: string | string[];
  time?: string | string[];
  role?: string | string[];
  area?: string | string[];
  outcome?: string | string[];
  method?: string | string[];
  slow?: string | string[];
  show?: string | string[];
  page?: string | string[];
}): LogQuery {
  const time = one(params.time);
  const role = one(params.role);
  const area = one(params.area);
  const outcome = one(params.outcome);
  const method = one(params.method);
  const show = Number(one(params.show));
  const page = Number(one(params.page));

  return {
    search: one(params.q).slice(0, 80),
    window: time in TIME_WINDOWS ? (time as TimeWindow) : "7d",
    role: LOG_ROLES.find((item) => item === role) ?? "all",
    area: LOG_AREAS.find((item) => item === area) ?? "all",
    outcome: outcome === "ok" || outcome === "failed" ? outcome : "all",
    method: LOG_METHODS.find((item) => item === method) ?? "all",
    slow: one(params.slow) === "1",
    page: Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1,
    pageSize: PAGE_SIZES.find((item) => item === show) ?? 25,
  };
}

export function serializeLogQuery(query: LogQuery): string {
  const params = new URLSearchParams();
  if (query.search) {
    params.set("q", query.search);
  }
  if (query.window !== "7d") {
    params.set("time", query.window);
  }
  if (query.role !== "all") {
    params.set("role", query.role);
  }
  if (query.area !== "all") {
    params.set("area", query.area);
  }
  if (query.outcome !== "all") {
    params.set("outcome", query.outcome);
  }
  if (query.method !== "all") {
    params.set("method", query.method);
  }
  if (query.slow) {
    params.set("slow", "1");
  }
  if (query.pageSize !== 25) {
    params.set("show", String(query.pageSize));
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }
  return params.toString();
}

export function areasMatchingSearch(search: string): LogArea[] {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  return LOG_AREAS.filter(
    (area) => AREA_LABELS[area].toLowerCase().includes(needle) || area.toLowerCase().includes(needle),
  );
}

function istParts(date: Date): { key: string; hour: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APPLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    key: `${read("year")}-${read("month")}-${read("day")}T${read("hour")}`,
    hour: read("hour"),
  };
}

export function activityHours(
  events: { createdAt: Date; userId: string | null }[],
  now: Date,
): { series: HourPoint[]; peak: { count: number; label: string } | null } {
  const slots = Array.from({ length: 24 }, (_, index) => {
    const instant = new Date(now.getTime() - (23 - index) * 60 * 60 * 1000);
    const parts = istParts(instant);
    return { key: parts.key, label: `${parts.hour}:00`, users: new Set<string>() };
  });

  for (const event of events) {
    if (!event.userId) {
      continue;
    }
    const slot = slots.find((item) => item.key === istParts(event.createdAt).key);
    slot?.users.add(event.userId);
  }

  const series = slots.map((slot) => ({ label: slot.label, count: slot.users.size }));
  const peak = series.reduce<{ count: number; label: string } | null>((best, point) => {
    if (point.count === 0) {
      return best;
    }
    if (!best || point.count >= best.count) {
      return point;
    }
    return best;
  }, null);

  return { series, peak };
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 1000) {
    return `${Math.max(0, Math.round(ms || 0))} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatLogTime(value: Date): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: APPLICATION_TIME_ZONE,
  }).format(value);
  return `${formatted} IST`;
}

export function durationMs(startedAt: number, now = Date.now()): number {
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(now - startedAt, 120_000));
}
