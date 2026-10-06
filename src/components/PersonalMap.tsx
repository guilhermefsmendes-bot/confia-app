import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Compass, Info, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { readPersonalEvents, PERSONAL_EVENTS_UPDATED_EVENT } from "../data/personal/personalEventStorage";
import { buildPersonalInsights, explainInsight } from "../data/personal/personalInsights";
import { applyInsightLifecycle, markInsightsShown } from "../data/personal/personalInsightLifecycle";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";
import type { PersonalInsight } from "../data/personal/personalInsights";

type Props = { onBack: () => void };

const confidenceRank: Record<PersonalInsight["confidence"], number> = { high: 3, moderate: 2, low: 1 };
const statusRank: Record<PersonalInsight["status"], number> = { consistent: 4, possible: 3, emerging: 2, changed: 2, weakened: 1, disappeared: 0 };
const actionRank: Record<PersonalInsight["actionability"], number> = { high: 3, medium: 2, low: 1 };

function rankInsight(a: PersonalInsight, b: PersonalInsight) {
  return (
    confidenceRank[b.confidence] - confidenceRank[a.confidence] ||
    statusRank[b.status] - statusRank[a.status] ||
    actionRank[b.actionability] - actionRank[a.actionability] ||
    b.evidenceCount - a.evidenceCount ||
    b.lastSeen.localeCompare(a.lastSeen)
  );
}

function formatPeriod(start: string, end: string) {
  if (start === end) return start;
  return start + " — " + end;
}

export default function PersonalMap({ onBack }: Props) {
  const { t } = useTranslation();
  const [revision, setRevision] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, "useful" | "dismissed">>({});
  const events = useMemo(() => readPersonalEvents(), [revision]);
  const insights = useMemo(
    () => applyInsightLifecycle(buildPersonalInsights(events)).sort(rankInsight),
    [events],
  );
  const observations = insights.slice(0, 3);
  const suggestions = insights
    .filter(insight => insight.actionability !== "low" && insight.confidence !== "low")
    .sort((a, b) => actionRank[b.actionability] - actionRank[a.actionability] || rankInsight(a, b))
    .slice(0, 2);
  const shownInsightIds = useRef(new Set<string>());

  useEffect(() => {
    const handleUpdated = () => setRevision(value => value + 1);
    window.addEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handleUpdated);
    recordPersonalAnalytics("personal_map_viewed");

    const newlyVisible = insights.filter(insight => !shownInsightIds.current.has(insight.id));
    if (newlyVisible.length) {
      markInsightsShown(newlyVisible);
      newlyVisible.forEach(insight => shownInsightIds.current.add(insight.id));
    }

    return () => window.removeEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handleUpdated);
  }, [insights]);

  const sendFeedback = (insight: PersonalInsight, value: "useful" | "dismissed") => {
    setFeedback(current => ({ ...current, [insight.id]: value }));
    recordPersonalAnalytics(value === "useful" ? "insight_useful" : "insight_dismissed", insight.id);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8F5F2] p-4 pb-28 text-[#332824] sm:p-6">
      <button type="button" onClick={onBack} className="mb-4 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#6D554B]" aria-label={t("personalMap.backAria")}>
        <ArrowLeft size={17} /> {t("back")}
      </button>

      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[radial-gradient(circle_at_85%_10%,rgba(220,157,125,.34),transparent_36%),linear-gradient(145deg,#fffdfa,#eee5df)] p-6 shadow-[0_24px_70px_rgba(93,65,53,.12)] sm:p-8">
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B86B52]">CONFIA · {t("personalMap.eyebrow")}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#3F2C27] sm:text-4xl">{t("personalMap.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#735F56]">{t("personalMap.subtitle")}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/65 shadow-sm sm:flex">
            <Compass className="text-[#B86B52]" />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#B86B52]" />
          <h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.observationsTitle")}</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.signalsExplanation")}</p>

        {observations.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#F8F3F0] p-4 text-sm leading-6 text-[#806D65]">{t("personalMap.noDiscoveries")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {observations.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                t={t}
                feedback={feedback[insight.id]}
                onFeedback={value => sendFeedback(insight, value)}
              />
            ))}
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-5 flex gap-2 rounded-2xl bg-[#F8F3F0] p-3 text-xs leading-5 text-[#806D65]">
            <Info size={14} className="mt-0.5 shrink-0" />
            {t("personalMap.explainable")}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[30px] border border-[#D7B36A]/35 bg-gradient-to-br from-[#FFFDF8] via-white to-[#FFF5E6] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1D6] text-[#9B6B20]">
            <Sparkles size={19} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#9B6B20]">CONFIA</p>
            <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.suggestions")}</h2>
            <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.suggestionsSubtitle")}</p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[#E2D2B9] bg-white/80 p-4 text-sm leading-6 text-[#806D65]">{t("personalMap.suggestionInsufficient")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {suggestions.map(insight => (
              <article key={"suggestion_" + insight.id} className="rounded-2xl border border-[#E8DDD7] bg-white p-4">
                <p className="text-xs font-black leading-5 text-[#4E4039]">
                  {insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#806D65]">
                  {insight.actionability === "high" ? t("personalMap.suggestionAct") : t("personalMap.suggestionObserve")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F7F1EC] px-2.5 py-1 text-[9px] font-black text-[#806D65]">
                    {insight.evidenceCount} {t("personalMap.observations")}
                  </span>
                  <span className="rounded-full bg-[#F7F1EC] px-2.5 py-1 text-[9px] font-black text-[#806D65]">
                    {formatPeriod(insight.periodStart, insight.periodEnd)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function InsightCard({
  insight,
  t,
  feedback,
  onFeedback,
}: {
  insight: PersonalInsight;
  t: (key: string, values?: Record<string, unknown>) => string;
  feedback?: "useful" | "dismissed";
  onFeedback: (value: "useful" | "dismissed") => void;
}) {
  return (
    <article className="rounded-[24px] border border-[#F0E3DC] bg-gradient-to-br from-[#FFF9F5] to-[#F6EFEB] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-6 text-[#3F2C27]">
          {insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}
        </p>
        <span className="shrink-0 rounded-full bg-[#F0E3DC] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#7A5A4E]">
          {t("personalInsights.confidence." + insight.confidence)}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#806D65]">{explainInsight(insight, t)}</p>

      <div className="mt-3 rounded-2xl bg-white/70 p-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#806D65]">
          <span>{insight.evidenceCount} {t("personalMap.observations")}</span>
          <span>·</span>
          <span>{formatPeriod(insight.periodStart, insight.periodEnd)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-[#9A8177]">
          {feedback ? t("personalMap.feedbackThanks") : t("personalMap.feedbackPrompt")}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onFeedback("useful")} disabled={!!feedback} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#6B8A72] disabled:opacity-60" aria-label={t("personalMap.useful")}>
            <ThumbsUp size={15} />
          </button>
          <button type="button" onClick={() => onFeedback("dismissed")} disabled={!!feedback} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#9A6E64] disabled:opacity-60" aria-label={t("personalMap.dismiss")}>
            <ThumbsDown size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
