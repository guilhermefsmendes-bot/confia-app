import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Compass, Info, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { readPersonalEvents, appendPersonalEvents } from "../data/personal/personalEventStorage";
import { buildPersonalModel, findAnalogousMoments } from "../data/personal/personalModel";
import { buildPersonalInsights, explainInsight } from "../data/personal/personalInsights";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";
import { applyInsightLifecycle, markInsightsShown } from "../data/personal/personalInsightLifecycle";
import { makePersonalEvent, createPersonalEventId } from "../data/personal/personalEvent";
import type { PersonalInsight } from "../data/personal/personalInsights";

type Props = { onBack: () => void };

export default function PersonalMap({ onBack }: Props) {
  const { t } = useTranslation();
  const events = useMemo(() => readPersonalEvents(), []);
  const model = useMemo(() => buildPersonalModel(events), [events]);
  const moodSeries = useMemo(() => events.filter(e => (e.type === "mood" || e.type === "checkin") && typeof e.value === "number").slice(-18), [events]);
  const analogous = useMemo(() => {
    const target = [...events].reverse().find(e => (e.type === "mood" || e.type === "checkin") && typeof e.value === "number");
    return target ? findAnalogousMoments(events, target, 3) : [];
  }, [events]);
  const insights = useMemo(() => applyInsightLifecycle(buildPersonalInsights(events)), [events]);
  useEffect(() => {
    recordPersonalAnalytics("personal_map_viewed");
    markInsightsShown(insights);
  }, [insights]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8F5F2] p-4 pb-28 text-[#332824] sm:p-6">
      <button type="button" onClick={onBack} className="mb-4 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#6D554B] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52]" aria-label={t("personalMap.backAria")}>
        <ArrowLeft size={17} /> {t("back")}
      </button>

      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[radial-gradient(circle_at_85%_10%,rgba(220,157,125,.34),transparent_36%),linear-gradient(145deg,#fffdfa,#eee5df)] p-6 shadow-[0_24px_70px_rgba(93,65,53,.12)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#D99B7C]/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B86B52]">CONFIA · {t("personalMap.eyebrow")}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#3F2C27] sm:text-4xl">{t("personalMap.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#735F56]">{t("personalMap.subtitle")}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/65 shadow-sm sm:flex"><Compass className="text-[#B86B52]" aria-hidden="true" /></div>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric label={t("personalMap.observations")} value={model.observationCount} />
          <Metric label={t("personalMap.days")} value={model.activeDays} />
          <Metric label={t("personalMap.completeness")} value={`${Math.round(model.completeness * 100)}%`} />
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[30px] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(93,65,53,.08)] sm:p-6">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B86B52]">{t("personalMap.pulseEyebrow")}</p><h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.pulseTitle")}</h2></div><span className="rounded-full bg-[#F5ECE7] px-3 py-1 text-xs font-bold text-[#8A685C]">{model.currentMood ?? "—"}/10</span></div>
        <div className="mt-5"><MoodPulse values={moodSeries.map(e => Number(e.value))} label={t("personalMap.pulseAria")} /></div>
        <p className="mt-3 text-xs leading-5 text-[#806D65]">{model.currentMood === undefined ? t("personalMap.learning") : t(`personalMap.direction.${model.moodDirection}`)}</p>
      </section>

      <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(93,65,53,.08)] sm:p-6">
        <div className="flex items-center gap-2"><Sparkles size={17} className="text-[#B86B52]" aria-hidden="true" /><h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.discoveries")}</h2></div>
        {insights.length === 0 ? <p className="mt-3 text-sm leading-6 text-[#806D65]">{t("personalMap.noDiscoveries")}</p> : insights.map(insight => <InsightCard key={insight.id} insight={insight} t={t} />)}
        {events.length > 0 && <div className="mt-5 flex gap-2 rounded-2xl bg-[#F8F3F0] p-3 text-xs leading-5 text-[#806D65]"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {t("personalMap.explainable")}</div>}
      </section>

      {model.repeatedNeeds.length > 0 && <section className="mt-4 rounded-[30px] border border-[#EADBD3] bg-[#FFF9F5] p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B86B52]">{t("personalMap.needEyebrow")}</p><h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.needTitle")}</h2><p className="mt-2 text-sm leading-6 text-[#6D5A53]">{t("personalMap.needObserved", { need: model.repeatedNeeds[0].need, count: model.repeatedNeeds[0].count })}</p></section>}

      {analogous.length > 0 && <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-sm"><h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.analogousTitle")}</h2><p className="mt-1 text-xs leading-5 text-[#806D65]">{t("personalMap.analogousSubtitle")}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{analogous.map(event => <div key={event.id} className="rounded-2xl bg-[#FFF8F4] px-4 py-3"><span className="block text-xs font-semibold text-[#806D65]">{event.localDate}</span><span className="mt-1 block text-xl font-black text-[#B86B52]">{event.value}/10</span></div>)}</div></section>}
    </main>
  );
}

function InsightCard({ insight, t }: { key?: string; insight: PersonalInsight; t: (key: string, values?: Record<string, unknown>) => string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const send = (kind: "useful" | "dismissed") => {
    appendPersonalEvents([makePersonalEvent({ id: createPersonalEventId("insight_feedback"), type: "insight_feedback", timestamp: new Date().toISOString(), source: "insight", value: kind, metadata: { insightId: insight.id, feedback: kind } })]);
    recordPersonalAnalytics(kind === "useful" ? "insight_useful" : "insight_dismissed");
    setFeedback(kind);
  };
  return <article className="mt-4 rounded-[24px] border border-[#F0E3DC] bg-gradient-to-br from-[#FFF9F5] to-[#F6EFEB] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold leading-6 text-[#3F2C27]">{insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}</p><div className="flex shrink-0 flex-wrap justify-end gap-1.5"><span className="rounded-full bg-[#F0E3DC] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#7A5A4E]">{t(`personalInsights.confidence.${insight.confidence}`)}</span>{insight.novelty !== "known" && <span className="rounded-full bg-[#EED3C7] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#7A493A]">{t("personalMap.new")}</span>}</div></div><p className="mt-2 text-xs leading-5 text-[#806D65]">{explainInsight(insight, t)}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-[#9A8177]">{feedback ? t("personalMap.feedbackThanks") : t("personalMap.feedbackPrompt")}</span><div className="flex gap-2"><button type="button" onClick={() => send("useful")} aria-label={t("personalMap.useful")} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#6B8A72] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52]"><ThumbsUp size={15} /></button><button type="button" onClick={() => send("dismissed")} aria-label={t("personalMap.dismiss")} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#9A6E64] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52]"><ThumbsDown size={15} /></button></div></div></article>;
}

function MoodPulse({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="flex h-28 items-center justify-center rounded-3xl bg-[#FAF5F2] text-xs font-semibold text-[#907A70]">—</div>;
  const width = 720; const height = 150; const pad = 12; const min = 1; const max = 10;
  const points = values.map((value, i) => `${pad + (i / (values.length - 1)) * (width - pad * 2)},${height - pad - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * (height - pad * 2)}`).join(" ");
  const last = points.split(" ").at(-1)?.split(",") ?? [String(pad), String(height / 2)];
  return <div className="overflow-hidden rounded-3xl bg-[#F9F3EF] p-2"><svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label={label}><defs><linearGradient id="pulseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#D99B7C" stopOpacity=".28"/><stop offset="100%" stopColor="#D99B7C" stopOpacity="0"/></linearGradient></defs><polyline points={`${pad},${height-pad} ${points} ${width-pad},${height-pad}`} fill="url(#pulseFill)" stroke="none"/><polyline points={points} fill="none" stroke="#B86B52" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx={last[0]} cy={last[1]} r="6" fill="#FFF" stroke="#B86B52" strokeWidth="3"/></svg></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white bg-white/65 p-3 text-center shadow-sm"><div className="text-lg font-black text-[#3F2C27]">{value}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-[#967E74]">{label}</div></div>; }
