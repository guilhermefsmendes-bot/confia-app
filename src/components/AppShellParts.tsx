import React, { Suspense } from "react";

export function LazySection({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function ScreenLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div role="status" aria-live="polite" className="rounded-full border border-[#E8DDD4] bg-white/90 px-4 py-2 text-xs font-bold text-[#795B50] shadow-sm">
        {label}
      </div>
    </div>
  );
}
