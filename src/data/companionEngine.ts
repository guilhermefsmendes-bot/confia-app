/**
 * COMPANHEIRO CONFIA
 *
 * Motor de análise personalizada.
 *
 * Este motor NÃO guarda dados.
 * Recebe os dados recolhidos por companionData.ts
 * e transforma-os em sinais compreensíveis.
 */

import type { CompanionCollectedData } from "./companionData";

export type MoodTrend =
  | "positive"
  | "stable"
  | "negative"
  | "insufficient";

export interface CompanionAnalysis {
  moodTrend: MoodTrend;

  morningTrend: MoodTrend;

  afternoonTrend: MoodTrend;

  averageMood7Days: number | null;

  averageMood14Days: number | null;

  morningAverage7Days: number | null;

  afternoonAverage7Days: number | null;

  completedObjectives: number;

  totalObjectives: number;

  objectiveCompletionRate: number;

  interventionCount7Days: number;

  interventionCount14Days: number;

  interventionEffectiveness: number | null;

  strongestSignal:
    | "morning"
    | "afternoon"
    | "objectives"
    | "impulse"
    | "habits"
    | "positive"
    | "insufficient";

  message: string;

  suggestion: string;

  gratitude: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function calculateTrend(values: number[]): MoodTrend {
  if (values.length < 2) return "insufficient";

  const first = values[0];
  const last = values[values.length - 1];

  const difference = last - first;

  if (difference >= 1) return "positive";

  if (difference <= -1) return "negative";

  return "stable";
}

function getRecentDates(days: number): string[] {
  const result: string[] = [];

  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    result.push(
      date.toISOString().split("T")[0]
    );
  }

  return result;
}

export function analyzeCompanionData(
  data: CompanionCollectedData
): CompanionAnalysis {

  const dates7 = getRecentDates(7);
  const dates14 = getRecentDates(14);

  /*
   * HUMOR
   */

  const mood7 = data.mood.filter(item =>
    dates7.includes(item.date)
  );

  const mood14 = data.mood.filter(item =>
    dates14.includes(item.date)
  );

  const allMood7 = mood7.flatMap(item => [
    ...(typeof item.morning === "number"
      ? [item.morning]
      : []),

    ...(typeof item.afternoon === "number"
      ? [item.afternoon]
      : []),
  ]);

  const allMood14 = mood14.flatMap(item => [
    ...(typeof item.morning === "number"
      ? [item.morning]
      : []),

    ...(typeof item.afternoon === "number"
      ? [item.afternoon]
      : []),
  ]);

  const morning7 = mood7
    .filter(item => typeof item.morning === "number")
    .map(item => item.morning as number);

  const afternoon7 = mood7
    .filter(item => typeof item.afternoon === "number")
    .map(item => item.afternoon as number);

  const averageMood7Days = average(allMood7);

  const averageMood14Days = average(allMood14);

  const morningAverage7Days = average(morning7);

  const afternoonAverage7Days = average(afternoon7);

  const moodTrend = calculateTrend(allMood14);

  const morningTrend = calculateTrend(morning7);

  const afternoonTrend = calculateTrend(afternoon7);

  /*
   * OBJECTIVOS
   */

  const recentObjectives = data.objectives.filter(item =>
    dates7.includes(item.date)
  );

  const completedObjectives = recentObjectives.reduce(
    (sum, item) => sum + item.completed,
    0
  );

  const totalObjectives = recentObjectives.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const objectiveCompletionRate =
    totalObjectives > 0
      ? completedObjectives / totalObjectives
      : 0;

  /*
   * IMPULSO
   */

  const recentImpulses7 = data.impulse.filter(item =>
    dates7.some(date =>
      item.date.startsWith(date)
    )
  );

  const recentImpulses14 = data.impulse.filter(item =>
    dates14.some(date =>
      item.date.startsWith(date)
    )
  );

  const completedInterventions =
    recentImpulses14.filter(item =>
      typeof item.intensity === "number" &&
      typeof item.finalIntensity === "number"
    );

  let interventionEffectiveness: number | null = null;

  if (completedInterventions.length > 0) {

    const reductions =
      completedInterventions.map(item =>
        (item.intensity ?? 0) -
        (item.finalIntensity ?? 0)
      );

    interventionEffectiveness =
      average(reductions);
  }

  /*
   * DETERMINAR O SINAL MAIS FORTE
   */

  let strongestSignal:
    | "morning"
    | "afternoon"
    | "objectives"
    | "impulse"
    | "habits"
    | "positive"
    | "insufficient" = "insufficient";

  if (
    morningTrend === "negative" &&
    (morningAverage7Days ?? 10) <
      (afternoonAverage7Days ?? 10)
  ) {
    strongestSignal = "morning";

  } else if (
    afternoonTrend === "negative"
  ) {
    strongestSignal = "afternoon";

  } else if (
    objectiveCompletionRate >= 0.75
  ) {
    strongestSignal = "objectives";

  } else if (
    interventionEffectiveness !== null &&
    interventionEffectiveness >= 2
  ) {
    strongestSignal = "impulse";

  } else if (
    moodTrend === "positive"
  ) {
    strongestSignal = "positive";
  }

  /*
   * MENSAGEM PERSONALIZADA
   */

  let message =
    "O teu Companheiro está a conhecer melhor os teus ritmos. Continua a registar como te sentes.";

  let suggestion =
    "Continua a usar a Confia como um pequeno espaço para parar, observar e cuidar de ti.";

  let gratitude =
    "Hoje pode existir algo pequeno pelo qual vale a pena agradecer.";

  if (strongestSignal === "morning") {

    message =
      "Esta semana as tuas manhãs têm estado menos positivas do que o resto do dia. Parece existir um padrão interessante no teu ritmo diário.";

    suggestion =
      "Experimenta criar uma pequena pausa a meio da manhã. Afasta-te por alguns minutos, respira e saboreia o momento sem pressa.";

    gratitude =
      "Antes de começares o dia, lembra-te de reconhecer uma coisa simples que tens hoje e que merece ser valorizada.";

  } else if (strongestSignal === "afternoon") {

    message =
      "Tenho reparado que as tuas tardes têm sido um pouco mais difíceis. Talvez seja nessa parte do dia que valha a pena reservar alguns minutos para ti.";

    suggestion =
      "Quando sentires a tarde a ficar mais pesada, experimenta fazer uma pausa curta antes de continuares.";

    gratitude =
      "Mesmo num dia difícil, procura uma pequena coisa boa que tenha acontecido até agora.";

  } else if (strongestSignal === "objectives") {

    message =
      "Tens conseguido cumprir uma boa parte dos teus objetivos. Isso mostra consistência e, sobretudo, vontade de cuidar de ti.";

    suggestion =
      "Não precisas de fazer tudo. Continua a valorizar cada pequena ação que consegues concretizar.";

    gratitude =
      "Reconhece hoje uma pequena vitória tua. O progresso também acontece nas coisas simples.";

  } else if (strongestSignal === "impulse") {

    message =
      "Os teus registos mostram que tens conseguido reduzir a intensidade em alguns momentos difíceis através do Impulso.";

    suggestion =
      "Quando surgir novamente um momento de maior intensidade, lembra-te de que já tens ferramentas que podem ajudar-te a atravessá-lo.";

    gratitude =
      "Agradece a ti próprio por teres parado para cuidar de ti quando precisaste.";

  } else if (strongestSignal === "positive") {

    message =
      "Os teus registos recentes mostram sinais positivos. Há uma evolução que vale a pena reconhecer.";

    suggestion =
      "Continua a observar o que estás a fazer nos dias em que te sentes melhor. Esses padrões podem ensinar-te muito.";

    gratitude =
      "Hoje vale a pena agradecer por alguma coisa que esteja a correr um pouco melhor.";
  }

  return {
    moodTrend,

    morningTrend,

    afternoonTrend,

    averageMood7Days,

    averageMood14Days,

    morningAverage7Days,

    afternoonAverage7Days,

    completedObjectives,

    totalObjectives,

    objectiveCompletionRate,

    interventionCount7Days:
      recentImpulses7.length,

    interventionCount14Days:
      recentImpulses14.length,

    interventionEffectiveness,

    strongestSignal,

    message,

    suggestion,

    gratitude,
  };
}
