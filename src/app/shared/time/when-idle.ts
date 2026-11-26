/**
 * Runs `task` once the browser is idle, or after `timeout` ms at the latest (ETE-126). Work that
 * the first paint doesn't need (third-party scripts, the first-visit consent banner) waits here,
 * so it runs in its own short task instead of inside the bootstrap task that blocks the page.
 * Returns a function that cancels it. Without `requestIdleCallback` (Safari), a timeout stands in.
 */
export function whenIdle(
  win: Window | null | undefined,
  task: () => void,
  timeout = 2000,
): () => void {
  if (!win) return () => undefined;
  const idle = win as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (idle.requestIdleCallback) {
    const id = idle.requestIdleCallback(task, { timeout });
    return () => idle.cancelIdleCallback?.(id);
  }
  const id = win.setTimeout(task, 1);
  return () => win.clearTimeout(id);
}
