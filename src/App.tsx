import {habitDestination,screenName} from "./navigation";
import {recordPersonalScreenView} from "./data/personal/personalAnalytics";
import type { CompanionAction } from "./components/Companheiro/CompanionVoice";
import type { NoticeTarget } from "./notifications/model";
import { emitCompanionBrainEvent } from "./data/reactive/companionBrain/companionBrainEvents";
import React, { lazy, Suspense, memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppHeader } from "./components/layout/AppHeader";
import { MainNavigation } from "./components/layout/MainNavigation";
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sun, Compass, ArrowUp, ArrowLeft, Sparkles, Moon, Users, AlertCircle, Brain, CheckCircle2, Calendar, Gift, House, Wind, Target, Zap, ChartNoAxesCombined, Backpack, Store, Settings, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";




import { initLanguage, setLanguage } from "./i18n/language";
import { emitCompanionInteraction } from "./data/reactive/companionBrain/companionInteractionEvents";

const HomeProgressSummary = lazy(() => import("./components/HomeProgressSummary"));
const MemoHomeProgressSummary = memo(HomeProgressSummary);
import { useDailyOpenState } from "./hooks/useDailyOpenState";
import { getLocalCalendarDate } from "./utils/date";

const PersonalMap = lazy(() => import("./components/PersonalMap"));
const ConfiaCompanionHome = lazy(() => import("./components/Companheiro/ConfiaCompanionHome"));
const MemoConfiaCompanionHome = memo(ConfiaCompanionHome);
const DailyCheckIn = lazy(() => import("./components/DailyCheckIn/DailyCheckIn"));
const InnerCanvas = lazy(() => import("./components/InnerCanvas/InnerCanvas"));
const HomeInventory = lazy(() => import("./components/HomeInventory"));
const HomeShop = lazy(() => import("./components/HomeShop"));
const PartilhaFeed = lazy(() => import("./components/PartilhaFeed").then(m => ({ default: m.PartilhaFeed })));
const ObjectivosList = lazy(() => import("./components/ObjectivosList").then(m => ({ default: m.ObjectivosList })));
const WeeklyGoalSection = lazy(() => import("./components/WeeklyGoalSection").then(m => ({ default: m.WeeklyGoalSection })));
const NotificationSettings = lazy(() => import("./components/NotificationSettings"));
const HabitDashboard = lazy(() => import("./components/Habits/HabitDashboard"));
const MemoHabitDashboard = memo(HabitDashboard);
const ProgressoDashboard = lazy(() => import("./components/ProgressoDashboard").then(m => ({ default: m.ProgressoDashboard })));
const StopMode = lazy(() => import("./components/StopMode").then(m => ({ default: m.StopMode })));
const CommunityChat = lazy(() => import("./components/CommunityChat").then(m => ({ default: m.CommunityChat })));
const TriageModal = lazy(() => import("./components/TriageModal").then(m => ({ default: m.TriageModal })));
const HorizonExperience = lazy(() => import("./components/HorizonExperience"));
const AbracoTimer = lazy(() => import("./components/AbracoTimer").then(m => ({ default: m.AbracoTimer })));

import { AvatarState, Objective, DailyRating, WeeklyGoal, SharePost } from './types';
import { getDailyObjectives, INITIAL_POSTS } from './data/initialData';

import type { ReactiveResult } from "./data/reactive/reactiveTypes";
import type { PersonalInsight } from "./data/personal/personalInsights";
import {
  recordReactiveResponse,
} from "./data/reactive/reactiveHistoryStorage";
import {
  collectReactiveRecentMemory,
} from "./data/reactive/reactiveRecentMemory";

// Component imports

import { hasCompletedToday } from "./storage/dailyCheckInStorage";

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

// O histórico visual nasce exclusivamente dos registos reais do utilizador.
// Não existe seed emocional nem histórico fictício: a CONFIA nunca deve fingir memória.

export default function App() {
const { t, i18n } = useTranslation();

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
} = useDailyOpenState();

/* CONFIA 3A — FIM DO ESTADO DIÁRIO */



const changeAppLanguage = (lang: "pt" | "en" | "es" | "fr") => {
    setLanguage(lang);
};

useEffect(() => {
    initLanguage();
}, []);
useEffect(() => {
  const run = () => {
    void import("./data/personal").then(({ syncPersonalEventsFromLegacySources }) => {
      try { syncPersonalEventsFromLegacySources(); } catch { /* complementar */ }
    });
  };
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    const id = idle(run, { timeout: 2500 });
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const timer = window.setTimeout(run, 1200);
  return () => window.clearTimeout(timer);
}, []);
useEffect(() => {
  void import("./firebaseAuth").then(({ initAnonymousAuth }) =>
    initAnonymousAuth().catch((error) => {
      console.error("Firebase Auth:", error);
    })
  );
}, []);
  // Global App States
const [homeScreen, setHomeScreen] = useState<
  "home" | "dailyCheckIn" | "shop" | "inventory" | "settings" | "progress" | "innerCanvas" | "map"
>(() => (hasCompletedToday() ? "home" : "dailyCheckIn"));
  const [avatar, setAvatar] = useState<AvatarState>(() => {
    const saved = readStoredJson<AvatarState | null>(STORAGE_KEYS.AVATAR, null);
    if (saved) {
      return {
        ...saved,
        level: Number.isFinite(saved.level) ? Math.max(1, saved.level) : 1,
        xp: Number.isFinite(saved.xp) ? Math.max(0, saved.xp) : 0,
        maxXp: Number.isFinite(saved.maxXp) && saved.maxXp > 0 ? saved.maxXp : 100,
        points: Number.isFinite(saved.points) ? Math.max(0, saved.points) : 0,
      };
    }

    return {
      level: 1,
      xp: 15,
      maxXp: 100,
      name: t("avatarName"),
      evolutionStage: t("avatarEvolutionStage"),
      points: 15
    };
  });

const [inventory, setInventory] = useState<any[]>([]);
const [objectivesHistory, setObjectivesHistory] = useState<
  { date: string; completed: number }[]
>(() => readStoredJson(STORAGE_KEYS.OBJECTIVES_HISTORY, []));
const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(() =>
  readStoredJson<WeeklyGoal | null>('confia_weekly_goal_v1', null)
);

useEffect(() => {
  if (weeklyGoal) {
    localStorage.setItem(
      'confia_weekly_goal_v1',
      JSON.stringify(weeklyGoal)
    );
  } else {
    localStorage.removeItem('confia_weekly_goal_v1');
  }
}, [weeklyGoal]);







const [objectives, setObjectives] = useState<Objective[]>(() => {
  const today = getLocalCalendarDate();
  const dailyObjectives = getDailyObjectives(new Date());
  const parsed = readStoredJson<{ date?: string; items?: Objective[] } | Objective[] | null>(
    STORAGE_KEYS.OBJECTIVES,
    null
  );

  if (parsed && !Array.isArray(parsed) && parsed.date === today && parsed.items) {
    return parsed.items.slice(0, 5).map(objective => ({ ...objective }));
  }

  return dailyObjectives;
});

const objectiveDayRef = useRef(getLocalCalendarDate());

useEffect(() => {
  const syncObjectiveDay = () => {
    const today = getLocalCalendarDate();
    if (today === objectiveDayRef.current) return;

    objectiveDayRef.current = today;
    setObjectives(getDailyObjectives(new Date()));
  };

  const intervalId = window.setInterval(syncObjectiveDay, 30_000);
  window.addEventListener("visibilitychange", syncObjectiveDay);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("visibilitychange", syncObjectiveDay);
  };
}, []);
 const completedObjectivesCount = objectives.filter(o => o.completed).length;

  const [ratings, setRatings] = useState<DailyRating[]>(() => {
      return readStoredJson<DailyRating[]>(STORAGE_KEYS.RATINGS, []);
  });

  const [personalEventRevision, setPersonalEventRevision] = useState(0);
  const [personalDiscovery, setPersonalDiscovery] = useState<PersonalInsight | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    void import("./data/personal").then(({ PERSONAL_EVENTS_UPDATED_EVENT, readPersonalEvents, buildPersonalInsights, applyInsightLifecycle }) => {
      if (cancelled) return;
      const handlePersonalEventsUpdated = () => setPersonalEventRevision(revision => revision + 1);
      window.addEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
      const insights = applyInsightLifecycle(buildPersonalInsights(readPersonalEvents(), new Date()));
      setPersonalDiscovery(insights
        .filter(insight => insight.status === "consistent" || insight.status === "possible")
        .filter(insight => insight.novelty !== "known" && insight.actionability !== "low")
        .sort((a, b) => {
          const confidence = { high: 3, moderate: 2, low: 1 };
          const actionability = { high: 3, medium: 2, low: 1 };
          return (confidence[b.confidence] * 2 + actionability[b.actionability]) - (confidence[a.confidence] * 2 + actionability[a.actionability]);
        })[0]);
      unsubscribe = () => window.removeEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
    }).catch(() => { if (!cancelled) setPersonalDiscovery(undefined); });
    return () => { cancelled = true; unsubscribe(); };
  }, [ratings, personalEventRevision]);

  const [posts, setPosts] = useState<SharePost[]>(() =>
    readStoredJson<SharePost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS)
  );

  const [currentTab, setCurrentTab] = useState<number>(0);
  useEffect(()=>recordPersonalScreenView(screenName(currentTab,homeScreen)),[currentTab,homeScreen]);
const preloadTab = (tab: number) => {
  const preload = (loader: () => Promise<unknown>, label: string) => {
    void loader().catch((error) => {
      // Prefetch é apenas uma otimização: uma falha de chunk nunca pode
      // transformar-se num erro global nem impedir a navegação normal.
      console.warn(`[Confia] prefetch_failed:${label}`, error);
    });
  };
  if (tab === 1) {
    preload(() => import("./components/HorizonExperience"), "horizon");
    preload(() => import("./components/AbracoTimer"), "abraco");
    return;
  }
  if (tab === 2) {
    preload(() => import("./components/ObjectivosList"), "objectives");
    preload(() => import("./components/WeeklyGoalSection"), "weekly-goal");
    return;
  }
  if (tab === 4) {
    preload(() => import("./components/PartilhaFeed"), "community-feed");
    preload(() => import("./components/CommunityChat"), "community-chat");
    return;
  }
};

const changeTab = (tab:number) => {
  // Primeiro mudamos o separador: a interação do utilizador nunca fica
  // à espera do carregamento de um chunk. O preload continua em background.
  setHomeScreen("home");
  setCurrentTab(tab);
  const run = () => preloadTab(tab);
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    idle(run, { timeout: 1200 });
  } else {
    window.setTimeout(run, 0);
  }
};

useEffect(() => {
  // Prefetch discreto depois da primeira pintura. Não bloqueia o caminho inicial.
  // A Comunidade fica fora deste primeiro prefetch porque Chat/Firestore são
  // recursos pesados e devem continuar a carregar sem competir com Home/Horizonte/Objetivos.
  const runPrefetch = () => {
    preloadTab(1);
    preloadTab(2);
  };
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    const id = idle(runPrefetch, { timeout: 2500 });
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const timer = window.setTimeout(runPrefetch, 1800);
  return () => window.clearTimeout(timer);
}, []);

useEffect(() => {
  // Aquecimento tardio da Comunidade: dá tempo para a app estabilizar primeiro.
  // Não altera listeners, autenticação, mensagens ou regras do chat.
  const warmCommunity = () => preloadTab(4);
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    const timer = window.setTimeout(() => idle(warmCommunity, { timeout: 4000 }), 8000);
    return () => window.clearTimeout(timer);
  }
  const timer = window.setTimeout(warmCommunity, 10000);
  return () => window.clearTimeout(timer);
}, []);
  const [triageOpen, setTriageOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
const [avatarCelebrating, setAvatarCelebrating] = useState(false);
const [avatarMemoryMessage, setAvatarMemoryMessage] = useState("");
  const [prevLevel, setPrevLevel] = useState(avatar.level);
  const [showSplash, setShowSplash] = useState(true);
const [showStopMode, setShowStopMode] = useState(false);
const [openHabitSupport, setOpenHabitSupport] = useState(false);
const [homeOverviewExpanded,setHomeOverviewExpanded]=useState(false);
useEffect(() => {
  const run = () => void import("./data/habits/sync").then(m => m.startHabitSync());
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    const id = idle(run, { timeout: 3500 });
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const timer = window.setTimeout(run, 1800);
  return () => window.clearTimeout(timer);
}, []);
const [showCommunityTerms, setShowCommunityTerms] = useState(false);
const [noticeDestination,setNoticeDestination]=useState<NoticeTarget|null>(null);
const [habitEntry,setHabitEntry]=useState({page:"home",key:0});
const [noticeMessage,setNoticeMessage]=useState("");
const [noticeMessageId,setNoticeMessageId]=useState<string|undefined>();
useEffect(() => {
  let stop = () => {};
  let cancelled = false;
  const run = () => {
    void import("./notifications/service").then(({ connectNoticeNavigation, startNativeNotices }) => {
      if (cancelled) return;
      stop = connectNoticeNavigation(setNoticeDestination);
      void startNativeNotices();
    }).catch((error) => console.error("Notificações:", error));
  };
  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    const id = idle(run, { timeout: 3000 });
    return () => {
      cancelled = true;
      (window as any).cancelIdleCallback?.(id);
      stop();
    };
  }
  const timer = window.setTimeout(run, 1500);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    stop();
  };
}, []);

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
    if(!noticeDestination)return;
    let cancelled=false;
    const target=noticeDestination;setNoticeMessage("");
    if(target.kind==="sky"){setCurrentTab(1);setHomeScreen("innerCanvas");return;}
    if(target.kind==="checkin"){setCurrentTab(0);setHomeScreen("dailyCheckIn");return;}
    if(target.kind==="habit"){const destination=habitDestination(target.action);setOpenHabitSupport(false);setHabitEntry(old=>({page:destination.page,key:old.key+1}));setCurrentTab(destination.tab);
      setHomeScreen("home");
      requestAnimationFrame(() => document.getElementById("home-habits")?.scrollIntoView({block:"start"}));return;}
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
  },[noticeDestination]);
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
  // Automatically dismiss splash screen after 2.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1600);
    return () => clearTimeout(timer);
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
const homeCompanionRelationalMemory = useMemo(() => {
  if (
    currentTab !== 0 ||
    homeScreen !== "home"
  ) {
    return null;
  }

  try {
    return collectReactiveRecentMemory();
  } catch {
    return null;
  }
}, [
  currentTab,
  homeScreen,
  ratings,
  objectives,
  weeklyGoal,
  avatar.xp,
]);


const homeNowMemory = useMemo(() => {
  if (currentTab !== 0 || homeScreen !== "home") {
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
      emitCompanionBrainEvent(
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

  if (currentTab !== 0 || homeScreen !== "home") {
    setHomeReactiveResult(null);
    return () => { cancelled = true; };
  }

  import("./data/reactive/reactiveEngine")
    .then(({ analyzeReactiveState }) => {
      if (!cancelled) {
        setHomeReactiveResult(analyzeReactiveState({ source: "general" }));
      }
    })
    .catch(() => {
      if (!cancelled) setHomeReactiveResult(null);
    });

  return () => { cancelled = true; };
}, [currentTab, homeScreen, ratings, objectives, weeklyGoal, avatar.xp]);

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

  // Analisa o contexto existente quando a Home é aberta.
  //
  // Importante:
  // - apenas lê o contexto existente;
  // - não regista uma nova resposta no histórico;
  // - não altera o reactiveEngine;
  // - respostas provocadas explicitamente pelo utilizador
  //   continuam a ser registadas em handleSaveRatings.
  useEffect(() => {
    if (currentTab !== 0 || homeScreen !== "home") return;

    if (ratings.length === 0) {
      setReactiveMessageKey(null);
      return;
    }

    import("./data/reactive/reactiveEngine")
      .then(({ analyzeReactiveState }) => {
        const reactiveResult = analyzeReactiveState({ source: "mood" });
        if (reactiveResult?.response?.translationKey) {
          setReactiveMessageKey(reactiveResult.response.translationKey);
        }
      })
      .catch(() => setReactiveMessageKey(null));

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
    localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(avatar));
    window.dispatchEvent(new CustomEvent("confia:avatar-updated"));
  }, [avatar]);

  useEffect(() => {
   localStorage.setItem(
  STORAGE_KEYS.OBJECTIVES,
  JSON.stringify({
    date: getLocalCalendarDate(),
    items: objectives
  })
);
   window.dispatchEvent(new CustomEvent("confia:objectives-updated"));
  }, [objectives]);
useEffect(() => {
localStorage.setItem(
  STORAGE_KEYS.OBJECTIVES_HISTORY,
  JSON.stringify(objectivesHistory)
);
}, [objectivesHistory]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts]);

// Escuta os chats privados deste utilizador.
// Não abre nada automaticamente aqui: apenas mantém memória
// da conversa não lida mais recente.
useEffect(() => {
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  const startUnreadChatListener = async () => {
    const [{ auth }, { db }, firestore] = await Promise.all([
      import("./firebaseAuth"),
      import("./firebaseFirestore"),
      import("firebase/firestore")
    ]);
    if (cancelled) return;

    let user = auth.currentUser;

    if (!user) {
      await new Promise<void>((resolve) => {
        const unsubscribeAuth = auth.onAuthStateChanged((authUser) => {
          unsubscribeAuth();
          resolve();
        });
      });

      user = auth.currentUser;
    }

    if (!user || cancelled) return;

    const myUid = user.uid;

    const chatsQuery = firestore.query(
      firestore.collection(db, "chats"),
      firestore.where("participants", "array-contains", myUid)
    );

    unsubscribe = firestore.onSnapshot(
      chatsQuery,
      (snapshot) => {
        if (cancelled) return;

        const unreadChats = snapshot.docs
          .map((chatDoc) => ({
            id: chatDoc.id,
            ...chatDoc.data()
          }) as {
            id: string;
            postId?: string;
            unreadBy?: string[];
            lastMessageAt?: any;
          })
          .filter((chat) =>
            Boolean(chat.postId) &&
            Array.isArray(chat.unreadBy) &&
            chat.unreadBy.includes(myUid)
          )
          .sort((a, b) => {
            const aTime =
              typeof a.lastMessageAt?.toMillis === "function"
                ? a.lastMessageAt.toMillis()
                : 0;

            const bTime =
              typeof b.lastMessageAt?.toMillis === "function"
                ? b.lastMessageAt.toMillis()
                : 0;

            return bTime - aTime;
          });

        const newest = unreadChats[0];

        if (!newest?.postId) {
          setPendingCommunityChat(null);
          return;
        }

        setPendingCommunityChat({
          id: newest.id,
          postId: newest.postId,
          lastMessageAt: newest.lastMessageAt
        });
      },
      (error) => {
        console.error(
          "Erro ao verificar mensagens da comunidade:",
          error
        );
      }
    );
  };

  startUnreadChatListener();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}, []);

useEffect(() => {
  if (currentTab !== 4) return;

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
}, [currentTab, t]);

// Ao tocar em Comunidade, se existir uma mensagem privada
// não lida, esperamos que o feed esteja disponível e abrimos
// automaticamente a publicação/conversa correspondente.
useEffect(() => {
  if (
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
    setMorningRating(loggedDay.morning);
    setAfternoonRating(loggedDay.afternoon);
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
  emitCompanionInteraction(
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
    emitCompanionBrainEvent(
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
    note: noteText.trim() || undefined
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

  setRatings(nextRatings);
  setTodayLogged(true);

  // CONFIA_COMPANION_EVENT_MOOD_SAVED
  emitCompanionBrainEvent(
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
      recordReactiveResponse({
        responseId: reactiveResult.response.id,
        situation: reactiveResult.situation,
        intent: reactiveResult.intent,
        timestamp: new Date().toISOString(),
      });
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
                recordReactiveResponse({
                  responseId: objectiveReactiveResult.response.id,
                  situation: objectiveReactiveResult.situation,
                  intent: objectiveReactiveResult.intent,
                  timestamp: new Date().toISOString(),
                });
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
    emitCompanionBrainEvent("community_posted", {
      postId: created.id,
      topic,
      feeling,
    });

    // Partilhar na comunidade = +10 XP
    addXp(10);

    // O Mar da Serenidade transforma participação real numa vantagem leve:
    // publicar na Comunidade desbloqueia uma escolha extra no próximo caminho.
    try {
      const bonusKey = "confia_horizon_bonuses_v1";
      const stored = JSON.parse(localStorage.getItem(bonusKey) || "{}");
      localStorage.setItem(
        bonusKey,
        JSON.stringify({
          extraChoices: Math.max(0, Number(stored.extraChoices) || 0) + 1,
          rerolls: Math.max(0, Number(stored.rerolls) || 0),
          hints: Math.max(0, Number(stored.hints) || 0),
        })
      );
      window.dispatchEvent(new CustomEvent("confia:community-post-created"));
    } catch {
      // A publicação nunca deve falhar por causa da camada de jogo.
    }

  } catch (error) {
    console.error("Erro ao publicar na comunidade:", error);
  }
}, [t, addXp]);

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

// Visual text helper for slider values (0-10)

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

const handleOpenProgress = useCallback(() => {
  setHomeScreen("progress");
}, []);

const handleMainNavigation = useCallback((index: number) => {
  setOpenHabitSupport(false);
  setHomeScreen("home");
  // Entrar no separador Comunidade deve mostrar primeiro o feed e o seu fundo.
  // Uma conversa por ler nunca deve abrir um modal automaticamente por cima do feed;
  // continua assinalada no ícone e pode ser aberta pelo utilizador.
  setOpenPendingChatOnCommunityEntry(false);
  setCurrentTab(index === 3 ? 0 : index);
}, []);

return (
    <div className="confia-app min-h-screen flex flex-col antialiased">

      {/* Splash Welcome Screen Overlay */}
      <AnimatePresence>
        {showSplash && (
<motion.div
  key="splash-screen"
  initial={{ opacity: 1 }}
  exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
  className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6 cursor-pointer"
  onClick={() => setShowSplash(false)}
>
  <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
className="flex items-center justify-center w-24 h-24 relative"
    >
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border-2 border-[#B85F48]/30"
      />
<img
  src="/images/confia-icon.png"
  alt="Confia"
  className="w-16 h-16 rounded-2xl shadow-md"
/>
    </motion.div>

    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="text-2xl font-black text-[#2F2926] font-display tracking-tight"
    >
      Confia
    </motion.h2>
  </div>
</motion.div>
)}
      </AnimatePresence>
      <AppHeader avatar={avatar} />

      {/* Main Content Stage */}
      <main
        className={`confia-main confia-main--tab-${currentTab === 1 ? "horizon" : currentTab === 2 ? "objectives" : currentTab === 4 ? "community" : "home"} flex-1 pb-28 px-4 sm:px-6 w-full pt-5 sm:pt-7`}
      >
{currentTab === 0 && homeScreen === "dailyCheckIn" && (
  <MorningSheet
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
  />
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


<LazySection>
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
</LazySection>


{/* O teu espaço — superfície deliberadamente simples.
    Os motores avançados continuam disponíveis contextualmente;
    não competem todos pela atenção diária. */}
{homeScreen === "home" && (
  <section className="relative overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF6F1] p-4 shadow-[0_12px_32px_rgba(92,64,52,0.055)]" aria-label={t("homeSpace.title")}>
    <div className="px-1 pb-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#934A38]">{t("homeSpace.title")}</p><p className="mt-1 text-[11px] font-semibold text-[var(--cf-muted)]">{t("homeSpace.subtitle")}</p></div>
    <button type="button" onClick={() => { emitCompanionInteraction("reflection_opened","map",{from:"home",to:"map"}); setHomeScreen("map"); }} className="mt-2 w-full rounded-[22px] border border-[#E8DDD7] bg-[#FFF9F5] px-4 py-3 text-left">
      <div className="flex items-center gap-3"><Compass size={17} className="text-[#934A38]"/><div className="flex-1"><span className="block text-xs font-black text-[#4A352F]">{t("personalMap.title")}</span><span className="mt-0.5 block text-[10px] text-[#806D65]">{t("personalMap.homeLearning")}</span></div><span className="text-[#934A38]">→</span></div>
    </button>
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
                        min="0"
                        max="10"
                        step="1"
                        value={morningRating}
                        onChange={(e) => setMorningRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#B85F48]"
                      />

                      <div className="flex justify-between text-[9px] text-[var(--cf-muted)] font-bold">
                        <span>0 · {t("difficult")}</span>
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
                        min="0"
                        max="10"
                        step="1"
                        value={afternoonRating}
                        onChange={(e) => setAfternoonRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#B85F48]"
                      />

                      <div className="flex justify-between text-[9px] text-[var(--cf-muted)] font-bold">
                        <span>0 · {t("difficult")}</span>
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
  emitCompanionInteraction(
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
<section id="home-habits" className="scroll-mt-24" aria-label={t("habitHub.title")}>
  <Suspense fallback={<p role="status">{t("loading")}</p>}>
    <MemoHabitDashboard
      embedded
      onAddXp={addXp}
      openSupport={openHabitSupport}
      initialPage={habitEntry.page}
      navigationKey={habitEntry.key}
    />
  </Suspense>
</section>

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

      <p className="mt-0.5 truncate text-[10px] font-semibold text-white/70">
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


{/* Evolução — ecrã próprio dentro do Principal */}
{currentTab === 0 && homeScreen === "progress" && (
  <div
    key="progress-screen"
    className="flex-1"
  >
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          // CONFIA_COMPANION_HOME_RETURNED_PROGRESS
          emitCompanionBrainEvent(
            "home_returned",
            {
              from: "progress",
            }
          );

          setHomeScreen("home");
        }}
        aria-label={t("back")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7]/80 bg-white text-[#934A38] shadow-sm transition-transform active:scale-95"
      >
        <ArrowLeft
          size={18}
          strokeWidth={1.9}
        />
      </button>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#934A38]">
          {t("homeProgress.eyebrow")}
        </p>

        <h2 className="text-lg font-black tracking-tight text-[#2F2926]">
          {t("homeProgress.evolutionTitle")}
        </h2>
      </div>
    </div>

    <LazySection>
      <ProgressoDashboard
        ratings={ratings}
        avatarLevel={avatar.level}
        avatarXp={avatar.xp}
        completedObjectivesCount={completedObjectivesCount}
        objectivesHistory={objectivesHistory}
      />
    </LazySection>
  </div>
)}

{/* CONFIA — QUADRO INTERIOR / 60 SEGUNDOS */}
{currentTab === 0 && homeScreen === "map" && (
  <Suspense fallback={<ScreenLoading label={t("loading")} />}><PersonalMap onBack={() => setHomeScreen("home")} /></Suspense>
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
    emitCompanionBrainEvent(
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
      emitCompanionBrainEvent(
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

      <button type="button"
        onClick={handleDeleteAccountData}
        className="w-full py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-black text-xs uppercase tracking-wide hover:bg-red-100 transition"
      >
        🗑️ {t("deleteMyData")}
      </button>
    </div>
  </div>
)}







{/* Community Guidelines Modal */}

{showCommunityTerms && (
  <div
    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5"
    onClick={() => setShowCommunityTerms(false)}
  >

    <div
      className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="flex items-center justify-between mb-5">

        <h2 className="text-xl font-black text-[#2F2926]">
          {t("communityGuidelines")}
        </h2>

        <button type="button"
          onClick={() => setShowCommunityTerms(false)}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-[var(--cf-text-soft)]"
          aria-label={t("close")}
        >
          ×
        </button>

      </div>

      <div className="text-sm text-slate-600 leading-relaxed">
        {t("communityGuidelinesDescription")}
      </div>

      <button type="button"
        onClick={() => setShowCommunityTerms(false)}
        className="w-full mt-6 py-3.5 rounded-2xl bg-[#F3E3DC] border border-[#B85F48]/30 text-[#934A38] font-black text-xs uppercase tracking-wide"
      >
        {t("close")}
      </button>

    </div>

  </div>
)}


{currentTab === 1 && homeScreen !== "innerCanvas" && (
  <EmbraceTab onOpenSky={handleOpenInnerCanvas} onAddXp={addXp} />
)}

{currentTab === 2 && (
  <ObjectivesTab
    reactiveMessageKey={reactiveMessageKey}
    objectives={objectives}
    weeklyGoal={weeklyGoal}
    onToggleComplete={handleToggleObjective}
    onAddCustomObjective={handleAddCustomObjective}
    onDeleteObjective={handleDeleteObjective}
    onCreateGoal={handleCreateWeeklyGoal}
    onCompleteDay={handleCompleteWeeklyDay}
    onShareTrophy={handleShareWeeklyTrophy}
  />
)}

{currentTab === 4 && (
  <CommunityTab
    posts={posts}
    onAddPost={handleAddPost}
    onLikePost={handleLikePost}
    onOpenChat={handleOpenChat}
    onConnectMatch={handleConnectCommunityMatch}
    onOpenMatchedChat={handleOpenMatchedChat}
    onDeletePost={handleDeletePost}
    onReportPost={handleReportPost}
    onBlockUser={handleBlockUser}
  />
)}

      </main>

      {/* Triage / Screening Help Modal */}
      <LazySection>
<TriageModal
        isOpen={triageOpen}
      onClose={() => setTriageOpen(false)}
        onAddXp={addXp}
      />
</LazySection>

      {/* Celebratory Level Up Overlay */}
      <AnimatePresence>
        {levelUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-7 text-center max-w-sm border border-[#B85F48]/20 shadow-2xl space-y-4"
            >
              <div className="w-16 h-16 bg-[#F3E3DC] rounded-full flex items-center justify-center mx-auto text-[#934A38] animate-bounce">
                <Gift size={32} />
              </div>
<div className="space-y-1.5">
<h3 className="text-xl font-black text-[#2F2926] font-display">
  {t("companionEvolution")}
</h3>

<p className="text-xs text-[var(--cf-text-soft)] leading-relaxed font-semibold">
  {t("guardianEvolution")}
</p>

<div className="py-2.5 px-4 bg-[#B85F48]/15 text-[#934A38] border border-[#B85F48]/30 rounded-2xl text-xs font-black font-display">
  {t("levelReached", { level: prevLevel })} 🎉
</div>

<p className="text-[10px] text-[var(--cf-muted)] font-extrabold font-mono uppercase tracking-wider">
  {t("extraReward")}

              </p>
</div>
              <button type="button"
            onClick={() => setLevelUpOpen(false)}
                className="w-full py-3 bg-[#B85F48] hover:bg-[#D59375] text-white shadow-lg shadow-[#B85F48]/25 font-black text-xs uppercase tracking-wider font-display rounded-xl cursor-pointer"
              >
{t("continueWalking")}
              </button>
            </motion.div>
          </div>
        )}


      </AnimatePresence>
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
      />
    </div>
  );
}


type MorningSheetProps = {
  onComplete: () => void;
  onOpenSky: () => void;
  onOpenMountain: () => void;
  onOpenSea: () => void;
  onOpenCommunity: () => void;
  onOpenChest: () => void;
};

const MorningSheet = memo(function MorningSheet({
  onComplete,
  onOpenSky,
  onOpenMountain,
  onOpenSea,
  onOpenCommunity,
  onOpenChest,
}: MorningSheetProps) {
  const { t } = useTranslation();
  const [showDestinations, setShowDestinations] = useState(false);

  const destinations = [
    {
      key: "sky",
      title: t("morningSheet.sky.title", { defaultValue: "CÉU" }),
      text: t("morningSheet.sky.text", { defaultValue: "Deslumbra a tua constelação hoje" }),
      icon: "✨",
      onClick: onOpenSky,
      className: "bg-gradient-to-br from-[#172B4D] via-[#355B78] to-[#B8CFE0]",
    },
    {
      key: "mountain",
      title: t("morningSheet.mountain.title", { defaultValue: "MONTANHA" }),
      text: t("morningSheet.mountain.text", { defaultValue: "De degrau a degrau, progride hoje" }),
      icon: "🏔️",
      onClick: onOpenMountain,
      className: "bg-gradient-to-br from-[#D9E3E5] via-[#9FAEAE] to-[#685B55]",
    },
    {
      key: "sea",
      title: t("morningSheet.sea.title", { defaultValue: "MAR" }),
      text: t("morningSheet.sea.text", { defaultValue: "Traça e descobre a rota do teu eu" }),
      icon: "🌊",
      onClick: onOpenSea,
      className: "bg-gradient-to-br from-[#A9D8DF] via-[#4D9AA7] to-[#245D70]",
    },
    {
      key: "community",
      title: t("morningSheet.community.title", { defaultValue: "COMUNIDADE" }),
      text: t("morningSheet.community.text", { defaultValue: "Humaniza os teus sentimentos" }),
      icon: "🤝",
      onClick: onOpenCommunity,
      className: "bg-gradient-to-br from-[#F3D7C8] via-[#D49D88] to-[#8E6559]",
    },
    {
      key: "chest",
      title: t("morningSheet.chest.title", { defaultValue: "COFRE · TERRA" }),
      text: t("morningSheet.chest.text", { defaultValue: "Guarda o que conquistaste e continua a caminhar" }),
      icon: "🗝️",
      onClick: onOpenChest,
      className: "bg-gradient-to-br from-[#D9C19D] via-[#9E7A51] to-[#4E3A2C]",
    },
  ];

  if (!showDestinations) {
    return (
      <div className="flex min-h-[calc(100vh-150px)] items-start justify-center">
        <div className="w-full max-w-md">
          <div className="mb-4 px-1 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#934A38]">
              {t("morningSheet.eyebrow", { defaultValue: "FOLHA DE BOM DIA" })}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2F2926]">
              {t("morningSheet.title", { defaultValue: "Como te sentes neste momento?" })}
            </h1>
            <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-semibold leading-relaxed text-[#806D65]">
              {t("morningSheet.subtitle", { defaultValue: "Começa pelo que está presente em ti. Depois, escolhe por onde queres caminhar hoje." })}
            </p>
          </div>

          <LazySection>
            <DailyCheckIn
              onComplete={() => {
                onComplete();
                setShowDestinations(true);
              }}
            />
          </LazySection>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="morning-destinations"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[calc(100vh-150px)] items-start justify-center"
    >
      <div className="w-full max-w-md">
        <div className="mb-4 px-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#934A38]">
            {t("morningSheet.eyebrow", { defaultValue: "FOLHA DE BOM DIA" })}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2F2926]">
            {t("morningSheet.portalTitle", { defaultValue: "Por onde queres começar hoje?" })}
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#806D65]">
            {t("morningSheet.portalSubtitle", { defaultValue: "Cinco caminhos. Um só dia. Escolhe o que te chama." })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {destinations.map((destination, index) => (
            <button
              key={destination.key}
              type="button"
              onClick={destination.onClick}
              className={[
                "group relative min-h-[150px] overflow-hidden rounded-[26px] border border-white/40 p-4 text-left shadow-[0_12px_28px_rgba(47,41,38,0.14)] transition-transform active:scale-[0.98]",
                destination.className,
                index === 4 ? "col-span-2 min-h-[118px]" : "",
              ].join(" ")}
            >
              <div aria-hidden="true" className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden="true" className="absolute bottom-2 right-3 text-5xl opacity-80 transition-transform duration-300 group-hover:scale-110">
                {destination.icon}
              </div>
              <div className="relative z-10 max-w-[82%]">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                  {destination.title}
                </p>
                <p className="mt-2 text-[15px] font-black leading-snug text-white drop-shadow-sm">
                  {destination.text}
                </p>
                <span className="mt-3 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-black text-white">
                  {t("morningSheet.open", { defaultValue: "Entrar →" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

type EmbraceTabProps = {
  onOpenSky: () => void;
  onAddXp: (amount: number) => void;
};

const EmbraceTab = memo(function EmbraceTab({ onOpenSky, onAddXp }: EmbraceTabProps) {
  return (
    <motion.div
      key="embrace-tab"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="confia-surface-panel">
        <LazySection>
          <HorizonExperience onOpenSky={onOpenSky} />
        </LazySection>
        <div className="mt-4">
          <AbracoTimer onAddXp={onAddXp} />
        </div>
      </div>
    </motion.div>
  );
});

type ObjectivesTabProps = {
  reactiveMessageKey: string | null;
  objectives: Objective[];
  weeklyGoal: WeeklyGoal | null;
  onToggleComplete: (id: string) => void;
  onAddCustomObjective: (text: string, category: 'corporeo' | 'mental' | 'social' | 'nutricao') => void;
  onDeleteObjective: (id: string) => void;
  onCreateGoal: (title: string) => void;
  onCompleteDay: (targetDate: string, ease: number, note: string, recovery: boolean) => void;
  onShareTrophy: () => void;
};

const ObjectivesTab = memo(function ObjectivesTab({
  reactiveMessageKey,
  objectives,
  weeklyGoal,
  onToggleComplete,
  onAddCustomObjective,
  onDeleteObjective,
  onCreateGoal,
  onCompleteDay,
  onShareTrophy,
}: ObjectivesTabProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="goals-tab"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="confia-surface-panel">
        {reactiveMessageKey && (
          <section className="mb-4 overflow-hidden rounded-[28px] border border-[#B85F48]/25 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFFDFC] shadow-[0_12px_32px_rgba(92,64,52,0.06)]">
            <div className="flex items-start gap-3.5 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#B85F48]/15 bg-white text-[#934A38] shadow-sm">
                <Sparkles size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">{t("homeNow.eyebrow")}</p>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#2F2926]">{t(reactiveMessageKey)}</p>
              </div>
            </div>
            <div aria-hidden="true" className="h-[3px] w-full bg-gradient-to-r from-[#B85F48]/10 via-[#934A38]/45 to-[#B85F48]/10" />
          </section>
        )}
        <LazySection>
          <ObjectivosList
            objectives={objectives}
            onToggleComplete={onToggleComplete}
            onAddCustomObjective={onAddCustomObjective}
            onDeleteObjective={onDeleteObjective}
          />
          <WeeklyGoalSection
            weeklyGoal={weeklyGoal}
            onCreateGoal={onCreateGoal}
            onCompleteDay={onCompleteDay}
            onShareTrophy={onShareTrophy}
          />
        </LazySection>
      </div>
    </motion.div>
  );
});

type CommunityTabProps = {
  posts: SharePost[];
  onAddPost: (
    feeling: string,
    topic: string,
    message: string,
    options?: {
      experienceTag?: string;
      supportMode?: "share" | "other_side" | "seeking_match" | "give_back";
      circleExpiresAt?: number;
    }
  ) => Promise<void>;
  onLikePost: (id: string, reaction: "yellow" | "green" | "red") => Promise<void>;
  onOpenChat: (post: SharePost) => void;
  onConnectMatch: (post: SharePost) => Promise<void>;
  onOpenMatchedChat: (post: SharePost, chatId: string) => void;
  onDeletePost: (id: string) => Promise<void>;
  onReportPost: (post: SharePost, reason: string) => Promise<void>;
  onBlockUser: (blockedUserId: string) => Promise<void>;
};

const CommunityTab = memo(function CommunityTab(props: CommunityTabProps) {
  return (
    <motion.div
      key="community-tab"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full min-w-0 overflow-x-clip"
    >
      <LazySection>
        <PartilhaFeed
          posts={props.posts}
          onAddPost={props.onAddPost}
          onLikePost={props.onLikePost}
          onOpenChat={props.onOpenChat}
          onConnectMatch={props.onConnectMatch}
          onOpenMatchedChat={props.onOpenMatchedChat}
          onDeletePost={props.onDeletePost}
          onReportPost={props.onReportPost}
          onBlockUser={props.onBlockUser}
        />
      </LazySection>
    </motion.div>
  );
});


function LazySection({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
}


function ScreenLoading({ label }: { label: string }) {
  return <div className="flex min-h-[40vh] items-center justify-center"><div role="status" aria-live="polite" className="rounded-full border border-[#E8DDD4] bg-white/90 px-4 py-2 text-xs font-bold text-[#795B50] shadow-sm">{label}</div></div>;
}
