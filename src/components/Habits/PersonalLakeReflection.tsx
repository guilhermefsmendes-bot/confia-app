import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Waves } from "lucide-react";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import { buildPersonalInsights } from "../../data/personal/personalInsights";

export default function PersonalLakeReflection({ events, onOpenDate }: { events: PersonalEvent[]; onOpenDate: (date: string) => void }) {
  const { t, i18n } = useTranslation();
  const validEvents = useMemo(() => events.filter(event => {
    const date = new Date(event.localDate + "T12:00:00");
    return /^\d{4}-\d{2}-\d{2}$/.test(event.localDate) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === event.localDate && Number.isFinite(new Date(event.timestamp).getTime());
  }), [events]);
  const insights = useMemo(() => buildPersonalInsights(validEvents)
    .filter(item => item.confidence !== "low" && item.status !== "disappeared" && item.supportingEventIds.length > 0)
    .sort((a, b) => (b.confidence === "high" ? 2 : 1) - (a.confidence === "high" ? 2 : 1) || b.evidenceCount - a.evidenceCount)
    .slice(0, 2), [validEvents]);
  const eventById = useMemo(() => new Map(validEvents.map(event => [event.id, event])), [validEvents]);
  const dateLabel = (date: string) => new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { day: "numeric", month: "short", year: "numeric" }).format(new Date(date + "T12:00:00"));
  return (
    <section className="rounded-2xl border border-white/80 bg-white/65 p-4" aria-labelledby="personal-lake-reflection-title">
      <div className="flex items-center gap-2"><Waves size={17} className="text-[#356D78]"/><h4 id="personal-lake-reflection-title" className="text-sm font-black text-[#234E58]">{t("personalMap.lakeReflection.title")}</h4></div>
      <p className="mt-1 text-xs leading-5 text-[#52656A]">{t("personalMap.lakeReflection.subtitle")}</p>
      {insights.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white/75 p-3 text-xs leading-5 text-[#6F7773]">{t("personalMap.lakeReflection.empty")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {insights.map(insight => (
            <article key={insight.id} className="rounded-xl border border-[#DDE9E6] bg-white/85 p-3">
              <p className="text-xs font-bold leading-5 text-[#31535A]">{insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#6F7773]">{t("personalMap.lakeReflection.evidence", { count: insight.evidenceCount, start: dateLabel(insight.periodStart), end: dateLabel(insight.periodEnd) })}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insight.supportingEventIds.slice(0, 3).map(id => {
                  const event = eventById.get(id);
                  if (!event) return null;
                  return <button key={id} type="button" aria-label={t("personalMap.lakeReflection.openRecord", { date: dateLabel(event.localDate) })} onClick={() => onOpenDate(event.localDate)} className="min-h-11 rounded-full border border-[#D6E5E2] bg-[#F6FAF8] px-3 py-1 text-[10px] font-bold text-[#35636A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356D78]">{dateLabel(event.localDate)} · {t("personalMap.livingMap.sources." + event.source, { defaultValue: t("personalMap.livingMap.sources.other") })} →</button>;
                })}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#7B8985]">{t("personalMap.lakeReflection.caution")}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
