import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Brain, Compass, Info, MessageSquareHeart, Plus, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { buildPersonalTwinSummary, buildReplayMoments } from "../data/personal/confiaReplay";
import { buildForecastSignals, buildRecall, buildCounterfactualSignals, buildPersonalIntelligenceSnapshot, askMyHistory, type HistoryQuestion } from "../data/personal/premiumIntelligence";
import { addManualNote, readFutureMessages, readManualNotes, removeManualNote, revealFutureMessage, saveFutureMessage, SELF_MEMORY_UPDATED_EVENT, type ManualNoteKind } from "../data/personal/selfMemory";
import { readPersonalEvents, appendPersonalEvents, PERSONAL_EVENTS_UPDATED_EVENT } from "../data/personal/personalEventStorage";
import { buildPersonalModel, findAnalogousMoments } from "../data/personal/personalModel";
import { buildPersonalInsights, explainInsight } from "../data/personal/personalInsights";
import { recordPersonalAnalytics } from "../data/personal/personalAnalytics";
import { applyInsightLifecycle, markInsightsShown } from "../data/personal/personalInsightLifecycle";
import { makePersonalEvent, createPersonalEventId } from "../data/personal/personalEvent";
import type { PersonalInsight } from "../data/personal/personalInsights";
import { emitCompanionInteraction } from "../data/reactive/companionBrain/companionInteractionEvents";

type Props = { onBack: () => void };

export default function PersonalMap({ onBack }: Props) {
  const { t } = useTranslation();
  const [personalEventRevision, setPersonalEventRevision] = useState(0);
  const [memoryRevision, setMemoryRevision] = useState(0);
  const [manualKind, setManualKind] = useState<ManualNoteKind>("helps");
  const [manualText, setManualText] = useState("");
  const [historyQuestion, setHistoryQuestion] = useState<HistoryQuestion | null>(null);
  const [futureText, setFutureText] = useState("");
  useEffect(() => {
    const handlePersonalEventsUpdated = () => setPersonalEventRevision(revision => revision + 1);
    const handleMemoryUpdated = () => setMemoryRevision(revision => revision + 1);
    window.addEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
    window.addEventListener(SELF_MEMORY_UPDATED_EVENT, handleMemoryUpdated);
    return () => {
      window.removeEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
      window.removeEventListener(SELF_MEMORY_UPDATED_EVENT, handleMemoryUpdated);
    };
  }, []);
  const events = useMemo(() => readPersonalEvents(), [personalEventRevision]);
  const model = useMemo(() => buildPersonalModel(events), [events]);
  const moodSeries = useMemo(() => events.filter(e => (e.type === "mood" || e.type === "checkin") && typeof e.value === "number").slice(-18), [events]);
  const analogous = useMemo(() => {
    const target = [...events].reverse().find(e => (e.type === "mood" || e.type === "checkin") && typeof e.value === "number");
    return target ? findAnalogousMoments(events, target, 3) : [];
  }, [events]);
  const insights = useMemo(() => applyInsightLifecycle(buildPersonalInsights(events)), [events]);
  const replay = useMemo(() => buildReplayMoments(events), [events]);
  const twin = useMemo(() => buildPersonalTwinSummary(events), [events]);
  const forecasts = useMemo(() => buildForecastSignals(events), [events]);
  const recall = useMemo(() => buildRecall(events), [events]);
  const counterfactuals = useMemo(() => buildCounterfactualSignals(events), [events]);
  const longitudinal = useMemo(() => buildPersonalIntelligenceSnapshot(events), [events]);
  const historyAnswer = useMemo(() => historyQuestion ? askMyHistory(events, historyQuestion) : null, [events, historyQuestion]);
  const manualNotes = useMemo(() => readManualNotes(), [memoryRevision]);
  const futureMessages = useMemo(() => readFutureMessages(), [memoryRevision]);
  const dueFutureMessages = futureMessages.filter(item => new Date(item.revealAt).getTime() <= Date.now());
  const shownInsightIds = useRef(new Set<string>());
  useEffect(() => {
    recordPersonalAnalytics("personal_map_viewed");
    const newlyVisible = insights.filter(insight => !shownInsightIds.current.has(insight.id));
    if (!newlyVisible.length) return;
    markInsightsShown(newlyVisible);
    newlyVisible.forEach(insight => shownInsightIds.current.add(insight.id));
  }, [insights]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8F5F2] p-4 pb-28 text-[#332824] sm:p-6">
      <button type="button" onClick={onBack} className="mb-4 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#6D554B] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52]" aria-label={t("personalMap.backAria")}>
        <ArrowLeft size={17} /> {t("back")}
      </button>

      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[radial-gradient(circle_at_85%_10%,rgba(220,157,125,.34),transparent_36%),linear-gradient(145deg,#fffdfa,#eee5df)] p-6 shadow-[0_24px_70px_rgba(93,65,53,.12)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#D99B7C]/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B86B52]">CONFIA · {t("personalMap.eyebrow")}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#3F2C27] sm:text-4xl">{t("personalMap.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#735F56]">{t("personalMap.subtitle")}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/65 shadow-sm sm:flex"><Compass className="text-[#B86B52]" aria-hidden="true" /></div>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric label={t("personalMap.observations")} value={model.observationCount} />
          <Metric label={t("personalMap.days")} value={model.activeDays} />
          <Metric label={t("personalMap.completeness")} value={`${Math.round(model.completeness * 100)}%`} />
        </div>
      </section>

      <section className="mt-4 rounded-[30px] border border-[#E5D7C7] bg-[#FFFCF7] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3F2C27] text-white"><Sparkles size={19}/></div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">CONFIA · Memória viva</p><h2 className="mt-1 text-xl font-black text-[#3F2C27]">O que a tua história está a ensinar</h2><p className="mt-2 text-xs leading-5 text-[#806D65]">A CONFIA observa o agora, 7, 30 e 90 dias e a tua história completa. Compara-te contigo próprio e conserva também os dados que contradizem um padrão.</p></div></div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">{longitudinal.timeScales.map(scale => <div key={scale.label} className="rounded-2xl border border-[#F0E3DC] bg-white px-2 py-3 text-center"><b className="block text-[10px] text-[#3F2C27]">{scale.label}</b><span className="mt-1 block text-[9px] text-[#9A8177]">{scale.activeDays}d</span></div>)}</div>
        {longitudinal.strongestLearning ? <div className="mt-4 rounded-2xl bg-[#F6EFEA] p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#8A684E]">Aprendizagem mais sólida agora</p><p className="mt-2 text-xs font-semibold leading-5 text-[#51463F]">{longitudinal.strongestLearning.text}</p></div> : <p className="mt-4 rounded-2xl bg-[#F6EFEA] p-4 text-xs leading-5 text-[#806D65]">Ainda estou a aprender. Não vou transformar poucos registos numa conclusão sobre ti.</p>}
        {longitudinal.interventions.some(item => item.state === "changed" || item.state === "weakening") && <p className="mt-3 rounded-2xl border border-[#E8D8C7] bg-white p-3 text-[11px] font-semibold leading-5 text-[#735F56]">Detetei pelo menos uma aprendizagem que está a mudar. A CONFIA dá mais peso ao teu padrão recente do que a uma memória antiga.</p>}
      </section>

      <section className="mt-4 rounded-[30px] border border-[#E2D6CD] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><MessageSquareHeart size={18} className="text-[#B86B52]"/><h2 className="text-xl font-black text-[#3F2C27]">Pergunta à minha história</h2></div>
        <p className="mt-2 text-xs leading-5 text-[#806D65]">Perguntas respondidas apenas a partir dos teus próprios registos. Podes sempre ver porque é que a CONFIA chegou à resposta.</p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{([{id:"what_helps",label:"O que me ajuda?"},{id:"when_harder",label:"Quando fico pior?"},{id:"am_i_changing",label:"Tenho mudado?"},{id:"have_i_been_here",label:"Já estive assim?"},{id:"how_i_recovered",label:"Como recuperei?"},{id:"what_do_you_know",label:"O que sabes sobre mim?"}] as Array<{id:HistoryQuestion;label:string}>).map(item=><button key={item.id} type="button" onClick={()=>setHistoryQuestion(item.id)} className={"min-h-10 shrink-0 rounded-full px-3 text-[10px] font-black "+(historyQuestion===item.id?"bg-[#3F2C27] text-white":"bg-[#F7EFEB] text-[#795B50]")}>{item.label}</button>)}</div>
        {historyAnswer && <div className="mt-4 rounded-2xl bg-[#FFF9F5] p-4"><p className="text-xs font-bold leading-5 text-[#51463F]">{historyAnswer.answer}</p><details className="mt-3"><summary className="cursor-pointer text-[10px] font-black text-[#8A684E]">Porque digo isto?</summary><p className="mt-2 text-[10px] leading-5 text-[#806D65]">{historyAnswer.why}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-[#A48D83]">{historyAnswer.evidenceClass} · {historyAnswer.evidenceCount} registos de evidência</p></details></div>}
      </section>

      <section className="mt-4 rounded-[30px] border border-[#EADBD3] bg-[#332824] p-5 text-white shadow-[0_18px_50px_rgba(51,40,36,.18)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Brain size={20} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#E6B9A3]">{t("personalMap.twin.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-black">{t("personalMap.twin.title")}</h2>
            <p className="mt-2 text-xs leading-5 text-white/70">{t("personalMap.twin.evidence", { observations: twin.observationCount, insights: twin.insightCount })}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {twin.strongest.length ? twin.strongest.map(item => (
            <div key={item.id} className="rounded-2xl bg-white/10 p-3 text-xs leading-5">
              {item.messageKey ? t(item.messageKey, item.messageValues) : item.message}
            </div>
          )) : <p className="rounded-2xl bg-white/10 p-3 text-xs text-white/70">{t("personalMap.twin.learning")}</p>}
          {twin.helpfulInterventionRate !== undefined && (
            <p className="text-[11px] font-bold text-[#E6B9A3]">{t("personalMap.twin.interventions", { rate: twin.helpfulInterventionRate })}</p>
          )}
        </div>
      </section>

      {replay.length > 0 && (
        <section className="mt-4 rounded-[30px] border border-[#DCC8BD] bg-gradient-to-br from-[#FFF7F2] to-white p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">CONFIA Replay</p>
          <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.replay.title")}</h2>
          <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.replay.subtitle")}</p>
          <div className="mt-4 space-y-2">
            {replay.map(item => (
              <article key={item.id} className="rounded-2xl border border-[#F0E3DC] bg-white p-4">
                <div className="flex items-center justify-between gap-3"><b className="text-xs text-[#3F2C27]">{item.date}</b><span className="rounded-full bg-[#F5ECE7] px-2 py-1 text-xs font-black text-[#B86B52]">{item.mood}/10</span></div>
                {item.note && <p className="mt-2 text-xs italic leading-5 text-[#806D65]">“{item.note}”</p>}
                {item.recovery && <p className="mt-2 text-[11px] font-bold leading-5 text-[#587563]">{item.recovery.daysLater === 0 ? "Mais tarde nesse dia" : item.recovery.daysLater === 1 ? "No dia seguinte" : `${item.recovery.daysLater} dias depois`}, registaste {item.recovery.mood}/10.</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {(forecasts.length > 0 || recall.length > 0 || counterfactuals.length > 0) && (
        <section className="mt-4 rounded-[30px] border border-[#E1D2CA] bg-gradient-to-br from-[#3F2C27] to-[#6D4D43] p-5 text-white shadow-lg sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#E6B9A3]">CONFIA Intelligence</p>
          <h2 className="mt-1 text-xl font-black">{t("personalPremium.title")}</h2>
          <p className="mt-2 text-xs leading-5 text-white/70">{t("personalPremium.subtitle")}</p>
          <div className="mt-4 space-y-3">
            {forecasts.map(item => <article key={item.id} className="rounded-2xl bg-white/10 p-4"><b className="text-xs">{t("personalPremium.forecast.title")}</b><p className="mt-2 text-[11px] leading-5 text-white/80">{item.need ? t("personalPremium.forecast.need",{need:item.need,count:item.evidenceCount,recent:item.recentCount}) : t("personalPremium.forecast.weekday",{count:item.evidenceCount})}</p><p className="mt-2 text-[9px] text-[#E6B9A3]">{t("personalPremium.evidence",{count:item.evidenceCount,dates:item.dates.join(", ")})}</p></article>)}
            {recall.slice(0,1).map(item => <article key={"recall_"+item.id} className="rounded-2xl bg-white/10 p-4"><b className="text-xs">{t("personalPremium.recall.title")}</b><p className="mt-2 text-[11px] leading-5 text-white/80">{t("personalPremium.recall.body",{date:item.date,mood:item.mood,recovery:item.recovery?.mood,days:item.recovery?.daysLater})}</p></article>)}
            {counterfactuals.map(item => <article key={item.id} className="rounded-2xl bg-white/10 p-4"><b className="text-xs">{t("personalPremium.counterfactual.title")}</b><p className="mt-2 text-[11px] leading-5 text-white/80">{t("personalPremium.counterfactual.body",{withCount:item.withCount,withoutCount:item.withoutCount,withDelta:item.withDelta,withoutDelta:item.withoutDelta})}</p><p className="mt-2 text-[9px] text-[#E6B9A3]">{t("personalPremium.associationOnly")}</p></article>)}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><MessageSquareHeart size={18} className="text-[#B86B52]" /><h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.manual.title")}</h2></div>
        <p className="mt-1 text-xs leading-5 text-[#806D65]">{t("personalMap.manual.subtitle")}</p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {([
            ["early_signal","Sinais iniciais"],["helps","Ajuda-me"],["does_not_help","Não ajuda"],["support_person","Pessoas"],["drains_me","Drena-me"],["victory","Vitórias"]
          ] as [ManualNoteKind,string][]).map(([id,label]) => (
            <button key={id} type="button" onClick={() => setManualKind(id)} className={"min-h-10 shrink-0 rounded-full px-3 text-[10px] font-black " + (manualKind === id ? "bg-[#3F2C27] text-white" : "bg-[#F7EFEB] text-[#795B50]")}>{label}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={manualText} onChange={e => setManualText(e.target.value.slice(0,500))} placeholder={t("personalMap.manual.placeholder")} className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[#E8DDD4] px-3 text-sm outline-none focus:ring-2 focus:ring-[#B86B52]/30" />
          <button type="button" disabled={!manualText.trim()} onClick={() => { addManualNote(manualKind, manualText); setManualText(""); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#587563] text-white disabled:opacity-40"><Plus size={17}/></button>
        </div>
        <div className="mt-3 space-y-2">
          {manualNotes.slice(0,8).map(note => <div key={note.id} className="flex items-start justify-between gap-3 rounded-2xl bg-[#FFF9F5] p-3"><div><span className="text-[9px] font-black uppercase tracking-wide text-[#B86B52]">{note.kind.replaceAll("_"," ")}</span><p className="mt-1 text-xs font-semibold leading-5 text-[#5E4A43]">{note.text}</p></div><button type="button" onClick={() => removeManualNote(note.id)} className="p-2 text-[#A48D83]" aria-label={t("personalMap.manual.delete")}><Trash2 size={14}/></button></div>)}
        </div>
      </section>

      <section className="mt-4 rounded-[30px] border border-[#E8DDD4] bg-[#FFF9F5] p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">{t("personalMap.future.eyebrow")}</p>
        <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.future.title")}</h2>
        {dueFutureMessages.slice(0,2).map(item => <div key={item.id} className="mt-3 rounded-2xl bg-white p-4"><p className="text-xs font-bold leading-5 text-[#5E4A43]">“{item.text}”</p><p className="mt-2 text-[10px] text-[#9A8177]">{t("personalMap.future.writtenOn", { date: item.createdAt.slice(0,10) })}</p>{!item.revealedAt && <button type="button" onClick={() => revealFutureMessage(item.id)} className="mt-2 text-[10px] font-black text-[#587563]">{t("personalMap.future.markRead")}</button>}</div>)}
        <textarea value={futureText} onChange={e => setFutureText(e.target.value.slice(0,1200))} rows={3} placeholder={t("personalMap.future.placeholder")} className="mt-4 w-full rounded-2xl border border-[#E8DDD4] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#B86B52]/30" />
        <button type="button" disabled={!futureText.trim()} onClick={() => { saveFutureMessage(futureText, 6); setFutureText(""); }} className="mt-2 min-h-11 w-full rounded-2xl bg-[#3F2C27] px-4 text-xs font-black text-white disabled:opacity-40">{t("personalMap.future.saveSixMonths")}</button>
      </section>

      <section className="mt-4 overflow-hidden rounded-[30px] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(93,65,53,.08)] sm:p-6">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B86B52]">{t("personalMap.pulseEyebrow")}</p><h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.pulseTitle")}</h2></div><span className="rounded-full bg-[#F5ECE7] px-3 py-1 text-xs font-bold text-[#8A685C]">{model.currentMood ?? "—"}/10</span></div>
        <div className="mt-5"><MoodPulse values={moodSeries.map(e => Number(e.value))} label={t("personalMap.pulseAria")} /></div>
        <p className="mt-3 text-xs leading-5 text-[#806D65]">{model.currentMood === undefined ? t("personalMap.learning") : t(`personalMap.direction.${model.moodDirection}`)}</p>
      </section>

      <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-[0_16px_45px_rgba(93,65,53,.08)] sm:p-6">
        <div className="flex items-center gap-2"><Sparkles size={17} className="text-[#B86B52]" aria-hidden="true" /><h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.discoveries")}</h2></div>
        {insights.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#806D65]">
            {t("personalMap.noDiscoveries")}
          </p>
        ) : (
          <InsightsSummary insights={insights} t={t} />
        )}
        {events.length > 0 && <div className="mt-5 flex gap-2 rounded-2xl bg-[#F8F3F0] p-3 text-xs leading-5 text-[#806D65]"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {t("personalMap.explainable")}</div>}
      </section>

      {model.repeatedNeeds.length > 0 && <section className="mt-4 rounded-[30px] border border-[#EADBD3] bg-[#FFF9F5] p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B86B52]">{t("personalMap.needEyebrow")}</p><h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.needTitle")}</h2><p className="mt-2 text-sm leading-6 text-[#6D5A53]">{t("personalMap.needObserved", { need: model.repeatedNeeds[0].need, count: model.repeatedNeeds[0].count })}</p></section>}

      {analogous.length > 0 && <section className="mt-4 rounded-[30px] border border-white bg-white/90 p-5 shadow-sm"><h2 className="text-xl font-black text-[#3F2C27]">{t("personalMap.analogousTitle")}</h2><p className="mt-1 text-xs leading-5 text-[#806D65]">{t("personalMap.analogousSubtitle")}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{analogous.map(event => <div key={event.id} className="rounded-2xl bg-[#FFF8F4] px-4 py-3"><span className="block text-xs font-semibold text-[#806D65]">{event.localDate}</span><span className="mt-1 block text-xl font-black text-[#B86B52]">{event.value}/10</span></div>)}</div></section>}
    </main>
  );
}


function InsightsSummary({
  insights,
  t,
}: {
  insights: PersonalInsight[];
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const [feedback, setFeedback] = useState<Record<string, "useful" | "dismissed">>({});

  const send = (insight: PersonalInsight, kind: "useful" | "dismissed") => {
    appendPersonalEvents([
      makePersonalEvent({
        id: createPersonalEventId("insight_feedback"),
        type: "insight_feedback",
        timestamp: new Date().toISOString(),
        source: "insight",
        value: kind,
        metadata: {
          insightId: insight.id,
          feedback: kind,
        },
      }),
    ]);

    recordPersonalAnalytics(
      kind === "useful" ? "insight_useful" : "insight_dismissed",
    );

    setFeedback(current => ({
      ...current,
      [insight.id]: kind,
    }));
  };

  const signalLabel = (insight: PersonalInsight): string => {
    const supportedTypes = new Set([
      "trend",
      "time_of_day",
      "weekday",
      "habit_association",
      "goal_association",
      "intervention_effect",
      "recovery_pattern",
      "repeated_need",
      "personal_change",
      "pattern_disappearance",
    ]);

    const type = supportedTypes.has(insight.type)
      ? insight.type
      : "default";

    return t(`personalMap.signalTypes.${type}`);
  };

  return (
    <article className="mt-4 rounded-[24px] border border-[#F0E3DC] bg-gradient-to-br from-[#FFF9F5] to-[#F6EFEB] p-4 sm:p-5">
      <div>
        <p className="text-sm font-black leading-6 text-[#3F2C27]">
          {t("personalMap.signalsDetected", { count: insights.length })}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#806D65]">
          {t("personalMap.signalsExplanation")}
        </p>
      </div>

      <div className="mt-4 divide-y divide-[#EADBD3]">
        {insights.map((insight, index) => {
          const currentFeedback = feedback[insight.id];

          return (
            <section key={insight.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EED3C7] text-[11px] font-black text-[#7A493A]">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-[#B86B52]">
                      {signalLabel(insight)}
                    </p>

                    <span className="rounded-full bg-[#F0E3DC] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#7A5A4E]">
                      {t(`personalInsights.confidence.${insight.confidence}`)}
                    </span>

                    {insight.novelty !== "known" && (
                      <span className="rounded-full bg-[#EED3C7] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#7A493A]">
                        {t("personalMap.new")}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-bold leading-6 text-[#3F2C27]">
                    {insight.messageKey
                      ? t(insight.messageKey, insight.messageValues)
                      : insight.message}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#806D65]">
                    {explainInsight(insight, t)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#9A8177]">
                      {currentFeedback
                        ? t("personalMap.feedbackThanks")
                        : t("personalMap.feedbackPrompt")}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => send(insight, "useful")}
                        disabled={Boolean(currentFeedback)}
                        aria-pressed={currentFeedback === "useful"}
                        aria-label={t("personalMap.useful")}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#6B8A72] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52] disabled:cursor-default disabled:opacity-60"
                      >
                        <ThumbsUp size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => send(insight, "dismissed")}
                        disabled={Boolean(currentFeedback)}
                        aria-pressed={currentFeedback === "dismissed"}
                        aria-label={t("personalMap.dismiss")}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#9A6E64] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52] disabled:cursor-default disabled:opacity-60"
                      >
                        <ThumbsDown size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function InsightCard({ insight, t }: { key?: string; insight: PersonalInsight; t: (key: string, values?: Record<string, unknown>) => string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const send = (kind: "useful" | "dismissed") => {
    appendPersonalEvents([makePersonalEvent({ id: createPersonalEventId("insight_feedback"), type: "insight_feedback", timestamp: new Date().toISOString(), source: "insight", value: kind, metadata: { insightId: insight.id, feedback: kind } })]);
    recordPersonalAnalytics(kind === "useful" ? "insight_useful" : "insight_dismissed");
    setFeedback(kind);
  };
  return <article className="mt-4 rounded-[24px] border border-[#F0E3DC] bg-gradient-to-br from-[#FFF9F5] to-[#F6EFEB] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold leading-6 text-[#3F2C27]">{insight.messageKey ? t(insight.messageKey, insight.messageValues) : insight.message}</p><div className="flex shrink-0 flex-wrap justify-end gap-1.5"><span className="rounded-full bg-[#F0E3DC] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#7A5A4E]">{t(`personalInsights.confidence.${insight.confidence}`)}</span>{insight.novelty !== "known" && <span className="rounded-full bg-[#EED3C7] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#7A493A]">{t("personalMap.new")}</span>}</div></div><p className="mt-2 text-xs leading-5 text-[#806D65]">{explainInsight(insight, t)}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-[#9A8177]">{feedback ? t("personalMap.feedbackThanks") : t("personalMap.feedbackPrompt")}</span><div className="flex gap-2"><button type="button" onClick={() => send("useful")} disabled={feedback !== null} aria-pressed={feedback === "useful"} aria-label={t("personalMap.useful")} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#6B8A72] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52] disabled:cursor-default disabled:opacity-60"><ThumbsUp size={15} /></button><button type="button" onClick={() => send("dismissed")} disabled={feedback !== null} aria-pressed={feedback === "dismissed"} aria-label={t("personalMap.dismiss")} className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#E5D5CD] bg-white text-[#9A6E64] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B86B52] disabled:cursor-default disabled:opacity-60"><ThumbsDown size={15} /></button></div></div></article>;
}

function MoodPulse({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="flex h-28 items-center justify-center rounded-3xl bg-[#FAF5F2] text-xs font-semibold text-[#907A70]">—</div>;
  const width = 720; const height = 150; const pad = 12; const min = 1; const max = 10;
  const points = values.map((value, i) => `${pad + (i / (values.length - 1)) * (width - pad * 2)},${height - pad - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * (height - pad * 2)}`).join(" ");
  const last = points.split(" ").at(-1)?.split(",") ?? [String(pad), String(height / 2)];
  return <div className="overflow-hidden rounded-3xl bg-[#F9F3EF] p-2"><svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label={label}><defs><linearGradient id="pulseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#D99B7C" stopOpacity=".28"/><stop offset="100%" stopColor="#D99B7C" stopOpacity="0"/></linearGradient></defs><polyline points={`${pad},${height-pad} ${points} ${width-pad},${height-pad}`} fill="url(#pulseFill)" stroke="none"/><polyline points={points} fill="none" stroke="#B86B52" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx={last[0]} cy={last[1]} r="6" fill="#FFF" stroke="#B86B52" strokeWidth="3"/></svg></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white bg-white/65 p-3 text-center shadow-sm"><div className="text-lg font-black text-[#3F2C27]">{value}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-[#967E74]">{label}</div></div>; }
