/**
 * Date utilities with timezone support for business date
 */

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export function getNowISO(): string {
  return new Date().toISOString();
}

/**
 * Returns YYYY-MM-DD in the specified timezone (default Asia/Jakarta)
 */
export function getBusinessDate(
  date: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // format "en-CA" gives YYYY-MM-DD
}

export function formatDateTime(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: timezone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTime(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateShort(
  isoString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: timezone,
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}
