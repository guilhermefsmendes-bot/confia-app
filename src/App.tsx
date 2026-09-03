import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence } from 'motion/react';
import {
  Heart,
  Sun,
  Compass,
  ArrowUp,
  Sparkles,
  Moon,
  Users,
  AlertCircle,
  Brain,
  CheckCircle2,
  Calendar,
  Gift,
  House,
  Wind,
  Target,
  Zap,
  ChartNoAxesCombined,
  Backpack,
  Store,
  Settings
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from "firebase/firestore";
import { db, auth, signInAnonymously } from "./firebase";
import { initAnonymousAuth } from "./firebaseAuth";
import HomeInventory from "./components/HomeInventory";
import { createWeeklyTrophy } from "./storage/weeklyTrophies";
import { deleteAllUserData } from "./storage/deleteUserData";
import { initLanguage } from "./i18n/language";
import ConfiaCompanionHome from "./components/Companheiro/ConfiaCompanionHome";
import HomeProgressSummary from "./components/HomeProgressSummary";
import HomeShop from "./components/HomeShop";
import { AvatarState, Objective, DailyRating, WeeklyGoal, SharePost } from './types';
import { INITIAL_OBJECTIVES, INITIAL_POSTS } from './data/initialData';
import PatternsNew from './components/PatternsNew/PatternsNew';
import HabitAssessment from './components/PatternsNew/HabitAssessment';
import HabitDailyCheck from './components/PatternsNew/HabitDailyCheck';
import HabitEvolution from './components/PatternsNew/HabitEvolution';
import { PartilhaFeed } from "./components/PartilhaFeed";
import {
  analyzeReactiveState,
} from "./data/reactive/reactiveEngine";
import {
  recordReactiveResponse,
} from "./data/reactive/reactiveHistoryStorage";
import {
  collectReactiveRecentMemory,
} from "./data/reactive/reactiveRecentMemory";

// Component imports
import DailyCheckIn from "./components/DailyCheckIn/DailyCheckIn";
import Companion from "./components/Companheiro/Companion";
import { hasCompletedToday } from "./storage/dailyCheckInStorage";

import { TriageModal } from './components/TriageModal';
import { AbracoTimer } from './components/AbracoTimer';
import { ObjectivosList } from './components/ObjectivosList';
import { WeeklyGoalSection } from "./components/WeeklyGoalSection";
import { ImpulsoSOS } from './components/ImpulsoSOS';
import { ProgressoDashboard } from './components/ProgressoDashboard';
import { FocoMente } from './components/FocoMente';
import { StopMode } from './components/StopMode';
import { CommunityChat } from './components/CommunityChat';
import { Avatar } from "./components/Avatar";
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
LAST_APP_OPEN_DATE: 'confia_last_app_open_date_v1',

};

// Past few days logs so the progress graph is instantly drawn on first load


// Past few days logs so the progress graph is instantly drawn on first load
const PRE_LOGGED_RATINGS: DailyRating[] = [
  { date: '2026-06-27', morning: 4, afternoon: 6, note: 'Tive picos de ansiedade de manhã, mas acalmei à tarde' },
  { date: '2026-06-28', morning: 5, afternoon: 7, note: 'Um dia estável, o passeio ajudou imenso' },
  { date: '2026-06-29', morning: 6, afternoon: 6, note: 'Senti-me bem de manhã, um pouco cansado à tarde' },
  { date: '2026-06-30', morning: 7, afternoon: 8, note: 'Senti muito progresso na respiração lenta' }
];

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

const getLocalCalendarDate = () => {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1).padStart(2, "0");

  const day =
    String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCalendarDaysDifference = (
  previousDate: string | null,
  currentDate: string
) => {
  if (!previousDate) {
    return undefined;
  }

  const previousParts =
    previousDate.split("-").map(Number);

  const currentParts =
    currentDate.split("-").map(Number);

  if (
    previousParts.length !== 3 ||
    currentParts.length !== 3 ||
    previousParts.some(Number.isNaN) ||
    currentParts.some(Number.isNaN)
  ) {
    return undefined;
  }

  const previousUtc = Date.UTC(
    previousParts[0],
    previousParts[1] - 1,
    previousParts[2]
  );

  const currentUtc = Date.UTC(
    currentParts[0],
    currentParts[1] - 1,
    currentParts[2]
  );

  const dayMs =
    24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.round(
      (currentUtc - previousUtc) / dayMs
    )
  );
};

const [dailyOpenState] = useState(() => {
  const appOpenDate =
    getLocalCalendarDate();

  const previousAppOpenDate =
    localStorage.getItem(
      STORAGE_KEYS.LAST_APP_OPEN_DATE
    );

  const isFirstAppOpenToday =
    previousAppOpenDate !== appOpenDate;

  const daysSincePreviousAppOpen =
    getCalendarDaysDifference(
      previousAppOpenDate,
      appOpenDate
    );

  return {
    appOpenDate,
    previousAppOpenDate,
    isFirstAppOpenToday,
    daysSincePreviousAppOpen,
  };
});

const {
  appOpenDate,
  previousAppOpenDate,
  isFirstAppOpenToday,
  daysSincePreviousAppOpen,
} = dailyOpenState;

/**
 * A escrita acontece depois do commit.
 *
 * O segundo getItem funciona como proteção adicional para:
 * - StrictMode;
 * - efeitos repetidos;
 * - escrita já efetuada por esta própria montagem.
 */
useEffect(() => {
  if (!isFirstAppOpenToday) {
    return;
  }

  const storedDate =
    localStorage.getItem(
      STORAGE_KEYS.LAST_APP_OPEN_DATE
    );

  if (storedDate === appOpenDate) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.LAST_APP_OPEN_DATE,
    appOpenDate
  );
}, [
  appOpenDate,
  isFirstAppOpenToday,
]);

/* CONFIA 3A — FIM DO ESTADO DIÁRIO */



 useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Erro na autenticação anónima:", error);
    });
  }, []);
const changeAppLanguage = (lang: string) => {
    localStorage.setItem("confia_language", lang);
    i18n.changeLanguage(lang);
};

useEffect(() => {
    initLanguage();
}, []);
useEffect(() => {
  initAnonymousAuth().catch((error) => {
    console.error("Firebase Auth:", error);
  });
}, []);
  // Global App States
const [patternsPage, setPatternsPage] = useState("menu");
const [homeScreen, setHomeScreen] = useState<
  "home" | "companion" | "patterns" | "shop" | "inventory" | "settings" | "progress"
>("home");
  const [avatar, setAvatar] = useState<AvatarState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVATAR);
    if (saved) return JSON.parse(saved);
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
>(() => {
  const saved = localStorage.getItem(STORAGE_KEYS.OBJECTIVES_HISTORY);
  return saved ? JSON.parse(saved) : [];
});
const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(() => {
  const saved = localStorage.getItem('confia_weekly_goal_v1');

  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
});

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
  const today = new Date().toISOString().split("T")[0];

  const saved = localStorage.getItem(STORAGE_KEYS.OBJECTIVES);

  if (saved) {
    const parsed = JSON.parse(saved);

    // Dados já guardados no novo formato diário
if (parsed.date === today && parsed.items) {
return parsed.items
  .slice(0, INITIAL_OBJECTIVES.length)
  .map((obj: Objective, index: number) => ({
    ...INITIAL_OBJECTIVES[index],
    completed: obj.completed,
    isCustom: obj.isCustom,
  }));
}

    // Compatibilidade com dados antigos (sem data)
    const oldItems = Array.isArray(parsed) ? parsed : parsed.items;

    if (oldItems) {
      return oldItems.map((obj: Objective) => ({
        ...obj,
        completed: false
      }));
    }
  }

  return INITIAL_OBJECTIVES;
});
 const completedObjectivesCount = objectives.filter(o => o.completed).length;
console.log("OBJECTIVOS:", objectives);
  const [ratings, setRatings] = useState<DailyRating[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RATINGS);
    if (saved) return JSON.parse(saved);
   return [];
  });

  const [posts, setPosts] = useState<SharePost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (saved) return JSON.parse(saved);
    return INITIAL_POSTS;
  });

  const [currentTab, setCurrentTab] = useState<number>(0);
const stopAbracoRef = useRef<(() => void) | null>(null);
const changeTab = (tab:number) => {
  // Sempre que mudamos de separador, fechamos qualquer sub-ecrã
  // aberto dentro do separador principal.
  setHomeScreen("home");
  setCurrentTab(tab);
};
  const [triageOpen, setTriageOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
const [avatarCelebrating, setAvatarCelebrating] = useState(false);
const [avatarMemoryMessage, setAvatarMemoryMessage] = useState("");
  const [prevLevel, setPrevLevel] = useState(avatar.level);
  const [showSplash, setShowSplash] = useState(true);
const [showStopMode, setShowStopMode] = useState(false);
const [showCommunityTerms, setShowCommunityTerms] = useState(false);

// Chat privado da comunidade
const [chatPost, setChatPost] = useState<SharePost | null>(null);
const [showDailyCheckIn, setShowDailyCheckIn] = useState(
  () => !hasCompletedToday()
);
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
    }, 2800);
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
const homeCompanionRelationalMemory = (() => {
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
})();


const homeNowMemory = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  try {
    const memory = collectReactiveRecentMemory();

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
})();


/**
 * CONFIA A3.2 — cérebro reativo único do Principal.
 *
 * O resultado é calculado uma vez e partilhado entre:
 * - ação inteligente;
 * - companheiro;
 * - balão;
 * - expressão visual.
 */
const homeReactiveResult = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  return analyzeReactiveState({
    source: "general",
  });
})();


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
      changeTab(3);
      return;

    case "patterns":
      setPatternsPage("menu");
      setHomeScreen("patterns");
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

    const reactiveResult = analyzeReactiveState({
      source: "mood",
    });

    if (reactiveResult?.response?.translationKey) {
      setReactiveMessageKey(
        reactiveResult.response.translationKey
      );
    }
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
    if (currentTab !== 1) return;

    const objectiveReactiveResult =
      analyzeReactiveState({
        source: "objective",
      });

    /**
     * Silêncio inteligente.
     *
     * "no_data" é uma situação válida para o motor
     * global da CONFIA, mas não representa uma
     * descoberta relevante dentro dos Objetivos.
     *
     * Portanto:
     *
     * - improving   -> mostrar
     * - declining   -> mostrar
     * - consistent  -> mostrar
     * - no_data     -> silêncio
     */
    if (
      objectiveReactiveResult.situation === "no_data"
    ) {
      setReactiveMessageKey(null);
      return;
    }

    if (
      objectiveReactiveResult?.response?.translationKey
    ) {
      setReactiveMessageKey(
        objectiveReactiveResult.response.translationKey
      );
    } else {
      setReactiveMessageKey(null);
    }
  }, [currentTab, objectivesHistory]);

const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split('T')[0]
);
  // Save states to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
   localStorage.setItem(
  STORAGE_KEYS.OBJECTIVES,
  JSON.stringify({
    date: new Date().toISOString().split("T")[0],
    items: objectives
  })
);
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

useEffect(() => {
  let unsubscribe: (() => void) | undefined;

  const startCommunityListener = async () => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const postsQuery = collection(db, "posts");

      unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
      const firestorePosts: SharePost[] = snapshot.docs
.map(doc => {
const data = doc.data();
const userId = auth.currentUser?.uid;

let userReaction: "yellow" | "green" | "red" | undefined;

if (userId) {
  if (Array.isArray(data.yellowLikedBy) && data.yellowLikedBy.includes(userId)) {
    userReaction = "yellow";
  } else if (Array.isArray(data.greenLikedBy) && data.greenLikedBy.includes(userId)) {
    userReaction = "green";
  } else if (Array.isArray(data.redLikedBy) && data.redLikedBy.includes(userId)) {
    userReaction = "red";
  }
}

return {
  id: doc.id,
  authorId: data.authorId || "",
  userName: data.userName || "Guardião Anon",
  feeling: data.feeling || "Calmo",
  message: data.message || "",
  timestamp: data.createdAt
    ? data.createdAt.toDate().toLocaleString("pt-PT")
    : t("justNow"),

  yellowLikes: data.yellowLikes || 0,
  greenLikes: data.greenLikes || 0,
  redLikes: data.redLikes || 0,

  redLikedBy: Array.isArray(data.redLikedBy)
    ? data.redLikedBy
    : [],

  userReaction
};
})
.sort((a, b) => {
const dateA = snapshot.docs.find(doc => doc.id === a.id)?.data().createdAt;
const dateB = snapshot.docs.find(doc => doc.id === b.id)?.data().createdAt;

if (!dateA || !dateB) return 0;

return dateB.toMillis() - dateA.toMillis();
});

  setPosts(firestorePosts);
    },
    (error) => {
      console.error("Erro ao ouvir comunidade:", error);
    }
  );

    } catch (error) {
      console.error("Erro ao iniciar comunidade:", error);
    }
  };

  startCommunityListener();

  return () => {
    unsubscribe?.();
  };
}, []);

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
  // Handle XP increments and level ups
  const addXp = (amount: number) => {
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
  };

const spendXp = (amount: number) => {
  setAvatar(prev => ({
    ...prev,
    xp: prev.xp - amount
  }));
};

const handleBuyItem = (item: any) => {
  setInventory(prev => [
    ...prev,
    item
  ]);
};

  // Pet Amigo (Interaction)
  const handlePetAvatar = () => {
    const todayStr = new Date().toISOString().split('T')[0];
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
  };

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

  /**
   * Analisar imediatamente o novo estado do utilizador.
   */
  const reactiveResult = analyzeReactiveState({
    source: "mood",
  });

  setReactiveMessageKey(
    reactiveResult.response.translationKey
  );

  /**
   * Esta utilização corresponde a uma resposta realmente
   * provocada por uma ação explícita do utilizador.
   */
  recordReactiveResponse({
    responseId: reactiveResult.response.id,
    situation: reactiveResult.situation,
    intent: reactiveResult.intent,
    timestamp: new Date().toISOString(),
  });
};

  // Toggle single objective completion

  const handleToggleObjective = (id: string) => {
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
            const objectiveReactiveResult =
              analyzeReactiveState({
                source: "objective",
                objectiveCompleted: true,
              });

            /**
             * A resposta imediata usa o mesmo estado
             * reativo já existente na CONFIA.
             */
            setReactiveMessageKey(
              objectiveReactiveResult.response.translationKey
            );

            /**
             * Esta resposta foi provocada por uma ação
             * explícita do utilizador, por isso entra
             * no histórico/cooldown reativo.
             */
            recordReactiveResponse({
              responseId:
                objectiveReactiveResult.response.id,
              situation:
                objectiveReactiveResult.situation,
              intent:
                objectiveReactiveResult.intent,
              timestamp: new Date().toISOString(),
            });
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
      const todayStr = new Date().toISOString().split('T')[0];

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
  };
  // Create objective

  const handleAddCustomObjective = (
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

    setObjectives(prev => [newObj, ...prev]);
  };

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

  const handleCreateWeeklyGoal = (title: string) => {
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
  };

  const handleCompleteWeeklyDay = (
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
        createWeeklyTrophy(
          prev.id,
          prev.title
        );
      }

      return {
        ...prev,
        completedDays,
        dailyCredits: nextCredits,
        dailyRatings,
        medalUnlocked
      };
    });
  };

  const handleDeleteAccountData = async () => {
    const confirmed = window.confirm(
      t("deleteDataConfirm")
    );

    if (!confirmed) return;

    try {
      await deleteAllUserData();

      alert(t("deleteDataSuccess"));

      window.location.reload();
    } catch (error) {
      console.error("Erro ao apagar os dados:", error);
      alert(t("deleteDataError"));
    }
  };


  // Delete objective
  const handleDeleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id));
  };

const handleDeleteAllUserData = async () => {
  const confirmed = window.confirm(
 t("deleteDataConfirm")
  );

  if (!confirmed) return;

  try {
    await deleteAllUserData();

    alert(t("deleteDataSuccess"));

    window.location.reload();
  } catch (error) {
    console.error("Erro ao apagar os dados:", error);
    alert(t("deleteDataError"));
  }
};
const handleDeletePost = async (id: string) => {
  try {
    await deleteDoc(doc(db, "posts", id));

    setPosts(prev =>
      prev.filter(post => post.id !== id)
    );

  } catch (error) {
    console.error("Erro ao apagar publicação:", error);
    alert("Não foi possível apagar esta publicação.");
  }
};
// Denunciar publicação
const handleReportPost = async (
  post: SharePost,
  reason: string
) => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    await addDoc(collection(db, "reports"), {
      postId: post.id,
      reportedUserId: post.authorId,
      reporterId: auth.currentUser!.uid,
      reason,
      createdAt: serverTimestamp()
    });

    alert("Obrigado. A denúncia foi enviada para análise.");

  } catch (error) {
    console.error("Erro ao denunciar publicação:", error);
    alert("Não foi possível enviar a denúncia.");
  }
};
// Bloquear utilizador
const handleBlockUser = async (blockedUserId: string) => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    if (auth.currentUser!.uid === blockedUserId) return;

    await addDoc(collection(db, "blocks"), {
      blockerId: auth.currentUser!.uid,
      blockedUserId,
      createdAt: serverTimestamp()
    });

    setPosts(prev =>
      prev.filter(post => post.authorId !== blockedUserId)
    );

    alert("Utilizador bloqueado.");

  } catch (error) {
    console.error("Erro ao bloquear utilizador:", error);
alert(t("blockError"));
  }
};
  // Create Community Post
const handleAddPost = async (feeling: string, message: string) => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const userName = `Guardião Anon_${Math.floor(100 + Math.random() * 900)}`;

    const docRef = await addDoc(collection(db, "posts"), {
      authorId: auth.currentUser!.uid,
      userName,
      feeling,
      message,
      yellowLikes: 0,
      greenLikes: 0,
      redLikes: 0,
      yellowLikedBy: [],
      greenLikedBy: [],
      redLikedBy: [],
      createdAt: serverTimestamp()
    });

const newPost: SharePost = {
  id: docRef.id,
  authorId: auth.currentUser!.uid,
  userName,
      feeling,
      message,
      timestamp: t("justNow"),
      yellowLikes: 0,
      greenLikes: 0,
      redLikes: 0,
      userReaction: undefined
    };

    setPosts(prev => [newPost, ...prev]);

    // Partilhar na comunidade = +10 XP
    addXp(10);

  } catch (error) {
    console.error("Erro ao publicar na comunidade:", error);
  }
};

  // Reações da comunidade
const handleLikePost = async (
  id: string,
  reaction: "yellow" | "green" | "red"
) => {
  try {
    const user = auth.currentUser;

    if (!user) return;

    console.log("REAÇÃO CLICADA:", id, reaction);
    console.log("UTILIZADOR:", user.uid);

    const postRef = doc(db, "posts", id);
    const post = posts.find(p => p.id === id);

    if (!post) return;

    const currentReaction = post.userReaction;

    // Se clicar novamente na mesma reação, remove-a
    if (currentReaction === reaction) {
      const field =
        reaction === "yellow"
          ? "yellowLikes"
          : reaction === "green"
          ? "greenLikes"
          : "redLikes";

      await updateDoc(postRef, {
        [field]: increment(-1),
        [`${reaction}LikedBy`]: arrayRemove(user.uid)
      });

      console.log("REAÇÃO REMOVIDA:", reaction);
      return;
    }

    // Se já tinha outra reação, removemos primeiro essa reação
    const updates: Record<string, any> = {};

    if (currentReaction === "yellow") {
      updates.yellowLikes = increment(-1);
      updates.yellowLikedBy = arrayRemove(user.uid);
    }

    if (currentReaction === "green") {
      updates.greenLikes = increment(-1);
      updates.greenLikedBy = arrayRemove(user.uid);
    }

    if (currentReaction === "red") {
      updates.redLikes = increment(-1);
      updates.redLikedBy = arrayRemove(user.uid);
    }

    // Adiciona a nova reação
    const newField =
      reaction === "yellow"
        ? "yellowLikes"
        : reaction === "green"
        ? "greenLikes"
        : "redLikes";

    updates[newField] = increment(1);
    updates[`${reaction}LikedBy`] = arrayUnion(user.uid);

    await updateDoc(postRef, updates);

    console.log("REAÇÃO ADICIONADA:", reaction);
  } catch (error) {
    console.error("Erro ao atualizar reação:", error);
  }
};

// Abre o chat privado associado a uma publicação
const handleOpenChat = (post: SharePost) => {
  setChatPost(post);
};

// Visual text helper for slider values (0-10)

const getRatingLabel = (val: number) => {
    if (val <= 2) return { text: t("moodVeryAgitated"), emoji: '🥺', color: 'text-[#C97B5E]' };
    if (val <= 4) return { text: t("moodRestless"), emoji: '😐', color: 'text-[#C97B5E]' };
    if (val <= 6) return { text: t("moodStable"), emoji: '🙂', color: 'text-[#8B5C4D]' };
    if (val <= 8) return { text: t("moodCalm"), emoji: '🌿', color: 'text-[#8B5C4D]' };
    return { text: t("moodVeryCalm"), emoji: '✨', color: 'text-[#8B5C4D]' };
  };

return (
    <div className="min-h-screen bg-[#FAF5F0] flex flex-col antialiased text-[#4E3B36]">
{showDailyCheckIn && (
  <DailyCheckIn
    onComplete={() => {
      addXp(20);
      setShowDailyCheckIn(false);
    }}
  />
)}

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
        className="absolute inset-0 rounded-full border-2 border-[#E5A88B]/30"
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
      className="text-2xl font-black text-[#4E3B36] font-display tracking-tight"
    >
      Confia
    </motion.h2>
  </div>
</motion.div>
)}
      </AnimatePresence>
  {/* App Top Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5A88B]/15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
<img
  src="/images/confia-icon.png"
  alt="Confia"
  className="w-10 h-10 rounded-2xl shadow-md"
/>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] bg-clip-text text-transparent font-display">
            Confia
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Level badge quick indicator */}
          <div className="flex items-center gap-1.5 bg-[#FFF8F4] text-[#C97B5E] px-3 py-1.5 rounded-xl border border-[#E5A88B]/20 text-xs font-bold font-mono">
            <Sparkles size={13} strokeWidth={1.9} className="text-[#E5A88B]" />
            {t("level")} {avatar.level}
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 pb-24 px-4 max-w-lg mx-auto w-full pt-4">
{currentTab === 0 && homeScreen === "home" && (
          <div
              key="main-menu"
              className="space-y-5"
            >
              {/* Interactive Amigo Panel */}
              <div className="space-y-4">


<ConfiaCompanionHome
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}
  reactiveResult={homeReactiveResult}
  relationalMemory={homeCompanionRelationalMemory}

  onCompanionAction={(target) => {
    if (target === "impulse") {
      setHomeScreen("home");
      setCurrentTab(3);
      return;
    }

    if (target === "patterns") {
      setHomeScreen("patterns");
      setCurrentTab(0);
      return;
    }

    if (target === "progress") {
      setHomeScreen("progress");
      setCurrentTab(0);
      return;
    }

    if (target === "record") {
      setHomeScreen("home");
      setCurrentTab(0);
    }
  }}
/>

{/* O teu espaço — navegação secundária premium */}
{homeScreen === "home" && (
  <section
    className="relative overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF6F1] shadow-[0_12px_32px_rgba(92,64,52,0.055)]"
    aria-label={t("homeSpace.title")}
  >
    {/* Cabeçalho */}
    <div className="relative px-5 pb-4 pt-5">
      <div
        aria-hidden="true"
        className="absolute left-5 top-0 h-px w-10 bg-[#E5A88B]/45"
      />
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
        {t("homeSpace.title")}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-400">
        {t("homeSpace.subtitle")}
      </p>
    </div>

    {/* Amigo — protagonista */}
    <div className="px-3">
      <button
        type="button"
        onClick={() => setHomeScreen("companion")}
        className="relative w-full overflow-hidden flex items-center justify-between gap-4 rounded-[24px] border border-[#E5A88B]/20 bg-gradient-to-br from-white via-white to-[#FFF3EC] px-4 py-4 text-left shadow-[0_8px_22px_rgba(92,64,52,0.055)] transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div
          aria-hidden="true"
          className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#F4D8C9]/20"
        />

        <div className="relative flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[#E5A88B]/15 bg-gradient-to-br from-[#FFF8F4] to-[#F3E2D8] shadow-[0_5px_14px_rgba(92,64,52,0.04)]">
            <Sparkles
              size={19}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
              CONFIA
            </p>

            <p className="mt-0.5 text-sm font-black text-[#4E3B36]">
              {t("companion")}
            </p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/15 bg-white/90 text-base font-light text-[#C97B5E] shadow-sm"
        >
          →
        </span>
      </button>
    </div>

    {/* Áreas do espaço */}
    <div className="mt-3 grid grid-cols-3 gap-2 px-3">
      {/* Hábitos */}
      <button
        type="button"
        onClick={() => {
          setPatternsPage("menu");
          setHomeScreen("patterns");
        }}
        className="group flex min-h-[88px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-[#E8DDD7]/60 bg-white/65 px-2 shadow-[0_5px_16px_rgba(92,64,52,0.035)] transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E5A88B]/10 bg-gradient-to-br from-[#FFF7F2] to-[#F8EAE2]">
          <ChartNoAxesCombined
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("patternsPremium.habits")}
        </span>
      </button>

      {/* Inventário */}
      <button
        type="button"
        onClick={() => setHomeScreen("inventory")}
        className="group flex min-h-[88px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-[#E8DDD7]/60 bg-white/65 px-2 shadow-[0_5px_16px_rgba(92,64,52,0.035)] transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E5A88B]/10 bg-gradient-to-br from-[#FFF7F2] to-[#F8EAE2]">
          <Backpack
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("inventory")}
        </span>
      </button>

      {/* Loja */}
      <button
        type="button"
        onClick={() => setHomeScreen("shop")}
        className="group flex min-h-[88px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-[#E8DDD7]/60 bg-white/65 px-2 shadow-[0_5px_16px_rgba(92,64,52,0.035)] transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E5A88B]/10 bg-gradient-to-br from-[#FFF7F2] to-[#F8EAE2]">
          <Store
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("shop")}
        </span>
      </button>
    </div>

    {/* Definições — utilidade secundária */}
    <div className="mx-4 mt-3 border-t border-[#E8DDD7]/55">
      <button
        type="button"
        onClick={() => setHomeScreen("settings")}
        className="flex w-full items-center justify-end gap-1.5 px-1 py-3.5 text-slate-400 transition-colors duration-200 active:text-[#C97B5E]"
      >
        <Settings
          size={13}
          strokeWidth={1.8}
        />

        <span className="text-[9px] font-bold">
          {t("settings")}
        </span>
      </button>
    </div>
  </section>
)}


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
{dailyContext &&
 dailyContext.state !== "first_contact" && (
  <section
    className="relative mt-4 overflow-hidden rounded-[30px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF8F3] via-white to-[#FFFDFB] px-5 py-4 shadow-[0_12px_32px_rgba(92,64,52,0.055)]"
    aria-label={t("dailyMoment.eyebrow")}
  >
    {/* detalhe atmosférico — CSS puro */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#F8E4D8]/35 blur-2xl"
    />

    <div
      aria-hidden="true"
      className="absolute left-0 top-5 h-14 w-[3px] rounded-r-full bg-gradient-to-b from-[#E5A88B]/70 to-[#E5A88B]/15"
    />

    <div className="relative flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white/90 shadow-sm">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {t("dailyMoment.eyebrow")}
        </p>

        <h2 className="mt-1 text-[15px] font-black leading-snug text-[#4E3B36]">
          {dailyContext.state === "return_after_absence"
            ? t("dailyMoment.return.title")
            : dailyContext.state === "first_today"
              ? t("dailyMoment.firstToday.title")
              : t("dailyMoment.continueToday.title")}
        </h2>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
          {dailyContext.state === "return_after_absence"
            ? t("dailyMoment.return.text")
            : dailyContext.state === "first_today"
              ? (
                  <>
                    {/* CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM */}
                    {dailyContext.dailyLearningLevel === "learned_impulse"
                      ? t("dailyMoment.learning.learnedImpulse")
                      : dailyContext.dailyLearningLevel === "effective_impulse"
                        ? t("dailyMoment.learning.effectiveImpulse")
                        : dailyContext.dailyLearningLevel === "repeated_signals"
                          ? t("dailyMoment.learning.repeatedSignals")
                          : dailyContext.dailyLearningLevel === "early_learning"
                            ? t("dailyMoment.learning.early")
                            : t("dailyMoment.learning.neutral")}
                  </>
                )
              : t("dailyMoment.continueToday.text")}
        </p>

        {dailyContext.state === "return_after_absence" &&
         typeof dailyContext.daysSincePreviousOpen === "number" &&
         dailyContext.daysSincePreviousOpen >= 2 && (
          <div className="mt-3 inline-flex items-center rounded-full border border-[#E5A88B]/15 bg-white/80 px-3 py-1.5">
            <span className="text-[9px] font-bold text-[#9A7567]">
              {t("dailyMoment.return.days", {
                count: dailyContext.daysSincePreviousOpen,
              })}
            </span>
          </div>
        )}

        {/* ======================================================
            CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA

            Torna visível a aprendizagem já existente.
            Não representa percentagem, ranking ou progressão
            independente.
        ====================================================== */}
        {dailyContext.dailyLearningLevel !== "none" && (
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[#E8DDD7]/45 bg-white/45 px-3.5 py-2.5">
            <div
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/20 bg-[#FFF9F5]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#C97B5E]/70" />
            </div>

            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#B79587]">
                {t("dailyMoment.evolvingInsight.eyebrow")}
              </p>

              <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-[#806D65]">
                {/* CONFIA 5E.2 — CURIOSIDADE CONCRETA */}
                {homeNowMemory?.kind === "impulseLearning" &&
                 homeNowMemory.need &&
                 homeNowMemory.needCount >= 2
                  ? t(
                      `dailyMoment.concreteInsight.impulse.${homeNowMemory.need}`
                    )
                  : homeNowMemory?.kind === "continuity" &&
                      homeNowMemory.repeatedNeed &&
                      homeNowMemory.repeatedNeedCount >= 2
                    ? t(
                        `dailyMoment.concreteInsight.impulse.${homeNowMemory.repeatedNeed}`
                      )
                    : homeNowMemory?.kind === "continuity" &&
                        homeNowMemory.repeatedCheckInNeed &&
                        homeNowMemory.repeatedCheckInNeedCount >= 2
                      ? t(
                          "dailyMoment.concreteInsight.checkIn"
                        )
                      : homeNowMemory?.kind === "continuity" &&
                          homeNowMemory.moodRecordCount >= 3 &&
                          homeNowMemory.moodDirection === "improving"
                        ? t(
                            "dailyMoment.concreteInsight.moodImproving"
                          )
                        : homeNowMemory?.kind === "continuity" &&
                            homeNowMemory.moodRecordCount >= 3 &&
                            homeNowMemory.moodDirection === "declining"
                          ? t(
                              "dailyMoment.concreteInsight.moodDeclining"
                            )
                          : homeNowMemory?.kind === "continuity" &&
                              homeNowMemory.moodRecordCount >= 3 &&
                              homeNowMemory.moodDirection === "stable"
                            ? t(
                                "dailyMoment.concreteInsight.moodStable"
                              )
                            : dailyContext.dailyLearningLevel === "learned_impulse"
                              ? t("dailyMoment.evolvingInsight.learnedImpulse")
                              : dailyContext.dailyLearningLevel === "effective_impulse"
                                ? t("dailyMoment.evolvingInsight.effectiveImpulse")
                                : dailyContext.dailyLearningLevel === "repeated_signals"
                                  ? t("dailyMoment.evolvingInsight.repeatedSignals")
                                  : t("dailyMoment.evolvingInsight.early")}
              </p>
            </div>
          </div>
        )}

        {/* ======================================================
            CONFIA 5C — CONTINUIDADE DO REGRESSO

            Reconhece continuidade temporal confirmada entre
            a abertura atual e a abertura anterior.

            Não atribui um registo específico ao dia anterior.
            Não cria streak nem recompensa.
        ====================================================== */}
        {dailyContext.state === "first_today" &&
         dailyContext.daysSincePreviousOpen === 1 && (
          <div className="mt-3 rounded-2xl border border-[#E5A88B]/15 bg-gradient-to-r from-[#FFF9F5]/80 to-white/70 px-3.5 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#C97B5E]">
              {t("dailyMoment.continuityReturn.eyebrow")}
            </p>

            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-[#806D65]">
              {dailyContext.dailyLearningLevel === "learned_impulse"
                ? t("dailyMoment.continuityReturn.learnedImpulse")
                : dailyContext.dailyLearningLevel === "effective_impulse"
                  ? t("dailyMoment.continuityReturn.effectiveImpulse")
                  : dailyContext.dailyLearningLevel === "repeated_signals"
                    ? t("dailyMoment.continuityReturn.repeatedSignals")
                    : dailyContext.dailyLearningLevel === "early_learning"
                      ? t("dailyMoment.continuityReturn.early")
                      : t("dailyMoment.continuityReturn.neutral")}
            </p>
          </div>
        )}

        {/* ======================================================
            CONFIA 5B — SEMENTE DE AMANHÃ

            Surge apenas na primeira abertura do dia.
            Cria continuidade sem promessa artificial,
            streak, recompensa ou penalização.
        ====================================================== */}
        {dailyContext.state === "first_today" && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#E8DDD7]/60 bg-white/60 px-3.5 py-3">
            <div
              aria-hidden="true"
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A66F]"
            />

            <p className="text-[10px] font-semibold leading-relaxed text-[#8A746A]">
              {dailyContext.dailyLearningLevel === "learned_impulse"
                ? t("dailyMoment.tomorrow.learnedImpulse")
                : dailyContext.dailyLearningLevel === "effective_impulse"
                  ? t("dailyMoment.tomorrow.effectiveImpulse")
                  : dailyContext.dailyLearningLevel === "repeated_signals"
                    ? t("dailyMoment.tomorrow.repeatedSignals")
                    : dailyContext.dailyLearningLevel === "early_learning"
                      ? t("dailyMoment.tomorrow.early")
                      : t("dailyMoment.tomorrow.neutral")}
            </p>
          </div>
        )}

        {dailyContext.suggestedAction &&
         homeNowAction &&
         dailyContext.suggestedAction === homeNowAction.kind && (
          <div className="mt-4 border-t border-[#E8DDD7]/60 pt-3">
            {/* CONFIA 3D — AÇÃO INTELIGENTE DO DIA */}
            <p className="text-[9px] font-bold leading-relaxed text-slate-400">
              {t("dailyMoment.actionHint")}
            </p>

            <button
              type="button"
              onClick={handleHomeNowAction}
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#E5A88B]/20 bg-white/85 px-4 py-2 text-[10px] font-black text-[#C97B5E] shadow-[0_5px_16px_rgba(92,64,52,0.045)] transition-[transform,opacity,background-color] active:scale-[0.98] active:opacity-75"
            >
              <span>
                {t(homeNowAction.actionKey)}
              </span>

              <span
                aria-hidden="true"
                className="text-sm leading-none"
              >
                →
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  </section>
)}

{homeScreen === "home" && (
  <>
  {homeNowMemory?.kind === "impulseLearning" &&
  !homeNowAction && (
  <div className="mt-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC] shadow-[0_10px_30px_rgba(92,64,52,0.06)]">
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white">
          <Sparkles
            size={18}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
            {t("impulseLearning.eyebrow")}
          </p>

          <h3 className="mt-1 text-base font-black leading-tight text-[#4E3B36]">
            {t("impulseLearning.title")}
          </h3>

          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
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
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              {t("impulseLearning.patternLabel")}
            </p>

            <p className="mt-1 text-sm font-black text-[#4E3B36]">
              {t(
                `impulsePremium.${homeNowMemory.need}Title`
              )}
            </p>
          </div>

          <div className="rounded-full bg-[#FFF3EC] px-3 py-1.5 text-[9px] font-black text-[#C97B5E]">
            {t("impulseLearning.observed", {
              count: homeNowMemory.needCount,
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-400">
        {t("impulseLearning.disclaimer")}
      </p>
    </div>
  </div>
)}

{isFirstContact && (
  <section
    className={`relative mt-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(92,64,52,0.05)] ${
      homeNowAction ? "rounded-b-[22px]" : ""
    }`}
    aria-label={t("firstContactInsight.eyebrow")}
  >
    <div
      aria-hidden="true"
      className="absolute left-0 top-6 h-12 w-[3px] rounded-r-full bg-[#E5A88B]/55"
    />

    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/15 bg-white shadow-sm">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[#C97B5E] font-display">
          {t("firstContactInsight.eyebrow")}
        </p>

        <h3 className="mt-1.5 text-sm font-black leading-snug text-[#4E3B36]">
          {t("firstContactInsight.title")}
        </h3>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t("firstContactInsight.text")}
        </p>
      </div>
    </div>
  </section>
)}

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
                <HomeProgressSummary
  onOpenProgress={() => setHomeScreen("progress")}
/>

                {/* Registo diário premium — integrado na área Hoje */}
                <section
                  id="home-daily-record"
                  className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-gradient-to-b from-white to-[#FFFDFC] shadow-[0_12px_30px_rgba(92,64,52,0.06)]"
                >

                <button
                  type="button"
                  onClick={() => setShowDayRatingPanel((current) => !current)}
                  aria-expanded={showDayRatingPanel}
                  className="w-full flex items-center justify-between gap-4 border-t border-[#E5A88B]/10 px-5 py-4 text-left transition-colors duration-200 active:bg-[#FFF9F5]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="w-11 h-11 shrink-0 rounded-2xl border border-[#E5A88B]/15 bg-gradient-to-br from-[#FFF5EF] to-[#F8EAE2] flex items-center justify-center shadow-[0_5px_14px_rgba(92,64,52,0.04)]">
                      <Calendar
                        size={19}
                        strokeWidth={1.8}
                        className="text-[#C97B5E]"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#4E3B36] font-display">
                        {t("classifyDay")}
                      </h3>

                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 font-semibold">
                        {t("wellbeingDescription")}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full border border-[#E5A88B]/15 bg-white flex items-center justify-center text-[#C97B5E] text-lg font-light shadow-sm"
                  >
                    {showDayRatingPanel ? "−" : "+"}
                  </span>
                </button>

                {showDayRatingPanel && (
                  <div className="border-t border-[#E5A88B]/10 bg-[#FFFCFA]/70 px-5 pb-5 pt-4 space-y-5">

                    {/* Data */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#4E3B36]">
                        {t("recordDate")}
                      </label>

                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] font-bold text-[#4E3B36]"
                      />
                    </div>

                    {/* Manhã */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#C97B5E]">
                          <Sun size={15} strokeWidth={1.8} />
                          {t("morning")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#4E3B36]">
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
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                      />

                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>0 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Tarde */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#C97B5E]">
                          <Moon size={15} strokeWidth={1.8} />
                          {t("afternoon")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#4E3B36]">
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
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                      />

                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>0 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Nota opcional */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#4E3B36]">
                        {t("dailyNote")}
                      </label>

                      <input
                        type="text"
                        placeholder={t("dailyNotePlaceholder")}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        maxLength={100}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] font-bold text-[#4E3B36]"
                      />
                    </div>

                    {/* Guardar */}
                    <button
                      onClick={handleSaveRatings}
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
        onClick={() => setHomeScreen("home")}
        aria-label={t("back")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7]/80 bg-white text-[#C97B5E] shadow-sm transition-transform active:scale-95"
      >
        <ArrowLeft
          size={18}
          strokeWidth={1.9}
        />
      </button>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
          {t("homeProgress.eyebrow")}
        </p>

        <h2 className="text-lg font-black tracking-tight text-[#4E3B36]">
          {t("homeProgress.evolutionTitle")}
        </h2>
      </div>
    </div>

    <ProgressoDashboard
      ratings={ratings}
      avatarLevel={avatar.level}
      avatarXp={avatar.xp}
      completedObjectivesCount={completedObjectivesCount}
      objectivesHistory={objectivesHistory}
    />
  </div>
)}

{/* Padrões — ecrã próprio dentro do Principal */}
{currentTab === 0 && homeScreen === "patterns" && (
  <>
    {patternsPage === "menu" && (
      <PatternsNew
        onBack={() => {
          setPatternsPage("menu");
          setHomeScreen("home");
        }}
        onOpenAssessment={() => setPatternsPage("assessment")}
        onOpenDaily={() => setPatternsPage("daily")}
        onOpenEvolution={() => setPatternsPage("evolution")}
      />
    )}

    {patternsPage === "assessment" && (
      <HabitAssessment
        onBack={() => setPatternsPage("menu")}
      />
    )}

    {patternsPage === "daily" && (
      <HabitDailyCheck
        onBack={() => setPatternsPage("menu")}
      />
    )}

    {patternsPage === "evolution" && (
      <HabitEvolution
        onBack={() => setPatternsPage("menu")}
      />
    )}
  </>
)}

{currentTab === 0 && homeScreen === "companion" && (
  <div
    key="companion-screen"
    className="flex-1 px-4 pt-4"
  >
    <div className="max-w-md mx-auto">

      <button
        onClick={() => setHomeScreen("home")}
        className="mb-4 text-xs font-bold text-[#C97B5E]"
      >
        ← {t("back")}
      </button>

      <Companion
        avatarLevel={avatar.level}
        avatarXp={avatar.xp}
      />

    </div>
  </div>
)}

{currentTab === 0 && homeScreen === "shop" && (
<HomeShop
  onBack={() => setHomeScreen("home")}
  xp={avatar.xp}
  companionLevel={avatar.level}
  spendXp={spendXp}
/>
)}
{currentTab === 0 && homeScreen === "inventory" && (
  <HomeInventory
    onBack={() => setHomeScreen("home")}
    companionLevel={avatar.level}
  />
)}
{currentTab === 0 && homeScreen === "settings" && (
  <div
    key="settings-screen"
    className="space-y-5"
  >
    <div className="flex items-center gap-3">
      <button
        onClick={() => setHomeScreen("home")}
        className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-lg"
      >
        ←
      </button>

      <h2 className="text-xl font-black text-[#4E3B36]">
        {t("settings")}
      </h2>
    </div>

{/* Idioma */}
  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">
    <h3 className="text-sm font-black text-[#4E3B36] mb-1">
      {t("language")}
    </h3>

    <p className="text-xs text-slate-500 leading-relaxed mb-4">
      {t("chooseLanguage")}
    </p>

    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => changeAppLanguage("pt")}
        className="py-3 rounded-2xl border border-[#E5A88B]/30 bg-[#FFF0E8] text-[#C97B5E] font-black text-xs"
      >
        🇵🇹 Português
      </button>

      <button
        onClick={() => changeAppLanguage("en")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇬🇧 English
      </button>

      <button
        onClick={() => changeAppLanguage("es")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇪🇸 Español
      </button>

      <button
        onClick={() => changeAppLanguage("fr")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇫🇷 Français
      </button>
    </div>
  </div>

<div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">



<h3 className="text-sm font-black text-[#4E3B36] mb-1">
    {t("communityTerms")}
  </h3>

  <p className="text-xs text-slate-500 leading-relaxed mb-4">
    {t("communityGuidelinesShort")}
  </p>

  <button
    onClick={() => setShowCommunityTerms(true)}
    className="w-full py-3.5 rounded-2xl bg-[#FFF0E8] border border-[#E5A88B]/30 text-[#C97B5E] font-black text-xs uppercase tracking-wide"
  >
    {t("communityTermsButton")}
  </button>

</div>
    <div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#4E3B36] mb-1">
        {t("deleteMyData")}
      </h3>

      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        {t("deleteMyDataDescription")}
      </p>

      <button
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

        <h2 className="text-xl font-black text-[#4E3B36]">
          {t("communityGuidelines")}
        </h2>

        <button
          onClick={() => setShowCommunityTerms(false)}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500"
          aria-label={t("close")}
        >
          ×
        </button>

      </div>

      <div className="text-sm text-slate-600 leading-relaxed">
        {t("communityGuidelinesDescription")}
      </div>

      <button
        onClick={() => setShowCommunityTerms(false)}
        className="w-full mt-6 py-3.5 rounded-2xl bg-[#FFF0E8] border border-[#E5A88B]/30 text-[#C97B5E] font-black text-xs uppercase tracking-wide"
      >
        {t("close")}
      </button>

    </div>

  </div>
)}


{currentTab === 1 && (
            /* TAB 2: ABRAÇO (TIMER DE RESPIRAÇÃO) */
            <motion.div
              key="embrace-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white border border-slate-100/80 rounded-[32px] p-6 shadow-sm">
<AbracoTimer
  onAddXp={addXp}
  onRegisterStop={(fn) => {
    stopAbracoRef.current = fn;
  }}
/>
              </div>
            </motion.div>
          )}

          {currentTab === 2 && (
            /* TAB 3: OBJECTIVOS */
            <motion.div
              key="goals-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white border border-slate-100/80 rounded-[32px] p-6 shadow-sm">
                {currentTab === 1 && reactiveMessageKey && (
                  <section
                    className="mb-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFFDFC] shadow-[0_12px_32px_rgba(92,64,52,0.06)]"
                  >
                    <div className="flex items-start gap-3.5 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/15 bg-white text-[#C97B5E] shadow-sm">
                        <Sparkles
                          size={18}
                          strokeWidth={1.8}
                        />
                      </div>
                
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
                          {t("homeNow.eyebrow")}
                        </p>
                
                        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
                          {t(reactiveMessageKey)}
                        </p>
                      </div>
                    </div>
                
                    <div
                      aria-hidden="true"
                      className="h-[3px] w-full bg-gradient-to-r from-[#E5A88B]/10 via-[#C97B5E]/45 to-[#E5A88B]/10"
                    />
                  </section>
                )}

                <ObjectivosList
                  objectives={objectives}
                  onToggleComplete={handleToggleObjective}
                  onAddCustomObjective={handleAddCustomObjective}
                  onDeleteObjective={handleDeleteObjective}
                />

                <WeeklyGoalSection
                  weeklyGoal={weeklyGoal}
                  onCreateGoal={handleCreateWeeklyGoal}
                  onCompleteDay={handleCompleteWeeklyDay}
                />
              </div>
            </motion.div>
          )}

{currentTab === 3 && (
  /* TAB 4: IMPULSO — intervenção imediata / SOS */
  <motion.div
    key="impulso-tab"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <ImpulsoSOS onAddXp={addXp} />
  </motion.div>
)}

          {currentTab === 4 && (
            /* TAB 5: COMUNIDADE */
            <motion.div
              key="community-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PartilhaFeed
                posts={posts}
                onAddPost={handleAddPost}
                onLikePost={handleLikePost}
                onOpenChat={handleOpenChat}
                onDeletePost={handleDeletePost}
                onReportPost={handleReportPost}
                onBlockUser={handleBlockUser}
              />
            </motion.div>
          )}

      </main>

      {/* Triage / Screening Help Modal */}
      <TriageModal
        isOpen={triageOpen}
      onClose={() => setTriageOpen(false)}
        onAddXp={addXp}
      />

      {/* Celebratory Level Up Overlay */}
      <AnimatePresence>
        {levelUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-7 text-center max-w-sm border border-[#E5A88B]/20 shadow-2xl space-y-4"
            >
              <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mx-auto text-[#C97B5E] animate-bounce">
                <Gift size={32} />
              </div>
<div className="space-y-1.5">
<h3 className="text-xl font-black text-[#4E3B36] font-display">
  {t("companionEvolution")}
</h3>

<p className="text-xs text-slate-500 leading-relaxed font-semibold">
  {t("guardianEvolution")}
</p>

<div className="py-2.5 px-4 bg-[#E5A88B]/15 text-[#C97B5E] border border-[#E5A88B]/30 rounded-2xl text-xs font-black font-display">
  {t("levelReached", { level: prevLevel })} 🎉
</div>

<p className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">
  {t("extraReward")}

              </p>
</div>
              <button
            onClick={() => setLevelUpOpen(false)}
                className="w-full py-3 bg-[#E5A88B] hover:bg-[#D59375] text-white shadow-lg shadow-[#E5A88B]/25 font-black text-xs uppercase tracking-wider font-display rounded-xl cursor-pointer"
              >
{t("continueWalking")}
              </button>
            </motion.div>
          </div>
        )}


      </AnimatePresence>
      {showStopMode && (
        <StopMode
          onStartImpulse={() => {
            setShowStopMode(false);
            setCurrentTab(3);
          }}
        />
      )}
      {chatPost && (
        <CommunityChat
          post={chatPost}
          onClose={() => setChatPost(null)}
        />
      )}

      {/* Global Tab Navigation Footer */}
      {/* Global Tab Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5A88B]/15 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {[
           { label: t("home"), icon: House, index: 0 },
           { label: t("hug"), icon: Wind, index: 1 },
           { label: t("objectives"), icon: Target, index: 2 },
           { label: t("impulse"), icon: Zap, index: 3 },
           { label: t("community"), icon: Users, index: 4 }
          ].map(tab => {
            const TabIcon = tab.icon;

            return (
            <button
              key={tab.index}
onClick={() => {
  window.dispatchEvent(new Event("stop-background-audio"));
  setHomeScreen("home");
  setCurrentTab(tab.index);
}}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative cursor-pointer ${
                currentTab === tab.index ? 'text-[#C97B5E] font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {currentTab === tab.index && (
                <motion.div
                  layoutId="active-bar"
                  className="absolute -top-3 w-10 h-1 rounded-full bg-[#E5A88B]"
                />
              )}

              <TabIcon
                size={20}
                strokeWidth={currentTab === tab.index ? 2.4 : 1.9}
                className="mb-1 transition-all duration-300"
              />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
