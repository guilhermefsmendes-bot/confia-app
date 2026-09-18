import type { HTMLAttributes, PropsWithChildren } from "react";

type SurfaceProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "soft" | "warm";
}>;

export function Surface({ tone = "default", className = "", children, ...props }: SurfaceProps) {
  const toneClass = tone === "warm" ? "bg-[var(--cf-surface-warm)]" : tone === "soft" ? "bg-[var(--cf-surface-soft)]" : "bg-[var(--cf-surface)]";
  return <div className={`rounded-[var(--cf-radius-lg)] border border-[var(--cf-border)] ${toneClass} shadow-sm ${className}`} {...props}>{children}</div>;
}
