import type { HTMLAttributes, PropsWithChildren } from "react";

type SectionProps = PropsWithChildren<HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title?: string;
  description?: string;
}>;

export function Section({ eyebrow, title, description, className = "", children, ...props }: SectionProps) {
  return <section className={`space-y-4 ${className}`} {...props}>
    {(eyebrow || title || description) && <header className="space-y-1">
      {eyebrow && <p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--cf-primary)]">{eyebrow}</p>}
      {title && <h2 className="text-lg font-black tracking-tight text-[var(--cf-text)]">{title}</h2>}
      {description && <p className="max-w-2xl text-sm leading-6 text-[var(--cf-text-soft)]">{description}</p>}
    </header>}
    {children}
  </section>;
}
