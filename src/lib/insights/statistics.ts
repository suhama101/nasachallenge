export function median(values: readonly number[]): number | null {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2
    ? usable[middle]
    : (usable[middle - 1] + usable[middle]) / 2;
}
export function mean(values: readonly number[]): number | null {
  const usable = values.filter(Number.isFinite);
  return usable.length
    ? usable.reduce((sum, n) => sum + n, 0) / usable.length
    : null;
}
export function standardDeviation(values: readonly number[]): number | null {
  const usable = values.filter(Number.isFinite);
  const average = mean(usable);
  return average === null || usable.length < 2
    ? null
    : Math.sqrt(
        usable.reduce((sum, n) => sum + (n - average) ** 2, 0) / usable.length,
      );
}
export function percentageChange(
  current: number,
  baseline: number,
): number | null {
  return !Number.isFinite(current) ||
    !Number.isFinite(baseline) ||
    baseline === 0
    ? null
    : (100 * (current - baseline)) / Math.abs(baseline);
}
export function regressionSlope(
  points: readonly { day: number; value: number }[],
): number | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.day) && Number.isFinite(point.value),
  );
  if (usable.length < 3 || new Set(usable.map((point) => point.day)).size < 3)
    return null;
  const x = mean(usable.map((p) => p.day))!;
  const y = mean(usable.map((p) => p.value))!;
  const denominator = usable.reduce((sum, p) => sum + (p.day - x) ** 2, 0);
  return denominator
    ? usable.reduce((sum, p) => sum + (p.day - x) * (p.value - y), 0) /
        denominator
    : null;
}
