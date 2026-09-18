import React, { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Confia] render_error", {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  private recover = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="confia-error-screen" role="alert">
        <div className="confia-card max-w-md p-6 text-center">
          <p className="confia-eyebrow">Confia</p>
          <h1 className="mt-2 text-xl font-black text-[var(--cf-text)]">Algo correu mal</h1>
          <p className="mt-2 text-sm text-[var(--cf-text-soft)]">A aplicação encontrou um erro inesperado. Os teus dados locais não são apagados.</p>
          <button type="button" onClick={this.recover} className="confia-action mt-5 w-full bg-[var(--cf-primary)] px-4 py-3 text-sm text-white">
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }
}
