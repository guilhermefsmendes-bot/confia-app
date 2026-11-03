export function startPerformanceDiagnostics(): void {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  const startedAt = performance.now();
  let longTaskCount = 0;
  let largestContentfulPaint = 0;
  const observers: PerformanceObserver[] = [];
  const observe = (type: string, callback: (entry: PerformanceEntry) => void) => {
    try {
      const observer = new PerformanceObserver(list => list.getEntries().forEach(callback));
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch { /* This browser does not support the entry type. */ }
  };
  observe("longtask", () => { longTaskCount += 1; });
  observe("largest-contentful-paint", entry => { largestContentfulPaint = Math.max(largestContentfulPaint, entry.startTime); });
  let frames = 0;
  let lastFrame = performance.now();
  let raf = 0;
  const sample = (now: number) => {
    frames += 1;
    if (now - lastFrame >= 5000) {
      const elapsed = now - lastFrame;
      const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number } }).memory;
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      console.info("[CONFIA performance diagnostics]", {
        sampleWindowMs: Math.round(elapsed),
        averageFps: Math.round((frames / elapsed) * 1000),
        longTasks: longTaskCount,
        largestContentfulPaintMs: Math.round(largestContentfulPaint),
        domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
        loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null,
        usedHeapMb: memory?.usedJSHeapSize ? Math.round(memory.usedJSHeapSize / 1048576) : null,
        totalHeapMb: memory?.totalJSHeapSize ? Math.round(memory.totalJSHeapSize / 1048576) : null,
        elapsedSinceMonitorStartMs: Math.round(now - startedAt),
      });
      frames = 0;
      longTaskCount = 0;
      lastFrame = now;
      observers.forEach(observer => observer.takeRecords());
    }
    raf = window.requestAnimationFrame(sample);
  };
  raf = window.requestAnimationFrame(sample);
  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(raf);
    observers.forEach(observer => observer.disconnect());
  }, { once: true });
}
