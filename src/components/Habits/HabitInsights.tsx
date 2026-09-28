import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import { buildPersonalInsights } from "../../data/personal/personalInsights";
export default function HabitInsights({events,today,showEmpty=true}:{events:PersonalEvent[];today:string;showEmpty?:boolean}) {
  const {t}=useTranslation();
  const insights=useMemo(()=>buildPersonalInsights(events).filter(i=>i.fingerprint.startsWith("lifestyle:")),[events,today]);
  if(!insights.length && !showEmpty)return null;
  if(!insights.length)return <p className="px-2 text-sm leading-6 text-[#6F5D51]">{t("habitHub.insights.empty")}</p>;
  return <section className="rounded-[28px] border border-[#DED1BD] bg-[#FFFDF7] p-5"><h2 className="text-lg font-black">{t("habitHub.insights.title")}</h2><div className="mt-4 space-y-3">{insights.map(i=><article key={i.id} className="rounded-2xl border border-[#E8DDD7] bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#715434]">{t("habitHub.insights."+(i.status==="emerging"?"early":"repeated"))}</p><p className="mt-2 text-sm leading-6">{t(i.messageKey!,i.messageValues)}</p><details className="mt-3 text-xs leading-5"><summary className="min-h-8 cursor-pointer font-bold">{t("habitHub.insights.evidence")}</summary><p>{t("habitHub.insights.sample",i.messageValues)}</p><p>{t("habitHub.insights.limits")}</p></details></article>)}</div><p className="mt-3 text-xs leading-5">{t("habitHub.insights.disclaimer")}</p></section>;
}
