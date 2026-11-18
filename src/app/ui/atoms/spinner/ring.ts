/** The design system's spinner ring for a size in px: radius, stroke width and arc path. */
export function spinnerRing(size: number): { r: number; w: number; d: string } {
  const sw = size >= 48 ? 4 : size >= 32 ? 3 : 2;
  const r = 12 - (sw * 12) / size;
  return { r, w: (sw * 24) / size, d: `M12 ${12 - r}a${r} ${r} 0 0 1 ${r} ${r}` };
}
