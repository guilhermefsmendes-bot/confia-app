export function startPerformanceDiagnostics(): void {
  if (typeof window === "undefined" || (!import.meta.env.DEV && new URLSearchParams(window.location.search).get("confiaPerf") !== "1")) return;
  const startedAt = performance.now();
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const paintEntries = performance.getEntriesByType("paint");
  let firstContentfulPaint = paintEntries.find(entry => entry.name === "first-contentful-paint")?.startTime ?? null;
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
  observe("paint", entry => {
    if (entry.name === "first-contentful-paint" && firstContentfulPaint === null) firstContentfulPaint = entry.startTime;
  });
  observe("largest-contentful-paint", entry => { largestContentfulPaint = Math.max(largestContentfulPaint, entry.startTime); });
  let frames = 0;
  let lastFrame = performance.now();
  let raf = 0;
  let stopped = false;

  const stopSampling = () => {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  };
  const sample = (now: number) => {
    if (stopped || document.visibilityState === "hidden") {
      raf = 0;
      return;
    }
    frames += 1;
    if (now - lastFrame >= 5000) {
      const elapsed = now - lastFrame;
      const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number } }).memory;
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const firebaseResources = resources.filter(entry => /firebase|firestore|identitytoolkit|securetoken/i.test(entry.name));
      const firebaseDurationMs = firebaseResources.reduce((total, entry) => total + entry.duration, 0);
      const firebaseTransferBytes = firebaseResources.reduce((total, entry) => total + entry.transferSize, 0);
      console.info("[CONFIA performance diagnostics]", {
        sampleWindowMs: Math.round(elapsed),
        averageFps: Math.round((frames / elapsed) * 1000),
        longTasks: longTaskCount,
        largestContentfulPaintMs: Math.round(largestContentfulPaint),
        firstContentfulPaintMs: firstContentfulPaint === null ? null : Math.round(firstContentfulPaint),
        responseStartMs: navigation ? Math.round(navigation.responseStart) : null,
        domInteractiveMs: navigation ? Math.round(navigation.domInteractive) : null,
        domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
        loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null,
        documentTransferKb: navigation?.transferSize ? Math.round(navigation.transferSize / 1024) : null,
        firebaseRequestCount: firebaseResources.length,
        firebaseDurationMs: Math.round(firebaseDurationMs),
        firebaseTransferKb: firebaseTransferBytes ? Math.round(firebaseTransferBytes / 1024) : null,
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

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      stopSampling();
      return;
    }
    frames = 0;
    lastFrame = performance.now();
    if (!stopped && !raf) raf = window.requestAnimationFrame(sample);
  };
  const cleanup = () => {
    stopped = true;
    stopSampling();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    observers.forEach(observer => observer.disconnect());
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  if (document.visibilityState !== "hidden") raf = window.requestAnimationFrame(sample);
  window.addEventListener("pagehide", cleanup, { once: true });
}
