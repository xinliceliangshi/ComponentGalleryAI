export function safeLower(s: string | undefined): string {
  return (s ?? "").toLowerCase();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
