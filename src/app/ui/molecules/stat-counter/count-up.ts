/** `1 − (1 − t)⁴`: the design system's StatCounter easing. */
export const easeOutQuart = (t: number): number => 1 - (1 - t) ** 4;

/** The number to show `elapsed` ms into a count-up to `value` that takes `duration` ms. */
export function countAt(value: number, elapsed: number, duration: number): number {
  if (elapsed >= duration) return value;
  return Math.round(value * easeOutQuart(Math.max(0, elapsed) / duration));
}

/** `--duration-count` (tokens.css), in ms. */
export const COUNT_DURATION = 1400;
