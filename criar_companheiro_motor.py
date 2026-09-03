from pathlib import Path

path = Path("src/data/companionEngine.ts")

content = r'''export interface CompanionData {
  moodHistory?: {
    date: string;
    morning?: number;
    afternoon?: number;
  }[];

  objectives?: {
    completed: boolean;
    title?: string;
    date?: string;
  }[];

  interventions?: {
    date: string;
    type?: string;
    intensityBefore?: number;
    intensityAfter?: number;
  }[];

  habits?: {
    date: string;
    completed: boolean;
    type?: string;
  }[];
}

export interface CompanionAnalysis {
  moodTrend: "positive" | "stable" | "negative" | "insufficient";
  morningTrend: "positive" | "stable" | "negative" | "insufficient";
  afternoonTrend: "positive" | "stable" | "negative" | "insufficient";

  completedObjectives: number;
  totalObjectives: number;

  interventionCount: number;

  message: string;
  suggestion: string;
  gratitude: string;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateTrend(values: number[]): CompanionAnalysis["moodTrend"] {
  if (values.length < 2) return "insufficient";

  const middle = Math.floor(values.length / 2);

  const firstHalf = average(values.slice(0, middle));
  const secondHalf = average(values.slice(middle));

  if (firstHalf === null || secondHalf === null) {
    return "insufficient";
  }

  const difference = secondHalf - firstHalf;

  if (difference >= 0.7) return "positive";
  if (difference <= -0.7) return "negative";

  return "stable";
}

export function analyzeCompanionData(
  data: CompanionData
): CompanionAnalysis {

  const moodHistory = data.moodHistory ?? [];

  const morningValues = moodHistory
    .map(item => item.morning)
    .filter((value): value is number => typeof value === "number");

  const afternoonValues = moodHistory
    .map(item => item.afternoon)
    .filter((value): value is number => typeof value === "number");

  const allMoodValues = [
    ...morningValues,
    ...afternoonValues
  ];

  const morningTrend = calculateTrend(morningValues);
  const afternoonTrend = calculateTrend(afternoonValues);
  const moodTrend = calculateTrend(allMoodValues);

  const objectives = data.objectives ?? [];

  const completedObjectives = objectives.filter(
    objective => objective.completed
  ).length;

  const totalObjectives = objectives.length;

  const interventionCount =
    data.interventions?.length ?? 0;

  let message =
    "Continua a observar como te sentes. Cada registo ajuda-te a conhecer melhor o teu caminho.";

  let suggestion =
    "Faz uma pequena pausa hoje e presta atenção ao que precisas neste momento.";

  let gratitude =
    "Lembra-te de reconhecer uma coisa boa deste dia.";

  /*
   * MANHÃS
   */
  if (morningTrend === "negative") {
    message =
      "Esta semana as tuas manhãs têm estado menos positivas. A Confia está a perceber esta mudança através dos teus registos.";

    suggestion =
      "Experimenta criar uma pequena pausa a meio da manhã. Afasta-te por alguns minutos, respira e saboreia o momento sem pressa.";

    gratitude =
      "Antes de continuares o teu dia, lembra-te de agradecer por mais um dia e por uma coisa simples que hoje tenhas.";
  }

  /*
   * TARDES
   */
  else if (afternoonTrend === "negative") {
    message =
      "Os teus registos mostram que as tardes têm sido um pouco mais difíceis recentemente.";

    suggestion =
      "Quando chegares a essa parte do dia, tenta fazer uma pausa consciente antes de continuares. Nem sempre precisas de resolver tudo imediatamente.";

    gratitude =
      "Pensa numa pequena coisa que correu bem hoje, mesmo que tenha parecido insignificante.";
  }

  /*
   * EVOLUÇÃO POSITIVA
   */
  else if (moodTrend === "positive") {
    message =
      "Os teus últimos registos mostram uma evolução positiva. Há sinais de que estás a conseguir cuidar melhor de ti.";

    suggestion =
      "Continua a repetir as pequenas coisas que parecem estar a ajudar-te.";

    gratitude =
      "Reconhece este progresso. Pequenas melhorias também são conquistas.";
  }

  /*
   * OBJETIVOS
   */
  if (
    totalObjectives > 0 &&
    completedObjectives / totalObjectives >= 0.7
  ) {
    suggestion =
      "Tens mantido uma boa frequência nos teus objetivos. Continua sem procurar fazer tudo perfeito.";
  }

  /*
   * INTERVENÇÕES
   */
  if (interventionCount >= 3 && moodTrend !== "positive") {
    suggestion =
      "Tens recorrido às ferramentas da Confia várias vezes. Isso mostra que estás a tentar cuidar de ti. Continua a usar esses momentos como pequenas pausas, não como uma obrigação.";
  }

  return {
    moodTrend,
    morningTrend,
    afternoonTrend,

    completedObjectives,
    totalObjectives,

    interventionCount,

    message,
    suggestion,
    gratitude
  };
}
'''

path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(content, encoding="utf-8")

print("==============================================")
print("COMPANHEIRO VIRTUAL — MOTOR CRIADO")
print("==============================================")
print()
print(f"✓ Criado: {path}")
print("✓ Análise de humor")
print("✓ Tendência manhã")
print("✓ Tendência tarde")
print("✓ Objetivos")
print("✓ Intervenções")
print("✓ Mensagens personalizadas")
print("✓ Sugestões")
print("✓ Gratidão")
print()
print("IMPORTANTE:")
print("Ainda NÃO foi alterado o App.tsx.")
print("O próximo passo será ligar este motor aos dados reais da Confia.")
