type RenderErrorContext = { componentStack?: string | null };
let reported = 0;
const MAX_PER_SESSION = 5;
function endpoint(): string | null {
  const value = String(import.meta.env.VITE_ERROR_REPORT_URL || "").trim();
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
}
export function reportRenderError(error: Error, context: RenderErrorContext = {}): void {
  const target = endpoint();
  if (!target || reported >= MAX_PER_SESSION || typeof fetch !== "function") return;
  reported += 1;
  // Do not transmit error messages, stack traces, user IDs, routes, diary text or component props.
  const payload = {
    type: "render_error",
    errorName: typeof error.name === "string" ? error.name.slice(0, 80) : "Error",
    componentStack: typeof context.componentStack === "string" ? context.componentStack.slice(0, 1200) : "",
    occurredAt: new Date().toISOString(),
  };
  void fetch(target, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => { /* Monitoring must never affect app availability. */ });
}

export function installRuntimeErrorReporting(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", event => {
    const error = event.error instanceof Error ? event.error : new Error("RuntimeError");
    reportRenderError(error);
  });
  window.addEventListener("unhandledrejection", () => {
    reportRenderError(new Error("UnhandledRejection"));
  });
}
