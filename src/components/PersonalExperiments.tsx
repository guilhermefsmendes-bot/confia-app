import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FlaskConical, CheckCircle2 } from "lucide-react";
import { appendPersonalEvents } from "../data/personal/personalEventStorage";
import { makePersonalEvent } from "../data/personal/personalEvent";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";

type Experiment = { id: string; hypothesis: string; metric: string; startedAt: string; status: "active" | "complete"; outcome?: string };
const KEY = "confia_personal_experiments_v1";
const load = (): Experiment[] => { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } };

export default function PersonalExperiments({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Experiment[]>(load);
  const [hypothesis, setHypothesis] = useState("");
  const [metric, setMetric] = useState("");
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);
  const start = () => {
    if (!hypothesis.trim() || !metric.trim()) return;
    const id = `experiment_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const item: Experiment = { id, hypothesis: hypothesis.trim(), metric: metric.trim(), startedAt: now, status: "active" };
    setItems(current => [item, ...current]);
    recordPersonalAnalytics("experiment_started");
    appendPersonalEvents([makePersonalEvent({ id: `pe_experiment_start_${id}`, type: "experiment", timestamp: now, source: "microexperiment", value: true, metadata: { experimentId: id, phase: "start", hypothesis: item.hypothesis, targetMetric: item.metric } })]);
    setHypothesis(""); setMetric("");
  };
  const complete = (item: Experiment) => {
    const outcome = window.prompt(t("experiments.outcomePrompt")) ?? "";
    const now = new Date().toISOString();
    setItems(current => current.map(value => value.id === item.id ? { ...value, status: "complete", outcome } : value));
    recordPersonalAnalytics("experiment_completed");
    appendPersonalEvents([makePersonalEvent({ id: `pe_experiment_complete_${item.id}`, type: "experiment", timestamp: now, source: "microexperiment", value: outcome, metadata: { experimentId: item.id, phase: "complete", targetMetric: item.metric } })]);
  };
  return <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] to-[#F1EAE4] p-5 pb-24"><button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-[#795B50] font-semibold"><ArrowLeft size={17} /> {t("back")}</button><div className="rounded-[30px] bg-white p-6 shadow-md border border-[#E8DDD4]"><div className="flex items-center gap-3"><FlaskConical className="text-[#C97B5E]" /><div><h1 className="text-2xl font-black text-[#4A352F]">{t("experiments.title")}</h1><p className="text-sm text-[#806D65]">{t("experiments.subtitle")}</p></div></div><div className="mt-5 space-y-3"><input value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder={t("experiments.hypothesisPlaceholder")} className="w-full rounded-2xl border border-[#E8DDD4] bg-[#FFFDFC] p-3 text-sm outline-none" /><input value={metric} onChange={e => setMetric(e.target.value)} placeholder={t("experiments.metricPlaceholder")} className="w-full rounded-2xl border border-[#E8DDD4] bg-[#FFFDFC] p-3 text-sm outline-none" /><button type="button" onClick={start} className="w-full rounded-2xl bg-[#587563] p-3 font-bold text-white">{t("experiments.start")}</button></div></div>{items.map(item => <article key={item.id} className="mt-4 rounded-[24px] bg-white p-5 shadow-sm border border-[#E8DDD4]"><p className="text-sm font-black text-[#4A352F]">{item.hypothesis}</p><p className="mt-2 text-xs text-[#806D65]">{t("experiments.metric", { metric: item.metric })}</p>{item.status === "active" ? <button type="button" onClick={() => complete(item)} className="mt-4 flex items-center gap-2 rounded-xl bg-[#F4E7DF] px-3 py-2 text-xs font-bold text-[#6D5A53]"><CheckCircle2 size={15} /> {t("experiments.complete")}</button> : <p className="mt-3 text-xs font-bold text-[#587563]">{t("experiments.completed")}{item.outcome ? ` — ${item.outcome}` : ""}</p>}</article>)}</div>;
}
