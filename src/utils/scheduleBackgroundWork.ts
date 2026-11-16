type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Run non-critical work after the first useful paint, preferring idle time. */
export function scheduleBackgroundWork(task: () => void, delayMs: number, idleTimeoutMs: number): () => void {
  if (typeof window === "undefined") return () => {};
  const idleWindow = window as IdleWindow;

  let cancelled = false;
  let delayTimer: number | undefined;
  let fallbackTimer: number | undefined;
  let idleHandle: number | undefined;
  let usesIdleCallback = false;

  const schedule = () => {
    delayTimer = undefined;
    if (cancelled) return;
    if (typeof idleWindow.requestIdleCallback === "function") {
      usesIdleCallback = true;
      idleHandle = idleWindow.requestIdleCallback(() => {
        idleHandle = undefined;
        if (!cancelled) task();
      }, { timeout: idleTimeoutMs });
      return;
    }

    // WebViews without requestIdleCallback still get a separate task turn,
    // allowing the browser to paint and dispatch pending input first.
    fallbackTimer = window.setTimeout(() => {
      fallbackTimer = undefined;
      if (!cancelled) task();
    }, 240);
  };

  delayTimer = window.setTimeout(schedule, Math.max(0, delayMs));

  return () => {
    cancelled = true;
    if (delayTimer !== undefined) window.clearTimeout(delayTimer);
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    if (usesIdleCallback && idleHandle !== undefined) {
      idleWindow.cancelIdleCallback?.(idleHandle);
    }
    delayTimer = undefined;
    fallbackTimer = undefined;
    idleHandle = undefined;
  };
}
