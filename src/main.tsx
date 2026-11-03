import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { i18nReady } from "./i18n";

function StartupShell() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6"
      aria-label="Confia"
      aria-busy="true"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-sm ring-1 ring-[#E8DED4]">
          <span className="text-3xl" aria-hidden="true">♡</span>
        </div>
        <div className="space-y-2">
          <p className="font-semibold tracking-[0.16em] text-[#76564B]">CONFIA</p>
          <div className="mx-auto h-1.5 w-36 overflow-hidden rounded-full bg-[#E8DED4]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#B87560]" />
          </div>
          <p className="text-xs text-[#8B7B72]">A preparar o teu espaço…</p>
        </div>
      </div>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Elemento #root não encontrado.");

const root = createRoot(rootElement);

// Mostra imediatamente uma estrutura leve. A aplicação e o idioma ativo
// descarregam em paralelo; a primeira pintura não fica à espera do JSON.
root.render(
  <StrictMode>
    <StartupShell />
  </StrictMode>,
);

// App Check é opcional e não deve bloquear a apresentação da interface.
void import("./firebaseAppCheck")
  .then(({ initAppCheck }) => initAppCheck())
  .catch((error) => console.error("Firebase App Check:", error));
void import("./monitoring/errorReporter").then(({ installRuntimeErrorReporting }) => installRuntimeErrorReporting()).catch(() => {});
if (import.meta.env.DEV) {
  void import("./monitoring/performanceDiagnostics").then(({ startPerformanceDiagnostics }) => startPerformanceDiagnostics()).catch(() => {});
}

void Promise.all([i18nReady, import("./App.tsx")])
  .then(([, appModule]) => {
    root.render(
      <StrictMode>
        <AppErrorBoundary>
          <appModule.default />
        </AppErrorBoundary>
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error("Não foi possível iniciar a Confia:", error);
    root.render(
      <main className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="font-semibold text-[#76564B]">Não foi possível abrir a Confia.</p>
          <p className="text-sm text-[#8B7B72]">Verifica a ligação e tenta novamente.</p>
          <button
            type="button"
            className="rounded-full bg-[#934A38] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </main>,
    );
  });
