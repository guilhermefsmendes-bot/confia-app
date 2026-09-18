from pathlib import Path
from datetime import datetime
import shutil
import re
import json

APP = Path("src/App.tsx")
COMPONENT = Path(
    "src/components/InnerCanvas/InnerCanvas.tsx"
)
STORAGE = Path(
    "src/storage/innerCanvasStorage.ts"
)

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

for path in [
    APP,
    COMPONENT,
    STORAGE,
    *LOCALES.values(),
]:
    if not path.exists():
        raise SystemExit(
            f"ERRO: não encontrei {path}"
        )

stamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)

print("=" * 76)
print(
    "CONFIA — QUADRO INTERIOR "
    "BRONZE / PRATA / OURO"
)
print("=" * 76)
print()

# ============================================================
# BACKUPS
# ============================================================

for path in [
    APP,
    COMPONENT,
    STORAGE,
    *LOCALES.values(),
]:
    backup = path.with_name(
        path.name +
        f".before_inner_rewards_{stamp}"
    )

    shutil.copy2(
        path,
        backup
    )

    print(
        f"✓ backup: {backup}"
    )

# ============================================================
# 1. STORAGE NOVO
# ============================================================

storage_code = r'''import type {
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
'''

STORAGE.write_text(
    storage_code,
    encoding="utf-8"
)

print()
print("✓ storage Bronze / Prata / Ouro instalado")
print("✓ peças antigas preservadas como Bronze")
print("✓ apenas um Bronze conta por dia")
print("✓ Prata = 7 dias diferentes na semana")
print("✓ Ouro = 20 dias diferentes no mês")
print("✓ Prata/Ouro reconstruídos automaticamente")

# ============================================================
# 2. COMPONENT — IMPORT STORAGE
# ============================================================

component = COMPONENT.read_text(
        encoding="utf-8"
    )

storage_import_pattern = re.compile(
    r'import\s*\{.*?\}\s*from\s*'
    r'["\'][^"\']*innerCanvasStorage["\'];',
    re.S
)

match = storage_import_pattern.search(
        component
    )

if not match:
    raise SystemExit(
        "ERRO: não encontrei import "
        "de innerCanvasStorage."
    )

original_import = match.group(0)

path_match = re.search(
    r'from\s*(["\'])(.*?)\1',
    original_import
)

if not path_match:
    raise SystemExit(
        "ERRO: não consegui determinar "
        "o path do storage."
    )

storage_import_path = path_match.group(2)

new_storage_import = f'''import {{
  deleteInnerCanvasEntry,
  getInnerCanvasDayKey,
  getInnerCanvasGallery,
  getInnerCanvasRewardProgress,
  saveInnerCanvasEntry,
  type InnerCanvasEntry,
  type InnerCanvasTier,
}} from "{storage_import_path}";'''

component = (
    component[:match.start()]
    + new_storage_import
    + component[match.end():]
)

print("✓ imports do InnerCanvas atualizados")

# ============================================================
# 3. ARTWORK RECEBE TIER
# ============================================================

old_signature = '''function EmotionalArtwork({
  answers,
  seed,
  interactive = true,
}: {
  answers: EmotionalAnswers;
  seed: number;
  interactive?: boolean;
}) {'''

new_signature = '''function EmotionalArtwork({
  answers,
  seed,
  interactive = true,
  tier = "bronze",
}: {
  answers: EmotionalAnswers;
  seed: number;
  interactive?: boolean;
  tier?: InnerCanvasTier;
}) {'''

if old_signature not in component:
    raise SystemExit(
        "ERRO: assinatura EmotionalArtwork "
        "não corresponde à V2 atual."
    )

component = component.replace(
    old_signature,
    new_signature,
    1
)

# Adiciona boost antes de cuts.
needle = '''  const cuts = useMemo(
    () =>
      Array.from(
        { length: 4 },'''

replacement = '''  const complexityBoost =
    tier === "gold"
      ? 2
      : tier === "silver"
        ? 1
        : 0;

  const cuts = useMemo(
    () =>
      Array.from(
        {
          length:
            4 +
            complexityBoost * 2,
        },'''

if needle not in component:
    raise SystemExit(
        "ERRO: não encontrei o bloco "
        "cuts da V2."
    )

component = component.replace(
    needle,
    replacement,
    1
)

component = component.replace(
    '''    [seed]
  );

  return (
    <button''',
    '''    [seed, complexityBoost]
  );

  return (
    <button''',
    1
)

print("✓ Prata/Ouro ganham complexidade artística adicional")

# ============================================================
# 4. PROGRESS STATE
# ============================================================

gallery_state = '''  const [gallery, setGallery] =
    useState<InnerCanvasEntry[]>(
      () => getInnerCanvasGallery()
    );

  const [current, setCurrent] ='''

gallery_state_new = '''  const [gallery, setGallery] =
    useState<InnerCanvasEntry[]>(
      () => getInnerCanvasGallery()
    );

  const rewardProgress =
    useMemo(
      () =>
        getInnerCanvasRewardProgress(
          gallery
        ),
      [gallery]
    );

  const [current, setCurrent] ='''

if gallery_state not in component:
    raise SystemExit(
        "ERRO: não encontrei gallery state."
    )

component = component.replace(
    gallery_state,
    gallery_state_new,
    1
)

# ============================================================
# 5. UM BRONZE POR DIA
# ============================================================

old_finish = '''  const finishSurvey = () => {
    const seed = hashAnswers(answers);

    const entry: InnerCanvasEntry = {
      id: `${Date.now()}-${seed}`,
      createdAt: new Date().toISOString(),
      seed,
      answers,
    };

    const nextGallery =
      saveInnerCanvasEntry(entry);

    setGallery(nextGallery);
    setCurrent(entry);
    setMode("result");
  };'''

new_finish = '''  const finishSurvey = () => {
    const seed =
      hashAnswers(answers);

    const now =
      new Date();

    const createdAt =
      now.toISOString();

    const dayKey =
      getInnerCanvasDayKey(
        now
      );

    const entry: InnerCanvasEntry = {
      id:
        `bronze-${dayKey}`,

      createdAt,

      seed,

      answers,

      tier:
        "bronze",

      momentCount:
        1,

      periodStart:
        createdAt,

      periodEnd:
        createdAt,
    };

    const nextGallery =
      saveInnerCanvasEntry(
        entry
      );

    /*
     * Recuperamos a versão já
     * normalizada pelo storage.
     */
    const savedEntry =
      nextGallery.find(
        item =>
          item.id ===
          entry.id
      ) ?? entry;

    setGallery(
      nextGallery
    );

    setCurrent(
      savedEntry
    );

    setMode(
      "result"
    );
  };'''

if old_finish not in component:
    raise SystemExit(
        "ERRO: finishSurvey atual "
        "não encontrado."
    )

component = component.replace(
    old_finish,
    new_finish,
    1
)

print("✓ cada dia passa a ter um único Bronze")

# ============================================================
# 6. RESULTADO — PASSA TIER AO ARTWORK
# ============================================================

old_result_art = '''              <EmotionalArtwork
                answers={
                  current.answers
                }
                seed={current.seed}
              />'''

new_result_art = '''              <EmotionalArtwork
                answers={
                  current.answers
                }
                seed={
                  current.seed
                }
                tier={
                  current.tier ??
                  "bronze"
                }
              />'''

if old_result_art not in component:
    raise SystemExit(
        "ERRO: artwork do resultado "
        "não encontrado."
    )

component = component.replace(
    old_result_art,
    new_result_art,
    1
)

# Badge tier no resultado.
date_block = '''                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {formatDate(
                    current.createdAt,
                    i18n.language
                  )}
                </p>
              </div>'''

date_block_new = '''                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {formatDate(
                    current.createdAt,
                    i18n.language
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      (current.tier ??
                        "bronze") ===
                      "gold"
                        ? "rounded-full border border-[#D9B85F]/45 bg-[#FFF8DB] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#98721F]"
                        : (current.tier ??
                            "bronze") ===
                          "silver"
                          ? "rounded-full border border-[#BCC4CC]/60 bg-[#F3F5F6] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#66717A]"
                          : "rounded-full border border-[#C98A6A]/35 bg-[#FFF2EB] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#B16B4B]"
                    }
                  >
                    {(current.tier ??
                      "bronze") ===
                    "gold"
                      ? `🥇 ${t(
                          "innerCanvas.tierGold"
                        )}`
                      : (current.tier ??
                          "bronze") ===
                        "silver"
                        ? `🥈 ${t(
                            "innerCanvas.tierSilver"
                          )}`
                        : `🥉 ${t(
                            "innerCanvas.tierBronze"
                          )}`}
                  </span>

                  {(current.tier ??
                    "bronze") !==
                    "bronze" &&
                    current.momentCount && (
                      <span className="text-[9px] font-bold text-slate-400">
                        {t(
                          "innerCanvas.createdFromMoments",
                          {
                            count:
                              current.momentCount,
                          }
                        )}
                      </span>
                    )}
                </div>
              </div>'''

if date_block not in component:
    raise SystemExit(
        "ERRO: bloco da data do resultado "
        "não encontrado."
    )

component = component.replace(
    date_block,
    date_block_new,
    1
)

# ============================================================
# 7. GALERIA — PROGRESSO
# ============================================================

gallery_conditional = '''          {gallery.length === 0 ? ('''

progress_ui = '''          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <section className="rounded-[24px] border border-[#C3C9CF]/65 bg-gradient-to-br from-white to-[#F1F3F4] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#7B858D]">
                    🥈 {t(
                      "innerCanvas.tierSilver"
                    )}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#4E3B36]">
                    {t(
                      "innerCanvas.weeklyPiece"
                    )}
                  </p>
                </div>

                <span className="text-xs font-black text-[#737F88]">
                  {rewardProgress.week.count}/
                  {rewardProgress.week.target}
                </span>
              </div>

              <div className="mt-3 flex gap-1.5">
                {Array.from(
                  {
                    length:
                      rewardProgress.week
                        .target,
                  },
                  (_, index) => (
                    <div
                      key={
                        `week-${index}`
                      }
                      className={
                        index <
                        rewardProgress.week
                          .count
                          ? "h-2 flex-1 rounded-full bg-[#AEB7BE]"
                          : "h-2 flex-1 rounded-full bg-[#E2E6E8]"
                      }
                    />
                  )
                )}
              </div>

              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">
                {rewardProgress.week
                  .unlocked
                  ? t(
                      "innerCanvas.silverUnlocked"
                    )
                  : t(
                      "innerCanvas.silverHint"
                    )}
              </p>
            </section>

            <section className="rounded-[24px] border border-[#E2CB87]/55 bg-gradient-to-br from-[#FFFDF7] to-[#FFF5D8] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9C7A28]">
                    🥇 {t(
                      "innerCanvas.tierGold"
                    )}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#4E3B36]">
                    {t(
                      "innerCanvas.monthlyPiece"
                    )}
                  </p>
                </div>

                <span className="text-xs font-black text-[#9C7A28]">
                  {rewardProgress.month.count}/
                  {rewardProgress.month.target}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFE4C2]">
                <div
                  className="h-full rounded-full bg-[#D6B45C] transition-all duration-300"
                  style={{
                    width:
                      `${Math.min(
                        100,
                        (
                          rewardProgress
                            .month
                            .count /
                          rewardProgress
                            .month
                            .target
                        ) *
                          100
                      )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">
                {rewardProgress.month
                  .unlocked
                  ? t(
                      "innerCanvas.goldUnlocked"
                    )
                  : t(
                      "innerCanvas.goldHint"
                    )}
              </p>
            </section>
          </div>

          {gallery.length === 0 ? ('''

if gallery_conditional not in component:
    raise SystemExit(
        "ERRO: início da galeria não encontrado."
    )

component = component.replace(
    gallery_conditional,
    progress_ui,
    1
)

# ============================================================
# 8. GALERIA — TIER NO ARTWORK
# ============================================================

old_gallery_art = '''                      <EmotionalArtwork
                        answers={
                          entry.answers
                        }
                        seed={
                          entry.seed
                        }
                        interactive={
                          false
                        }
                      />'''

new_gallery_art = '''                      <EmotionalArtwork
                        answers={
                          entry.answers
                        }
                        seed={
                          entry.seed
                        }
                        interactive={
                          false
                        }
                        tier={
                          entry.tier ??
                          "bronze"
                        }
                      />'''

if old_gallery_art not in component:
    raise SystemExit(
        "ERRO: artwork da galeria "
        "não encontrado."
    )

component = component.replace(
    old_gallery_art,
    new_gallery_art,
    1
)

# Badge na galeria após a data.
gallery_date = '''                      <p className="mt-2 px-1 text-left text-[9px] font-black text-[#6D5A53]">
                        {formatDate(
                          entry.createdAt,
                          i18n.language
                        )}
                      </p>
                    </button>'''

gallery_date_new = '''                      <p className="mt-2 px-1 text-left text-[9px] font-black text-[#6D5A53]">
                        {formatDate(
                          entry.createdAt,
                          i18n.language
                        )}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-1 px-1">
                        <span
                          className={
                            (entry.tier ??
                              "bronze") ===
                            "gold"
                              ? "text-[8px] font-black uppercase tracking-[0.1em] text-[#A37A1E]"
                              : (entry.tier ??
                                  "bronze") ===
                                "silver"
                                ? "text-[8px] font-black uppercase tracking-[0.1em] text-[#747F87]"
                                : "text-[8px] font-black uppercase tracking-[0.1em] text-[#B16B4B]"
                          }
                        >
                          {(entry.tier ??
                            "bronze") ===
                          "gold"
                            ? `🥇 ${t(
                                "innerCanvas.tierGold"
                              )}`
                            : (entry.tier ??
                                "bronze") ===
                              "silver"
                              ? `🥈 ${t(
                                  "innerCanvas.tierSilver"
                                )}`
                              : `🥉 ${t(
                                  "innerCanvas.tierBronze"
                                )}`}
                        </span>

                        {(entry.tier ??
                          "bronze") !==
                          "bronze" &&
                          entry.momentCount && (
                            <span className="text-[8px] font-bold text-slate-400">
                              {entry.momentCount}×
                            </span>
                          )}
                      </div>
                    </button>'''

if gallery_date not in component:
    raise SystemExit(
        "ERRO: data da galeria não encontrada."
    )

component = component.replace(
    gallery_date,
    gallery_date_new,
    1
)

# ============================================================
# 9. APAGAR SÓ BRONZE
# ============================================================

delete_block_pattern = re.compile(
    r'''                    <button
                      type="button"
                      onClick=\{\(\) => \{
                        if \(
                          window\.confirm\(
                            t\(
                              "innerCanvas\.deleteConfirm"
                            \)
                          \)
                        \) \{
                          removeEntry\(
                            entry\.id
                          \);
                        \}
                      \}\}
                      className="mt-1 w-full px-1 py-2 text-right text-\[9px\] font-bold text-slate-400"
                    >
                      \{t\(
                        "innerCanvas\.delete"
                      \)\}
                    </button>''',
    re.S
)

delete_match = delete_block_pattern.search(
        component
    )

if not delete_match:
    raise SystemExit(
        "ERRO: botão apagar "
        "da galeria não encontrado."
    )

delete_replacement = '''                    {(entry.tier ??
                      "bronze") ===
                      "bronze" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                "innerCanvas.deleteConfirm"
                              )
                            )
                          ) {
                            removeEntry(
                              entry.id
                            );
                          }
                        }}
                        className="mt-1 w-full px-1 py-2 text-right text-[9px] font-bold text-slate-400"
                      >
                        {t(
                          "innerCanvas.delete"
                        )}
                      </button>
                    )}'''

component = (
    component[:delete_match.start()]
    + delete_replacement
    + component[delete_match.end():]
)

# ============================================================
# 10. SEGURANÇAS COMPONENT
# ============================================================

required_tokens = [
    "getInnerCanvasRewardProgress",
    "getInnerCanvasDayKey",
    "complexityBoost",
    "tier?: InnerCanvasTier",
    '"bronze"',
    "weeklyPiece",
    "monthlyPiece",
    "silverUnlocked",
    "goldUnlocked",
    "export default function InnerCanvas",
    "buildSculpturalBlobPath",
    "buildRibbonPath",
    "buildCutPath",
]

for token in required_tokens:
    if token not in component:
        raise SystemExit(
            f"ERRO SEGURANÇA COMPONENT: "
            f"falta {token}"
        )

COMPONENT.write_text(
    component,
    encoding="utf-8"
)

print("✓ InnerCanvas atualizado")
print("✓ progresso semanal adicionado")
print("✓ progresso mensal adicionado")
print("✓ badges Bronze / Prata / Ouro")
print("✓ peças derivadas não mostram apagar")
print("✓ motor V2 preservado")

# ============================================================
# 11. APP — MOVE 60 SEGUNDOS
# ============================================================

app = APP.read_text(
        encoding="utf-8"
    )

button_start_marker = (
    "    {/* CONFIA — 60 SEGUNDOS / "
    "QUADRO INTERIOR */}"
)

areas_marker = (
    "    {/* Áreas do espaço */}"
)

button_start = app.find(
        button_start_marker
    )

areas_start = app.find(
        areas_marker,
        button_start
    )

if (
    button_start == -1 or
    areas_start == -1
):
    raise SystemExit(
        "ERRO: não consegui localizar "
        "o botão 60 segundos atual."
    )

button_block = app[
        button_start:
        areas_start
    ]

# Remove botão da zona "O teu espaço".
app = (
    app[:button_start]
    + app[areas_start:]
)

# Ajusta wrapper para a nova posição.
button_block = (
    button_block
    .replace(
        'className="mt-3 px-3"',
        'className="mb-3"',
        1
    )
)

sos_marker = (
    "{/* Apoio — acesso SOS discreto "
    "e sempre disponível */}"
)

sos_index = app.find(
        sos_marker
    )

if sos_index == -1:
    raise SystemExit(
        "ERRO: não encontrei "
        "o SOS da Home."
    )

new_button_block = (
    "{/* CONFIA — 60 SEGUNDOS / "
    "AÇÃO PRINCIPAL ACIMA DO SOS */}\n"
    + button_block.split(
        "\n",
        1
    )[1]
)

app = (
    app[:sos_index]
    + new_button_block
    + "\n"
    + app[sos_index:]
)

# Confirma uma ocorrência visual do botão.
if app.count(
    'setHomeScreen("innerCanvas")'
) < 1:
    raise SystemExit(
        "ERRO: navegação innerCanvas desapareceu."
    )

APP.write_text(
    app,
    encoding="utf-8"
)

print()
print("✓ 60 segundos removido de 'O teu espaço'")
print("✓ 60 segundos colocado imediatamente acima do SOS")

# ============================================================
# 12. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "tierBronze": "Bronze",
        "tierSilver": "Prata",
        "tierGold": "Ouro",
        "weeklyPiece": "Semana Interior",
        "monthlyPiece": "Mês Interior",
        "silverHint": "Regista os 7 dias desta semana para revelar a tua peça Prata.",
        "goldHint": "Regista 20 dias neste mês para revelar a tua peça Ouro.",
        "silverUnlocked": "A tua peça Prata desta semana foi desbloqueada.",
        "goldUnlocked": "A tua peça Ouro deste mês foi desbloqueada.",
        "createdFromMoments": "Criada a partir de {{count}} momentos",
    },

    "en": {
        "tierBronze": "Bronze",
        "tierSilver": "Silver",
        "tierGold": "Gold",
        "weeklyPiece": "Inner Week",
        "monthlyPiece": "Inner Month",
        "silverHint": "Record all 7 days this week to reveal your Silver piece.",
        "goldHint": "Record 20 days this month to reveal your Gold piece.",
        "silverUnlocked": "Your Silver piece for this week has been unlocked.",
        "goldUnlocked": "Your Gold piece for this month has been unlocked.",
        "createdFromMoments": "Created from {{count}} moments",
    },

    "es": {
        "tierBronze": "Bronce",
        "tierSilver": "Plata",
        "tierGold": "Oro",
        "weeklyPiece": "Semana Interior",
        "monthlyPiece": "Mes Interior",
        "silverHint": "Registra los 7 días de esta semana para revelar tu pieza de Plata.",
        "goldHint": "Registra 20 días este mes para revelar tu pieza de Oro.",
        "silverUnlocked": "Tu pieza de Plata de esta semana ha sido desbloqueada.",
        "goldUnlocked": "Tu pieza de Oro de este mes ha sido desbloqueada.",
        "createdFromMoments": "Creada a partir de {{count}} momentos",
    },

    "fr": {
        "tierBronze": "Bronze",
        "tierSilver": "Argent",
        "tierGold": "Or",
        "weeklyPiece": "Semaine Intérieure",
        "monthlyPiece": "Mois Intérieur",
        "silverHint": "Enregistre les 7 jours de cette semaine pour révéler ta pièce Argent.",
        "goldHint": "Enregistre 20 jours ce mois-ci pour révéler ta pièce Or.",
        "silverUnlocked": "Ta pièce Argent de cette semaine a été débloquée.",
        "goldUnlocked": "Ta pièce Or de ce mois a été débloquée.",
        "createdFromMoments": "Créée à partir de {{count}} moments",
    },
}

def insert_inner_canvas_translations(
    path: Path,
    values: dict
):
    text = path.read_text(
        encoding="utf-8"
    )

    # Evita duplicar se script for corrido novamente.
    if '"tierSilver"' in text:
        print(
            f"• {path}: traduções já existem"
        )
        return

    marker = '"innerCanvas"'

    marker_index = text.find(marker)

    if marker_index == -1:
        raise SystemExit(
            f"ERRO: innerCanvas não encontrado "
            f"em {path}"
        )

    open_brace = text.find(
            "{",
            marker_index
        )

    if open_brace == -1:
        raise SystemExit(
            f"ERRO: bloco innerCanvas inválido "
            f"em {path}"
        )

    depth = 0
    in_string = False
    escaped = False
    close_brace = -1

    for index in range(
        open_brace,
        len(text)
    ):
        char = text[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1

            if depth == 0:
                close_brace = index
                break

    if close_brace == -1:
        raise SystemExit(
            f"ERRO: não fechei innerCanvas "
            f"em {path}"
        )

    before = text[:close_brace]

    after = text[close_brace:]

    # Conteúdo imediatamente antes do }
    stripped = before.rstrip()

    separator = (
        ""
        if stripped.endswith(",")
        else ","
    )

    indent = "    "

    additions = []

    for key, value in values.items():
        additions.append(
            indent +
            json.dumps(
                key,
                ensure_ascii=False
            ) +
            ": " +
            json.dumps(
                value,
                ensure_ascii=False
            )
        )

    insertion = (
        separator +
        "\n" +
        ",\n".join(
            additions
        ) +
        "\n  "
    )

    path.write_text(
        before +
        insertion +
        after,
        encoding="utf-8"
    )

    print(
        f"✓ traduções atualizadas: {path}"
    )

for language, path in LOCALES.items():
    insert_inner_canvas_translations(
        path,
        translations[language]
    )

# ============================================================
# 13. VALIDAR JSON
# ============================================================

for path in LOCALES.values():
    try:
        json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception as exc:
        raise SystemExit(
            f"ERRO JSON em {path}: {exc}"
        )

print()
print("✓ PT validado")
print("✓ EN validado")
print("✓ ES validado")
print("✓ FR validado")

# ============================================================
# FINAL
# ============================================================

print()
print("=" * 76)
print("ATUALIZAÇÃO CONCLUÍDA ✓")
print("=" * 76)
print()
print("HOME")
print("  ✓ 60 segundos imediatamente acima do SOS")
print("  ✓ removido de O teu espaço")
print()
print("PROGRESSÃO")
print("  🥉 Bronze = quadro diário")
print("  🥈 Prata = 7 dias diferentes na semana")
print("  🥇 Ouro = 20 dias diferentes no mês")
print()
print("GALERIA")
print("  ✓ badges Bronze / Prata / Ouro")
print("  ✓ progresso semanal")
print("  ✓ progresso mensal")
print("  ✓ peças Prata/Ouro mais complexas")
print()
print("PRESERVADO")
print("  ✓ quadros antigos")
print("  ✓ motor artístico V2")
print("  ✓ questionário")
print("  ✓ 16 estados")
print("  ✓ escala 0–10")
print("  ✓ Companion Brain")
print("  ✓ XP")
print("  ✓ navegação")
print("  ✓ PT / EN / ES / FR")
print()
print("FUTURO")
print("  ✓ estrutura preparada para partilha social")
print("=" * 76)
