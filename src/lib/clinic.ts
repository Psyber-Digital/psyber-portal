// The weekly group clinic (Offer Ladder stage 5; Build terms 2.3).
// Wednesdays, 12:00 to 1:00pm US Eastern (Don, board move m12).

export const CLINIC_ZONE = "America/New_York";
const WEEKDAY = 3; // Wednesday
const HOUR = 12;
const MINUTES = 60;

// The offset (ms) of a time zone from UTC at a given moment, using only Intl,
// so daylight saving changes are handled by the platform.
function zoneOffset(at: Date, zone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - at.getTime();
}

// The start of the current or next clinic. A clinic that started less than an
// hour ago still counts, so the Zoom button stays up while it runs.
export function nextClinic(now = new Date()): { start: Date; live: boolean } {
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    const local = new Date(d.getTime() + zoneOffset(d, CLINIC_ZONE));
    if (local.getUTCDay() !== WEEKDAY) continue;
    const guess = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), HOUR);
    const start = new Date(guess - zoneOffset(new Date(guess), CLINIC_ZONE));
    const end = start.getTime() + MINUTES * 60_000;
    if (end <= now.getTime()) continue;
    return { start, live: start.getTime() <= now.getTime() };
  }
  // Unreachable: some Wednesday always falls within 8 days.
  throw new Error("no clinic found");
}

export function clinicLabel(start: Date) {
  const date = start.toLocaleDateString("en-US", {
    timeZone: CLINIC_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = start.toLocaleTimeString("en-US", {
    timeZone: CLINIC_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time} Eastern`;
}
