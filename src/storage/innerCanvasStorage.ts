import type {
  EmotionalAnswers,
} from "../components/InnerCanvas/innerCanvasEngine";

const STORAGE_KEY =
  "confia_inner_canvas_gallery_v1";

export type InnerCanvasTier =
  | "bronze"
  | "silver"
  | "gold";

export type InnerCanvasEntry = {
  id: string;
  createdAt: string;
  seed: number;
  answers: EmotionalAnswers;

  /*
   * Retrocompatível:
   * peças antigas sem tier são Bronze.
   */
  tier?: InnerCanvasTier;

  /*
   * Dados preparados para:
   * - coleção
   * - partilha
   * - histórico
   */
  periodStart?: string;
  periodEnd?: string;
  momentCount?: number;
  sourceIds?: string[];
};

export type InnerCanvasRewardProgress = {
  week: {
    count: number;
    target: number;
    start: string;
    end: string;
    unlocked: boolean;
  };

  month: {
    count: number;
    target: number;
    start: string;
    end: string;
    unlocked: boolean;
  };
};

function pad2(
  value: number
) {
  return String(value).padStart(
    2,
    "0"
  );
}

export function getInnerCanvasDayKey(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return (
    `${date.getFullYear()}-` +
    `${pad2(
      date.getMonth() + 1
    )}-` +
    `${pad2(date.getDate())}`
  );
}

function localMidnight(
  value: string | Date
) {
  const source =
    value instanceof Date
      ? value
      : new Date(value);

  return new Date(
    source.getFullYear(),
    source.getMonth(),
    source.getDate(),
    0,
    0,
    0,
    0
  );
}

function getWeekStart(
  value: string | Date
) {
  const date =
    localMidnight(value);

  /*
   * Semana:
   * segunda → domingo.
   */
  const day = date.getDay();

  const offset =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() +
      offset
  );

  return date;
}

function getWeekEnd(
  value: string | Date
) {
  const start =
    getWeekStart(value);

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 6
  );

  end.setHours(
    23,
    59,
    59,
    999
  );

  return end;
}

function getMonthStart(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function getMonthEnd(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function dateInRange(
  value: string,
  start: Date,
  end: Date
) {
  const time =
    new Date(value).getTime();

  return (
    time >= start.getTime() &&
    time <= end.getTime()
  );
}

function normalizeEntry(
  item: InnerCanvasEntry
): InnerCanvasEntry {
  return {
    ...item,

    tier:
      item.tier === "silver" ||
      item.tier === "gold"
        ? item.tier
        : "bronze",

    momentCount:
      typeof item.momentCount ===
      "number"
        ? item.momentCount
        : 1,
  };
}

function safeParse(
  value: string | null
): InnerCanvasEntry[] {
  if (!value) return [];

  try {
    const parsed =
      JSON.parse(value);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed
      .filter(
        item =>
          item &&
          typeof item.id ===
            "string" &&
          typeof item.createdAt ===
            "string" &&
          typeof item.seed ===
            "number" &&
          item.answers &&
          typeof item.answers ===
            "object"
      )
      .map(
        item =>
          normalizeEntry(item)
      );
  } catch {
    return [];
  }
}

function rawGallery() {
  return safeParse(
    localStorage.getItem(
      STORAGE_KEY
    )
  );
}

/*
 * Se por algum motivo existirem
 * vários Bronze no mesmo dia
 * (ex.: dados antigos),
 * usamos o mais recente desse dia
 * para Prata/Ouro.
 *
 * Não apagamos os antigos.
 */
function uniqueBronzeDays(
  gallery: InnerCanvasEntry[]
) {
  const bronze =
    gallery
      .filter(
        item =>
          (item.tier ??
            "bronze") ===
          "bronze"
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

  const seen =
    new Set<string>();

  const result:
    InnerCanvasEntry[] = [];

  for (
    const entry of bronze
  ) {
    const key =
      getInnerCanvasDayKey(
        entry.createdAt
      );

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    result.push(entry);
  }

  return result;
}

function aggregateAnswers(
  entries: InnerCanvasEntry[]
): EmotionalAnswers {
  const totals:
    Record<string, number> = {};

  for (
    const entry of entries
  ) {
    for (
      const [
        key,
        value,
      ] of Object.entries(
        entry.answers
      )
    ) {
      totals[key] =
        (totals[key] ?? 0) +
        Number(value ?? 0);
    }
  }

  const answers:
    EmotionalAnswers = {};

  const divisor =
    Math.max(
      1,
      entries.length
    );

  for (
    const [
      key,
      total,
    ] of Object.entries(
      totals
    )
  ) {
    /*
     * O quadro combina o somatório
     * dos dias, normalizando novamente
     * para a escala 0–10 esperada
     * pelo motor artístico.
     */
    answers[key] =
      Math.max(
        0,
        Math.min(
          10,
          Number(
            (
              total /
              divisor
            ).toFixed(2)
          )
        )
      );
  }

  return answers;
}

function hashAggregate(
  entries: InnerCanvasEntry[],
  prefix: string
) {
  /*
   * O seed considera os seeds
   * individuais e a ordem temporal.
   *
   * Isto faz com que a peça agregada
   * seja determinística e própria
   * daquele conjunto de dias.
   */
  const token =
    prefix +
    "|" +
    [...entries]
      .sort(
        (a, b) =>
          new Date(
            a.createdAt
          ).getTime() -
          new Date(
            b.createdAt
          ).getTime()
      )
      .map(
        item =>
          `${item.id}:${item.seed}`
      )
      .join("|");

  let hash =
    2166136261;

  for (
    let index = 0;
    index < token.length;
    index += 1
  ) {
    hash ^=
      token.charCodeAt(
        index
      );

    hash = Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

function newestDate(
  entries: InnerCanvasEntry[]
) {
  return [...entries]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )[0]?.createdAt ??
    new Date().toISOString();
}

function buildSilverAwards(
  bronzeDays:
    InnerCanvasEntry[]
) {
  const weeks =
    new Map<
      string,
      InnerCanvasEntry[]
    >();

  for (
    const entry of bronzeDays
  ) {
    const start =
      getWeekStart(
        entry.createdAt
      );

    const key =
      getInnerCanvasDayKey(
        start
      );

    const group =
      weeks.get(key) ?? [];

    group.push(entry);
    weeks.set(
      key,
      group
    );
  }

  const awards:
    InnerCanvasEntry[] = [];

  for (
    const [
      weekKey,
      entries,
    ] of weeks
  ) {
    /*
     * Sete dias diferentes.
     */
    if (
      entries.length < 7
    ) {
      continue;
    }

    const start =
      getWeekStart(
        entries[0].createdAt
      );

    const end =
      getWeekEnd(
        entries[0].createdAt
      );

    awards.push({
      id:
        `silver-${weekKey}`,

      createdAt:
        newestDate(entries),

      seed:
        hashAggregate(
          entries,
          `silver-${weekKey}`
        ),

      answers:
        aggregateAnswers(
          entries
        ),

      tier:
        "silver",

      momentCount:
        entries.length,

      periodStart:
        start.toISOString(),

      periodEnd:
        end.toISOString(),

      sourceIds:
        entries.map(
          item => item.id
        ),
    });
  }

  return awards;
}

function buildGoldAwards(
  bronzeDays:
    InnerCanvasEntry[]
) {
  const months =
    new Map<
      string,
      InnerCanvasEntry[]
    >();

  for (
    const entry of bronzeDays
  ) {
    const date =
      new Date(
        entry.createdAt
      );

    const key =
      `${date.getFullYear()}-` +
      `${pad2(
        date.getMonth() + 1
      )}`;

    const group =
      months.get(key) ?? [];

    group.push(entry);

    months.set(
      key,
      group
    );
  }

  const awards:
    InnerCanvasEntry[] = [];

  for (
    const [
      monthKey,
      entries,
    ] of months
  ) {
    /*
     * Ouro desbloqueia a partir
     * de 20 dias diferentes.
     *
     * Depois de desbloqueado,
     * continua a incorporar os
     * restantes dias desse mês.
     */
    if (
      entries.length < 20
    ) {
      continue;
    }

    const start =
      getMonthStart(
        entries[0].createdAt
      );

    const end =
      getMonthEnd(
        entries[0].createdAt
      );

    awards.push({
      id:
        `gold-${monthKey}`,

      createdAt:
        newestDate(entries),

      seed:
        hashAggregate(
          entries,
          `gold-${monthKey}`
        ),

      answers:
        aggregateAnswers(
          entries
        ),

      tier:
        "gold",

      momentCount:
        entries.length,

      periodStart:
        start.toISOString(),

      periodEnd:
        end.toISOString(),

      sourceIds:
        entries.map(
          item => item.id
        ),
    });
  }

  return awards;
}

function rebuildAwards(
  gallery: InnerCanvasEntry[]
) {
  const normalized =
    gallery.map(
      normalizeEntry
    );

  /*
   * Prata/Ouro são derivados
   * dos Bronze.
   *
   * Removemos as versões derivadas
   * anteriores e reconstruímos.
   */
  const bronze =
    normalized.filter(
      item =>
        (item.tier ??
          "bronze") ===
        "bronze"
    );

  const bronzeDays =
    uniqueBronzeDays(
      bronze
    );

  const silver =
    buildSilverAwards(
      bronzeDays
    );

  const gold =
    buildGoldAwards(
      bronzeDays
    );

  return [
    ...bronze,
    ...silver,
    ...gold,
  ].sort(
    (a, b) => {
      const dateDiff =
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime();

      if (
        dateDiff !== 0
      ) {
        return dateDiff;
      }

      const weight = {
        bronze: 1,
        silver: 2,
        gold: 3,
      };

      return (
        weight[
          b.tier ??
            "bronze"
        ] -
        weight[
          a.tier ??
            "bronze"
        ]
      );
    }
  );
}

function persist(
  gallery:
    InnerCanvasEntry[]
) {
  /*
   * Aumentamos o limite porque
   * agora existem peças derivadas.
   */
  const next =
    gallery.slice(
      0,
      260
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );

  return next;
}

export function getInnerCanvasGallery():
  InnerCanvasEntry[] {
  const next =
    rebuildAwards(
      rawGallery()
    );

  persist(next);

  return next;
}

export function saveInnerCanvasEntry(
  entry: InnerCanvasEntry
) {
  const gallery =
    rawGallery();

  const normalized =
    normalizeEntry(entry);

  const withoutDerived =
    gallery.filter(
      item =>
        (item.tier ??
          "bronze") ===
        "bronze"
    );

  /*
   * ID diário:
   * repetir os 60 segundos no
   * mesmo dia atualiza o Bronze
   * desse dia.
   */
  const nextBase = [
    normalized,
    ...withoutDerived.filter(
      item =>
        item.id !==
        normalized.id
    ),
  ];

  return persist(
    rebuildAwards(
      nextBase
    )
  );
}

export function deleteInnerCanvasEntry(
  id: string
) {
  const gallery =
    rawGallery();

  /*
   * Só Bronze é realmente
   * removível.
   *
   * Prata/Ouro voltariam a ser
   * reconstruídos automaticamente.
   */
  const nextBase =
    gallery.filter(
      item => {
        const tier =
          item.tier ??
          "bronze";

        if (
          tier !==
          "bronze"
        ) {
          return false;
        }

        return (
          item.id !== id
        );
      }
    );

  return persist(
    rebuildAwards(
      nextBase
    )
  );
}

export function getInnerCanvasRewardProgress(
  gallery:
    InnerCanvasEntry[] =
      getInnerCanvasGallery()
): InnerCanvasRewardProgress {
  const bronzeDays =
    uniqueBronzeDays(
      gallery
    );

  const now =
    new Date();

  const weekStart =
    getWeekStart(now);

  const weekEnd =
    getWeekEnd(now);

  const monthStart =
    getMonthStart(now);

  const monthEnd =
    getMonthEnd(now);

  const weekEntries =
    bronzeDays.filter(
      item =>
        dateInRange(
          item.createdAt,
          weekStart,
          weekEnd
        )
    );

  const monthEntries =
    bronzeDays.filter(
      item =>
        dateInRange(
          item.createdAt,
          monthStart,
          monthEnd
        )
    );

  return {
    week: {
      count:
        Math.min(
          7,
          weekEntries.length
        ),

      target: 7,

      start:
        weekStart.toISOString(),

      end:
        weekEnd.toISOString(),

      unlocked:
        weekEntries.length >= 7,
    },

    month: {
      count:
        Math.min(
          20,
          monthEntries.length
        ),

      target: 20,

      start:
        monthStart.toISOString(),

      end:
        monthEnd.toISOString(),

      unlocked:
        monthEntries.length >= 20,
    },
  };
}
