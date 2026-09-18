import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EyeOff, Feather, LockKeyhole, Sparkles, Wind, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const PARTICLES = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  x: ((index * 47) % 180) - 90,
  y: -(((index * 31) % 120) + 40),
  rotate: (index * 29) % 180 - 90,
  delay: (index % 7) * 0.018,
  scale: 0.55 + (index % 5) * 0.1,
}));

const MAX_LENGTH = 2400;

export function BlindVent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [text, setText] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const releaseTimerRef = useRef<number | null>(null);

  const canRelease = text.trim().length > 0 && !releasing && !released;
  const particleSet = useMemo(() => PARTICLES, []);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      if (releaseTimerRef.current !== null) {
        window.clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  const close = () => {
    // Defensive cleanup: the session is intentionally ephemeral.
    setText("");
    setReleased(true);
    onClose();
  };

  const release = () => {
    if (!canRelease) return;
    setReleasing(true);

    // Never persist, emit, hash, log or send the content. After the visual
    // transition the only copy of the text held by this feature is removed.
    releaseTimerRef.current = window.setTimeout(() => {
      setText("");
      setReleasing(false);
      setReleased(true);
    }, reducedMotion ? 80 : 720);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="blind-vent"
        className="fixed inset-0 z-[70] flex items-end justify-center bg-[#302622]/45 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blind-vent-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.section
          initial={{ opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-[#FFFDF9] shadow-[0_30px_80px_rgba(54,39,32,0.25)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(229,168,139,0.28),transparent_68%)]" />

          <header className="relative flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E8DF] text-[#A85F45]">
                <EyeOff size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B9785D]">
                  {t("blindVent.eyebrow")}
                </p>
                <h2 id="blind-vent-title" className="mt-1 text-xl font-black tracking-tight text-[#493A35]">
                  {t("blindVent.title")}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#F7EEE9] hover:text-[#6E5146]"
              aria-label={t("blindVent.close")}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
            {!released ? (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#E9DDD6] bg-white/80 px-3.5 py-3 text-xs font-semibold leading-relaxed text-[#735F57]">
                  <LockKeyhole size={15} className="shrink-0 text-[#A85F45]" aria-hidden="true" />
                  <span>{t("blindVent.privacy")}</span>
                </div>

                <div className="relative overflow-hidden rounded-[24px] border border-[#E6DAD2] bg-white shadow-inner">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    maxLength={MAX_LENGTH}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={t("blindVent.placeholder")}
                    className="min-h-[260px] w-full resize-none bg-transparent px-5 py-5 text-[16px] leading-7 text-[#493A35] outline-none placeholder:text-[#B6A59D]"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={t("blindVent.textAreaLabel")}
                    disabled={releasing}
                  />
                  <div className="flex items-center justify-between border-t border-[#EEE4DE] px-4 py-2.5 text-[10px] font-bold text-[#A8958C]">
                    <span>{t("blindVent.noHistory")}</span>
                    <span aria-live="polite">{text.length}/{MAX_LENGTH}</span>
                  </div>

                  {releasing && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white/15">
                      {reducedMotion ? null : particleSet.map((particle) => (
                        <motion.span
                          key={particle.id}
                          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#934A38]"
                          initial={{ x: 0, y: 0, opacity: 0.9, scale: particle.scale }}
                          animate={{
                            x: particle.x,
                            y: particle.y,
                            rotate: particle.rotate,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={{ duration: 0.65, delay: particle.delay, ease: "easeOut" }}
                        />
                      ))}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.65, times: [0, 0.2, 1] }}
                      >
                        <Wind size={34} className="text-[#934A38]" aria-hidden="true" />
                      </motion.div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={release}
                  disabled={!canRelease}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#934A38] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#934A38]/20 transition hover:bg-[#B86C51] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Feather size={17} aria-hidden="true" />
                  {t("blindVent.release")}
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[340px] flex-col items-center justify-center px-4 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8E8DF] text-[#A85F45]">
                  <Sparkles size={28} aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-[#493A35]">{t("blindVent.releasedTitle")}</h3>
                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#79665E]">{t("blindVent.releasedText")}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 min-h-11 rounded-2xl border border-[#E3D5CE] bg-white px-6 py-3 text-xs font-black text-[#6E5146] transition hover:bg-[#FAF5F1]"
                >
                  {t("blindVent.done")}
                </button>
              </motion.div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

export default BlindVent;
