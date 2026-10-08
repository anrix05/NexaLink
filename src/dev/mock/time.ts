// Relative-date helpers calculated at runtime from "now"
// Ensures demo data never looks stale regardless of when it is presented.

export function nowMs(): number {
  return Date.now();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysAgo(days: number, hours = 0, minutes = 0): string {
  const d = new Date(Date.now() - (days * 86400000 + hours * 3600000 + minutes * 60000));
  return d.toISOString();
}

export function daysFromNow(days: number, hours = 0, minutes = 0): string {
  const d = new Date(Date.now() + (days * 86400000 + hours * 3600000 + minutes * 60000));
  return d.toISOString();
}

export function hoursAgo(hours: number, minutes = 0): string {
  const d = new Date(Date.now() - (hours * 3600000 + minutes * 60000));
  return d.toISOString();
}

export function hoursFromNow(hours: number): string {
  const d = new Date(Date.now() + hours * 3600000);
  return d.toISOString();
}

export function minutesAgo(minutes: number): string {
  const d = new Date(Date.now() - minutes * 60000);
  return d.toISOString();
}

export function dateOnlyString(isoString: string): string {
  return isoString.split('T')[0];
}
