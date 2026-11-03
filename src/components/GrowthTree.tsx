import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Leaf, Sprout } from "lucide-react";
import type { PersonalEvent } from "../data/personal/personalEvent";
import type { PersonalInsight } from "../data/personal/personalInsights";
import type { PersonalExperiment } from "../data/personal/personalExperiments";
import { buildPersonalGrowthTree } from "../data/personal/personalGrowthTree";
export function GrowthTree({ events, insights, experiments }: { events: PersonalEvent[]; insights: PersonalInsight[]; experiments: PersonalExperiment[] }) {
  const { t } = useTranslation();
  const branches = useMemo(() => buildPersonalGrowthTree(events, insights, experiments), [events, insights, experiments]);
  const learned = branches.filter(branch => branch.learned).length;
  const points = [{ x: 54, y: 20 }, { x: 88, y: 37 }, { x: 104, y: 70 }, { x: 18, y: 70 }, { x: 34, y: 37 }, { x: 68, y: 88 }];
  return (
    <section className="mt-4 rounded-[30px] border border-[#DCE7D8] bg-gradient-to-br from-[#FBFDF8] via-white to-[#EEF5EB] p-5 shadow-sm sm:p-6" aria-labelledby="confia-growth-tree-title">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6F0E2] text-[#557A58]"><Sprout size={21}/></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#66866A]">{t("personalMap.growthTree.eyebrow")}</p>
          <h2 id="confia-growth-tree-title" className="mt-1 text-xl font-black text-[#3F5140]">{t("personalMap.growthTree.title")}</h2>
          <p className="mt-2 text-xs leading-5 text-[#687B68]">{t("personalMap.growthTree.subtitle")}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#E0EBDD] bg-white/80 p-3">
        <svg viewBox="0 0 122 112" className="h-28 w-28 shrink-0" role="img" aria-label={t("personalMap.growthTree.visualLabel", { learned, total: branches.length })}>
          <path d="M61 104 C58 83 62 66 61 49 M61 78 C48 64 37 54 23 42 M61 70 C75 57 87 47 99 29 M61 56 C54 42 51 31 54 17 M61 60 C72 47 76 33 86 22" fill="none" stroke="#8C765C" strokeWidth="5" strokeLinecap="round"/>
          {points.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r={branches[index]?.learned?9:6} fill={branches[index]?.learned?"#77A879":"#D8E2D4"} stroke={branches[index]?.learned?"#4E7954":"#B8C8B5"} strokeWidth="2"/>)}
          <path d="M36 105 Q61 96 86 105" fill="none" stroke="#A7B99F" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div className="min-w-0">
          <p className="text-2xl font-black tabular-nums text-[#47684B]">{learned}/{branches.length}</p>
          <p className="mt-1 text-xs font-bold text-[#536D55]">{t("personalMap.growthTree.learnedDimensions")}</p>
          <p className="mt-2 text-[10px] leading-4 text-[#788A78]">{t("personalMap.growthTree.method")}</p>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {branches.map(branch=>(
          <li key={branch.id} className={"flex min-h-[58px] items-center gap-2 rounded-xl border px-3 py-2 " + (branch.learned?"border-[#D4E3D0] bg-white":"border-[#E5EAE2] bg-white/55")}>
            <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full " + (branch.learned?"bg-[#E7F1E3] text-[#527B57]":"bg-[#F0F2EE] text-[#A0AA9D]")}><Leaf size={14}/></span>
            <span className="min-w-0"><span className="block text-[11px] font-bold leading-4 text-[#4B604D]">{t("personalMap.growthTree.dimensions."+branch.id)}</span><span className="block text-[9px] text-[#829081]">{branch.learned?t("personalMap.growthTree.learned"):t("personalMap.growthTree.growing")}</span><span className="block text-[9px] leading-4 text-[#9AA596]">{t("personalMap.growthTree.evidence",{count:branch.evidenceCount,days:branch.activeDays})}</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] leading-4 text-[#788A78]">{t("personalMap.growthTree.noStreaks")}</p>
    </section>
  );
}
