import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, CalendarDays, FlaskConical, Sparkles } from "lucide-react";
import { isValidPersonalLocalDate, type PersonalEvent } from "../data/personal/personalEvent";
import type { PersonalInsight } from "../data/personal/personalInsights";
import type { PersonalExperiment } from "../data/personal/personalExperiments";
import { buildPersonalMapSummary } from "../data/personal/personalMapSummary";
import { buildPersonalMonthlyLearning } from "../data/personal/personalMonthlyLearning";
import { GrowthTree } from "./GrowthTree";

export default function PersonalMapOverview({
  events,
  insights,
  experiments,
}: {
  events: PersonalEvent[];
  insights: PersonalInsight[];
  experiments: PersonalExperiment[];
}) {
  const { t, i18n } = useTranslation();
  const summary = buildPersonalMapSummary(events, insights, experiments);
  const monthly = buildPersonalMonthlyLearning(events, insights, experiments);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [category, setCategory] = useState<"all" | "emotional" | "habits" | "goals" | "experiments" | "lifestyle">("all");
  const filteredEvents = events.filter(event => {
    const timestamp = new Date(event.timestamp).getTime();
    if (!Number.isFinite(timestamp) || !isValidPersonalLocalDate(event.localDate)) return false;
    if (period !== "all" && timestamp < Date.now() - (period === "7d" ? 7 : period === "30d" ? 30 : 90) * 86400000) return false;
    if (category === "emotional" && !["mood", "checkin", "intervention", "context"].includes(event.type)) return false;
    if (category === "habits" && !["habit", "habit_challenge"].includes(event.type)) return false;
    if (category === "goals" && event.type !== "goal") return false;
    if (category === "experiments" && event.type !== "experiment") return false;
    if (category === "lifestyle" && !["nutrition", "exercise"].includes(event.type)) return false;
    return true;
  });
  const recentEvents = [...filteredEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const visibleEvents = showAllEvents ? recentEvents : recentEvents.slice(0, 12);
  const openSourceEvent = (id: string) => {
    setPeriod("all");
    setCategory("all");
    setShowAllEvents(true);
    setPendingEventId(id);
  };
  useEffect(() => {
    if (!pendingEventId) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("personal-event-" + pendingEventId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingEventId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingEventId, showAllEvents, period, category]);

  const formatDate = (value?: string) => {
    if (!value) return t("personalMap.livingMap.noDate");
    const date = new Date(value + "T12:00:00");
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { day: "numeric", month: "short", year: "numeric" }).format(date)
      : value;
  };

  const eventDetail = (event: PersonalEvent) => {
    if ((event.type === "mood" || event.type === "checkin") && typeof event.value === "number") {
      return t("personalMap.livingMap.rating", { value: event.value });
    }
    if (event.type === "experiment") {
      const phase = event.metadata?.phase;
      if (phase === "start") return t("personalMap.livingMap.experimentStarted");
      if (phase === "complete") return t("personalMap.livingMap.experimentCompleted");
      if (phase === "measure") return t("personalMap.livingMap.experimentMeasured");
    }
    return "";
  };

  return (
    <section className="mt-4 rounded-[30px] border border-[#E8DDD7] bg-gradient-to-br from-[#FFFCFA] via-white to-[#F5EEE9] p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E9E4] text-[#934A38]">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">{t("personalMap.livingMap.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.livingMap.title")}</h2>
          <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.livingMap.subtitle")}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E8DDD7] bg-white/85 p-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#934A38]" />
          <h3 className="text-xs font-black text-[#49362F]">{t("personalMap.livingMap.stageTitle")}</h3>
        </div>
        <p className="mt-2 text-sm font-black text-[#49362F]">{t("personalMap.livingMap.stages." + summary.stage + ".title")}</p>
        <p className="mt-1 text-xs leading-5 text-[#806D65]">{t("personalMap.livingMap.stages." + summary.stage + ".description")}</p>
        <p className="mt-3 text-[10px] leading-4 text-[#8A7971]">{t("personalMap.livingMap.stageMethod")}</p>
      </div>

      {summary.firstDate && summary.latestDate && (
        <p className="mt-3 text-[10px] leading-4 text-[#8A7971]">
          {t("personalMap.livingMap.historyRange", { start: formatDate(summary.firstDate), end: formatDate(summary.latestDate) })}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryMetric label={t("personalMap.livingMap.metrics.records")} value={summary.eventCount} />
        <SummaryMetric label={t("personalMap.livingMap.metrics.days")} value={summary.activeDays} />
        <SummaryMetric label={t("personalMap.livingMap.metrics.discoveries")} value={summary.insightCount} />
        <SummaryMetric label={t("personalMap.livingMap.metrics.activeExperiments")} value={summary.activeExperiments} />
        <SummaryMetric label={t("personalMap.livingMap.metrics.completedExperiments")} value={summary.completedExperiments} />
      </div>

      <section className="mt-4 rounded-2xl border border-[#E8DDD7] bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#934A38]" />
          <h3 className="text-xs font-black text-[#49362F]">{t("personalMap.livingMap.monthly.title")}</h3>
        </div>
        <p className="mt-1 text-[10px] text-[#8A7971]">{t("personalMap.livingMap.monthly.month", { month: new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { month: "long", year: "numeric" }).format(new Date()) })}</p>
        <p className="mt-3 text-xs leading-5 text-[#594A43]">{t(monthly.hasEnoughRecords ? "personalMap.livingMap.monthly.intro" : "personalMap.livingMap.monthly.insufficient", { records: monthly.eventCount, days: monthly.activeDays })}</p>
        <MonthlyInsightGroup title={t("personalMap.livingMap.monthly.changed")} empty={t("personalMap.livingMap.monthly.noneChanged")} insights={monthly.changed} events={events} t={t} onOpenEvent={openSourceEvent} />
        <MonthlyInsightGroup title={t("personalMap.livingMap.monthly.remains")} empty={t("personalMap.livingMap.monthly.noneRemains")} insights={monthly.remains} events={events} t={t} onOpenEvent={openSourceEvent} />
        <MonthlyInsightGroup title={t("personalMap.livingMap.monthly.observations")} empty={t("personalMap.livingMap.monthly.noneObservations")} insights={monthly.observations} events={events} t={t} onOpenEvent={openSourceEvent} />
        {monthly.experiments.length > 0 && <div className="mt-3 border-t border-[#F0E7E2] pt-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#806D65]">{t("personalMap.livingMap.monthly.experiments")}</p>
          <ul className="mt-2 space-y-2">{monthly.experiments.map(({ experiment, evidenceCount, enough, direction }) => <li key={experiment.id} className="text-xs leading-5 text-[#594A43]">
            <span className="font-bold">{experiment.hypothesis}</span> — {enough ? t("personalMap.experiments." + direction + "Summary") : t("personalMap.experiments.notEnough")} ({t("personalMap.experiments.logged", { count: evidenceCount })})
          </li>)}</ul>
        </div>}
        <p className="mt-3 rounded-xl bg-[#F8F3F0] p-3 text-[10px] leading-4 text-[#806D65]">{t("personalMap.livingMap.monthly.limit")}</p>
        <button type="button" onClick={() => document.getElementById("personal-manual")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-3 min-h-10 rounded-full border border-[#DCC8BE] bg-white px-4 text-[10px] font-black text-[#8A4D3C]">{t("personalMap.manual.title")}</button>
      </section>

      <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-[#934A38]" />
          <h3 className="text-xs font-black text-[#49362F]">{t("personalMap.livingMap.timelineTitle")}</h3>
          <span className="ml-auto text-[10px] font-bold text-[#8A7971]">{visibleEvents.length}/{filteredEvents.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[10px] font-bold text-[#806D65]">
            {t("personalMap.livingMap.periodLabel")}
            <select value={period} onChange={event => setPeriod(event.target.value as typeof period)} className="mt-1 min-h-10 w-full rounded-xl border border-[#E8DDD7] bg-white px-2 text-xs text-[#49362F]">
              <option value="all">{t("personalMap.livingMap.periods.all")}</option>
              <option value="7d">{t("personalMap.livingMap.periods.week")}</option>
              <option value="30d">{t("personalMap.livingMap.periods.month")}</option>
              <option value="90d">{t("personalMap.livingMap.periods.quarter")}</option>
            </select>
          </label>
          <label className="text-[10px] font-bold text-[#806D65]">
            {t("personalMap.livingMap.categoryLabel")}
            <select value={category} onChange={event => setCategory(event.target.value as typeof category)} className="mt-1 min-h-10 w-full rounded-xl border border-[#E8DDD7] bg-white px-2 text-xs text-[#49362F]">
              <option value="all">{t("personalMap.livingMap.categories.all")}</option>
              <option value="emotional">{t("personalMap.livingMap.categories.emotional")}</option>
              <option value="habits">{t("personalMap.livingMap.categories.habits")}</option>
              <option value="goals">{t("personalMap.livingMap.categories.goals")}</option>
              <option value="experiments">{t("personalMap.livingMap.categories.experiments")}</option>
              <option value="lifestyle">{t("personalMap.livingMap.categories.lifestyle")}</option>
            </select>
          </label>
        </div>
        {recentEvents.length === 0 ? (
          <p className="mt-3 text-xs leading-5 text-[#806D65]">{t("personalMap.livingMap.timelineEmpty")}</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {visibleEvents.map((event, index) => (
              <li id={"personal-event-" + event.id} key={event.id} className="relative flex gap-3">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#A66C55] bg-white" />
                  {index < visibleEvents.length - 1 && <span className="mt-1 w-px flex-1 bg-[#DDC9BE]" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-xs font-bold text-[#49362F]">{t("personalMap.livingMap.eventTypes." + event.type, { defaultValue: t("personalMap.livingMap.eventTypes.other") })}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#806D65]">
                    {formatDate(event.localDate)}
                    {eventDetail(event) ? " · " + eventDetail(event) : ""}
                  </p>
                  <details className="mt-1">
                    <summary className="min-h-8 cursor-pointer text-[10px] font-bold text-[#8A4D3C]">{t("personalMap.livingMap.recordOrigin")}</summary>
                    <p className="mt-1 text-[10px] leading-4 text-[#806D65]">{t("personalMap.livingMap.sources." + event.source, { defaultValue: t("personalMap.livingMap.sources.other") })}</p>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        )}
        {recentEvents.length > 12 && <button type="button" onClick={() => setShowAllEvents(value => !value)} className="mt-3 min-h-10 rounded-full border border-[#E8DDD7] bg-white px-4 text-[10px] font-bold text-[#8A4D3C]">{t(showAllEvents ? "personalMap.livingMap.showRecent" : "personalMap.livingMap.showAll", { count: recentEvents.length })}</button>}
        <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[#8A7971]">
          <FlaskConical size={13} className="mt-0.5 shrink-0" />
          {t("personalMap.livingMap.timelineNote")}
        </p>
      </div>
      <GrowthTree events={events} insights={insights} experiments={experiments} />
      <p className="mt-3 text-[10px] leading-5 text-[#8A7971]">{t("personalMap.livingMap.privacyNote")}</p>
    </section>
  );
}

function MonthlyInsightGroup({
  title, empty, insights, events, t, onOpenEvent,
}: {
  title: string;
  empty: string;
  insights: PersonalInsight[];
  events: PersonalEvent[];
  onOpenEvent: (id: string) => void;
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  return <div className="mt-3 border-t border-[#F0E7E2] pt-3">
    <p className="text-[10px] font-black uppercase tracking-wide text-[#806D65]">{title}</p>
    {insights.length === 0 ? <p className="mt-1 text-[11px] text-[#8A7971]">{empty}</p> : <ul className="mt-2 space-y-2">
      {insights.slice(0, 3).map(insight => {
        const linkedEvents = events.filter(event => insight.supportingEventIds.includes(event.id));
        return <li key={insight.id} className="rounded-xl bg-[#FFFCFA] p-3">
          <p className="text-xs leading-5 text-[#49362F]">{insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}</p>
          <p className="mt-1 text-[10px] text-[#8A7971]">{insight.evidenceCount} {t("personalMap.observations")} · {t("personalInsights.confidence." + insight.confidence)}</p>
          {linkedEvents.length > 0 && <details className="mt-2">
            <summary className="min-h-8 cursor-pointer text-[10px] font-bold text-[#8A4D3C]">{t("personalMap.livingMap.monthly.sources", { count: linkedEvents.length })}</summary>
            <ul className="mt-1 space-y-1">{linkedEvents.slice(0, 8).map(event => <li key={event.id}>
              <button type="button" onClick={() => onOpenEvent(event.id)} className="text-left text-[10px] text-[#806D65] underline">{event.localDate} · {t("personalMap.livingMap.eventTypes." + event.type, { defaultValue: t("personalMap.livingMap.eventTypes.other") })}</button>
            </li>)}</ul>
          </details>}
        </li>;
      })}
    </ul>}
  </div>;
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E8DDD7] bg-white px-3 py-3">
      <p className="text-lg font-black tabular-nums text-[#49362F]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#806D65]">{label}</p>
    </div>
  );
}
