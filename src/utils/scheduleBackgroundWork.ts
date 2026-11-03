/** Run non-critical work after the first useful paint, preferring idle time. */
export function scheduleBackgroundWork(task: () => void, delayMs: number, idleTimeoutMs: number): () => void {
  let cancelled = false;
  let delayTimer: number | undefined;
  let idleId: number | undefined;
  const schedule = () => {
    if (cancelled) return;
    const requestIdle = (window as any).requestIdleCallback;
    if (typeof requestIdle === "function") {
      idleId = requestIdle(() => {
        if (!cancelled) task();
      }, { timeout: idleTimeoutMs });
    } else {
      task();
    }
  };
  delayTimer = window.setTimeout(schedule, delayMs);
  return () => {
    cancelled = true;
    if (delayTimer !== undefined) window.clearTimeout(delayTimer);
    if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
  };
}
