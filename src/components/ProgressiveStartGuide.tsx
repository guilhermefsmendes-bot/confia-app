import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Compass, Footprints, CheckCircle2, Circle } from "lucide-react";
import { normalizeDailyRatings } from "../storage/dailyRatingStorage";
import { isValidPersonalLocalDate } from "../data/personal/personalEvent";

interface Props {
  onOpenTool: () => void;
  onOpenRecord: () => void;
  onOpenMap: () => void;
}

/**
 * Progressive first-use guide: daily check-ins and daily ratings both count
 * as meaningful first steps. The Personal Map is promoted after three
 * distinct, valid record days across either source.
 */
export function ProgressiveStartGuide({ onOpenTool, onOpenRecord, onOpenMap }: Props) {
  const { t } = useTranslation();
  const [recordDays, setRecordDays] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let latestRequest = 0;

    const loadRecordDays = async () => {
      const request = ++latestRequest;
      const dates = new Set<string>();

      // Daily check-ins and daily ratings are both valid first steps.
      // Count distinct real calendar days across both sources.
      try {
        const { getDailyCheckInHistory } = await import("../storage/dailyCheckInStorage");
        for (const item of getDailyCheckInHistory()) {
          if (isValidPersonalLocalDate(item?.date)) dates.add(item.date);
        }
      } catch {
        // Continue: ratings may still provide a valid history.
      }

      try {
        const rawRatings = window.localStorage.getItem("confia_ratings_v2");
        const ratings = normalizeDailyRatings(rawRatings ? JSON.parse(rawRatings) : []);
        for (const item of ratings) {
          if (isValidPersonalLocalDate(item.date)) dates.add(item.date);
        }
      } catch {
        // A damaged or unavailable source must not break the home screen.
      }

      // Ignore stale async reads if another save triggered a newer refresh.
      if (!cancelled && request === latestRequest) setRecordDays(dates.size);
    };

    const refresh = () => { void loadRecordDays(); };
    const events = [
      "confia:daily-checkin-saved",
      "confia:daily-rating-saved",
      "confia:personal-events-updated",
      "storage",
      "focus",
    ];

    void loadRecordDays();
    events.forEach(event => window.addEventListener(event, refresh));
    return () => {
      cancelled = true;
      events.forEach(event => window.removeEventListener(event, refresh));
    };
  }, []);

  if (recordDays === null) {
    return <div className="min-h-24 animate-pulse rounded-[24px] bg-[#F8F3F0]" aria-busy="true" />;
  }

  if (recordDays >= 3) {
    return (
      <section className="relative overflow-hidden rounded-[30px] border border-[#D9B8A8] bg-[radial-gradient(circle_at_90%_10%,rgba(220,157,125,.28),transparent_42%),linear-gradient(135deg,#FFF9F5,#FFFFFF)] p-4 shadow-[0_10px_28px_rgba(92,64,52,0.07)]" aria-label={t("personalMap.title")}>
        <button type="button" onClick={onOpenMap} className="flex min-h-16 w-full items-center gap-3 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E8DDD7] bg-white text-[#934A38]"><Compass size={20}/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-[#4A352F]">{t("personalMap.title")}</span>
            <span className="mt-1 block text-[11px] leading-5 text-[#806D65]">{t("personalMap.homeLearning")}</span>
            <span className="mt-2 block text-[10px] font-black uppercase tracking-wide text-[#934A38]">{t("personalMap.openMap")}</span>
          </span>
          <span className="text-lg text-[#934A38]" aria-hidden="true">→</span>
        </button>
      </section>
    );
  }

  const hasFirstRecord = recordDays > 0;

  return (
    <section className="rounded-[28px] border border-[#E8DDD7] bg-white p-4 shadow-[0_8px_24px_rgba(92,64,52,0.045)]" aria-label={t("homeSpace.guidedStart.title")}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F8EEE8] text-[#934A38]"><Footprints size={19}/></span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#934A38]">{t("homeSpace.guidedStart.eyebrow")}</p>
          <h3 className="mt-1 text-sm font-black text-[#4A352F]">{t("homeSpace.guidedStart.title")}</h3>
          <p className="mt-1 text-[11px] leading-5 text-[#806D65]">{t("homeSpace.guidedStart.subtitle")}</p>
        </div>
      </div>

      <ol className="mt-4 space-y-3">
        <li className="flex items-center gap-3">
          <Circle size={17} className="shrink-0 text-[#B6A69D]"/>
          <span className="text-xs font-semibold text-[#594A43]">{t("homeSpace.guidedStart.companion")}</span>
          <span className="ml-auto text-[9px] font-bold text-[#6F8D6D]">{t("homeSpace.guidedStart.available")}</span>
        </li>
        <li className="flex items-center gap-3">
          {hasFirstRecord ? <CheckCircle2 size={17} className="shrink-0 text-[#6F9A72]"/> : <Circle size={17} className="shrink-0 text-[#B6A69D]"/>}
          <span className="text-xs font-semibold text-[#594A43]">{t("homeSpace.guidedStart.firstRecord")}</span>
          {!hasFirstRecord && <button type="button" onClick={onOpenRecord} className="ml-auto min-h-9 rounded-full border border-[#DCC8BE] px-3 text-[10px] font-bold text-[#8A4D3C]">{t("homeSpace.guidedStart.recordAction")}</button>}
        </li>
        <li className="flex items-center gap-3">
          <Circle size={17} className="shrink-0 text-[#B6A69D]"/>
          <span className="min-w-0 flex-1 text-xs font-semibold text-[#594A43]">{t("homeSpace.guidedStart.tryTool")}</span>
          <button type="button" onClick={onOpenTool} className="min-h-9 rounded-full border border-[#DCC8BE] px-3 text-[10px] font-bold text-[#8A4D3C]">{t("homeSpace.guidedStart.toolAction")}</button>
        </li>
      </ol>

      <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-[#674D44]">{t("homeSpace.guidedStart.mapTitle")}</p>
          <span className="text-[10px] font-bold tabular-nums text-[#8A4D3C]">{Math.min(recordDays, 3)}/3</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E9DDD5]">
          <div className="h-full rounded-full bg-[#B77A62] transition-all" style={{ width: ((Math.min(recordDays, 3) / 3) * 100) + "%" }}/>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#806D65]">{t("homeSpace.guidedStart.mapHint")}</p>
      </div>
    </section>
  );
}
