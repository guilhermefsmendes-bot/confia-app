import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { readClockTime } from "./clockTime";

// Only this subtree updates every second. No storage, analytics or pattern calls.
export default memo(function DailyClock({ days=0, showTime=true }: { days?:number; showTime?:boolean }) {
  const {t}=useTranslation();
  const [clock,setClock]=useState(readClockTime);
  useEffect(()=>{
    let timer:ReturnType<typeof setInterval>|undefined;
    const update=()=>setClock(readClockTime());
    const resume=()=>{
      if(timer)clearInterval(timer);
      timer=undefined;
      update();
      if(document.visibilityState!=="hidden")timer=setInterval(update,1000);
    };
    resume();
    window.addEventListener("focus",resume);
    window.addEventListener("pageshow",resume);
    document.addEventListener("visibilitychange",resume);
    return ()=>{
      if(timer)clearInterval(timer);
      window.removeEventListener("focus",resume);
      window.removeEventListener("pageshow",resume);
      document.removeEventListener("visibilitychange",resume);
    };
  },[]);
  return <>
    <svg className="challenge-clock-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="challenge-clock-track" cx="50" cy="50" r="47" fill="none" strokeWidth="1.4"/>
      <circle key={clock.day} data-testid="challenge-day-ring" className="challenge-clock-progress" cx="50" cy="50" r="47" fill="none"
        strokeWidth="1.8" pathLength="100" strokeDasharray="100"
        strokeDashoffset={100-clock.progress*100} strokeLinecap="round" transform="rotate(-90 50 50)"/>
    </svg>
    {showTime && <div className="challenge-clock-countdown" role="timer" aria-live="off"
      aria-label={t("habitHub.clock.accessible",{count:days,hours:clock.hours,minutes:clock.minutes})}>
      <time data-testid="challenge-countdown" className="challenge-clock-time" aria-hidden="true">{clock.time}</time>
      <span className="challenge-clock-caption" aria-hidden="true">{t("habitHub.countdown")}</span>
    </div>}
  </>;
});
