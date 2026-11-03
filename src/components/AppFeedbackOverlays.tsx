import type { TFunction } from "i18next";
import { Gift } from "lucide-react";

type CommunityGuidelinesModalProps = {
  open: boolean;
  onClose: () => void;
  t: TFunction;
};

export function CommunityGuidelinesModal({ open, onClose, t }: CommunityGuidelinesModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-[#2F2926]">{t("communityGuidelines")}</h2>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-[var(--cf-text-soft)]" aria-label={t("close")}>×</button>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed">{t("communityGuidelinesDescription")}</div>
        <button type="button" onClick={onClose} className="w-full mt-6 py-3.5 rounded-2xl bg-[#F3E3DC] border border-[#B85F48]/30 text-[#934A38] font-black text-xs uppercase tracking-wide">{t("close")}</button>
      </div>
    </div>
  );
}

type LevelUpOverlayProps = {
  open: boolean;
  previousLevel: number;
  onClose: () => void;
  t: TFunction;
};

export function LevelUpOverlay({ open, previousLevel, onClose, t }: LevelUpOverlayProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="confia-motion-enter bg-white rounded-[32px] p-7 text-center max-w-sm border border-[#B85F48]/20 shadow-2xl space-y-4">
        <div className="w-16 h-16 bg-[#F3E3DC] rounded-full flex items-center justify-center mx-auto text-[#934A38] animate-bounce">
          <Gift size={32} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-[#2F2926] font-display">{t("companionEvolution")}</h3>
          <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed font-semibold">{t("guardianEvolution")}</p>
          <div className="py-2.5 px-4 bg-[#B85F48]/15 text-[#934A38] border border-[#B85F48]/30 rounded-2xl text-xs font-black font-display">{t("levelReached", { level: previousLevel })} 🎉</div>
          <p className="text-[10px] text-[var(--cf-muted)] font-extrabold font-mono uppercase tracking-wider">{t("extraReward")}</p>
        </div>
        <button type="button" onClick={onClose} className="w-full py-3 bg-[#B85F48] hover:bg-[#D59375] text-white shadow-lg shadow-[#B85F48]/25 font-black text-xs uppercase tracking-wider font-display rounded-xl cursor-pointer">{t("continueWalking")}</button>
      </div>
    </div>
  );
}
