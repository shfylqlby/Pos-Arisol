export interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  context: string;
  message: string;
}

const STORAGE_KEY = "pos-logs";
const MAX_ENTRIES = 200;

function read(): LogEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: LogEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* storage full or unavailable */
  }
}

export function logEvent(
  level: LogEntry["level"],
  context: string,
  message: string
): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    context,
    message,
  };
  write([...read(), entry]);
}

export function logError(context: string, err: unknown): void {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  logEvent("error", context, message);
}

export function getLogs(): LogEntry[] {
  return read();
}

export function clearLogs(): void {
  write([]);
}

export function formatLogs(entries: LogEntry[] = read()): string {
  return entries
    .map((e) => `${e.ts} [${e.level.toUpperCase()}] ${e.context}: ${e.message}`)
    .join("\n");
}

let installed = false;

export function installGlobalErrorLogging(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    logEvent(
      "error",
      "window.error",
      `${event.message}${event.filename ? ` (${event.filename}:${event.lineno})` : ""}`
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logEvent(
      "error",
      "unhandledrejection",
      reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason)
    );
  });
}
