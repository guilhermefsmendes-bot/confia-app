import { useState } from "react";
import type { PersonalEvent } from "../data/personal/personalEvent";
import type { PersonalInsight } from "../data/personal/personalInsights";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";
import { readExperiments, experimentSummary } from "../data/personal/personalExperiments";
import { readPersonalInsightFeedback } from "../data/personal/personalInsightFeedback";
import { useTranslation } from "react-i18next";

const NOTE_KEY = "confia_personal_manual_note_v1";
function readNote() {
  try { return localStorage.getItem(NOTE_KEY) || ""; } catch { return ""; }
}
export default function PersonalManual({ events, insights }: { events: PersonalEvent[]; insights: PersonalInsight[] }) {
  const { t, i18n } = useTranslation();
  const [note, setNote] = useState(readNote);
  const [saved, setSaved] = useState(false);
  const [storyPeriod, setStoryPeriod] = useState<"week" | "month">("week");
  const now = new Date();
  const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const periodStartDate = new Date(now);
  if (storyPeriod === "week") periodStartDate.setDate(periodStartDate.getDate() - 6);
  else periodStartDate.setDate(1);
  const periodStart = periodStartDate.getFullYear() + "-" + String(periodStartDate.getMonth() + 1).padStart(2, "0") + "-" + String(periodStartDate.getDate()).padStart(2, "0");
  const periodEvents = events.filter(event => event.localDate >= periodStart && event.localDate <= today);
  const periodDays = new Set(periodEvents.map(event => event.localDate)).size;
  const periodInsights = insights.filter(insight => insight.status !== "disappeared" && insight.periodEnd >= periodStart && insight.periodEnd <= today);
  const allExperiments = readExperiments();
  const periodExperiments = allExperiments.filter(item => {
    const startedInPeriod = item.startedAt >= periodStart && item.startedAt <= today;
    const completedInPeriod = Boolean(item.completedAt && item.completedAt >= periodStart && item.completedAt <= today);
    const measuredInPeriod = (item.checks || []).some(check => check.date >= periodStart && check.date <= today);
    return startedInPeriod || completedInPeriod || measuredInPeriod;
  });
  const insightFeedback = readPersonalInsightFeedback();
  const usefulInsights = insights.filter(insight => insightFeedback[insight.id]?.value === "useful").slice(0, 8);
  const completedExperiments = allExperiments.filter(item => item.status === "complete").slice(-5).reverse();
  const save = (value: string) => {
    setNote(value);
    setSaved(false);
    try { localStorage.setItem(NOTE_KEY, value); setSaved(true); } catch { setSaved(false); }
  };
  const exportMonthlyReport = () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthEvents = events.filter(event => String(event.timestamp || "").slice(0, 7) === month);
    const monthExperiments = allExperiments.filter(item => String(item.completedAt || item.startedAt).slice(0, 7) === month);
    const lines = [
      `CONFIA — ${t("personalMap.manual.title")}`,
      `${t("personalMap.manual.subtitle")}`,
      `${t("personalMap.manual.reportMonth")}: ${new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(now)}`,
      `${t("personalMap.manual.reportRecords")}: ${monthEvents.length}`,
      "",
      t("personalMap.manual.reportObservations"),
      ...(insights.filter(insight => String(insight.periodEnd || "").slice(0, 7) === month).slice(0, 8).map((insight, index) => `${index + 1}. ${insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message} (${insight.evidenceCount} ${t("personalMap.observations")})`)),
      "",
      t("personalMap.experiments.title"),
      ...(monthExperiments.length ? monthExperiments.map(item => {
        const summary = experimentSummary(item);
        const result = summary.enough ? t(`personalMap.experiments.${summary.direction}Summary`) : t("personalMap.experiments.notEnough");
        return `- ${item.hypothesis}: ${t("personalMap.experiments.logged", { count: summary.done })} · ${result}`;
      }) : [t("personalMap.experiments.empty")]),
      "",
      t("personalMap.manual.reportNote"),
      note,
      "",
      t("personalMap.manual.reportDisclaimer"),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `confia-relatorio-${month}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordPersonalAnalytics("monthly_report_exported");
  };
  return <section id="personal-manual" className="mt-4 rounded-[30px] border border-[#E8DDD7] bg-white p-5 shadow-sm sm:p-6">
    <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">CONFIA · {t("personalMap.manual.eyebrow")}</p>
    <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.manual.title")}</h2>
    <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.manual.subtitle")}</p>
    <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-4">
      <h3 className="text-xs font-black text-[#49362F]">{t("personalMap.manual.storyTitle")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setStoryPeriod("week")} aria-pressed={storyPeriod === "week"} className={storyPeriod === "week" ? "min-h-9 rounded-full bg-[#934A38] px-3 text-[10px] font-bold text-white" : "min-h-9 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"}>{t("personalMap.manual.storyWeek")}</button>
        <button type="button" onClick={() => setStoryPeriod("month")} aria-pressed={storyPeriod === "month"} className={storyPeriod === "month" ? "min-h-9 rounded-full bg-[#934A38] px-3 text-[10px] font-bold text-white" : "min-h-9 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"}>{t("personalMap.manual.storyMonth")}</button>
      </div>
      {periodEvents.length === 0 ? (
        <p className="mt-3 text-xs leading-5 text-[#806D65]">{t("personalMap.manual.storyEmpty")}</p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[#594A43]">{t("personalMap.manual.storyAvailable", { records: periodEvents.length, days: periodDays, discoveries: periodInsights.length, experiments: periodExperiments.length })}</p>
      )}
      <p className="mt-2 text-[10px] leading-4 text-[#8A7971]">{t("personalMap.manual.storyNote")}</p>
    </div>
    {usefulInsights.length > 0 && <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-4">
      <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-black text-[#594A43]">{t("personalMap.observationsTitle")}</h3><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#6B8A72]">{t("personalMap.useful")}</span></div>
      <div className="mt-3 space-y-2">{usefulInsights.map(insight => <article key={insight.id} className="rounded-xl border border-[#E8DDD7] bg-white p-3">
        <p className="text-xs font-bold leading-5 text-[#3F2C27]">{insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}</p>
        <p className="mt-1 text-[10px] text-[#806D65]">{insight.evidenceCount} {t("personalMap.observations")} · {t(`personalInsights.confidence.${insight.confidence}`)}</p>
      </article>)}</div>
    </div>}
    {completedExperiments.length > 0 && <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-4">
      <h3 className="text-xs font-black text-[#594A43]">{t("personalMap.experiments.title")}</h3>
      <div className="mt-3 space-y-2">{completedExperiments.map(item => {
        const summary = experimentSummary(item);
        return <article key={item.id} className="rounded-xl border border-[#E8DDD7] bg-white p-3">
          <p className="text-xs font-bold leading-5 text-[#3F2C27]">{item.hypothesis}</p>
          <p className="mt-1 text-[10px] text-[#806D65]">{t("personalMap.experiments.logged", { count: summary.done })} · {summary.enough ? t(`personalMap.experiments.${summary.direction}Summary`) : t("personalMap.experiments.notEnough")}</p>
        </article>;
      })}</div>
    </div>}
    <label className="mt-4 block text-xs font-bold text-[#594A43]" htmlFor="confia-personal-manual-note">{t("personalMap.manual.noteLabel")}</label>
    <textarea id="confia-personal-manual-note" value={note} onChange={event => save(event.target.value)} maxLength={4000} rows={5} placeholder={t("personalMap.manual.placeholder")} className="mt-2 w-full rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3 text-sm leading-6 text-[#3F2C27] outline-none focus:border-[#B86B52]" />
    <p className="mt-1 text-[10px] text-[#806D65]" role="status">{saved ? t("personalMap.manual.savedLocally") : t("personalMap.manual.localOnly")}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={exportMonthlyReport} className="min-h-11 rounded-full bg-[#934A38] px-4 py-2 text-xs font-black text-white">{t("personalMap.manual.exportReport")}</button>
      <button type="button" onClick={() => save("")} className="min-h-11 rounded-full border border-[#E8DDD7] bg-white px-4 py-2 text-xs font-bold text-[#806D65]">{t("personalMap.manual.clearNote")}</button>
    </div>
  </section>;
}
