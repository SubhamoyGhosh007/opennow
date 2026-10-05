export function matchesCondition(record: Record<string, any>, condition: any): boolean {
  if (!condition || typeof condition !== "object") return false;
  for (const [key, expected] of Object.entries(condition)) {
    const actual = record[key] ?? record[toSnake(key)];
    if (Array.isArray(expected)) {
      if (!expected.map(String).includes(String(actual))) return false;
    } else if (typeof expected === "boolean") {
      const a = actual === true || actual === "true" || actual === 1 || actual === "1";
      if (a !== expected) return false;
    } else {
      if (String(actual) !== String(expected)) return false;
    }
  }
  return true;
}

function toSnake(camel: string): string {
  return camel.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

export function businessMinutesToMs(durationMinutes: number, schedule: string, from: Date): Date {
  // Simplified: 24x7 adds wall-clock minutes; 8x5_weekdays skips weekends + off-hours (9-17).
  if (schedule !== "8x5_weekdays") {
    return new Date(from.getTime() + durationMinutes * 60_000);
  }
  let remaining = durationMinutes;
  const cursor = new Date(from);
  let guard = 0;
  const maxGuard = Math.max(525600, durationMinutes * 10);
  while (remaining > 0 && guard++ < maxGuard) {
    const day = cursor.getDay();
    const hour = cursor.getHours();
    const isWorkday = day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    if (isWorkday) {
      remaining -= 1;
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return cursor;
}
