from pathlib import Path
import json
import shutil
import sys


COMPONENT = Path("src/components/HomeProgressSummary.tsx")
LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not COMPONENT.exists():
    fail(f"não encontrado: {COMPONENT}")

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"locale não encontrado: {path}")


original = COMPONENT.read_text(encoding="utf-8")


# ============================================================
# COMPONENTE 1D.2
# ============================================================

component = '''import React, { useMemo } from "react";
import {
  Activity,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { collectCompanionData } from "../data/companionData";

interface DayData {
  date: string;
  mood?: number;
  completedObjectives: number;
  totalObjectives: number;
  active: boolean;
}

function getLast7Days(): string[] {
  const days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split("T")[0]);
  }

  return days;
}

export default function HomeProgressSummary() {
  const { t } = useTranslation();

  /*
   * O resumo é recalculado em cada render.
   * Não adicionamos listeners nem novo storage.
   *
   * Isto permite que, quando o App volta a renderizar após
   * um registo, "Hoje" reflita os dados mais recentes.
   */
  const analysis = (() => {
    const data = collectCompanionData();
    const dates = getLast7Days();

    const moodByDate = new Map<string, number>();

    data.mood.forEach((item) => {
      const values = [item.morning, item.afternoon].filter(
        (value): value is number =>
          typeof value === "number"
      );

      if (values.length > 0) {
        moodByDate.set(
          item.date,
          values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        );
      }
    });

    const objectivesByDate = new Map<
      string,
      {
        completed: number;
        total: number;
      }
    >();

    data.objectives.forEach((item) => {
      objectivesByDate.set(item.date, {
        completed: item.completed,
        total: item.total,
      });
    });

    const days: DayData[] = dates.map((date) => {
      const objectives =
        objectivesByDate.get(date);

      const mood =
        moodByDate.get(date);

      return {
        date,
        mood,
        completedObjectives:
          objectives?.completed ?? 0,
        totalObjectives:
          objectives?.total ?? 0,
        active:
          typeof mood === "number" ||
          Boolean(
            objectives &&
              objectives.total > 0
          ),
      };
    });

    const moodValues = days
      .map((day) => day.mood)
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    const averageMood =
      moodValues.length > 0
        ? moodValues.reduce(
            (sum, value) => sum + value,
            0
          ) / moodValues.length
        : null;

    const activeDays =
      days.filter((day) => day.active).length;

    const objectivesCompleted =
      days.reduce(
        (sum, day) =>
          sum + day.completedObjectives,
        0
      );

    const objectivesTotal =
      days.reduce(
        (sum, day) =>
          sum + day.totalObjectives,
        0
      );

    let trend:
      | "up"
      | "down"
      | "stable"
      | "none" = "none";

    if (moodValues.length >= 2) {
      const half = Math.max(
        1,
        Math.floor(moodValues.length / 2)
      );

      const first =
        moodValues.slice(0, half);

      const second =
        moodValues.slice(-half);

      const firstAverage =
        first.reduce(
          (sum, value) => sum + value,
          0
        ) / first.length;

      const secondAverage =
        second.reduce(
          (sum, value) => sum + value,
          0
        ) / second.length;

      const difference =
        secondAverage - firstAverage;

      if (difference >= 0.6) {
        trend = "up";
      } else if (difference <= -0.6) {
        trend = "down";
      } else {
        trend = "stable";
      }
    }

    return {
      averageMood,
      moodRecordCount: moodValues.length,
      activeDays,
      objectivesCompleted,
      objectivesTotal,
      trend,
      xp: data.xp,
    };
  })();

  const moodText =
    analysis.averageMood !== null
      ? analysis.averageMood.toFixed(1)
      : "—";

  const objectiveText =
    analysis.objectivesTotal > 0
      ? `${analysis.objectivesCompleted}/${analysis.objectivesTotal}`
      : "—";

  /*
   * Prioridade editorial:
   *
   * 1. Sem dados suficientes -> não fingir padrão.
   * 2. Tendência emocional -> interpretação principal.
   * 3. Presença/atividade -> reconhecimento neutro.
   *
   * Estabilidade não é chamada de progresso.
   */
  const feedbackKey =
    analysis.moodRecordCount < 2
      ? analysis.activeDays >= 3
        ? "homeProgress.feedback.active"
        : "homeProgress.feedback.noData"
      : analysis.trend === "up"
      ? "homeProgress.feedback.improving"
      : analysis.trend === "down"
      ? "homeProgress.feedback.difficult"
      : "homeProgress.feedback.stable";

  const TrendIcon =
    analysis.trend === "up"
      ? TrendingUp
      : analysis.trend === "down"
      ? TrendingDown
      : analysis.trend === "stable"
      ? Minus
      : Activity;

  const trendLabelKey =
    analysis.moodRecordCount < 2
      ? "homeProgress.trend.learning"
      : analysis.trend === "up"
      ? "homeProgress.trend.improving"
      : analysis.trend === "down"
      ? "homeProgress.trend.difficult"
      : "homeProgress.trend.stable";

  return (
    <section className="overflow-hidden rounded-t-[30px] border border-b-0 border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-[#FFF7F2] px-5 pb-5 pt-5">
      {/* Identidade */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            {t("homeToday.title")}
          </p>

          <h3 className="mt-1 text-lg font-black tracking-tight text-[#4E3B36]">
            {t("homeProgress.title")}
          </h3>

          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">
            {t("homeProgress.subtitle")}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[#E8DDD7]/60 bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-400">
          {t("homeProgress.period")}
        </span>
      </div>

      {/* Leitura principal da CONFIA */}
      <div className="mt-4 rounded-[22px] border border-[#E8DDD7]/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(107,78,67,0.05)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0E8] text-[#C97B5E]">
            <TrendIcon size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#C97B5E]">
                {t("homeProgress.feedbackTitle")}
              </p>

              <span className="rounded-full bg-[#FAF5F0] px-2 py-0.5 text-[8px] font-bold text-[#8B6F65]">
                {t(trendLabelKey)}
              </span>
            </div>

            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-[#5F4A43]">
              {t(feedbackKey)}
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-[#E8DDD7]/70">
        <div className="px-2 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {moodText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.mood")}
          </div>
        </div>

        <div className="px-2 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {analysis.activeDays}/7
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.activeDays")}
          </div>
        </div>

        <div className="px-2 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {objectiveText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.objectives")}
          </div>
        </div>
      </div>

      {/* XP — secundário */}
      <div className="mt-4 flex items-center justify-end border-t border-[#E8DDD7]/50 pt-3">
        <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>
      </div>
    </section>
  );
}
'''


# useMemo deixa de ser necessário.
if 'import React, { useMemo } from "react";' not in original:
    fail("estrutura esperada do HomeProgressSummary mudou.")

# Guardar backup antes de escrever.
shutil.copy2(
    COMPONENT,
    "/tmp/HomeProgressSummary.tsx.before_1d2"
)

COMPONENT.write_text(
    component,
    encoding="utf-8"
)


# ============================================================
# TRADUÇÕES
# ============================================================

updates = {
    "pt": {
        "stable":
            "O teu bem-estar tem-se mantido relativamente estável. "
            "Vale a pena continuar a observar este ritmo sem precisares de o forçar.",
        "trend": {
            "learning": "A conhecer-te",
            "improving": "Tendência positiva",
            "difficult": "Dias mais exigentes",
            "stable": "Ritmo estável",
        },
    },
    "en": {
        "stable":
            "Your wellbeing has remained relatively stable. "
            "It may be useful to keep noticing this rhythm without needing to force it.",
        "trend": {
            "learning": "Getting to know you",
            "improving": "Positive trend",
            "difficult": "More demanding days",
            "stable": "Steady rhythm",
        },
    },
    "es": {
        "stable":
            "Tu bienestar se ha mantenido relativamente estable. "
            "Puede ser útil seguir observando este ritmo sin necesidad de forzarlo.",
        "trend": {
            "learning": "Conociéndote",
            "improving": "Tendencia positiva",
            "difficult": "Días más exigentes",
            "stable": "Ritmo estable",
        },
    },
    "fr": {
        "stable":
            "Ton bien-être est resté relativement stable. "
            "Il peut être utile de continuer à observer ce rythme sans chercher à le forcer.",
        "trend": {
            "learning": "On apprend à te connaître",
            "improving": "Tendance positive",
            "difficult": "Jours plus exigeants",
            "stable": "Rythme stable",
        },
    },
}


for lang, path in LOCALES.items():
    with path.open(
        "r",
        encoding="utf-8"
    ) as f:
        data = json.load(f)

    if "homeProgress" not in data:
        fail(
            f"homeProgress não existe em {lang}"
        )

    if "feedback" not in data["homeProgress"]:
        fail(
            f"homeProgress.feedback não existe em {lang}"
        )

    # Backup.
    shutil.copy2(
        path,
        f"/tmp/{lang}.json.before_1d2"
    )

    data["homeProgress"]["feedback"]["stable"] = (
        updates[lang]["stable"]
    )

    data["homeProgress"]["trend"] = (
        updates[lang]["trend"]
    )

    with path.open(
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

        f.write("\\n")


# ============================================================
# VALIDAÇÃO
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

required = [
    "collectCompanionData",
    "moodRecordCount",
    "feedbackKey",
    "trendLabelKey",
    "TrendingUp",
    "TrendingDown",
    "homeProgress.feedbackTitle",
    "homeProgress.trend.learning",
    "homeProgress.trend.improving",
    "homeProgress.trend.difficult",
    "homeProgress.trend.stable",
    "analysis.activeDays",
    "analysis.xp",
]

for fragment in required:
    if fragment not in written:
        fail(
            f"verificação do componente falhou: {fragment}"
        )


for lang, path in LOCALES.items():
    with path.open(
        "r",
        encoding="utf-8"
    ) as f:
        data = json.load(f)

    hp = data.get("homeProgress", {})

    if "trend" not in hp:
        fail(
            f"trend ausente em {lang}"
        )

    for key in (
        "learning",
        "improving",
        "difficult",
        "stable",
    ):
        if not hp["trend"].get(key):
            fail(
                f"trend.{key} ausente em {lang}"
            )

    stable_text = (
        hp.get("feedback", {})
        .get("stable", "")
    )

    forbidden = {
        "pt": "também é progresso",
        "en": "progress too",
        "es": "también es progreso",
        "fr": "aussi un progrès",
    }

    if forbidden[lang].lower() in stable_text.lower():
        fail(
            f"estabilidade ainda tratada como progresso em {lang}"
        )


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.2 HOJE INTELIGENTE")
print("=" * 72)
print("✓ Hoje passou de estatísticas para interpretação")
print("✓ Tendência dos últimos 7 dias agora é visível")
print("✓ Falta de dados tratada sem inventar padrões")
print("✓ Tendência positiva reconhecida")
print("✓ Dias mais exigentes reconhecidos")
print("✓ Estabilidade tratada como estabilidade, não progresso")
print("✓ Presença pode ser reconhecida mesmo com poucos moods")
print("✓ Indicadores de humor / atividade / objetivos preservados")
print("✓ XP preservado como informação secundária")
print("✓ Dados recalculados quando o componente renderiza")
print("✓ Nenhum listener novo")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1D.2 aplicada.")
