/** Returns an ISO-like calendar date using the user's local timezone. */
export function getLocalCalendarDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCalendarDaysDifference(
  previousDate: string | null,
  currentDate: string,
): number | undefined {
  if (!previousDate) return undefined;

  const previousParts = previousDate.split("-").map(Number);
  const currentParts = currentDate.split("-").map(Number);

  if (
    previousParts.length !== 3 ||
    currentParts.length !== 3 ||
    previousParts.some(Number.isNaN) ||
    currentParts.some(Number.isNaN)
  ) {
    return undefined;
  }

  const previousUtc = Date.UTC(
    previousParts[0],
    previousParts[1] - 1,
    previousParts[2],
  );
  const currentUtc = Date.UTC(
    currentParts[0],
    currentParts[1] - 1,
    currentParts[2],
  );

  return Math.max(0, Math.round((currentUtc - previousUtc) / (24 * 60 * 60 * 1000)));
}
