import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EXPERIMENT_TEMPLATES, experimentSummary, readExperiments, recordExperimentStarted, recordExperimentMeasure, recordExperimentCompleted, writeExperiments, type PersonalExperiment } from "../data/personal/personalExperiments";
import { getLocalCalendarDate } from "../utils/date";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";

function elapsedDays(start: string, end: string) {
  const a = Date.parse(`${start}T12:00:00Z`), b = Date.parse(`${end}T12:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(1, Math.floor((b-a)/86400000)+1) : 1;
}
export default function PersonalExperimentsPanel() {
  const { t } = useTranslation();
  const [revision, setRevision] = useState(0);
  const [items, setItems] = useState<PersonalExperiment[]>(() => readExperiments());
  const [selectedTemplate, setSelectedTemplate] = useState(EXPERIMENT_TEMPLATES[0].id);
  const [storageError, setStorageError] = useState(false);
  const today = getLocalCalendarDate();
  useEffect(() => {
    const refresh = () => { setItems(readExperiments()); setRevision(value => value + 1); };
    window.addEventListener("confia:experiments-updated", refresh);
    return () => window.removeEventListener("confia:experiments-updated", refresh);
  }, []);
  const active = useMemo(() => items.filter(item => item.status === "active"), [items, revision]);
  const completed = useMemo(() => items.filter(item => item.status === "complete").slice(-5).reverse(), [items, revision]);
  const startExperiment = () => {
    const template = EXPERIMENT_TEMPLATES.find(item => item.id === selectedTemplate) || EXPERIMENT_TEMPLATES[0];
    const next: PersonalExperiment = {
      id: `experiment_${Date.now()}`,
      templateId: template.id,
      hypothesis: t(template.hypothesisKey),
      metric: t(template.metricKey),
      startedAt: today,
      durationDays: template.days,
      status: "active",
      checks: [],
    };
    const updated = [...items, next];
    if (!writeExperiments(updated)) { setStorageError(true); return; }
    setStorageError(false);
    setItems(updated);
    setRevision(value => value + 1);
    recordExperimentStarted(next);
    recordPersonalAnalytics("experiment_started", template.id);
  };
  const recordToday = (item: PersonalExperiment, effect: "better" | "same" | "worse") => {
    const checks = item.checks || [];
    if (checks.some(check => check.date === today)) return;
    const check = { date: today, done: true, effect } as const;
    const nextItem = { ...item, checks: [...checks, check] };
    const duration = item.durationDays || 7;
    if (elapsedDays(item.startedAt, today) >= duration) {
      nextItem.status = "complete";
      nextItem.completedAt = today;
    }
    const updated = items.map(value => value.id === item.id ? nextItem : value);
    if (!writeExperiments(updated)) { setStorageError(true); return; }
    setStorageError(false);
    recordExperimentMeasure(item, check);
    recordPersonalAnalytics("experiment_checkin", item.templateId);
    if (nextItem.status === "complete") {
      recordExperimentCompleted(nextItem);
      recordPersonalAnalytics("experiment_completed", item.templateId);
    }
    setItems(updated);
    setRevision(value => value + 1);
  };
  const labels: Record<string, string> = { wind_down:"windDown", short_walk:"shortWalk", screen_pause:"screenPause", worry_note:"worryNote" };
  return <section id="personal-experiments" className="mt-4 rounded-[30px] border border-[#E8DDD7] bg-white p-5 shadow-sm sm:p-6">
    <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">CONFIA · {t("personalMap.experiments.eyebrow")}</p>
    <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.experiments.title")}</h2>
    <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.experiments.subtitle")}</p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <select value={selectedTemplate} onChange={event => setSelectedTemplate(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-[#E8DDD7] bg-[#FFFCFA] px-3 text-sm">
        {EXPERIMENT_TEMPLATES.map(template => <option key={template.id} value={template.id}>{t(template.titleKey)} · {template.days} {t("personalMap.experiments.days")}</option>)}
      </select>
      <button type="button" onClick={startExperiment} disabled={active.length >= 2} className="min-h-11 rounded-full bg-[#934A38] px-4 py-2 text-xs font-black text-white disabled:opacity-40">{t("personalMap.experiments.start")}</button>
    </div>
    {storageError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{t("personalMap.experiments.storageError")}</p>}
    {active.length === 0 ? <p className="mt-4 rounded-2xl bg-[#F8F3F0] p-4 text-sm leading-6 text-[#806D65]">{t("personalMap.experiments.empty")}</p> : <div className="mt-4 space-y-3">
      {active.map(item => {
        const templateKey = labels[item.templateId || ""];
        const duration = item.durationDays || 7;
        const days = Math.min(duration, elapsedDays(item.startedAt, today));
        const summary = experimentSummary(item);
        const recordedToday = (item.checks || []).some(check => check.date === today);
        return <article key={item.id} className="rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-4">
          <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-black text-[#3F2C27]">{templateKey ? t(`experiments.templates.${templateKey}.title`) : item.hypothesis}</h3><span className="rounded-full bg-[#F2E8E1] px-2 py-1 text-[10px] font-bold text-[#806D65]">{days}/{duration} {t("personalMap.experiments.days")}</span></div>
          <p className="mt-2 text-xs leading-5 text-[#806D65]">{templateKey ? t(`experiments.templates.${templateKey}.action`) : item.hypothesis}</p>
          <p className="mt-1 text-[10px] text-[#806D65]">{t("personalMap.experiments.logged", { count: summary.done })}</p>
          {recordedToday ? <p className="mt-3 text-xs font-bold text-[#587563]">{t("personalMap.experiments.todayDone")}</p> : <div className="mt-3 grid grid-cols-3 gap-2">
            {(["better", "same", "worse"] as const).map(effect => <button key={effect} type="button" onClick={() => recordToday(item, effect)} className="min-h-10 rounded-xl border border-[#E8DDD7] bg-white px-2 py-2 text-[10px] font-bold text-[#594A43]">{t(`personalMap.experiments.${effect}`)}</button>)}
          </div>}
          <p className="mt-2 text-[10px] leading-4 text-[#806D65]">{t("personalMap.experiments.caution")}</p>
        </article>;
      })}
    </div>}
    {completed.length > 0 && <details className="mt-4 rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3"><summary className="min-h-10 cursor-pointer text-xs font-bold text-[#594A43]">{t("personalMap.experiments.completed", { count: completed.length })}</summary><div className="mt-3 space-y-2">{completed.map(item => { const summary = experimentSummary(item); return <p key={item.id} className="text-xs leading-5 text-[#806D65]">{item.hypothesis} · {t("personalMap.experiments.logged", { count: summary.done })} · {summary.enough ? t(`personalMap.experiments.${summary.direction}Summary`) : t("personalMap.experiments.notEnough")}</p>; })}</div></details>}
  </section>;
}
