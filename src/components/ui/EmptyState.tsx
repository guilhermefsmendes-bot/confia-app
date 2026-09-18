import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

type EmptyStateProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title: string;
  description?: string;
}>;

export function EmptyState({ icon, title, description, children, className = "", ...props }: EmptyStateProps) {
  return <div role="status" className={`flex flex-col items-center justify-center rounded-[var(--cf-radius-lg)] border border-dashed border-[var(--cf-border-strong)] bg-[var(--cf-surface-soft)] px-6 py-10 text-center ${className}`} {...props}>
    {icon && <div className="mb-3 text-[var(--cf-primary)]">{icon}</div>}
    <h3 className="text-sm font-black text-[var(--cf-text)]">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--cf-text-soft)]">{description}</p>}
    {children}
  </div>;
}
