import { Sparkles } from "lucide-react";
import type { AvatarState } from "../../types";
import { useTranslation } from "react-i18next";

type Props = { avatar: AvatarState };

export function AppHeader({ avatar }: Props) {
  const { t } = useTranslation();
  return (
    <header className="confia-header sticky top-0 z-40 px-4 py-3.5 sm:px-6">
      <div className="confia-header-inner mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/images/confia-icon.png" alt="Confia" className="confia-brand-mark h-10 w-10 rounded-2xl shadow-md" />
          <h1 className="font-display text-xl font-black tracking-tight text-[var(--cf-primary)]">Confia</h1>
        </div>
        <div className="confia-level-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          <Sparkles size={13} strokeWidth={1.9} className="text-[var(--cf-primary)]" />
          {t("level")} {avatar.level}
        </div>
      </div>
    </header>
  );
}
