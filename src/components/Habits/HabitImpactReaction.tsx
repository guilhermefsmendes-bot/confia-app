import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRecord } from "../../data/habits/types";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import type { HabitImpactSource } from "../../data/habits/impactKnowledge";
import { buildHabitImpact, getHabitImpactSource } from "../../data/habits/impactEngine";

export default function HabitImpactReaction({ records, events, date }: { records: HabitRecord[]; events: PersonalEvent[]; date: string }) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const report = useMemo(() => buildHabitImpact(records, events, date), [records, events, date]);
  if (!report.hasData) return null;
  const associations = report.personalAssociations;
  const orderedCards = [...report.cards].sort((a, b) => {
    const priority = { attention: 0, information: 1, neutral: 2 } as const;
    return priority[a.severity] - priority[b.severity];
  });
  return <section className="space-y-4 rounded-[28px] border border-[#D8CDBB] bg-[#FFFDF7] p-5" aria-labelledby="habit-impact-title">
    <header>
      <h3 id="habit-impact-title" className="text-xl font-black">{t("habitImpact.title")}</h3>
      <p className="mt-1 text-sm leading-6 text-[#6F5D51]">{t("habitImpact.subtitle")}</p>
    </header>
    <div className="space-y-3">
      {(showAll ? orderedCards : orderedCards.slice(0, 3)).map(card => {
        const severity = card.severity === "attention" ? "border-[#E8C4A8] bg-[#FFF6EB]" : card.severity === "information" ? "border-[#D9E2CF] bg-white" : "border-[#E8DDD7] bg-white";
        const source = card.sourceId ? getHabitImpactSource(card.sourceId) : undefined;
        const detail = card.detailKey ? getHabitImpactSource(card.detailKey) : undefined;
        return <article key={card.id} className={`rounded-2xl border p-4 ${severity}`}>
          <h4 className="font-black">{t(card.titleKey)}</h4>
          <p className="mt-2 text-sm leading-6">{t(card.messageKey, { ...card.values, ...(card.values.unit ? { unit: t("habitImpact.units." + card.values.unit) } : {}) })}</p>
          {(source || detail) && <details className="mt-3 text-xs leading-5">
            <summary className="min-h-9 cursor-pointer font-bold">{t("habitImpact.evidence")}</summary>
            {[source, detail].filter((item, index, all): item is HabitImpactSource => Boolean(item) && all.findIndex(other => other?.id === item?.id) === index).map(item => <div key={item.id} className="mt-3 border-t border-[#E8DDD7] pt-3">
              <p className="font-bold">{item.title}</p>
              <p className="mt-1">{t("habitImpact.evidenceType")}: {item.evidenceType}</p>
              <p className="mt-1">{t("habitImpact.population")}: {item.population}</p>
              <p className="mt-1">{t("habitImpact.statistic")}: {item.statistic}</p>
              <p className="mt-1">{t("habitImpact.certainty")}: {item.certainty}</p>
              <p className="mt-1">{t("habitImpact.limitations")}: {item.limitations}</p>
              <p className="mt-1">{t("habitImpact.lastReviewed")}: {item.checkedOn}</p>
              <a className="mt-2 inline-block min-h-10 py-2 font-bold underline" href={item.url} target="_blank" rel="noreferrer">{t("habitImpact.openSource")} · {item.organization}</a>
            </div>)}
          </details>}
        </article>;
      })}
    </div>
    {orderedCards.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} aria-expanded={showAll} className="min-h-11 rounded-xl border border-[#D9C6B8] bg-white px-4 py-2 text-sm font-bold underline">{showAll ? t("habitImpact.showLess") : t("habitImpact.showMore", { count: orderedCards.length - 3 })}</button>}
    {associations.length > 0 ? <section className="rounded-2xl border border-[#D8D2E5] bg-[#F8F5FC] p-4">
      <h4 className="font-black">{t("habitImpact.personal.title")}</h4>
      <p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitImpact.personal.intro")}</p>
      <div className="mt-3 space-y-3">{associations.map(item => <div key={item.id} className="rounded-xl bg-white p-3">
        <p className="font-bold">{t("habitImpact.personal." + item.habit)}</p>
        <p className="mt-1 text-sm leading-6">{t("habitImpact.personal.pattern", {
          direction: t("habitImpact.personal.direction." + item.direction),
          exposedMean: item.exposedMean.toFixed(1), comparisonMean: item.comparisonMean.toFixed(1),
          exposedDays: item.exposedDays, comparisonDays: item.comparisonDays,
          difference: Math.abs(item.difference).toFixed(1),
        })}</p>
      </div>)}</div>
      <p className="mt-3 text-xs leading-5 text-[#6F5D51]">{t("habitImpact.personal.caution")}</p>
    </section> : <p className="rounded-2xl bg-white p-4 text-xs leading-5 text-[#6F5D51]">{t("habitImpact.personal.insufficient", { count: report.moodDaysAvailable })}</p>}
  </section>;
}
