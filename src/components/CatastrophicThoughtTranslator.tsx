import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Brain, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

type Step = "thought" | "known" | "interpretation" | "uncertain" | "alternative";

const MAX_THOUGHT_LENGTH = 1200;

export default function CatastrophicThoughtTranslator() {
  const { t } = useTranslation();
  const [thought, setThought] = useState("");
  const [step, setStep] = useState<Step>("thought");
  const [known, setKnown] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [uncertain, setUncertain] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const progress = useMemo(() => {
    const steps: Step[] = ["thought", "known", "interpretation", "uncertain", "alternative"];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  }, [step]);

  const canContinue = step === "thought" ? thought.trim().length > 0
    : step === "known" ? known.trim().length > 0
    : step === "interpretation" ? interpretation.trim().length > 0
    : uncertain.trim().length > 0;

  const next = () => {
    if (!canContinue) return;
    if (step === "thought") setStep("known");
    else if (step === "known") setStep("interpretation");
    else if (step === "interpretation") setStep("uncertain");
    else if (step === "uncertain") setStep("alternative");
  };

  const reset = () => {
    setThought("");
    setKnown("");
    setInterpretation("");
    setUncertain("");
    setStep("thought");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const isFinal = step === "alternative";

  return (
    <section
      aria-labelledby="thought-translator-title"
      className="overflow-hidden rounded-[28px] border border-[#B85F48]/20 bg-white shadow-sm"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E3DC] text-[#934A38]">
            <Brain size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#B9785D]">
              {t("thoughtTranslator.eyebrow")}
            </p>
            <h2 id="thought-translator-title" className="mt-1 text-base font-black text-[#2F2926]">
              {t("thoughtTranslator.title")}
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {t("thoughtTranslator.description")}
            </p>
          </div>
        </div>

        <div className="mt-4" aria-hidden="true">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F3E6DF]">
            <div className="h-full rounded-full bg-[#D99A7B] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {step === "thought" && (
          <div className="mt-4">
            <label htmlFor="thought-translator-input" className="text-xs font-black text-[#2F2926]">
              {t("thoughtTranslator.thoughtLabel")}
            </label>
            <textarea
              ref={inputRef}
              id="thought-translator-input"
              value={thought}
              onChange={(event) => setThought(event.target.value.slice(0, MAX_THOUGHT_LENGTH))}
              maxLength={MAX_THOUGHT_LENGTH}
              rows={4}
              placeholder={t("thoughtTranslator.thoughtPlaceholder")}
              className="mt-2 w-full resize-none rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3 text-sm text-[#2F2926] outline-none transition focus:border-[#934A38] focus:ring-2 focus:ring-[#934A38]/15"
            />
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-400">{thought.length}/{MAX_THOUGHT_LENGTH}</p>
            <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-400">{t("thoughtTranslator.privacy")}</p>
          </div>
        )}

        {step !== "thought" && !isFinal && (
          <div className="mt-5">
            <p className="text-sm font-black text-[#2F2926]">{t(`thoughtTranslator.steps.${step}.title`)}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t(`thoughtTranslator.steps.${step}.description`)}</p>
            <textarea
              autoFocus
              value={step === "known" ? known : step === "interpretation" ? interpretation : uncertain}
              onChange={(event) => {
                const value = event.target.value.slice(0, 800);
                if (step === "known") setKnown(value);
                else if (step === "interpretation") setInterpretation(value);
                else setUncertain(value);
              }}
              maxLength={800}
              rows={3}
              className="mt-3 w-full resize-none rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3 text-sm text-[#2F2926] outline-none focus:border-[#934A38] focus:ring-2 focus:ring-[#934A38]/15"
              aria-label={t(`thoughtTranslator.steps.${step}.title`)}
            />
          </div>
        )}

        {isFinal && (
          <div className="mt-5 rounded-2xl border border-[#B85F48]/20 bg-[#FFF9F5] p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#934A38]" aria-hidden="true" />
              <div>
                <p className="text-sm font-black text-[#2F2926]">{t("thoughtTranslator.result.title")}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  {t("thoughtTranslator.result.template", { alternative: t("thoughtTranslator.result.alternative") })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs font-semibold text-[#5B4943]">
              <div><strong>{t("thoughtTranslator.result.known")}:</strong> {known}</div>
              <div><strong>{t("thoughtTranslator.result.interpretation")}:</strong> {interpretation}</div>
              <div><strong>{t("thoughtTranslator.result.uncertain")}:</strong> {uncertain}</div>
              <div><strong>{t("thoughtTranslator.result.alternative")}:</strong> {t("thoughtTranslator.result.alternative")}</div>
            </div>
            <div className="mt-4 flex items-start gap-2 text-[10px] font-semibold leading-4 text-slate-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {t("thoughtTranslator.result.safety")}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {isFinal ? (
            <button type="button" onClick={reset} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F3E3DC] px-4 py-3 text-xs font-black text-[#A85F45]">
              <RotateCcw size={15} aria-hidden="true" /> {t("thoughtTranslator.restart")}
            </button>
          ) : (
            <button type="button" onClick={next} disabled={!canContinue} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#934A38] px-4 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
              {t("thoughtTranslator.continue")} <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
