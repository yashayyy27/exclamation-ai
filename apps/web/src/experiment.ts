export function sampleSize(baseline: number, relativeMde: number): number {
  const p = baseline / 100,
    delta = (p * relativeMde) / 100;
  if (p <= 0 || p >= 1 || delta <= 0 || p + delta >= 1) return NaN;
  return Math.ceil(
    (2 * Math.pow(1.96 + 0.8416, 2) * p * (1 - p)) / (delta * delta),
  );
}
