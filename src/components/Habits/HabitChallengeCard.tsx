import { useMemo, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Beer, Candy, Cigarette, Coffee, Gamepad2, Moon, Search, ShoppingBag, Smartphone, Sprout, Trophy } from "lucide-react";
import { type HabitDefinition,type HabitRecord } from "../../data/habits/types";
import { habitStats } from "../../data/habits/statistics";
import { primaryClass } from "./shared";
import { challengePalette } from "./clockTime";
import MountainLandscape from "./MountainLandscape";
import DailyClock from "./DailyClock";
import "./challengeClock.css";

const habitIcons = { tobacco:Cigarette, coffee:Coffee, alcohol:Beer, social:Smartphone, gaming:Gamepad2, sugar:Candy, shopping:ShoppingBag, checking:Search, sleep:Moon, custom:Sprout };
export default function HabitChallengeCard({habit,records,today,onOpen}:{habit?:HabitDefinition;records:HabitRecord[];today:string;onOpen:(page:string)=>void}) {
  const {t}=useTranslation();
  const stats=useMemo(()=>habit?habitStats(records,habit.id,today):null,[habit,records,today]);
  const days=stats?.current??0;
  const palette=challengePalette(days);
  const style={"--challenge-face":palette.face,"--challenge-ring":palette.ring,"--challenge-edge":palette.edge} as CSSProperties;
  const name=habit?(habit.data.type==="custom"?habit.data.name:t("habitHub.habits."+habit.data.type)):"";
  const Icon=habitIcons[habit?.data.type??"custom"];
  return <section className="challenge-module" aria-label={t("habitHub.challenge")} style={style}>
    <div className="challenge-clock" data-testid="challenge-clock" data-state={habit?"active":"empty"}>
      <MountainLandscape days={days}/>
      <div className="challenge-clock-content">
        <h2 className="challenge-clock-heading">{t("habitHub.challenge")}</h2>
        {habit && stats ? <>
          <p className="challenge-clock-day" aria-label={t("habitHub.day",{count:days})}>
            <span className="challenge-clock-day-word">{t("habitHub.clock.dayWord")}</span>{" "}
            <span className={"challenge-clock-number"+(String(days).length>3?" challenge-clock-number-long":"")}>{days}</span>
          </p>
          <DailyClock days={days}/>
          <div className="challenge-clock-habit">
            {habit.data.type==="custom"?<span className="challenge-clock-habit-emoji" aria-hidden="true">{habit.data.icon}</span>:<Icon className="challenge-clock-habit-icon" strokeWidth={1.65} aria-hidden="true"/>}
            <h3 title={name} className="challenge-clock-habit-name">{name}</h3>
          </div>
          <p className="challenge-clock-streak">{t("habitHub.streak",{count:days})}</p>
        </> : <>
          <DailyClock showTime={false}/>
          <Sprout className="challenge-clock-seed" strokeWidth={1.3} aria-hidden="true"/>
          <p className="challenge-clock-invitation">{t("habitHub.empty")}</p>
        </>}
      </div>
      {days>=30 && <span className="challenge-clock-trophy" role="img" aria-label={t("habitHub.trophy")}><Trophy size={20} strokeWidth={1.6} aria-hidden="true"/></span>}
    </div>
    <div className="challenge-clock-actions">
      {habit && <p className="challenge-clock-goal"><span className="sr-only">{name}. </span>{habit.data.goal}</p>}
      <button type="button" className={primaryClass+" challenge-clock-primary"} onClick={()=>onOpen(habit?"log":"setup")}>
        {t(habit?"habitHub.register":"habitHub.choose")}
      </button>
      {habit && stats && <>
        {stats.today!==undefined && <p className="challenge-clock-note">{t("habitHub.status."+(stats.today?"done":"notDone"))}</p>}
        {days>=30 && <p className="challenge-clock-note">{t("habitHub.trophy")}</p>}
        {stats.awaitingYesterday && <p className="challenge-clock-note">{t("habitHub.grace")}</p>}
        <nav className="challenge-clock-secondary" aria-label={t("habitHub.clock.actions")}>
          {(["history","setup","restart"] as const).map(page=><button type="button" key={page} onClick={()=>onOpen(page)}>
            {t("habitHub."+({history:"clock.history",setup:"change",restart:"restart"}[page]))}
          </button>)}
        </nav>
      </>}
    </div>
  </section>;
}
