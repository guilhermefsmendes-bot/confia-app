/**
 * COMPANHEIRO CONFIA
 *
 * Motor central de análise.
 *
 * IMPORTANTE:
 * Esta primeira versão não altera nem cria novos
 * registos. Apenas define a estrutura que permitirá
 * interligar os diferentes módulos da Confia.
 */

export interface MoodRecord {
  date: string;
  morning?: number;
  afternoon?: number;
}

export interface CompanionData {
  mood?: MoodRecord[];

  objectives?: {
    date: string;
    completed: number;
    total: number;
  }[];

  habits?: {
    date: string;
    completed: number;
    total: number;
  }[];

  impulse?: {
    date: string;
    intensity?: number;
    emotion?: string;
    trigger?: string;
    automaticThought?: string;
    finalIntensity?: number;
  }[];

  embrace?: {
    date: string;
    duration?: number;
    completed?: boolean;
  }[];
}

export interface CompanionInsight {
  type:
    | "morning"
    | "afternoon"
    | "trend"
    | "objectives"
    | "habits"
    | "impulse"
    | "embrace"
    | "positive";

  title: string;

  message: string;

  priority: number;
}

/**
 * Analisa os dados disponíveis.
 *
 * Nesta primeira versão devolve uma estrutura vazia.
 *
 * A lógica será acrescentada depois de ligarmos
 * este motor aos sistemas de armazenamento reais
 * da Confia.
 */
export function analyseCompanionData(
  data: CompanionData
): CompanionInsight[] {

  const insights: CompanionInsight[] = [];

  /*
   * FUTURO:
   *
   * 1. analisar manhã vs tarde
   * 2. analisar tendências de 7/14/30 dias
   * 3. cruzar humor com objetivos
   * 4. cruzar humor com hábitos
   * 5. cruzar humor com Impulso
   * 6. cruzar humor com Abraço
   * 7. identificar melhorias
   * 8. identificar padrões repetidos
   * 9. gerar recomendações
   */

  return insights;
}
