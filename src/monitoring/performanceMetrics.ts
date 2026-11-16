type PerformanceDetails = Record<string, number | string | boolean>;

function isPerformanceMeasurementEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    return new URLSearchParams(window.location.search).get("confiaPerf") === "1";
  } catch {
    return false;
  }
}

/**
 * Lightweight, opt-in timing for real device/browser sessions.
 * Enable in production preview with ?confiaPerf=1; no user content or IDs
 * are collected. Each span reports only its duration and optional counters.
 */
export function startPerformanceSpan(label: string, details?: PerformanceDetails): () => number | null {
  if (!isPerformanceMeasurementEnabled() || typeof performance === "undefined") {
    return () => null;
  }

  const startedAt = performance.now();
  let finished = false;

  return (extra?: PerformanceDetails) => {
    if (finished) return null;
    finished = true;
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
    console.info("[CONFIA PERF]", {
      metric: label,
      durationMs,
      ...details,
      ...extra,
    });
    return durationMs;
  };
}

export function recordPerformanceValue(label: string, value: number, details?: PerformanceDetails): void {
  if (!isPerformanceMeasurementEnabled()) return;
  console.info("[CONFIA PERF]", { metric: label, value, ...details });
}
