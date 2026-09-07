/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 13 — SIMULAÇÃO FINAL
 * ============================================================
 *
 * TESTE FINAL DE ACEITAÇÃO DO COMPANION BRAIN.
 *
 * Não altera regras.
 * Não grava dados reais.
 * Não altera a aplicação.
 *
 * Objetivo:
 *
 * - testar decisões finais do Brain
 * - testar composição emocional
 * - testar Humor
 * - testar Impulso
 * - testar origem temporal real
 * - testar conflito entre candidatos
 * - testar silêncio
 *
 * Execução:
 *
 * npx tsx src/data/reactive/companionBrain/companionBrainManualTest.ts
 */


/**
 * ------------------------------------------------------------
 * localStorage temporário para ambiente Node.
 * ------------------------------------------------------------
 *
 * O Brain foi criado para browser.
 *
 * O simulador instala uma memória isolada para que os módulos
 * possam correr através de tsx sem tocar nos dados reais
 * da aplicação.
 */

class TestLocalStorage {
  private data =
    new Map<string, string>();

  getItem(
    key: string
  ): string | null {
    return (
      this.data.get(key) ??
      null
    );
  }

  setItem(
    key: string,
    value: string
  ): void {
    this.data.set(
      key,
      String(value)
    );
  }

  removeItem(
    key: string
  ): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  key(
    index: number
  ): string | null {
    return (
      Array.from(
        this.data.keys()
      )[index] ??
      null
    );
  }

  get length(): number {
    return this.data.size;
  }
}


const testStorage =
  new TestLocalStorage();

(globalThis as any).window = {
  localStorage: testStorage,
};


type ExpectedResult = {
  id?: string;
  category?: string;
  silence?: boolean;
};


type SimulationScenario = {
  name: string;
  description: string;

  hour: number;
  minute?: number;

  morningCompleted: boolean;
  afternoonCompleted: boolean;

  morningRating?: number;
  afternoonRating?: number;

  recentImpulse?: boolean;

  sessionActivityCount?: number;

  moodSavedMinutesAgo?: number;
  impulseMinutesAgo?: number;

  expected: ExpectedResult;
};


function makeDate(
  hour: number,
  minute = 0
): Date {
  const now =
    new Date();

  now.setHours(
    hour,
    minute,
    0,
    0
  );

  return now;
}


function isoMinutesAgo(
  now: Date,
  minutes: number
): string {
  return new Date(
    now.getTime() -
      minutes *
        60 *
        1000
  ).toISOString();
}


function eventId(
  prefix: string,
  index: number
): string {
  return [
    "fase13",
    prefix,
    index,
  ].join("_");
}


/**
 * ============================================================
 * MEMÓRIA LONGITUDINAL NEUTRA
 * ============================================================
 *
 * A Fase 13 está a testar comportamento diário/temporal,
 * não padrões históricos.
 *
 * O Brain real recebe sempre longitudinalMood através do App.
 * No simulador fornecemos explicitamente um estado
 * "insufficient" para não ativar regras históricas.
 */
const neutralLongitudinalMood: any = {
  trend: "insufficient",

  daysAnalyzed: 0,
  ratingDays: 0,

  averageMorning: null,
  averageAfternoon: null,

  recoveryDays: 0,
  harderDays: 0,

  lowMorningCount: 0,

  repeatedLowMornings: false,
  repeatedRecoveries: false,

  lowMorningRelevance:
    "insufficient",

  recoveryRelevance:
    "insufficient",

  hasEnoughData: false,
};


/**
 * Memória longitudinal do Impulso também neutra.
 *
 * Não queremos que os cenários da Fase 13 sejam contaminados
 * por padrões históricos que não fazem parte do caso testado.
 */
const neutralLongitudinalImpulse: any = {
  episodeCount: 0,
  measurableEpisodeCount: 0,

  effectiveEpisodeCount: 0,
  partialEpisodeCount: 0,

  averageReduction: null,

  repeatedNeed: false,
  repeatedUse: false,
  repeatedEffectiveness: false,
  repeatedEffectiveNeed: false,

  effectiveNeed: undefined,
  effectiveNeedCount: 0,

  hasEnoughData: false,
};


const scenarios: SimulationScenario[] = [

  /**
   * ==========================================================
   * 1 — RECUPERAÇÃO
   * ==========================================================
   */
  {
    name:
      "RECUPERAÇÃO CLARA — 3 → 6",

    description:
      "Manhã difícil seguida de melhoria clara durante o dia.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 3,
    afternoonRating: 6,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "low_morning_recovered",
    },
  },


  /**
   * ==========================================================
   * 2 — AGRAVAMENTO
   * ==========================================================
   */
  {
    name:
      "AGRAVAMENTO CLARO — 7 → 4",

    description:
      "O utilizador começou bem e terminou significativamente pior.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 7,
    afternoonRating: 4,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "day_became_harder",
    },
  },


  /**
   * ==========================================================
   * 3 — DIA ESTÁVEL
   * ==========================================================
   */
  {
    name:
      "DIA ESTÁVEL — 6 → 6",

    description:
      "Dois registos positivos e sem oscilação emocional relevante.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 6,
    afternoonRating: 6,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "stable_day_observation",
    },
  },


  /**
   * ==========================================================
   * 4 — DIA BAIXO
   * ==========================================================
   */
  {
    name:
      "DIA BAIXO — 2 → 2",

    description:
      "O dia começa baixo e continua baixo.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 2,
    afternoonRating: 2,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "morning_low_followup",
    },
  },


  /**
   * ==========================================================
   * 5 — IMPULSO RECENTE
   * ==========================================================
   */
  {
    name:
      "IMPULSO RECENTE",

    description:
      "Existe um Impulso acabado de concluir num dia emocionalmente estável.",

    hour: 16,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 5,
    afternoonRating: 5,

    recentImpulse: true,

    moodSavedMinutesAgo: 10,
    impulseMinutesAgo: 2,

    expected: {
      id:
        "recent_impulse_followup",
    },
  },


  /**
   * ==========================================================
   * 6 — IMPULSO + AGRAVAMENTO
   * ==========================================================
   */
  {
    name:
      "IMPULSO + QUEDA DE HUMOR",

    description:
      "Um Impulso recente coexistiu com uma queda clara do humor.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 7,
    afternoonRating: 3,

    recentImpulse: true,

    moodSavedMinutesAgo: 1,
    impulseMinutesAgo: 8,

    expected: {
      id:
        "impulse_and_mood_decline",
    },
  },


  /**
   * ==========================================================
   * 7 — DUAS ORIGENS MUITO RECENTES
   * ==========================================================
   */
  {
    name:
      "COMPOSTO — DUAS ORIGENS MUITO RECENTES",

    description:
      "Humor e Impulso são ambos acontecimentos muito recentes.",

    hour: 19,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 8,
    afternoonRating: 4,

    recentImpulse: true,

    moodSavedMinutesAgo: 2,
    impulseMinutesAgo: 3,

    expected: {
      id:
        "impulse_and_mood_decline",
    },
  },


  /**
   * ==========================================================
   * 8 — IMPULSO MAIS ANTIGO MAS AINDA RECENTE
   * ==========================================================
   */
  {
    name:
      "COMPOSTO — IMPULSO COM 25 MINUTOS",

    description:
      "O Impulso ainda pertence à janela contextual de 30 minutos.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 7,
    afternoonRating: 3,

    recentImpulse: true,

    moodSavedMinutesAgo: 1,
    impulseMinutesAgo: 25,

    expected: {
      id:
        "impulse_and_mood_decline",
    },
  },


  /**
   * ==========================================================
   * 9 — IMPULSO EXPIRADO
   * ==========================================================
   */
  {
    name:
      "IMPULSO FORA DA JANELA — 31 MINUTOS",

    description:
      "O episódio já não deve participar na composição atual.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 7,
    afternoonRating: 3,

    recentImpulse: false,

    moodSavedMinutesAgo: 1,
    impulseMinutesAgo: 31,

    expected: {
      id:
        "day_became_harder",
    },
  },


  /**
   * ==========================================================
   * 10 — RECUPERAÇÃO + IMPULSO
   * ==========================================================
   */
  {
    name:
      "RECUPERAÇÃO + IMPULSO RECENTE",

    description:
      "Existe recuperação emocional mas também um Impulso acabado de usar.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 3,
    afternoonRating: 6,

    recentImpulse: true,

    moodSavedMinutesAgo: 2,
    impulseMinutesAgo: 2,

    /**
     * O follow-up do Impulso tem forte relevância presente.
     * Este cenário verifica a arbitragem real do ranking.
     */
    expected: {
      category:
        "impulse_followup",
    },
  },


  /**
   * ==========================================================
   * 11 — AGRAVAMENTO FORTE
   * ==========================================================
   */
  {
    name:
      "QUEDA FORTE — 9 → 3",

    description:
      "Grande alteração negativa no mesmo dia sem Impulso recente.",

    hour: 20,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 9,
    afternoonRating: 3,

    moodSavedMinutesAgo: 3,

    expected: {
      id:
        "day_became_harder",
    },
  },


  /**
   * ==========================================================
   * 12 — RECUPERAÇÃO FORTE
   * ==========================================================
   */
  {
    name:
      "RECUPERAÇÃO FORTE — 2 → 8",

    description:
      "Uma manhã muito baixa seguida de recuperação clara.",

    hour: 19,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 2,
    afternoonRating: 8,

    moodSavedMinutesAgo: 2,

    expected: {
      id:
        "low_morning_recovered",
    },
  },


  /**
   * ==========================================================
   * 13 — VARIAÇÃO PEQUENA POSITIVA
   * ==========================================================
   */
  {
    name:
      "VARIAÇÃO PEQUENA — 6 → 7",

    description:
      "A diferença não deve ser tratada como uma mudança emocional forte.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 6,
    afternoonRating: 7,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "stable_day_observation",
    },
  },


  /**
   * ==========================================================
   * 14 — VARIAÇÃO PEQUENA NEGATIVA
   * ==========================================================
   */
  {
    name:
      "VARIAÇÃO PEQUENA — 7 → 6",

    description:
      "Pequena descida mas ainda num dia relativamente estável.",

    hour: 18,

    morningCompleted: true,
    afternoonCompleted: true,

    morningRating: 7,
    afternoonRating: 6,

    moodSavedMinutesAgo: 1,

    expected: {
      id:
        "stable_day_observation",
    },
  },


  /**
   * ==========================================================
   * 15 — SILÊNCIO
   * ==========================================================
   */
  {
    name:
      "SILÊNCIO — SEM CONTEXTO RELEVANTE",

    description:
      "Fim do dia sem registos nem acontecimento recente.",

    hour: 23,

    morningCompleted: false,
    afternoonCompleted: false,

    recentImpulse: false,

    expected: {
      silence: true,
    },
  },
];


async function run(): Promise<void> {

  /**
   * Importamos depois de criar window/localStorage.
   */
  const {
    buildCompanionBrainContext,
    evaluateCompanionContext,
  } = await import(
    "./index"
  );


  console.log("");
  console.log(
    "======================================================================"
  );
  console.log(
    "CONFIA — COMPANION VIVO — FASE 13"
  );
  console.log(
    "SIMULAÇÃO FINAL DO CÉREBRO"
  );
  console.log(
    "======================================================================"
  );


  let passed = 0;
  let failed = 0;


  const failures: Array<{
    name: string;
    expected: string;
    actual: string;
  }> = [];


  for (
    let index = 0;
    index < scenarios.length;
    index += 1
  ) {

    /**
     * Cada cenário começa isolado.
     *
     * Não queremos que cooldowns de um teste contaminem
     * outro teste independente.
     */
    testStorage.clear();


    const scenario =
      scenarios[index];

    const now =
      makeDate(
        scenario.hour,
        scenario.minute ?? 0
      );


    const recentEvents: any[] =
      [];


    /**
     * mood_saved REAL.
     *
     * Só é criado quando o cenário pede explicitamente
     * um registo recente.
     */
    if (
      typeof scenario.moodSavedMinutesAgo ===
        "number" &&
      typeof scenario.morningRating ===
        "number" &&
      typeof scenario.afternoonRating ===
        "number"
    ) {
      recentEvents.push({
        id:
          eventId(
            "mood",
            index
          ),

        type:
          "mood_saved",

        timestamp:
          isoMinutesAgo(
            now,
            scenario.moodSavedMinutesAgo
          ),

        metadata: {
          morningRating:
            scenario.morningRating,

          afternoonRating:
            scenario.afternoonRating,

          hasNote: false,

          wasExistingRecord: false,
        },
      });
    }


    /**
     * impulse_completed REAL.
     */
    if (
      typeof scenario.impulseMinutesAgo ===
        "number"
    ) {
      recentEvents.push({
        id:
          eventId(
            "impulse",
            index
          ),

        type:
          "impulse_completed",

        timestamp:
          isoMinutesAgo(
            now,
            scenario.impulseMinutesAgo
          ),

        metadata: {},
      });
    }


    /**
     * Igual à arquitetura real do App:
     *
     * recentEvents contém apenas a janela comportamental
     * considerada atual.
     *
     * Eventos com mais de 30 minutos ficam de fora.
     */
    const contextRecentEvents =
      recentEvents.filter(
        event => {
          const age =
            now.getTime() -
            new Date(
              event.timestamp
            ).getTime();

          return (
            age <=
            30 *
              60 *
              1000
          );
        }
      );


    const context =
      buildCompanionBrainContext({
        now,

        currentTab: 0,
        homeScreen: "home",

        morningCompleted:
          scenario.morningCompleted,

        afternoonCompleted:
          scenario.afternoonCompleted,

        morningRating:
          scenario.morningRating,

        afternoonRating:
          scenario.afternoonRating,

        recentImpulse:
          scenario.recentImpulse ??
          false,

        sessionActivityCount:
          scenario.sessionActivityCount ??
          0,

        recentEvents:
          contextRecentEvents,

        /**
         * O App real fornece estas memórias.
         *
         * Para a simulação diária usamos versões neutras,
         * impedindo padrões históricos artificiais.
         */
        longitudinalMood:
          neutralLongitudinalMood,

        longitudinalImpulse:
          neutralLongitudinalImpulse,
      });


    const decision =
      evaluateCompanionContext(
        context
      );


    const actualId =
      decision?.candidate.id;

    const actualCategory =
      decision?.candidate.category;


    let ok = false;


    if (
      scenario.expected.silence
    ) {
      ok =
        decision === null;
    } else if (
      scenario.expected.id
    ) {
      ok =
        actualId ===
        scenario.expected.id;
    } else if (
      scenario.expected.category
    ) {
      ok =
        actualCategory ===
        scenario.expected.category;
    }


    if (ok) {
      passed += 1;
    } else {
      failed += 1;

      failures.push({
        name:
          scenario.name,

        expected:
          scenario.expected.silence
            ? "SILÊNCIO"
            : scenario.expected.id ??
              `categoria:${scenario.expected.category}`,

        actual:
          decision
            ? `${actualId} [${actualCategory}]`
            : "SILÊNCIO",
      });
    }


    console.log("");
    console.log(
      "----------------------------------------------------------------------"
    );

    console.log(
      `${index + 1}. ${scenario.name}`
    );

    console.log(
      "----------------------------------------------------------------------"
    );

    console.log(
      scenario.description
    );

    console.log("");

    console.log(
      "CONTEXTO:"
    );

    console.log(
      `  Hora: ${String(
        scenario.hour
      ).padStart(2, "0")}:${String(
        scenario.minute ?? 0
      ).padStart(2, "0")}`
    );

    console.log(
      `  Manhã: ${
        scenario.morningCompleted
          ? scenario.morningRating
          : "não registada"
      }`
    );

    console.log(
      `  Tarde: ${
        scenario.afternoonCompleted
          ? scenario.afternoonRating
          : "não registada"
      }`
    );

    console.log(
      `  Impulso recente: ${
        scenario.recentImpulse
          ? "sim"
          : "não"
      }`
    );

    if (
      typeof scenario.moodSavedMinutesAgo ===
        "number"
    ) {
      console.log(
        `  mood_saved: ${
          scenario.moodSavedMinutesAgo
        } min atrás`
      );
    }

    if (
      typeof scenario.impulseMinutesAgo ===
        "number"
    ) {
      console.log(
        `  impulse_completed: ${
          scenario.impulseMinutesAgo
        } min atrás`
      );
    }


    console.log("");
    console.log(
      "ESPERADO:"
    );

    if (
      scenario.expected.silence
    ) {
      console.log(
        "  SILÊNCIO"
      );
    } else if (
      scenario.expected.id
    ) {
      console.log(
        `  ${scenario.expected.id}`
      );
    } else {
      console.log(
        `  categoria: ${scenario.expected.category}`
      );
    }


    console.log("");
    console.log(
      "DECISÃO REAL:"
    );

    if (!decision) {
      console.log(
        "  SILÊNCIO"
      );
    } else {
      console.log(
        `  ID: ${decision.candidate.id}`
      );

      console.log(
        `  Categoria: ${decision.candidate.category}`
      );

      console.log(
        `  Prioridade: ${decision.candidate.priority}`
      );

      console.log(
        `  Emoção: ${decision.candidate.emotion}`
      );

      console.log(
        `  Razão: ${decision.candidate.reason}`
      );

      if (
        decision.candidate.expiresAt
      ) {
        console.log(
          `  Expira: ${decision.candidate.expiresAt}`
        );
      }
    }


    console.log("");
    console.log(
      ok
        ? "RESULTADO: PASS ✓"
        : "RESULTADO: FAIL ✗"
    );
  }


  const total =
    scenarios.length;

  const percentage =
    total > 0
      ? Math.round(
          passed /
            total *
            100
        )
      : 0;


  console.log("");
  console.log(
    "======================================================================"
  );
  console.log(
    "RESULTADO FINAL"
  );
  console.log(
    "======================================================================"
  );

  console.log(
    `Cenários: ${total}`
  );

  console.log(
    `PASS:     ${passed}`
  );

  console.log(
    `FAIL:     ${failed}`
  );

  console.log(
    `Sucesso:  ${percentage}%`
  );


  if (
    failures.length > 0
  ) {
    console.log("");
    console.log(
      "--------------------------------------------------------------------"
    );
    console.log(
      "CENÁRIOS A REVER"
    );
    console.log(
      "--------------------------------------------------------------------"
    );

    for (
      const failure of failures
    ) {
      console.log("");
      console.log(
        failure.name
      );

      console.log(
        `  Esperado: ${failure.expected}`
      );

      console.log(
        `  Real:     ${failure.actual}`
      );
    }
  }


  console.log("");
  console.log(
    "======================================================================"
  );

  if (
    failed === 0
  ) {
    console.log(
      "VEREDITO: COMPANION BRAIN APROVADO ✓"
    );

    console.log(
      "Todos os cenários centrais tiveram o comportamento esperado."
    );
  } else {
    console.log(
      "VEREDITO: EXISTEM COMPORTAMENTOS A ANALISAR"
    );

    console.log(
      "Não alterar regras automaticamente."
    );

    console.log(
      "Primeiro analisar cada FAIL e decidir se o problema está"
    );

    console.log(
      "no Brain ou na expectativa do teste."
    );
  }

  console.log(
    "======================================================================"
  );
  console.log("");
}


run().catch(
  error => {
    console.error("");
    console.error(
      "ERRO NA SIMULAÇÃO FINAL:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
