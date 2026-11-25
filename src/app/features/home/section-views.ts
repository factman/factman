/** Visible share of the viewport (or of the section) that counts as a view. */
const SHARE = 0.5;
/** Ratios the observer reports at: fine enough to catch a tall section reaching half the screen. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Calls `onView(id)` once per section the first time it is in view: half of it visible, or (for
 * a section taller than the screen) half the screen filled by it. Sections missing from the page
 * are skipped. Returns a function that stops watching; without IntersectionObserver it does
 * nothing.
 */
export function watchSectionViews(
  doc: Document,
  ids: readonly string[],
  onView: (id: string) => void,
): () => void {
  const win = doc.defaultView;
  if (!win || typeof win.IntersectionObserver !== 'function') return () => undefined;
  const seen = new Set<string>();
  const observer = new win.IntersectionObserver(
    (entries) => {
      const screen = win.innerHeight || doc.documentElement.clientHeight;
      for (const entry of entries) {
        const id = entry.target.id;
        if (seen.has(id) || !entry.isIntersecting) continue;
        const inView =
          entry.intersectionRatio >= SHARE || entry.intersectionRect.height >= screen * SHARE;
        if (!inView) continue;
        seen.add(id);
        observer.unobserve(entry.target);
        onView(id);
      }
    },
    { threshold: THRESHOLDS },
  );
  for (const id of ids) {
    const el = doc.getElementById(id);
    if (el) observer.observe(el);
  }
  return () => observer.disconnect();
}
