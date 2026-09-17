import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Compass, Info, Sparkles } from "lucide-react";
import { readPersonalEvents } from "../data/personal/personalEventStorage";
import { buildPersonalModel } from "../data/personal/personalModel";
import { buildPersonalInsights, explainInsight } from "../data/personal/personalInsights";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";

type Props = { onBack: () => void };

export default function PersonalMap({ onBack }: Props) {
  const { t } = useTranslation();
  const events = useMemo(() => readPersonalEvents(), []);
  const model = useMemo(() => buildPersonalModel(events), [events]);
  const insights = useMemo(() => buildPersonalInsights(events), [events]);
  useEffect(() => { recordPersonalAnalytics("personal_map_viewed"); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] to-[#F1EAE4] p-5 pb-24">
      <button type="button" onClick={onBack} className="mb-5 flex min-h-11 items-center gap-2 text-[#795B50] font-semibold" aria-label={t("personalMap.backAria")}>
        <ArrowLeft size={17} /> {t("back")}
      </button>
      <div className="rounded-[30px] border border-[#E8DDD4] bg-white p-6 shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4E7DF]"><Compass className="text-[#C97B5E]" aria-hidden="true" /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">CONFIA</p><h1 className="text-2xl font-black text-[#4A352F]">{t("personalMap.title")}</h1><p className="mt-1 text-sm text-[#806D65]">{t("personalMap.subtitle")}</p></div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2"><Metric label={t("personalMap.observations")} value={model.observationCount} /><Metric label={t("personalMap.days")} value={model.activeDays} /><Metric label={t("personalMap.completeness")} value={`${Math.round(model.completeness * 100)}%`} /></div>
      </div>
      <section className="mt-4 rounded-[26px] border border-[#E8DDD4] bg-white p-5 shadow-sm">
        <h2 className="font-black text-[#4A352F]">{t("personalMap.currentTitle")}</h2>
        <p className="mt-2 text-sm text-[#806D65]">{model.currentMood === undefined ? t("personalMap.learning") : t(`personalMap.direction.${model.moodDirection}`)}</p>
        {model.repeatedNeeds.length > 0 && <p className="mt-3 text-sm text-[#6D5A53]">{t("personalMap.needObserved", { need: model.repeatedNeeds[0].need, count: model.repeatedNeeds[0].count })}</p>}
      </section>
      <section className="mt-4 rounded-[26px] border border-[#E8DDD4] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Sparkles size={17} className="text-[#C97B5E]" aria-hidden="true" /><h2 className="font-black text-[#4A352F]">{t("personalMap.discoveries")}</h2></div>
        {insights.length === 0 ? <p className="mt-3 text-sm leading-6 text-[#806D65]">{t("personalMap.noDiscoveries")}</p> : insights.map(insight => <article key={insight.id} className="mt-4 rounded-2xl bg-[#FFF8F4] p-4"><p className="text-sm font-bold text-[#4A352F]">{insight.message}</p><p className="mt-2 text-xs leading-5 text-[#806D65]">{explainInsight(insight)}</p></article>)}
        {events.length > 0 && <div className="mt-4 flex gap-2 text-xs text-[#806D65]"><Info size={14} aria-hidden="true" /> {t("personalMap.explainable")}</div>}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-[#F8F2EE] p-3 text-center"><div className="text-lg font-black text-[#4A352F]">{value}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-[#967E74]">{label}</div></div>;
}
