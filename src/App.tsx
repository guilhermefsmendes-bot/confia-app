import {habitDestination,screenName} from "./navigation";
import type { CompanionAction } from "./components/Companheiro/CompanionVoice";
import type { NoticeTarget } from "./notifications/model";
import { lazy, Suspense, memo, startTransition, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppHeader } from "./components/layout/AppHeader";
import { MainNavigation } from "./components/layout/MainNavigation";
import { Heart, Sun, Compass, ArrowUp, ArrowLeft, Sparkles, Moon, Users, AlertCircle, Brain, CheckCircle2, Calendar, House, Wind, Target, Zap, ChartNoAxesCombined, Backpack, Store, Settings, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useAgeGate, useDocumentVisibility, useObjectiveDaySync } from "./hooks/useAppLifecycle";
import { useDeferredAppServices } from "./hooks/useDeferredAppServices";
import { usePersonalDiscovery } from "./hooks/usePersonalDiscovery";
import { readCompanionPersonalContextConsent } from "./data/reactive/companionContextConsent";
import { ProgressiveStartGuide } from "./components/ProgressiveStartGuide";
import { useCommunityPosts } from "./hooks/useCommunityPosts";
import { scheduleBackgroundWork } from "./utils/scheduleBackgroundWork";
import { AgeGateScreen } from "./components/AgeGateScreen";
import { LazySection, ScreenLoading } from "./components/AppShellParts";
import { CommunityGuidelinesModal, LevelUpOverlay } from "./components/AppFeedbackOverlays";




import type { CompanionInteractionKind, CompanionSemanticArea } from "./data/reactive/companionBrain/companionEventIntelligence";
import type { CompanionBrainTrigger } from "./data/reactive/companionBrain/companionBrainTypes";

import { useDailyOpenState } from "./hooks/useDailyOpenState";
import { useUnreadCommunityChat } from "./hooks/useUnreadCommunityChat";
import { useTabNavigation } from "./hooks/useTabNavigation";
import { getLocalCalendarDate } from "./utils/date";
import { normalizeDailyRatings } from "./storage/dailyRatingStorage";

const PersonalGrowthHub = lazy(() => import("./components/PersonalGrowthHub"));
const ConfiaCompanionHome = lazy(() => import("./components/Companheiro/ConfiaCompanionHome"));
const MemoConfiaCompanionHome = memo(ConfiaCompanionHome);
const InnerCanvas = lazy(() => import("./components/InnerCanvas/InnerCanvas"));
const HomeInventory = lazy(() => import("./components/HomeInventory"));
const HomeShop = lazy(() => import("./components/HomeShop"));
const NotificationSettings = lazy(() => import("./components/NotificationSettings"));
const ModeratorDashboard = lazy(() => import("./components/ModeratorDashboard"));
const HabitDashboard = lazy(() => import("./components/Habits/HabitDashboard"));
const MemoHabitDashboard = memo(HabitDashboard);
const MorningSheet = lazy(() => import("./components/layout/MorningSheet").then(m => ({ default: m.MorningSheet })));
const EmbraceTab = lazy(() => import("./components/layout/AppTabs").then(m => ({ default: m.EmbraceTab })));
const ObjectivesTab = lazy(() => import("./components/layout/AppTabs").then(m => ({ default: m.ObjectivesTab })));
const CommunityTab = lazy(() => import("./components/layout/AppTabs").then(m => ({ default: m.CommunityTab })));

const StopMode = lazy(() => import("./components/StopMode").then(m => ({ default: m.StopMode })));
const CommunityChat = lazy(() => import("./components/CommunityChat").then(m => ({ default: m.CommunityChat })));
const TriageModal = lazy(() => import("./components/TriageModal").then(m => ({ default: m.TriageModal })));
const ListeningSupportModal = lazy(() => import("./components/ListeningSupportModal").then(m => ({ default: m.ListeningSupportModal })));

import { AvatarState, Objective, DailyRating, WeeklyGoal, SharePost } from './types';

import type { ReactiveResult } from "./data/reactive/reactiveTypes";
type ReactiveRecentMemorySnapshot = ReturnType<typeof import("./data/reactive/reactiveRecentMemory").collectReactiveRecentMemory>;

// Component imports


const STORAGE_KEYS = {
  AVATAR: 'confia_avatar_v2',
  OBJECTIVES: 'confia_objectives_v2',
  OBJECTIVES_HISTORY: 'confia_objectives_history_v1',
  RATINGS: 'confia_ratings_v2',
  PET_COUNT: 'confia_pet_count_v2',
  POSTS: 'confia_posts_v2',
  LAST_PET_DATE: 'confia_last_pet_date_v2',
  LAST_IMPULSE_USE: 'confia_last_impulse_use_v1',
  IMPULSE_COUNT: 'confia_impulse_count_v1',
  MICRO_HABIT_XP_DATE: 'confia_micro_habit_xp_date_v1',
};

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Interaction analytics is non-critical: load it only after a real user action.
// This keeps the event-history machinery out of the initial app download.
function recordCompanionInteractionDeferred(
  kind: CompanionInteractionKind,
  area: CompanionSemanticArea,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  void import("./data/reactive/companionBrain/companionInteractionEvents")
    .then(({ emitCompanionInteraction }) => emitCompanionInteraction(kind, area, metadata))
    .catch(() => { /* Optional analytics must not block the user action. */ });
}

function recordCompanionBrainEventDeferred(
  type: CompanionBrainTrigger,
  metadata?: Record<string, unknown>,
): void {
  void import("./data/reactive/companionBrain/companionBrainEvents")
    .then(({ emitCompanionBrainEvent }) => emitCompanionBrainEvent(type, metadata))
    .catch(() => { /* Companion memory must never block navigation or saving. */ });
}

// O histórico visual nasce exclusivamente dos registos reais do utilizador.
// Não existe seed emocional nem histórico fictício: a CONFIA nunca deve fingir memória.

export default function App() {
const { t, i18n } = useTranslation();
const {
  ageGateReady, ageConfirmed, setAgeConfirmed,
  ageCheckboxChecked, setAgeCheckboxChecked,
  underageNotice, setUnderageNotice, confirmAge,
} = useAgeGate();
const [firstScreenReady, setFirstScreenReady] = useState(false);
const [appDataReady, setAppDataReady] = useState(false);

// Work that is not required to display or navigate the first screen waits until
// the 18+ gate is confirmed and the browser has had an opportunity to paint.
useEffect(() => {
  if (!ageGateReady || !ageConfirmed) { setFirstScreenReady(false); return; }
  let frame = 0;
  let timer = 0;
  frame = window.requestAnimationFrame(() => {
    timer = window.setTimeout(() => setFirstScreenReady(true), 0);
  });
  return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
}, [ageGateReady, ageConfirmed]);

// Privacy-preserving product metrics stay on this device; no emotional content is transmitted.
useEffect(() => {
  if (!firstScreenReady) return;
  void import("./data/personal/personalAnalytics").then(({ recordAppOpenLifecycleMetrics }) => recordAppOpenLifecycleMetrics());
}, [firstScreenReady]);

// Read local profile/history only after the 18+ gate and first app-shell paint.
useEffect(() => {
  if (!firstScreenReady) return;
  let cancelled = false;
  const savedAvatar = readStoredJson<AvatarState | null>(STORAGE_KEYS.AVATAR, null);
  setAvatar(savedAvatar ? {
    ...savedAvatar,
    level: Number.isFinite(savedAvatar.level) ? Math.max(1, savedAvatar.level) : 1,
    xp: Number.isFinite(savedAvatar.xp) ? Math.max(0, savedAvatar.xp) : 0,
    maxXp: Number.isFinite(savedAvatar.maxXp) && savedAvatar.maxXp > 0 ? savedAvatar.maxXp : 100,
    points: Number.isFinite(savedAvatar.points) ? Math.max(0, savedAvatar.points) : 0,
  } : {
    level: 1, xp: 15, maxXp: 100, name: i18n.t("avatarName"),
    evolutionStage: i18n.t("avatarEvolutionStage"), points: 15,
  });
  setObjectivesHistory(readStoredJson(STORAGE_KEYS.OBJECTIVES_HISTORY, []));
  setWeeklyGoal(readStoredJson<WeeklyGoal | null>("confia_weekly_goal_v1", null));
  const savedObjectives = readStoredJson<{ date?: string; items?: Objective[] } | Objective[] | null>(STORAGE_KEYS.OBJECTIVES, null);
  const today = getLocalCalendarDate();
  setObjectives(savedObjectives && !Array.isArray(savedObjectives) && savedObjectives.date === today && savedObjectives.items
    ? savedObjectives.items.slice(0, 5).map(objective => ({ ...objective }))
    : []);
  setRatings(normalizeDailyRatings(readStoredJson<DailyRating[]>(STORAGE_KEYS.RATINGS, [])));
  void import("./storage/dailyCheckInStorage").then(({ hasCompletedToday }) => {
    if (cancelled) return;
    setHomeScreen(hasCompletedToday() ? "home" : "dailyCheckIn");
    setAppDataReady(true);
  }).catch(() => {
    if (cancelled) return;
    setHomeScreen("dailyCheckIn");
    setAppDataReady(true);
  });
  return () => { cancelled = true; };
}, [firstScreenReady, i18n]);

// Lifecycle concerns are isolated from the screen composition.
useDocumentVisibility();

/**
 * ==========================================================
 * CONFIA 3A — ESTADO DIÁRIO
 * CONFIA 3A.1 — SNAPSHOT ESTÁVEL
 * ==========================================================
 *
 * O estado da abertura é capturado uma única vez por
 * montagem da app.
 *
 * Isto é importante porque a data atual é escrita no
 * localStorage depois da primeira renderização.
 *
 * Sem este snapshot, um rerender poderia transformar
 * "primeira abertura de hoje" em "já abriu hoje" durante
 * a própria sessão.
 */

const {
  appOpenDate,
  previousAppOpenDate,
  isFirstAppOpenToday,
  daysSincePreviousAppOpen,
} = useDailyOpenState(appDataReady);

/* CONFIA 3A — FIM DO ESTADO DIÁRIO */



const changeAppLanguage = (lang: "pt" | "en" | "es" | "fr") => {
    void import("./i18n/language").then(({ setLanguage }) => setLanguage(lang));
};

  // Global App States
const [homeScreen, setHomeScreen] = useState<
  "home" | "dailyCheckIn" | "shop" | "inventory" | "settings" | "progress" | "innerCanvas" | "map"
>("home");
const [avatar, setAvatar] = useState<AvatarState>(() => ({
  level: 1, xp: 15, maxXp: 100, name: t("avatarName"),
  evolutionStage: t("avatarEvolutionStage"), points: 15,
}));

const [inventory, setInventory] = useState<any[]>([]);
const [objectivesHistory, setObjectivesHistory] = useState<{ date: string; completed: number }[]>([]);
const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);

useEffect(() => {
  if (!appDataReady) return;
  if (weeklyGoal) {
    localStorage.setItem(
      'confia_weekly_goal_v1',
      JSON.stringify(weeklyGoal)
    );
  } else {
    localStorage.removeItem('confia_weekly_goal_v1');
  }
}, [weeklyGoal, appDataReady]);







const [objectives, setObjectives] = useState<Objective[]>([]);

useEffect(() => {
  if (!appDataReady) return;
  let cancelled = false;
  void import("./data/initialData")
    .then(async ({ getDailyObjectives }) => {
      const { getDailyCheckIn } = await import("./storage/dailyCheckInStorage");
      if (cancelled) return;
      const checkIn = getDailyCheckIn();
      const need = checkIn?.date === getLocalCalendarDate() ? checkIn.need : undefined;
      setObjectives(current => current.length ? current : getDailyObjectives(new Date(), need));
    })
    .catch(() => {
      // The rest of the app remains usable if optional starter content fails to load.
    });
  return () => { cancelled = true; };
}, [appDataReady]);

// The first check-in personalizes today's action set. Do not replace work the
// person has already started or customized in the Objectives menu.
useEffect(() => {
  if (!appDataReady) return;
  let cancelled = false;
  const personalizeObjectives = () => {
    void import("./storage/dailyCheckInStorage").then(({ getDailyCheckIn }) => {
      const checkIn = getDailyCheckIn();
      if (cancelled || !checkIn || checkIn.date !== getLocalCalendarDate()) return;
      void import("./data/initialData").then(({ getDailyObjectives }) => {
        if (cancelled) return;
        setObjectives(current => {
          const alreadyStarted = current.some(item => item.completed || item.isCustom);
          const manuallyChanged = current.length > 0 && current.length !== 5;
          if (alreadyStarted || manuallyChanged) return current;
          return getDailyObjectives(new Date(), checkIn.need);
        });
      });
    });
  };
  window.addEventListener("confia:daily-checkin-saved", personalizeObjectives);
  return () => {
    cancelled = true;
    window.removeEventListener("confia:daily-checkin-saved", personalizeObjectives);
  };
}, [appDataReady]);

useObjectiveDaySync(appDataReady, setObjectives);
 const completedObjectivesCount = objectives.filter(o => o.completed).length;

  const [ratings, setRatings] = useState<DailyRating[]>([]);

  const personalDiscovery = usePersonalDiscovery(appDataReady, ratings);

  const { posts, setPosts, postsLoaded } = useCommunityPosts(appDataReady);

  const { currentTab, setCurrentTab, visitedTabs, markVisited, preloadTab, changeTab } = useTabNavigation({
    enabled: appDataReady,
    resetHomeScreen: () => setHomeScreen("home"),
  });
  useEffect(() => {
  if (!appDataReady) return;
  let cancelled = false;
  void import("./data/personal/personalAnalytics")
    .then(({ recordPersonalScreenView }) => {
      if (!cancelled) recordPersonalScreenView(screenName(currentTab, homeScreen));
    })
    .catch(() => { /* Analytics is optional; navigation must remain available. */ });
  return () => { cancelled = true; };
}, [currentTab, homeScreen, appDataReady]);
// Os separadores são pré-carregados quando o utilizador demonstra intenção
// (foco/ponteiro na navegação) e novamente após o clique. Evita descarregar
// código de funcionalidades que a pessoa talvez nunca abra.
  const [triageOpen, setTriageOpen] = useState(false);
  const [listeningSupportOpen, setListeningSupportOpen] = useState(false);
  const [incomingListeningRequestCount, setIncomingListeningRequestCount] = useState(0);
  const [listeningSupportInitialView, setListeningSupportInitialView] = useState<"talk" | "listen">("talk");
  const [levelUpOpen, setLevelUpOpen] = useState(false);
const [avatarCelebrating, setAvatarCelebrating] = useState(false);
const [avatarMemoryMessage, setAvatarMemoryMessage] = useState("");
  const [prevLevel, setPrevLevel] = useState(avatar.level);
  const [showStopMode, setShowStopMode] = useState(false);
const [openHabitSupport, setOpenHabitSupport] = useState(false);

const [showCommunityTerms, setShowCommunityTerms] = useState(false);
const [noticeDestination,setNoticeDestination]=useState<NoticeTarget|null>(null);
useDeferredAppServices(appDataReady, setNoticeDestination);
const [habitEntry,setHabitEntry]=useState({page:"home",key:0});
const [habitSectionVisible, setHabitSectionVisible] = useState(false);
useEffect(() => {
  if (!appDataReady || currentTab !== 0 || homeScreen !== "home") return;
  if (openHabitSupport || habitEntry.key > 0 || habitEntry.page !== "home") {
    setHabitSectionVisible(true);
    return;
  }

  // Prepare the habit dashboard during idle time, not at the exact moment
  // the user scrolls into it. This avoids a large lazy-module parse/render
  // landing on the scroll gesture and showing a loading pulse in the feed.
  let cancelled = false;
  const cancelScheduledLoad = scheduleBackgroundWork(() => {
    void import("./components/Habits/HabitDashboard")
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          startTransition(() => setHabitSectionVisible(true));
        }
      });
  }, 700, 1400);

  return () => {
    cancelled = true;
    cancelScheduledLoad();
  };
}, [appDataReady, currentTab, homeScreen, openHabitSupport, habitEntry.key, habitEntry.page]);
const [noticeMessage,setNoticeMessage]=useState("");
const [noticeMessageId,setNoticeMessageId]=useState<string|undefined>();


// Chat privado da comunidade
const [chatPost, setChatPost] = useState<SharePost | null>(null);
const [chatIdOverride, setChatIdOverride] = useState<string | null>(null);

// Conversa privada mais recente ainda não lida pelo utilizador.
// Guardamos apenas os dados necessários para abrir o chat
// quando o utilizador entra no separador Comunidade.
const [pendingCommunityChat, setPendingCommunityChat] = useState<{
  id: string;
  postId: string;
  lastMessageAt?: any;
} | null>(null);

// Só tentamos abrir automaticamente uma conversa quando
// o utilizador toca explicitamente no separador Comunidade.
const [openPendingChatOnCommunityEntry, setOpenPendingChatOnCommunityEntry] =
  useState(false);

  useEffect(()=>{
    if(!appDataReady || !noticeDestination)return;
    let cancelled=false;
    const target=noticeDestination;setNoticeMessage("");
    if(target.kind==="sky"){setCurrentTab(1);setHomeScreen("innerCanvas");return;}
    if(target.kind==="checkin"){setCurrentTab(0);setHomeScreen("dailyCheckIn");return;}
    if(target.kind==="habit"){const destination=habitDestination(target.action);setOpenHabitSupport(false);setHabitEntry(old=>({page:destination.page,key:old.key+1}));setCurrentTab(destination.tab);
      setHomeScreen("home");
      requestAnimationFrame(() => document.getElementById("home-habits")?.scrollIntoView({block:"start"}));return;}
    if(target.kind==="listening"){
      setCurrentTab(0);setHomeScreen("home");
      if(target.mode==="request"){setListeningSupportInitialView("listen");setListeningSupportOpen(true);return;}
      setListeningSupportOpen(false);
      let handled=false;
      let stop=()=>{};
      void Promise.all([import("./firebaseAuth"),import("./firebaseFirestore"),import("firebase/firestore")]).then(([authModule,firestoreModule,firestore])=>{
        if(cancelled)return;
        stop=authModule.auth.onAuthStateChanged(user=>{if(!user||cancelled||handled)return;handled=true;void (async()=>{
          try{
            const chatId="listen_"+target.requestId;
            const chat=await firestore.getDoc(firestore.doc(firestoreModule.db,"chats",chatId));
            if(!chat.exists())throw Error("unavailable");
            const data=chat.data();
            const participants:Array<string>=Array.isArray(data.participants)?data.participants:[];
            if(!participants.includes(user.uid)||data.listeningRequestId!==target.requestId||data.postId!==chatId)throw Error("unavailable");
            const requesterId=String(data.authorId||"");
            const volunteerId=participants.find(id=>id!==requesterId)||"";
            const post:SharePost={
              id:chatId,authorId:requesterId,userName:t("listeningSupport.memberName"),
              feeling:"💬",topic:String(data.listeningTheme||"other"),message:t("listeningSupport.chatIntro"),
              timestamp:t("justNow"),createdAtMs:Date.now(),yellowLikes:0,greenLikes:0,redLikes:0,
              yellowLikedBy:[],greenLikedBy:[],redLikedBy:volunteerId?[volunteerId]:[]
            };
            if(cancelled)return;
            setChatIdOverride(chatId);setNoticeMessageId(null);setChatPost(post);
          }catch{if(!cancelled)setNoticeMessage(t("notifications.unavailable"));}
        })();});
      }).catch(()=>{if(!cancelled)setNoticeMessage(t("notifications.unavailable"));});
      return()=>{cancelled=true;stop();};
    }
    setCurrentTab(4);setOpenPendingChatOnCommunityEntry(false);
    let handled=false;
    let stop=()=>{};
    void Promise.all([import("./firebaseAuth"), import("./firebaseFirestore"), import("firebase/firestore")]).then(([authModule, firestoreModule, firestore])=>{
      if (cancelled) return;
      stop=authModule.auth.onAuthStateChanged(user=>{if(!user||cancelled||handled)return;handled=true;void (async()=>{
        try {
          const chat=await firestore.getDoc(firestore.doc(firestoreModule.db,"chats",target.chatId));
          if(!chat.exists()||!chat.data().participants?.includes(user.uid)||chat.data().postId!==target.postId)throw Error("unavailable");
          const post=await firestore.getDoc(firestore.doc(firestoreModule.db,"posts",target.postId));
          if(!post.exists())throw Error("unavailable");
          if(cancelled)return;
          const data=post.data();
          setChatIdOverride(target.chatId);setNoticeMessageId(target.messageId);
          setChatPost({...data,id:post.id,timestamp:t("justNow"),yellowLikes:data.yellowLikes??0,greenLikes:data.greenLikes??0,redLikes:data.redLikes??0} as SharePost);
        }catch{if(!cancelled)setNoticeMessage(t("notifications.unavailable"));}
      })();});
    }).catch(()=>{if(!cancelled)setNoticeMessage(t("notifications.unavailable"));});
    return()=>{cancelled=true;stop();};
  },[appDataReady, noticeDestination]);
  // Open STOP mode from Android widget/deep link
  useEffect(() => {
    const handleStopLink = () => {
      if (window.location.hash === "#stop") {
        setShowStopMode(true);
      }
    };

    handleStopLink();

    window.addEventListener("hashchange", handleStopLink);

    return () => {
      window.removeEventListener("hashchange", handleStopLink);
    };
  }, []);

  // Today rating active inputs
  const [morningRating, setMorningRating] = useState<number>(5);
  const [afternoonRating, setAfternoonRating] = useState<number>(5);
  const [showDayRatingPanel, setShowDayRatingPanel] = useState(false);

/**
 * 1D.5 — PARA TI AGORA + MEMÓRIA CONTEXTUAL
 *
 * O Reactive Engine continua a decidir situação + intenção.
 *
 * A memória reativa acrescenta contexto quando existe evidência real
 * de que uma estratégia anterior foi eficaz.
 *
 * A memória nunca escolhe automaticamente uma necessidade.
 * Apenas contextualiza a recomendação apresentada ao utilizador.
 */
/**
 * 1D.11A — PRIMEIRO CONTACTO INTELIGENTE
 *
 * A ausência de ratings significa que a CONFIA ainda está
 * no início da relação com o utilizador.
 *
 * Não fingimos memória, padrões ou conhecimento que ainda
 * não existem. Este valor é totalmente derivado do histórico
 * real já existente e não cria storage adicional.
 */
const isFirstContact =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length === 0;

/**
 * 1D.11B — PRIMEIROS SINAIS
 *
 * Com um ou dois registos já existe informação real,
 * mas ainda não existe histórico suficiente para comunicar
 * a experiência como se a CONFIA já conhecesse padrões
 * consolidados do utilizador.
 *
 * Esta camada é apenas de apresentação.
 * O Reactive Engine continua a decidir a resposta.
 */
const isEarlyLearning =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length >= 1 &&
  ratings.length <= 2;

/**
 * A6.3 — memória relacional do companheiro.
 *
 * Reutiliza o mesmo modelo de memória do sistema reativo.
 * Não persiste nada e não cria uma segunda fonte de verdade.
 */
const [homeCompanionRelationalMemory, setHomeCompanionRelationalMemory] =
  useState<ReactiveRecentMemorySnapshot | null>(null);
const [companionConsentRevision, setCompanionConsentRevision] = useState(0);
useEffect(() => {
  const refreshConsent = () => setCompanionConsentRevision(value => value + 1);
  window.addEventListener("confia:companion-context-consent-changed", refreshConsent);
  return () => window.removeEventListener("confia:companion-context-consent-changed", refreshConsent);
}, []);

useEffect(() => {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  if (!appDataReady || currentTab !== 0 || homeScreen !== "home" || !readCompanionPersonalContextConsent()) {
    setHomeCompanionRelationalMemory(null);
    return;
  }

  // A memória contextual é complementar: não deve bloquear a primeira pintura
  // da Home nem a resposta imediata ao navegar entre separadores.
  setHomeCompanionRelationalMemory(null);
  const calculate = () => {
    void import("./data/reactive/reactiveRecentMemory")
      .then(({ collectReactiveRecentMemory }) => {
        if (cancelled) return;
        try {
          setHomeCompanionRelationalMemory(collectReactiveRecentMemory());
        } catch {
          setHomeCompanionRelationalMemory(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHomeCompanionRelationalMemory(null);
      });
  };

  const requestIdle = (window as any).requestIdleCallback;
  if (typeof requestIdle === "function") {
    idleId = requestIdle(calculate, { timeout: 500 });
  } else {
    timerId = window.setTimeout(calculate, 50);
  }

  return () => {
    cancelled = true;
    if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}, [currentTab, homeScreen, ratings, objectives, weeklyGoal, appDataReady, companionConsentRevision]);


const homeNowMemory = useMemo(() => {
  if (currentTab !== 0 || homeScreen !== "home" || !readCompanionPersonalContextConsent()) {
    return null;
  }

  try {
    const memory = homeCompanionRelationalMemory;

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    const continuity =
      memory?.continuity ?? null;

    /*
     * 1D.6C — HIERARQUIA DA MEMÓRIA
     *
     * Primeiro verificamos se existe aprendizagem pessoal
     * suficiente para apresentar um padrão observado.
     *
     * A aprendizagem exige pelo menos dois episódios eficazes.
     * Isto evita transformar uma única experiência numa conclusão.
     *
     * A necessidade observada é apenas memória contextual.
     * Nunca escolhe automaticamente o percurso.
     */
    if (memory?.hasImpulseLearning) {
      return {
        kind: "impulseLearning" as const,

        effectiveCount:
          memory.effectiveImpulseCount,

        recentCount:
          memory.recentImpulseCount,

        averageReduction:
          memory.recentImpulseAverageReduction ?? null,

        need:
          memory.effectiveImpulseNeed ?? null,

        needCount:
          memory.effectiveImpulseNeedCount,

        /*
         * Mantemos a última experiência eficaz disponível
         * para eventual utilização visual futura.
         */
        recentEffective:
          effectiveImpulse &&
          typeof effectiveImpulse.initialIntensity === "number" &&
          typeof effectiveImpulse.finalIntensity === "number"
            ? {
                before: effectiveImpulse.initialIntensity,
                after: effectiveImpulse.finalIntensity,
                reduction: effectiveImpulse.reduction,
                need: effectiveImpulse.need ?? null,
              }
            : null,
      };
    }

    /*
     * 2. Ainda não existe evidência suficiente para falar
     * de aprendizagem.
     *
     * Nesse caso mantemos a memória da última experiência
     * eficaz exatamente como anteriormente.
     */
    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,

        need:
          effectiveImpulse.need ?? null,

        before:
          effectiveImpulse.initialIntensity,

        after:
          effectiveImpulse.finalIntensity,

        reduction:
          effectiveImpulse.reduction,

        continuity:
          continuity,
      };
    }

    /*
     * 1D.7B — continuidade sem uma última experiência
     * suficientemente recente para mostrar Antes / Agora.
     *
     * Continua a ser apenas memória contextual.
     */
    if (
      continuity?.hasRepeatedSignals
    ) {
      return {
        kind: "continuity" as const,

        /**
         * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
         *
         * A Home recebe agora as três dimensões da memória.
         * Continua sem decidir a ação.
         */
        signalCount:
          continuity.signalCount,

        moodDirection:
          continuity.moodDirection,

        moodRecordCount:
          continuity.moodRecordCount,

        repeatedCheckInNeed:
          continuity.repeatedCheckInNeed ?? null,

        repeatedCheckInNeedCount:
          continuity.repeatedCheckInNeedCount,

        repeatedNeed:
          continuity.repeatedNeed ?? null,

        repeatedNeedCount:
          continuity.repeatedNeedCount,

        recentEffectiveImpulseCount:
          continuity.recentEffectiveImpulseCount,
      };
    }

    return null;
  } catch {
    /*
     * A memória é apenas uma camada complementar.
     *
     * Se não estiver disponível, o Principal continua
     * a funcionar normalmente através do Reactive Engine.
     */
    return null;
  }
}, [
  currentTab,
  homeScreen,
  ratings,
  objectives,
  weeklyGoal,
  avatar.xp,
  homeCompanionRelationalMemory,
  companionConsentRevision,
]);


/**
 * CONFIA A3.2 — cérebro reativo único do Principal.
 *
 * O resultado é calculado uma vez e partilhado entre:
 * - ação inteligente;
 * - companheiro;
 * - balão;
 * - expressão visual.
 */
const handleCompanionAction = useCallback((target: CompanionAction) => {
    if (["habits","habitHistory","nutrition","exercise","plans"].includes(target)) {
      setOpenHabitSupport(false);setHabitEntry(old=>({page:target==="habitHistory"?"history":target==="habits"?"home":target,key:old.key+1}));setCurrentTab(0);setHomeScreen("home");
      requestAnimationFrame(()=>document.getElementById("home-habits")?.scrollIntoView({block:"start"}));return;
    }
    if(target==="breathe"){setCurrentTab(1);setHomeScreen("home");return;}
    if(target==="objectives"){setCurrentTab(2);setHomeScreen("home");return;}
    if(target==="community"){setCurrentTab(4);setHomeScreen("home");return;}
    if(target==="mood"||target==="record"){setCurrentTab(0);setHomeScreen("dailyCheckIn");return;}

    if (target === "impulse") {
      setOpenHabitSupport(true);
      setHomeScreen("home");
      setCurrentTab(0);
      setHomeScreen("home");
      requestAnimationFrame(() => document.getElementById("home-habits")?.scrollIntoView({block:"start"}));
      return;
    }

    if (target === "patterns") {
      setHomeScreen("map");
      setCurrentTab(0);
      return;
    }

    if (target === "progress") {
      // CONFIA_COMPANION_OPEN_PROGRESS
      recordCompanionBrainEventDeferred(
        "context_changed",
        {
          from: "home",
          to: "progress",
          source: "companion_action",
        }
      );

      setHomeScreen("progress");
      setCurrentTab(0);
      return;
    }


    if (target === "inventory") {
      setHomeScreen("inventory");
      setCurrentTab(0);
      return;
    }

    if (target === "shop") {
      setHomeScreen("shop");
      setCurrentTab(0);
    }
}, []);

const [homeReactiveResult, setHomeReactiveResult] =
  useState<ReactiveResult | null>(null);

useEffect(() => {
  let cancelled = false;
  if (!appDataReady || currentTab !== 0 || homeScreen !== "home") {
    setHomeReactiveResult(null);
    return () => { cancelled = true; };
  }
  // Debounce rapid state changes and fetch the analysis engine only in idle time.
  const cancelBackgroundStart = scheduleBackgroundWork(() => {
    void import("./data/reactive/reactiveEngine")
      .then(({ analyzeReactiveState }) => {
        if (!cancelled) setHomeReactiveResult(analyzeReactiveState({ source: "general" }));
      })
      .catch(() => { if (!cancelled) setHomeReactiveResult(null); });
  }, 650, 900);
  return () => {
    cancelled = true;
    cancelBackgroundStart();
  };
}, [currentTab, homeScreen, ratings, objectives, weeklyGoal, avatar.xp, appDataReady]);

// Uma única observação contextual para o cartão de chegada. A prioridade é
// diversidade real de dados (exercício/alimentação/hábitos), depois continuidade
// de registos. Não inventa relações causais nem duplica vários cartões.
const homeReactiveObservation = useMemo(() => {
  const result = homeReactiveResult;
  if (!result) return null;

  const positiveFacts = (result.personalSignals?.facts ?? []).filter(
    (fact) => typeof fact.observedValue === "number" && fact.observedValue > 0
  );
  const domains = new Set(positiveFacts.map((fact) => fact.domain));
  const activeDays = result.personalSignals?.activeDays ?? result.metrics.activeDays;
  const variant = activeDays % 2 === 0 ? "a" : "b";

  if (domains.size >= 2) {
    return { key: `dailyMoment.observation.mixed.${variant}` };
  }
  if (domains.has("exercise")) {
    return { key: `dailyMoment.observation.exercise.${variant}` };
  }
  if (domains.has("nutrition")) {
    return { key: `dailyMoment.observation.nutrition.${variant}` };
  }
  if (domains.has("habit")) {
    return { key: `dailyMoment.observation.habit.${variant}` };
  }
  if (activeDays >= 4) {
    return {
      key: `dailyMoment.observation.records.${variant}`,
      values: { count: activeDays },
    };
  }
  return null;
}, [homeReactiveResult]);


const homeNowAction = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  /*
   * 1D.6D — separação entre MEMÓRIA e AÇÃO.
   *
   * A memória contextual não deve decidir sozinha
   * qual é a próxima ação do utilizador.
   *
   * Ela informa o Principal sobre experiências anteriores.
   * O Reactive Engine continua a ser responsável
   * pela decisão da ação atual.
   */

  /*
   * 1D.4 — decisão normal do Reactive Engine.
   */
  const result = homeReactiveResult;

  const intent = result?.intent;

  if (!intent) {
    return null;
  }

  switch (intent) {
    // Regulação / momento difícil
    case "calm":
    case "ground":
    case "encourage_regulation":
    case "support_difficult_moment":
    case "gentle_check":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulse.title",
        textKey: "homeNow.impulse.text",
        actionKey: "homeNow.impulse.action",
      };

    // Aprendizagem a partir do Impulso
    case "reinforce_impulse":
    case "review_impulse":
    case "reinforce_effective_strategy":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulseMemory.title",
        textKey: "homeNow.impulseMemory.text",
        actionKey: "homeNow.impulseMemory.action",
      };

    // Padrões / reflexão
    case "connect_pattern":
    case "invite_reflection":
    case "explore":
    case "reflect":
    case "clarify":
      return {
        kind: "patterns" as const,
        titleKey: "homeNow.patterns.title",
        textKey: "homeNow.patterns.text",
        actionKey: "homeNow.patterns.action",
      };

    // Objetivos
    case "celebrate_objective":
    case "redirect_objective":
      return {
        kind: "objectives" as const,
        titleKey: "homeNow.objectives.title",
        textKey: "homeNow.objectives.text",
        actionKey: "homeNow.objectives.action",
      };

    // Evolução
    case "reinforce_progress":
    case "highlight_small_win":
    case "recognize_consistency":
      return {
        kind: "progress" as const,
        titleKey: "homeNow.progress.title",
        textKey: "homeNow.progress.text",
        actionKey: "homeNow.progress.action",
      };

    // Retoma / início
    case "welcome":
    case "encourage_return":
      return {
        kind: "record" as const,
        titleKey: "homeNow.record.title",
        textKey: "homeNow.record.text",
        actionKey: "homeNow.record.action",
      };

    /*
     * Intenções genéricas não recebem uma recomendação
     * artificial apenas para preencher espaço.
     */
    default:
      return null;
  }
})();


/**
 * ==========================================================
 * CONFIA 3B — CONTEXTO DIÁRIO
 * ==========================================================
 *
 * A 3A sabe quando a app foi aberta.
 *
 * A 3B combina esse estado factual com informação que
 * já foi preparada pelas camadas existentes da Principal.
 *
 * Não existe aqui uma segunda decisão emocional.
 *
 * O Reactive Engine continua responsável pela decisão
 * da situação e da ação atual.
 *
 * A memória recente continua responsável pela aprendizagem
 * e continuidade.
 *
 * dailyContext limita-se a preparar a futura experiência
 * "Momento de Hoje".
 */

type DailyContextState =
  | "first_contact"
  | "return_after_absence"
  | "first_today"
  | "already_here_today";

const dailyContext = (() => {
  if (
    currentTab !== 0 ||
    homeScreen !== "home"
  ) {
    return null;
  }

  /**
   * --------------------------------------------------------
   * ESTADO DIÁRIO
   * --------------------------------------------------------
   *
   * Hierarquia:
   *
   * 1. Primeiro contacto absoluto.
   *
   * 2. Regresso após pelo menos um dia completo
   *    sem abrir a CONFIA.
   *
   * 3. Primeira abertura do dia.
   *
   * 4. Já esteve na CONFIA hoje.
   */
  let state: DailyContextState;

  if (isFirstContact) {
    state = "first_contact";
  } else if (
    isFirstAppOpenToday &&
    typeof daysSincePreviousAppOpen === "number" &&
    daysSincePreviousAppOpen >= 2
  ) {
    state = "return_after_absence";
  } else if (isFirstAppOpenToday) {
    state = "first_today";
  } else {
    state = "already_here_today";
  }

  /**
   * --------------------------------------------------------
   * MEMÓRIA
   * --------------------------------------------------------
   *
   * Reutilizamos apenas a memória que a Principal já
   * considerou suficientemente sólida para apresentar.
   */
  const memoryKind =
    homeNowMemory?.kind ?? null;

  const hasImpulseLearning =
    memoryKind === "impulseLearning";

  const hasImpulseMemory =
    memoryKind === "impulseMemory";

  const hasContinuityMemory =
    memoryKind === "continuity";

  /**
   * --------------------------------------------------------
   * CONFIA 3E.1 — CONTINUIDADE INTELIGENTE
   * --------------------------------------------------------
   *
   * Este nível NÃO representa uma nova memória.
   *
   * É apenas uma classificação da memória que já foi
   * recolhida por homeNowMemory.
   *
   * A ordem é deliberadamente conservadora:
   *
   * learned_impulse
   *   = aprendizagem sustentada por múltiplos episódios.
   *
   * effective_impulse
   *   = uma experiência eficaz conhecida, ainda sem
   *     evidência suficiente para afirmar um padrão.
   *
   * repeated_signals
   *   = existem sinais repetidos de continuidade.
   *
   * early_learning
   *   = existem poucos registos e a CONFIA ainda está
   *     a aprender.
   *
   * none
   *   = não existe evidência suficiente para comunicar
   *     aprendizagem ou continuidade.
   */
  const dailyLearningLevel =
    hasImpulseLearning
      ? "learned_impulse"
      : hasImpulseMemory
        ? "effective_impulse"
        : hasContinuityMemory
          ? "repeated_signals"
          : isEarlyLearning
            ? "early_learning"
            : "none";


  /**
   * --------------------------------------------------------
   * AÇÃO
   * --------------------------------------------------------
   *
   * Não voltamos a executar o motor.
   *
   * Apenas reutilizamos a ação já escolhida
   * por homeNowAction.
   */
  const suggestedAction =
    homeNowAction?.kind ?? null;

  /**
   * --------------------------------------------------------
   * CONTEXTO FINAL
   * --------------------------------------------------------
   *
   * Ainda não existem aqui mensagens, UI, XP,
   * celebrações ou histórico próprio.
   */
  return {
    state,

    isFirstOpenToday:
      isFirstAppOpenToday,

    previousOpenDate:
      previousAppOpenDate,

    daysSincePreviousOpen:
      daysSincePreviousAppOpen,

    isEarlyLearning,

    memoryKind,

    hasImpulseLearning,

    hasImpulseMemory,

    hasContinuityMemory,

    suggestedAction,
    dailyLearningLevel,
  };
})();

/* CONFIA 3B — FIM DO CONTEXTO DIÁRIO */

/**
 * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
 *
 * A memória pode enriquecer "Para ti agora", mas apenas
 * quando pertence ao mesmo domínio da ação escolhida pelo
 * Reactive Engine.
 *
 * Assim evitamos, por exemplo:
 * - falar do Impulso numa recomendação de Objetivos;
 * - falar de melhoria histórica num momento atual incompatível;
 * - transformar memória em decisão.
 */
/**
 * ==========================================================
 * CONFIA 4B — MUNDO VIVO
 * ==========================================================
 *
 * O mundo não cria uma interpretação própria.
 *
 * Apenas recebe uma tradução visual muito leve do nível de
 * continuidade que o Ritual Diário já calculou.
 *
 * Não existe storage, estado, efeito ou motor adicional.
 */
const worldMood:
  | "growing"
  | "settling"
  | "discovering"
  | "neutral" =
  dailyContext?.dailyLearningLevel === "learned_impulse" ||
  dailyContext?.dailyLearningLevel === "repeated_signals"
    ? "growing"
    : dailyContext?.dailyLearningLevel === "effective_impulse"
      ? "settling"
      : dailyContext?.dailyLearningLevel === "early_learning"
        ? "discovering"
        : "neutral";

const homeNowContext = (() => {
  if (!homeNowAction || !homeNowMemory) {
    return null;
  }

  /**
   * ----------------------------------------------------------
   * IMPULSO
   * ----------------------------------------------------------
   */
  if (homeNowAction.kind === "impulse") {
    if (homeNowMemory.kind === "impulseLearning") {
      return {
        kind: "impulseLearning" as const,
        memory: homeNowMemory,
      };
    }

    if (
      homeNowMemory.kind === "impulseMemory" &&
      homeNowMemory.continuity?.hasRepeatedSignals &&
      (
        homeNowMemory.continuity.repeatedNeedCount >= 2 ||
        homeNowMemory.continuity.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.continuity.repeatedNeedCount,
          homeNowMemory.continuity.recentEffectiveImpulseCount
        ),
      };
    }

    if (
      homeNowMemory.kind === "continuity" &&
      (
        homeNowMemory.repeatedNeedCount >= 2 ||
        homeNowMemory.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.repeatedNeedCount,
          homeNowMemory.recentEffectiveImpulseCount
        ),
      };
    }

    return null;
  }

  /**
   * ----------------------------------------------------------
   * PADRÕES / REFLEXÃO
   * ----------------------------------------------------------
   *
   * Aqui a convergência entre duas ou mais fontes é útil:
   * há algo recorrente que vale a pena observar.
   *
   * Não dizemos que uma coisa causou a outra.
   */
  if (
    homeNowAction.kind === "patterns" &&
    homeNowMemory.kind === "continuity"
  ) {
    /**
     * 1D.8E — CHECK-IN VISÍVEL
     *
     * Quando existem duas ou mais fontes de continuidade,
     * mostramos primeiro a convergência transversal.
     */
    if (homeNowMemory.signalCount >= 2) {
      return {
        kind: "continuity" as const,
        source: "cross" as const,
        count: homeNowMemory.signalCount,
      };
    }

    /**
     * Sem convergência entre fontes, uma necessidade repetida
     * nos últimos Check-Ins pode contextualizar uma ação
     * que o Reactive Engine já decidiu como reflexão/padrões.
     *
     * A memória continua sem escolher a ação.
     */
    if (
      homeNowMemory.repeatedCheckInNeed &&
      homeNowMemory.repeatedCheckInNeedCount >= 2
    ) {
      return {
        kind: "continuity" as const,
        source: "checkIn" as const,
        count: homeNowMemory.repeatedCheckInNeedCount,
      };
    }

    return null;
  }

  /**
   * ----------------------------------------------------------
   * PROGRESSO
   * ----------------------------------------------------------
   *
   * Só mostramos memória emocional quando a direção
   * transversal observada é de melhoria.
   */
  if (
    homeNowAction.kind === "progress" &&
    homeNowMemory.kind === "continuity" &&
    homeNowMemory.moodDirection === "improving"
  ) {
    return {
      kind: "continuity" as const,
      source: "mood" as const,
      count: homeNowMemory.moodRecordCount,
    };
  }

  /**
   * Objetivos e Registo não recebem contexto histórico
   * artificial nesta fase.
   */
  return null;
})();


const handleHomeNowAction = () => {
  if (!homeNowAction) {
    return;
  }

  switch (homeNowAction.kind) {
    case "impulse":
      // Apoio imediato vive no painel de Hábitos da Home. O antigo
      // changeTab(3) apontava para um separador inexistente e deixava o
      // utilizador num ecrã vazio no Android.
      setOpenHabitSupport(true);
      setCurrentTab(0);
      setHomeScreen("home");
      requestAnimationFrame(() =>
        document.getElementById("home-habits")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      );
      return;

    case "patterns":
      // Padrões passam a ter um único destino: Meu Mapa. O antigo menu
      // PatternsNew duplicava avaliação, registo diário e evolução já
      // presentes noutras áreas da app.
      setHomeScreen("map");
      return;

    case "objectives":
      changeTab(2);
      return;

    case "progress":
      setHomeScreen("progress");
      return;

    case "record":
      setShowDayRatingPanel(true);

      requestAnimationFrame(() => {
        document
          .getElementById("home-daily-record")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      });

      return;
  }
};
  const [todayLogged, setTodayLogged] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Resposta imediata da Confia após um registo do utilizador
  const [reactiveMessageKey, setReactiveMessageKey] =
    useState<string | null>(null);
  // Prevent the ratings effect from immediately repeating the same analysis
  // already performed synchronously by handleSaveRatings for this exact state.
  const lastMoodAnalysisSignature = useRef<string | null>(null);

  // Analisa o contexto existente quando a Home é aberta.
  //
  // Importante:
  // - apenas lê o contexto existente;
  // - não regista uma nova resposta no histórico;
  // - não altera o reactiveEngine;
  // - respostas provocadas explicitamente pelo utilizador
  //   continuam a ser registadas em handleSaveRatings.
  useEffect(() => {
    let cancelled = false;
    if (currentTab !== 0 || homeScreen !== "home") return;
    if (ratings.length === 0) {
      setReactiveMessageKey(null);
      return;
    }

    const ratingsSignature = JSON.stringify(ratings);
    if (lastMoodAnalysisSignature.current === ratingsSignature) {
      lastMoodAnalysisSignature.current = null;
      return;
    }

    const cancelBackgroundStart = scheduleBackgroundWork(() => {
      void import("./data/reactive/reactiveEngine")
        .then(({ analyzeReactiveState }) => {
          if (cancelled) return;
          const reactiveResult = analyzeReactiveState({ source: "mood" });
          if (reactiveResult?.response?.translationKey) {
            setReactiveMessageKey(reactiveResult.response.translationKey);
          }
        })
        .catch(() => { if (!cancelled) setReactiveMessageKey(null); });
    }, 500, 700);

    return () => {
      cancelled = true;
      cancelBackgroundStart();
    };
  }, [currentTab, homeScreen, ratings]);

  /**
   * Objetivos — leitura contextual ao entrar.
   *
   * Não regista resposta no histórico porque abrir
   * o separador não é uma nova ação emocional.
   *
   * objective_completed continua reservado para
   * uma conclusão acabada de acontecer.
   */
  useEffect(() => {
    if (currentTab !== 2) return;

    import("./data/reactive/reactiveEngine")
      .then(({ analyzeReactiveState }) => {
        const objectiveReactiveResult = analyzeReactiveState({ source: "objective" });
        if (objectiveReactiveResult.situation === "no_data") {
          setReactiveMessageKey(null);
          return;
        }
        setReactiveMessageKey(objectiveReactiveResult?.response?.translationKey ?? null);
      })
      .catch(() => setReactiveMessageKey(null));

  }, [currentTab, objectivesHistory]);

const [selectedDate, setSelectedDate] = useState(
  getLocalCalendarDate()
);

const companionVoiceInput = useMemo(() => ({
  currentTab: 0,
  homeScreen: "home",
  selectedDate,
  todayLogged,
  morningRating,
  afternoonRating,
  ratings,
  personalDiscovery,
  reactiveResult: homeReactiveResult,
}), [selectedDate, todayLogged, morningRating, afternoonRating, ratings, personalDiscovery, homeReactiveResult]);

  // Save states to localStorage on changes
  useEffect(() => {
    if (!appDataReady) return;
    localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(avatar));
    window.dispatchEvent(new CustomEvent("confia:avatar-updated"));
  }, [avatar, appDataReady]);

  useEffect(() => {
   if (!appDataReady) return;
   localStorage.setItem(
  STORAGE_KEYS.OBJECTIVES,
  JSON.stringify({
    date: getLocalCalendarDate(),
    items: objectives
  })
);
   window.dispatchEvent(new CustomEvent("confia:objectives-updated"));
  }, [objectives, appDataReady]);
useEffect(() => {
if (!appDataReady) return;
localStorage.setItem(
  STORAGE_KEYS.OBJECTIVES_HISTORY,
  JSON.stringify(objectivesHistory)
);
}, [objectivesHistory, appDataReady]);
  useEffect(() => {
    if (!appDataReady) return;
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
  }, [ratings, appDataReady]);

  useEffect(() => {
    if (!postsLoaded) return;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts, postsLoaded]);

// Mantém o badge da conversa privada mais recente sem bloquear o arranque.
useUnreadCommunityChat({ setPendingCommunityChat, enabled: appDataReady });

useEffect(() => {
  if (!appDataReady || currentTab !== 4) return;

  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  const startCommunityListener = async () => {
    try {
      // Garantimos autenticação anónima antes do primeiro snapshot.
      // Sem isto, o primeiro snapshot pode ser recebido sem UID e
      // as reações/chat ficam sem saber quem é o utilizador.
      const { initAnonymousAuth } = await import("./firebaseAuth");
      await initAnonymousAuth();
      const { subscribeToCommunityPosts } = await import("./data/community/communityService");
      if (cancelled) return;
      unsubscribe = subscribeToCommunityPosts(setPosts, t);
    } catch (error) {
      console.error("Erro ao iniciar comunidade:", error);
    }
  };

  startCommunityListener();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}, [appDataReady, currentTab, t]);

// Ao tocar em Comunidade, se existir uma mensagem privada
// não lida, esperamos que o feed esteja disponível e abrimos
// automaticamente a publicação/conversa correspondente.
useEffect(() => {
  if (
    !appDataReady ||
    currentTab !== 4 ||
    !openPendingChatOnCommunityEntry
  ) {
    return;
  }

  // Se não existe nenhuma conversa pendente, terminamos
  // imediatamente o pedido de abertura.
  if (!pendingCommunityChat) {
    setOpenPendingChatOnCommunityEntry(false);
    return;
  }

  const matchingPost = posts.find(
    (post) => post.id === pendingCommunityChat.postId
  );

  // O listener da Comunidade pode ainda estar a carregar os posts.
  // Nesse caso esperamos pela próxima atualização de posts.
  if (!matchingPost) {
    return;
  }

  const openUnreadConversation = async () => {
    try {
      setChatIdOverride(pendingCommunityChat.id);
      setChatPost(matchingPost);

      const [{ auth }, { db }, firestore] = await Promise.all([
        import("./firebaseAuth"),
        import("./firebaseFirestore"),
        import("firebase/firestore")
      ]);
      const user = auth.currentUser;

      if (user) {
        await firestore.updateDoc(
          firestore.doc(db, "chats", pendingCommunityChat.id),
          {
            unreadBy: firestore.arrayRemove(user.uid)
          }
        );
      }
    } catch (error) {
      console.error(
        "Erro ao abrir/marcar conversa da comunidade como lida:",
        error
      );
    } finally {
      setOpenPendingChatOnCommunityEntry(false);
    }
  };

  void openUnreadConversation();
}, [
  appDataReady,
  currentTab,
  openPendingChatOnCommunityEntry,
  pendingCommunityChat,
  posts
]);

// Check if selected date is already logged
useEffect(() => {
  const loggedDay = ratings.find(r => r.date === selectedDate);

  if (loggedDay) {
    setTodayLogged(true);
    setMorningRating(loggedDay.morning ?? 5);
    setAfternoonRating(loggedDay.afternoon ?? 5);
    setNoteText(loggedDay.note || "");
  } else {
    setTodayLogged(false);
    setMorningRating(5);
    setAfternoonRating(5);
    setNoteText("");
  }
}, [ratings, selectedDate]);
useEffect(() => {
  const today = ratings.find(r => r.date === selectedDate);

  if (!today) {
    setAvatarMemoryMessage("");
    return;
  }

  const previous = ratings
    .filter(r => r.date < selectedDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!previous) {
    setAvatarMemoryMessage("");
    return;
  }

  const todayScore = ((today.morning ?? 5) + (today.afternoon ?? 5)) / 2;
  const previousScore = ((previous.morning ?? 5) + (previous.afternoon ?? 5)) / 2;

  if (todayScore - previousScore >= 2) {
    setAvatarMemoryMessage(t("avatarImprovement"));
  } else if (previousScore - todayScore >= 2) {
    setAvatarMemoryMessage(t("avatarHardDay"));
  } else {
    setAvatarMemoryMessage("");
  }

}, [ratings, selectedDate]);

  /**
   * ==========================================================
   * CONFIA — COMPANION BRAIN
   * FASE 4 — contexto real da Home
   * ==========================================================
   *
   * O DailyRating atual guarda manhã e tarde em conjunto.
   * Nesta fase só usamos informação que podemos afirmar
   * com segurança.
   */
// Handle XP increments and level ups
  const addXp = useCallback((amount: number) => {
    setAvatar(prev => {
      let nextXp = prev.xp + amount;
      let nextLevel = prev.level;
   let nextMaxXp = prev.maxXp;
      let nextPoints = prev.points + Math.round(amount / 2);

      while (nextXp >= nextMaxXp) {
        nextXp -= nextMaxXp;
        nextLevel += 1;
        nextMaxXp = Math.round(nextMaxXp * 1.3);
        nextPoints += 30; // bonus points for level up
setPrevLevel(nextLevel);
setLevelUpOpen(true);
setAvatarCelebrating(true);

setTimeout(() => {
  setAvatarCelebrating(false);
}, 2500);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: nextXp,
        maxXp: nextMaxXp,
        points: nextPoints
      };
    });
  }, []);

const handleMicroHabitCompleted = () => {
  recordCompanionInteractionDeferred(
    "tool_completed",
    "exercise",
    { tool: "micro_habit" }
  );

  const today = getLocalCalendarDate();
  try {
    if (localStorage.getItem(STORAGE_KEYS.MICRO_HABIT_XP_DATE) === today) return;
    localStorage.setItem(STORAGE_KEYS.MICRO_HABIT_XP_DATE, today);
  } catch {
    // If storage is unavailable, still reward the completion for this session.
  }
  addXp(1);
};

const spendPoints = useCallback((amount: number) => {
  setAvatar(prev => ({
    ...prev,
    points: Math.max(0, prev.points - amount)
  }));
}, []);

const handleBuyItem = (item: any) => {
  setInventory(prev => [
    ...prev,
    item
  ]);
};

  // Pet Amigo (Interaction)
  const handlePetAvatar = useCallback(() => {
    // CONFIA_COMPANION_EVENT_AVATAR_TAPPED
    recordCompanionBrainEventDeferred(
      "avatar_tapped",
      {
        source: "home_companion",
      }
    );

    const todayStr = getLocalCalendarDate();
    const lastPetDate = localStorage.getItem(STORAGE_KEYS.LAST_PET_DATE);
    const petCountStr = localStorage.getItem(STORAGE_KEYS.PET_COUNT);
    let petCount = petCountStr ? parseInt(petCountStr, 10) : 0;

    if (lastPetDate !== todayStr) {
      petCount = 0;
      localStorage.setItem(STORAGE_KEYS.LAST_PET_DATE, todayStr);
    }

    if (petCount < 5) {
     addXp(5); // +5 XP for the first 5 pets of the day
      localStorage.setItem(STORAGE_KEYS.PET_COUNT, (petCount + 1).toString());
    } else {
      // Award only points beyond limit
      setAvatar(prev => ({ ...prev, points: prev.points + 1 }));
    }
  }, [addXp]);

  // Log today mood ratings
const handleSaveRatings = () => {
  const nextRatings = [...ratings];
  const existingIdx = nextRatings.findIndex(
    r => r.date === selectedDate
  );

  const newRating: DailyRating = {
    date: selectedDate,
    morning: morningRating,
    afternoon: afternoonRating,
    note: noteText.trim() || undefined,
    scaleVersion: 2,
  };

  if (existingIdx >= 0) {
    nextRatings[existingIdx] = newRating;
  } else {
    nextRatings.push(newRating);

    // Dá XP apenas quando é criado um novo registo
    addXp(15);
  }

  /**
   * Persistir primeiro os novos dados.
   *
   * Isto permite que o motor reativo analise imediatamente
   * o registo acabado de fazer, sem esperar pelo useEffect.
   */
  localStorage.setItem(
    STORAGE_KEYS.RATINGS,
    JSON.stringify(nextRatings)
  );

  lastMoodAnalysisSignature.current = JSON.stringify(nextRatings);
  setRatings(nextRatings);
  setTodayLogged(true);
  // Keep the progressive onboarding guide in sync within this same session.
  window.dispatchEvent(new Event("confia:daily-rating-saved"));

  // Keep the personal timeline in step with both daily-entry mechanisms.
  // This is deliberately deferred: the rating is already saved and the UI
  // must remain responsive if the optional projection cannot be updated.
  void import("./data/personal/syncPersonalEvents")
    .then(({ syncPersonalEventsFromLegacySources }) => {
      try { syncPersonalEventsFromLegacySources(); } catch { /* recover on next sync */ }
    })
    .catch(() => { /* personal discovery is optional to the save action */ });

  // CONFIA_COMPANION_EVENT_MOOD_SAVED
  recordCompanionBrainEventDeferred(
    "mood_saved",
    {
      date: selectedDate,
      morningRating,
      afternoonRating,
      hasNote: noteText.trim().length > 0,
      wasExistingRecord: existingIdx >= 0,
    }
  );

  /**
   * Analisar imediatamente o novo estado do utilizador.
   */
  import("./data/reactive/reactiveEngine")
    .then(({ analyzeReactiveState }) => {
      const reactiveResult = analyzeReactiveState({ source: "mood" });
      setReactiveMessageKey(reactiveResult.response.translationKey);
      void import("./data/reactive/reactiveHistoryStorage").then(({ recordReactiveResponse }) => recordReactiveResponse({
        responseId: reactiveResult.response.id,
        situation: reactiveResult.situation,
        intent: reactiveResult.intent,
        timestamp: new Date().toISOString(),
      })).catch(() => {});
    })
    .catch(() => setReactiveMessageKey(null));
};

  // Toggle single objective completion

  const handleToggleObjective = useCallback((id: string) => {
    setObjectives(prev => {
      const updatedObjectives = prev.map(obj => {
        if (obj.id === id) {
          const nextCompleted = !obj.completed;

          if (nextCompleted) {
            // Reward XP on check
            addXp(obj.xpReward);

            /**
             * 2F.1 — conclusão atual.
             *
             * Informamos o mesmo Reactive Engine usado
             * pelo resto da CONFIA.
             *
             * Não criamos regras editoriais locais.
             */
            void import("./data/reactive/reactiveEngine")
              .then(({ analyzeReactiveState }) => {
                const objectiveReactiveResult = analyzeReactiveState({
                  source: "objective",
                  objectiveCompleted: true,
                });
                setReactiveMessageKey(objectiveReactiveResult.response.translationKey);
                void import("./data/reactive/reactiveHistoryStorage").then(({ recordReactiveResponse }) => recordReactiveResponse({
                  responseId: objectiveReactiveResult.response.id,
                  situation: objectiveReactiveResult.situation,
                  intent: objectiveReactiveResult.intent,
                  timestamp: new Date().toISOString(),
                })).catch(() => {});
              })
              .catch(() => setReactiveMessageKey(null));

          } else {
            // Deduct points/XP if unchecked
            setAvatar(a => ({
              ...a,
              points: Math.max(
                0,
                a.points - Math.round(obj.xpReward / 2)
              )
            }));
          }

          return { ...obj, completed: nextCompleted };
        }

        return obj;
      });

      // Save today's completed objectives count
      const todayStr = getLocalCalendarDate();

      const completedCount = updatedObjectives.filter(
        obj => obj.completed
      ).length;

      setObjectivesHistory(prevHistory => {
        const existing = prevHistory.findIndex(
          item => item.date === todayStr
        );

        const updatedHistory = [...prevHistory];

        const entry = {
          date: todayStr,
          completed: completedCount,
          total: updatedObjectives.length
        };

        if (existing >= 0) {
          updatedHistory[existing] = entry;
        } else {
          updatedHistory.push(entry);
        }

        return updatedHistory;
      });

      return updatedObjectives;
    });
  }, [addXp]);
  // Create objective

  const handleAddCustomObjective = useCallback((
    text: string,
    category: 'corporeo' | 'mental' | 'social' | 'nutricao'
  ) => {
    const newObj: Objective = {
      id: `obj-custom-${Date.now()}`,
      text,
      category,
      xpReward: 20,
      completed: false,
      isCustom: true
    };

    setObjectives(prev => {
      if (prev.length < 5) {
        return [newObj, ...prev].slice(0, 5);
      }

      const replaceIndex = prev.findIndex(objective => !objective.completed);
      if (replaceIndex < 0) return prev;

      return prev.map((objective, index) =>
        index === replaceIndex ? newObj : objective
      );
    });
  }, []);

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getMondayOfCurrentWeek = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + diff);

    return getLocalDateString(date);
  };

  /**
   * CICLO SEMANAL
   *
   * Um objetivo pertence sempre à semana indicada por
   * weekStart. Quando entramos numa nova semana, o quadro
   * anterior deixa de ser o quadro ativo.
   *
   * O troféu NÃO é apagado: vive separadamente em
   * confia_weekly_trophies.
   */
  useEffect(() => {
    if (!weeklyGoal) {
      return;
    }

    const currentWeekStart =
      getMondayOfCurrentWeek();

    if (weeklyGoal.weekStart === currentWeekStart) {
      return;
    }

    setWeeklyGoal(null);
  }, [weeklyGoal?.weekStart]);

  const handleCreateWeeklyGoal = useCallback((title: string) => {
    const cleanTitle = title.trim().slice(0, 20);

    if (!cleanTitle) return;

    setWeeklyGoal({
      id: `weekly-${Date.now()}`,
      title: cleanTitle,
      weekStart: getMondayOfCurrentWeek(),
      completedDays: [],
      medalUnlocked: false,
      dailyCredits: {}
    });
  }, []);

  const handleCompleteWeeklyDay = useCallback((
    targetDate: string,
    ease: number,
    note: string,
    recovery: boolean
  ) => {
    if (!weeklyGoal || weeklyGoal.medalUnlocked) return;

    const today = getLocalDateString();
    const alreadyCompleted = weeklyGoal.completedDays.includes(targetDate);

    setWeeklyGoal(prev => {
      if (!prev) return prev;

      const credits = prev.dailyCredits ?? {};
      const todayCredits = credits[today] ?? 0;

      // Alterar uma avaliação já existente não consome novo crédito.
      if (!alreadyCompleted && todayCredits >= 2) {
        return prev;
      }

      const completedDays = alreadyCompleted
        ? prev.completedDays
        : [...prev.completedDays, targetDate];

      const nextCredits = alreadyCompleted
        ? credits
        : {
            ...credits,
            [today]: todayCredits + 1
          };

      const dailyRatings = {
        ...(prev.dailyRatings ?? {}),
        [targetDate]: {
          ease,
          note
        }
      };

      const medalUnlocked = completedDays.length >= 7;

      if (
        medalUnlocked &&
        !prev.medalUnlocked
      ) {
        void import("./storage/weeklyTrophies")
          .then(({ createWeeklyTrophy }) => {
            createWeeklyTrophy(
              prev.id,
              prev.title,
              prev.weekStart
            );
          })
          .catch((error) => {
            console.error("Erro ao criar troféu semanal:", error);
          });
      }

      return {
        ...prev,
        completedDays,
        dailyCredits: nextCredits,
        dailyRatings,
        medalUnlocked
      };
    });
  }, [weeklyGoal]);

  const handleDeleteAccountData = async () => {
    const confirmed = window.confirm(
      t("deleteDataConfirm")
    );

    if (!confirmed) return;

    try {
      const { deleteAllUserData } = await import("./storage/deleteUserData");
      await deleteAllUserData();

      alert(t("deleteDataSuccess"));

      window.location.reload();
    } catch (error) {
      console.error("Erro ao apagar os dados:", error);
      alert(t("deleteDataError"));
    }
  };


  // Delete objective
  const handleDeleteObjective = useCallback((id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id));
  }, []);

const handleDeletePost = useCallback(async (id: string) => {
  try {
    const { deleteCommunityPost } = await import("./data/community/communityService");
    await deleteCommunityPost(id);

    setPosts(prev =>
      prev.filter(post => post.id !== id)
    );

  } catch (error) {
    console.error("Erro ao apagar publicação:", error);
    alert("Não foi possível apagar esta publicação.");
  }
}, []);
// Denunciar publicação
const handleReportPost = useCallback(async (
  post: SharePost,
  reason: string
) => {
  try {
    const { reportCommunityPost } = await import("./data/community/communityService");
    await reportCommunityPost(post, reason);

    alert("Obrigado. A denúncia foi enviada para análise.");

  } catch (error) {
    console.error("Erro ao denunciar publicação:", error);
    alert("Não foi possível enviar a denúncia.");
  }
}, []);
// Bloquear utilizador
const handleBlockUser = useCallback(async (blockedUserId: string) => {
  try {
    const { blockCommunityUser } = await import("./data/community/communityService");
    await blockCommunityUser(blockedUserId);

    setPosts(prev =>
      prev.filter(post => post.authorId !== blockedUserId)
    );

    alert("Utilizador bloqueado.");

  } catch (error) {
    console.error("Erro ao bloquear utilizador:", error);
    alert(t("blockError"));
  }
}, [t]);
  // Create Community Post
const handleAddPost = useCallback(async (feeling: string, topic: string, message: string, options?: { experienceTag?: string; supportMode?: "share" | "other_side" | "seeking_match" | "give_back"; circleExpiresAt?: number }) => {
  try {
    const { createCommunityPost } = await import("./data/community/communityService");
    const created = await createCommunityPost(feeling, topic, message, options);

    const newPost: SharePost = {
      ...created,
      timestamp: t("justNow"),
    };

    setPosts(prev => [newPost, ...prev]);

    // O Companion só deve tratar a publicação como facto depois de
    // a publicação ter sido criada com sucesso.
    recordCompanionBrainEventDeferred("community_posted", {
      postId: created.id,
      topic,
      feeling,
    });

    // Publicar conteúdo pessoal nunca concede XP nem vantagens de jogo.
    // A participação comunitária deve ser livre, sem pressão para revelar mais.

  } catch (error) {
    console.error("Erro ao publicar na comunidade:", error);
    throw error;
  }
}, [t]);

  /**
   * Partilha de troféus.
   *
   * Por privacidade, o texto pessoal do objetivo não é
   * enviado para a Comunidade.
   */
  const handleShareWeeklyTrophy = useCallback(async () => {
    await handleAddPost(
      t("trophyRoom.communityFeeling"),
      "progresso",
      t("trophyRoom.communityMessage")
    );
  }, [handleAddPost, t]);

  // Reações da comunidade
const handleLikePost = useCallback(async (
  id: string,
  reaction: "yellow" | "green" | "red"
) => {
  try {
    // reactToCommunityPost garante a autenticação anónima quando
    // necessário. Não bloqueamos a reação só porque o estado auth
    // ainda não chegou ao componente.
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const { reactToCommunityPost } = await import("./data/community/communityService");
    await reactToCommunityPost(id, reaction, post.userReaction);

  } catch (error) {
    console.error("Erro ao atualizar reação:", error);
  }
}, [posts]);

// Abre o chat privado associado a uma publicação
const handleOpenChat = useCallback((post: SharePost) => {
  setChatIdOverride(null);
  setChatPost(post);
}, []);

const handleOpenMatchedChat = useCallback((post: SharePost, chatId: string) => {
  setChatIdOverride(chatId);
  setChatPost(post);
}, []);

const handleConnectCommunityMatch = useCallback(async (post: SharePost) => {
  try {
    if (!post.userReaction) {
      const { reactToCommunityPost } = await import("./data/community/communityService");
      await reactToCommunityPost(post.id, "red", post.userReaction);
    }
    setChatIdOverride(null);
    setChatPost(post);
  } catch (error) {
    console.error("Erro ao ligar utilizadores por experiência:", error);
  }
}, []);

// Visual text helper for the shared 1–10 emotional scale

const getRatingLabel = useCallback((val: number) => {
    if (val <= 2) return { text: t("moodVeryAgitated"), emoji: '🥺', color: 'text-[#934A38]' };
    if (val <= 4) return { text: t("moodRestless"), emoji: '😐', color: 'text-[#934A38]' };
    if (val <= 6) return { text: t("moodStable"), emoji: '🙂', color: 'text-[#8B5C4D]' };
    if (val <= 8) return { text: t("moodCalm"), emoji: '🌿', color: 'text-[#8B5C4D]' };
    return { text: t("moodVeryCalm"), emoji: '✨', color: 'text-[#8B5C4D]' };
  }, [t]);

const handleOpenInnerCanvas = useCallback(() => {
  setHomeScreen("innerCanvas");
}, []);

const handleMainNavigation = useCallback((index: number) => {
  setOpenHabitSupport(false);
  setHomeScreen("home");
  // Entrar no separador Comunidade deve mostrar primeiro o feed e o seu fundo.
  // Uma conversa por ler nunca deve abrir um modal automaticamente por cima do feed;
  // continua assinalada no ícone e pode ser aberta pelo utilizador.
  setOpenPendingChatOnCommunityEntry(false);
  const targetTab = index === 3 ? 0 : index;
  setCurrentTab(targetTab);
  markVisited(targetTab);
  // Começa a descarregar o código do separador em paralelo com a navegação.
  // Não aguardamos pelo import: o clique e a mudança visual nunca ficam bloqueados.
  preloadTab(targetTab);
}, [markVisited, preloadTab]);

if (!ageGateReady) {
  return <div className="min-h-screen bg-[#FAF7F2]" aria-label="Confia" />;
}

if (!ageConfirmed) {
  const language = (i18n.resolvedLanguage || i18n.language || "pt").slice(0, 2);
  return <AgeGateScreen language={language} checked={ageCheckboxChecked} underageNotice={underageNotice} onCheckedChange={setAgeCheckboxChecked} onConfirm={confirmAge} onShowUnderageNotice={() => setUnderageNotice(true)} />;
}

if (!appDataReady) {
  return <div className="min-h-screen bg-[#FAF7F2]" aria-label="Confia"><ScreenLoading label={t("loading")} /></div>;
}

return (
    <div className="confia-app min-h-screen flex flex-col antialiased">

      <AppHeader avatar={avatar} />

      {/* Main Content Stage */}
      <main
        className={`confia-main confia-main--tab-${currentTab === 1 ? "horizon" : currentTab === 2 ? "objectives" : currentTab === 4 ? "community" : "home"} flex-1 pb-28 px-4 sm:px-6 w-full pt-5 sm:pt-7`}
      >
{currentTab === 0 && homeScreen === "dailyCheckIn" && (
  <Suspense fallback={<ScreenLoading label={t("loading")} />}><MorningSheet
    onComplete={() => {
      addXp(20);
    }}
    onOpenSky={() => {
      setCurrentTab(1);
      handleOpenInnerCanvas();
    }}
    onOpenMountain={() => {
      setCurrentTab(2);
      setHomeScreen("home");
    }}
    onOpenSea={() => {
      setCurrentTab(1);
      setHomeScreen("home");
    }}
    onOpenCommunity={() => {
      setCurrentTab(4);
      setHomeScreen("home");
    }}
    onOpenChest={() => {
      setCurrentTab(2);
      setHomeScreen("home");
    }}
  /></Suspense>
)}

{currentTab === 0 && homeScreen === "home" && (
          <div
              key="main-menu"
              className="space-y-5"
            >
              {/* Interactive Amigo Panel */}
              <div className="space-y-4">


{/* ======================================================
    CONFIA 3C.1 — MOMENTO DE HOJE

    Primeira manifestação visual do Ritual Diário.

    Não substitui:
    - A CONFIA percebeu;
    - Para ti agora;
    - primeiro contacto;
    - Reactive Engine.

    Apenas dá contexto à chegada do utilizador naquele dia.
====================================================== */}


<Suspense fallback={<div role="status" aria-live="polite" className="flex min-h-40 items-center justify-center text-xs font-semibold text-[#806D65]">{t("loading")}</div>}>
<MemoConfiaCompanionHome
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}
  voiceInput={companionVoiceInput}
  relationshipStage={
    isFirstContact
      ? "first_contact"
      : isEarlyLearning
        ? "early_learning"
        : personalDiscovery
          ? "personal_discovery"
          : "established"
  }
  relationshipObservationCount={ratings.length}

  onCompanionAction={handleCompanionAction}
/>
</Suspense>


{/* O teu espaço — superfície deliberadamente simples.
    Os motores avançados continuam disponíveis contextualmente;
    não competem todos pela atenção diária. */}
{homeScreen === "home" && (
  <section className="relative overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF6F1] p-4 shadow-[0_12px_32px_rgba(92,64,52,0.055)]" aria-label={t("homeSpace.title")}>
    <div className="px-1 pb-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#934A38]">{t("homeSpace.title")}</p><p className="mt-1 text-[11px] font-semibold text-[var(--cf-muted)]">{t("homeSpace.subtitle")}</p></div>
    <ProgressiveStartGuide
      onOpenRecord={() => setHomeScreen("dailyCheckIn")}
      onOpenTool={() => { setCurrentTab(1); setHomeScreen("home"); }}
      onOpenMap={() => { recordCompanionInteractionDeferred("reflection_opened","map",{from:"home",to:"map"}); setHomeScreen("map"); }}
    />
    <button type="button" onClick={() => setHomeScreen("settings")} className="mt-2 flex w-full items-center justify-end gap-1.5 px-2 py-2 text-[9px] font-bold text-[var(--cf-muted)]"><Settings size={12}/>{t("settings")}</button>
  </section>
)}



{homeScreen === "home" && (
  <>
  {homeNowMemory?.kind === "impulseLearning" &&
  !homeNowAction && (
  <div className="mt-4 overflow-hidden rounded-[28px] border border-[#B85F48]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC] shadow-[0_10px_30px_rgba(92,64,52,0.06)]">
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#B85F48]/20 bg-white">
          <Sparkles
            size={18}
            strokeWidth={1.8}
            className="text-[#934A38]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#934A38]">
            {t("impulseLearning.eyebrow")}
          </p>

          <h3 className="mt-1 text-base font-black leading-tight text-[#2F2926]">
            {t("impulseLearning.title")}
          </h3>

          <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--cf-text-soft)]">
            {t("impulseLearning.description", {
              count: homeNowMemory.effectiveCount,
              reduction:
                homeNowMemory.averageReduction !== null
                  ? Math.round(
                      homeNowMemory.averageReduction * 10
                    ) / 10
                  : 0,
            })}
          </p>
        </div>
      </div>

      {homeNowMemory.need && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--cf-muted)]">
              {t("impulseLearning.patternLabel")}
            </p>

            <p className="mt-1 text-sm font-black text-[#2F2926]">
              {t(
                `impulsePremium.${homeNowMemory.need}Title`
              )}
            </p>
          </div>

          <div className="rounded-full bg-[#FFF3EC] px-3 py-1.5 text-[9px] font-black text-[#934A38]">
            {t("impulseLearning.observed", {
              count: homeNowMemory.needCount,
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] font-semibold leading-relaxed text-[var(--cf-muted)]">
        {t("impulseLearning.disclaimer")}
      </p>
    </div>
  </div>
)}

{/* O primeiro contacto vive agora no próprio companheiro.
    Não existe um segundo cartão a explicar a relação:
    a CONFIA demonstra-a através da sua presença e voz. */}

{/* CONFIA A3.3 — a reação do Principal é agora
    apresentada pela própria CONFIA através do seu balão.
    reactiveMessageKey permanece ativo para os restantes
    fluxos reativos e separadores. */}

  </>
)}

              {/* CONFIA — ação contextual integrada no cartão principal.
                  O antigo cartão independente "Para ti agora" foi removido
                  para evitar duplicação visual e repetição do mesmo CTA. */}

{/* Hoje — resumo + registo diário */}
              <div className="mt-1">
                {/* Registo diário premium — integrado na área Hoje */}
                <section
                  id="home-daily-record"
                  className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-gradient-to-b from-white to-[#FFFDFC] shadow-[0_12px_30px_rgba(92,64,52,0.06)]"
                >

                <button
                  type="button"
                  onClick={() => setShowDayRatingPanel((current) => !current)}
                  aria-expanded={showDayRatingPanel}
                  className="w-full flex items-center justify-between gap-4 border-t border-[#B85F48]/10 px-5 py-4 text-left transition-colors duration-200 active:bg-[#FFF9F5]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="w-11 h-11 shrink-0 rounded-2xl border border-[#B85F48]/15 bg-gradient-to-br from-[#FFF5EF] to-[#F8EAE2] flex items-center justify-center shadow-[0_5px_14px_rgba(92,64,52,0.04)]">
                      <Calendar
                        size={19}
                        strokeWidth={1.8}
                        className="text-[#934A38]"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#2F2926] font-display">
                        {t("classifyDay")}
                      </h3>

                      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--cf-text-soft)] font-semibold">
                        {t("wellbeingDescription")}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full border border-[#B85F48]/15 bg-white flex items-center justify-center text-[#934A38] text-lg font-light shadow-sm"
                  >
                    {showDayRatingPanel ? "−" : "+"}
                  </span>
                </button>

                {showDayRatingPanel && (
                  <div className="border-t border-[#B85F48]/10 bg-[#FFFCFA]/70 px-5 pb-5 pt-4 space-y-5">

                    {/* Data */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#2F2926]">
                        {t("recordDate")}
                      </label>

                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#B85F48] focus:ring-2 focus:ring-[#B85F48]/15 bg-[#F7F5F2] font-bold text-[#2F2926]"
                      />
                    </div>

                    {/* Manhã */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#934A38]">
                          <Sun size={15} strokeWidth={1.8} />
                          {t("morning")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#2F2926]">
                            {morningRating}
                          </span>

                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${getRatingLabel(morningRating).color}`}
                          >

                            <span>{getRatingLabel(morningRating).text}</span>
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={morningRating}
                        onChange={(e) => setMorningRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#B85F48]"
                      />

                      <div className="flex justify-between text-[9px] text-[var(--cf-muted)] font-bold">
                        <span>1 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Tarde */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#934A38]">
                          <Moon size={15} strokeWidth={1.8} />
                          {t("afternoon")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#2F2926]">
                            {afternoonRating}
                          </span>

                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${getRatingLabel(afternoonRating).color}`}
                          >

                            <span>{getRatingLabel(afternoonRating).text}</span>
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={afternoonRating}
                        onChange={(e) => setAfternoonRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#B85F48]"
                      />

                      <div className="flex justify-between text-[9px] text-[var(--cf-muted)] font-bold">
                        <span>1 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Nota opcional */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#2F2926]">
                        {t("dailyNote")}
                      </label>

                      <input
                        type="text"
                        placeholder={t("dailyNotePlaceholder")}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        maxLength={100}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#B85F48] focus:ring-2 focus:ring-[#B85F48]/15 bg-[#F7F5F2] font-bold text-[#2F2926]"
                      />
                    </div>

                    {/* Guardar */}
                    <button type="button"
                      onClick={() => {
  recordCompanionInteractionDeferred(
    "checkin_completed",
    "checkin",
    { source: "home_day_rating" }
  );
  handleSaveRatings();
}}
                      className="w-full py-3.5 bg-[#D59375] active:bg-[#C68060] text-white font-extrabold text-xs rounded-2xl shadow-[0_8px_20px_rgba(201,123,94,0.18)] transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} />

                      {todayLogged
                        ? t("updateTodayRecord")
                        : t("saveDailyRecord")}
                    </button>

                  </div>
                )}

                </section>
              </div>

{/* Hábitos — relógio, Alimenta-me e Exercício entre Classificar o teu dia e SOS */}
<section id="home-habits" className="confia-content-deferred scroll-mt-24" aria-label={t("habitHub.title")}>
  {habitSectionVisible ? (
    <Suspense fallback={<div className="min-h-40 rounded-3xl bg-[#F7F5F2]" aria-hidden="true" />}>
      <MemoHabitDashboard
        embedded
        openSupport={openHabitSupport}
        initialPage={habitEntry.page}
        navigationKey={habitEntry.key}
      />
    </Suspense>
  ) : (
    <div className="min-h-40 rounded-3xl bg-[#F7F5F2]" aria-hidden="true" />
  )}
</section>

{/* Apoio humano — entrada para a comunidade, acima do SOS */}
<button
  type="button"
  onClick={() => { setListeningSupportInitialView("talk"); setListeningSupportOpen(true); }}
  aria-label={t("listeningSupport.title")}
  className="group w-full rounded-[24px] border border-[#C9DCCB] bg-gradient-to-r from-[#F2F8F1] via-white to-[#F4F8F3] px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(73,112,80,0.08)] transition-all duration-200 active:scale-[0.99] active:opacity-95"
  aria-describedby={incomingListeningRequestCount > 0 ? "listening-support-incoming-alert" : undefined}
>
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D5E5D5] bg-white">
      <svg viewBox="0 0 64 64" width="42" height="42" fill="none" aria-hidden="true">
        <circle cx="17" cy="13" r="6" fill="#73977A"/>
        <circle cx="47" cy="13" r="6" fill="#5D8270"/>
        <path d="M7 31c0-7 4-11 10-11s10 4 10 11v4H7z" fill="#A8C8A7"/>
        <path d="M37 31c0-7 4-11 10-11s10 4 10 11v4H37z" fill="#91B6A0"/>
        <path d="M10 30l10 8 8 7M54 30l-10 8-8 7" stroke="#4D755A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 35l12 9 8-2 8 2 12-9" stroke="#6F9675" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 44l5 5c2 2 4 2 6 0l5-5" stroke="#4D755A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 45l-3-3M36 45l3-3" stroke="#DCEBDD" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black text-[#365740] font-display">
        {t("listeningSupport.title")}
      </p>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#64816A]">
        {t("listeningSupport.subtitle")}
      </p>
    </div>
    <span className="relative flex shrink-0 items-center gap-2 text-xl font-light text-[#64816A]" aria-hidden={incomingListeningRequestCount === 0 ? "true" : undefined}>
      {incomingListeningRequestCount > 0 && (
        <span id="listening-support-incoming-alert" className="inline-flex items-center gap-1 rounded-full bg-[#B42318] px-2 py-1 text-[10px] font-black leading-none text-white shadow-sm" role="status" aria-live="polite">
          <AlertCircle size={14} strokeWidth={2.5} />
          {incomingListeningRequestCount > 9 ? "9+" : incomingListeningRequestCount}
        </span>
      )}
      →
    </span>
  </div>
</button>

{/* Apoio — acesso SOS discreto e sempre disponível */}
<button
  type="button"
  onClick={() => setTriageOpen(true)}
  className="group w-full rounded-[22px] border border-[#8F433A]/35 bg-gradient-to-r from-[#A65349] to-[#93443C] px-4 py-3 text-left shadow-[0_8px_22px_rgba(130,58,50,0.16)] transition-all duration-200 active:scale-[0.99] active:opacity-95"
>
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
      <Brain
        size={16}
        strokeWidth={1.7}
        className="text-white"
      />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-black text-white font-display">
        {t("crisisQuestion")}
      </p>

      <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-white/75">
        {t("crisisStartSupport")}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-1.5">
      <span className="text-[10px] font-black tracking-wide text-white">
        SOS
      </span>

      <span
        aria-hidden="true"
        className="text-sm font-light text-white/90"
      >
        →
      </span>
    </div>
  </div>
</button>

</div>

            </div>
          )}


{/* O progresso e o Mapa Pessoal passam a viver no mesmo espaço de aprendizagem. */}
{currentTab === 0 && (homeScreen === "progress" || homeScreen === "map") && (
  <Suspense fallback={<ScreenLoading label={t("loading")} />}>
    <PersonalGrowthHub
      onBack={() => setHomeScreen("home")}
      ratings={ratings}
      avatarLevel={avatar.level}
      avatarXp={avatar.xp}
      completedObjectivesCount={completedObjectivesCount}
      objectivesHistory={objectivesHistory}
    />
  </Suspense>
)}

{currentTab === 1 && homeScreen === "innerCanvas" && (
  <div
    key="inner-canvas-screen"
    className="flex-1"
  >
    <LazySection>
      <InnerCanvas
        onBack={() => setHomeScreen("home")}
      />
    </LazySection>
  </div>
)}

{currentTab === 0 && homeScreen === "shop" && (
<LazySection>
<HomeShop
  onBack={() => {
    // CONFIA_COMPANION_HOME_RETURNED_SHOP
    recordCompanionBrainEventDeferred(
      "home_returned",
      {
        from: "shop",
      }
    );

    setHomeScreen("home");
  }}
  points={avatar.points}
  companionLevel={avatar.level}
  spendPoints={spendPoints}
/>
</LazySection>
)}
{currentTab === 0 && homeScreen === "inventory" && (
  <LazySection>
<HomeInventory
    onBack={() => {
      // CONFIA_COMPANION_HOME_RETURNED_INVENTORY
      recordCompanionBrainEventDeferred(
        "home_returned",
        {
          from: "inventory",
        }
      );

      setHomeScreen("home");
    }}
    companionLevel={avatar.level}
  />
</LazySection>
)}
{currentTab === 0 && homeScreen === "settings" && (
  <div
    key="settings-screen"
    className="space-y-5"
  >
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setHomeScreen("home")}
        aria-label={t("back")}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#934A38]"
      >
        ←
      </button>

      <h2 className="text-xl font-black text-[#2F2926]">
        {t("settings")}
      </h2>
    </div>

<Suspense fallback={<ScreenLoading label={t("loading")} />}><NotificationSettings/></Suspense>
<Suspense fallback={null}><ModeratorDashboard /></Suspense>
{/* Idioma */}
  <div className="bg-white border border-[#B85F48]/20 rounded-3xl p-5 shadow-sm mb-4">
    <h3 className="text-sm font-black text-[#2F2926] mb-1">
      {t("language")}
    </h3>

    <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed mb-4">
      {t("chooseLanguage")}
    </p>

    <div className="grid grid-cols-2 gap-2">
      <button type="button"
        onClick={() => changeAppLanguage("pt")}
        className="py-3 rounded-2xl border border-[#B85F48]/30 bg-[#F3E3DC] text-[#934A38] font-black text-xs"
      >
        🇵🇹 Português
      </button>

      <button type="button"
        onClick={() => changeAppLanguage("en")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#2F2926] font-black text-xs"
      >
        🇬🇧 English
      </button>

      <button type="button"
        onClick={() => changeAppLanguage("es")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#2F2926] font-black text-xs"
      >
        🇪🇸 Español
      </button>

      <button type="button"
        onClick={() => changeAppLanguage("fr")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#2F2926] font-black text-xs"
      >
        🇫🇷 Français
      </button>
    </div>
  </div>

<div className="bg-white border border-[#B85F48]/20 rounded-3xl p-5 shadow-sm mb-4">
  <h3 className="text-sm font-black text-[#2F2926] mb-1">{t("privacyPolicyTitle")}</h3>
  <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed mb-4">{t("privacyPolicyDescription")}</p>
  <a href={(i18n.resolvedLanguage || i18n.language || "pt").split("-")[0] === "pt" ? "/privacy-policy.html" : `/privacy-policy-${(i18n.resolvedLanguage || i18n.language || "pt").split("-")[0]}.html`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#B85F48]/30 bg-[#F3E3DC] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#934A38]">{t("privacyPolicyOpen")}</a>
</div>

<div className="bg-white border border-[#B85F48]/20 rounded-3xl p-5 shadow-sm mb-4">



<h3 className="text-sm font-black text-[#2F2926] mb-1">
    {t("communityTerms")}
  </h3>

  <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed mb-4">
    {t("communityGuidelinesShort")}
  </p>

  <button type="button"
    onClick={() => setShowCommunityTerms(true)}
    className="w-full py-3.5 rounded-2xl bg-[#F3E3DC] border border-[#B85F48]/30 text-[#934A38] font-black text-xs uppercase tracking-wide"
  >
    {t("communityTermsButton")}
  </button>

</div>
    <div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#2F2926] mb-1">
        {t("deleteMyData")}
      </h3>

      <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed mb-4">
        {t("deleteMyDataDescription")}
      </p>
      <p className="mb-4 text-[10px] leading-5 text-[#806D65]">{t("deleteDataRetentionNotice")}</p>

      <button type="button"
        onClick={handleDeleteAccountData}
        className="w-full py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-black text-xs uppercase tracking-wide hover:bg-red-100 transition"
      >
        🗑️ {t("deleteMyData")}
      </button>
    </div>
  </div>
)}







<CommunityGuidelinesModal open={showCommunityTerms} onClose={() => setShowCommunityTerms(false)} t={t} />

{visitedTabs.includes(1) && (
  <div hidden={currentTab !== 1 || homeScreen === "innerCanvas"} aria-hidden={currentTab !== 1 || homeScreen === "innerCanvas"}>
    <Suspense fallback={<ScreenLoading label={t("loading")} />}><EmbraceTab onOpenSky={handleOpenInnerCanvas} onAddXp={addXp} active={currentTab === 1 && homeScreen !== "innerCanvas"} /></Suspense>
  </div>
)}

{visitedTabs.includes(2) && (
  <div hidden={currentTab !== 2} aria-hidden={currentTab !== 2}>
  <Suspense fallback={<ScreenLoading label={t("loading")} />}><ObjectivesTab
    reactiveMessageKey={reactiveMessageKey}
    objectives={objectives}
    weeklyGoal={weeklyGoal}
    onToggleComplete={handleToggleObjective}
    onAddCustomObjective={handleAddCustomObjective}
    onDeleteObjective={handleDeleteObjective}
    onCreateGoal={handleCreateWeeklyGoal}
    onCompleteDay={handleCompleteWeeklyDay}
    onShareTrophy={handleShareWeeklyTrophy}
  /></Suspense>
  </div>
)}

{currentTab === 4 && (
  <Suspense fallback={<ScreenLoading label={t("loading")} />}><CommunityTab
    posts={posts}
    onAddPost={handleAddPost}
    onLikePost={handleLikePost}
    onOpenChat={handleOpenChat}
    onConnectMatch={handleConnectCommunityMatch}
    onOpenMatchedChat={handleOpenMatchedChat}
    onDeletePost={handleDeletePost}
    onReportPost={handleReportPost}
    onBlockUser={handleBlockUser}
  /></Suspense>
)}

      </main>

      {/* Apoio humano em tempo real: pedido por tema e parelha exclusiva */}
      <Suspense fallback={null}>
        <ListeningSupportModal
          isOpen={listeningSupportOpen}
          initialView={listeningSupportInitialView}
          onOpen={() => { setListeningSupportInitialView("listen"); setListeningSupportOpen(true); }}
          onClose={() => setListeningSupportOpen(false)}
          onOpenMatchedChat={handleOpenMatchedChat}
          onIncomingRequestsChange={setIncomingListeningRequestCount}
        />
      </Suspense>

      {/* Triage / Screening Help Modal */}
      <LazySection>
<TriageModal
        isOpen={triageOpen}
      onClose={() => setTriageOpen(false)}
      />
</LazySection>

      <LevelUpOverlay open={levelUpOpen} previousLevel={prevLevel} onClose={() => setLevelUpOpen(false)} t={t} />

{showStopMode && (
      <LazySection>
        <StopMode
          onStartImpulse={() => {
            setShowStopMode(false);
            setOpenHabitSupport(true);
            setCurrentTab(0);
      setHomeScreen("home");
      requestAnimationFrame(() => document.getElementById("home-habits")?.scrollIntoView({block:"start"}));
          }}
        />
      </LazySection>
      )}
      {chatPost && (
        <LazySection>
<CommunityChat
          post={chatPost}
          initialChatId={chatIdOverride}
          initialMessageId={noticeMessageId}
          onClose={() => {
            setChatPost(null);
            setChatIdOverride(null);
            setNoticeMessageId(undefined);
          }}
        />
</LazySection>
      )}

      {noticeMessage && <div role="status" className="fixed bottom-28 left-4 right-4 z-[100] rounded-2xl bg-[#FFF7E9] p-4 text-sm"><p>{noticeMessage}</p><button type="button" className="min-h-11 underline" onClick={()=>setNoticeMessage("")}>{t("notifications.close")}</button></div>}
      <MainNavigation
        currentTab={currentTab}
        hasUnreadCommunityMessage={Boolean(pendingCommunityChat)}
        onNavigate={handleMainNavigation}
        onIntent={preloadTab}
      />
    </div>
  );
}
