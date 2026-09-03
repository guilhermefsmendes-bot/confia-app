import os
import shutil
from datetime import datetime

BASE = "src/components/Companheiro"

print()
print("==============================================")
print("       CRIAÇÃO DA BASE DO COMPANHEIRO")
print("==============================================")
print()

# ------------------------------------------------
# 1. Criar diretórios
# ------------------------------------------------

os.makedirs(BASE, exist_ok=True)

print(f"✓ Diretório criado/verificado: {BASE}")

# ------------------------------------------------
# 2. Criar companionAnalysis.ts
# ------------------------------------------------

analysis_file = os.path.join(BASE, "companionAnalysis.ts")

analysis_content = r'''/**
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
'''

with open(analysis_file, "w", encoding="utf-8") as f:
    f.write(analysis_content)

print(f"✓ Criado: {analysis_file}")

# ------------------------------------------------
# 3. Criar Companion.tsx
# ------------------------------------------------

component_file = os.path.join(BASE, "Companion.tsx")

component_content = r'''import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompanionProps {
  avatarLevel?: number;
  avatarXp?: number;
}

export default function Companion({
  avatarLevel = 1,
  avatarXp = 0,
}: CompanionProps) {

  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-6"
    >

      {/* Cabeçalho */}

      <div className="flex items-center gap-3">

        <div className="w-12 h-12 rounded-2xl bg-[#FFF0E8] flex items-center justify-center text-2xl">
          🌱
        </div>

        <div>
          <h2 className="text-xl font-black text-[#4E3B36]">
            {t("companionTitle")}
          </h2>

          <p className="text-xs text-slate-400 font-medium">
            {t("companionSubtitle")}
          </p>
        </div>

      </div>


      {/* Mensagem principal */}

      <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-3">

          <Sparkles
            size={16}
            className="text-[#C97B5E]"
          />

          <span className="text-[10px] font-black uppercase tracking-widest text-[#C97B5E]">
            {t("companionToday")}
          </span>

        </div>

        <p className="text-sm leading-relaxed text-[#4E3B36] font-medium">
          {t("companionInitialMessage")}
        </p>

      </div>


      {/* Observação */}

      <div className="bg-[#FFF9F5] border border-[#E5A88B]/20 rounded-3xl p-5">

        <div className="flex items-center gap-2 mb-3">

          <TrendingUp
            size={16}
            className="text-[#C97B5E]"
          />

          <h3 className="text-sm font-black text-[#4E3B36]">
            {t("companionObservationTitle")}
          </h3>

        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {t("companionObservationInitial")}
        </p>

      </div>


      {/* Pequena sugestão */}

      <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5">

        <div className="flex items-center gap-2 mb-3">

          <Heart
            size={16}
            className="text-[#C97B5E]"
          />

          <h3 className="text-sm font-black text-[#4E3B36]">
            {t("companionSuggestionTitle")}
          </h3>

        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {t("companionSuggestionInitial")}
        </p>

      </div>


      {/* Informação técnica discreta */}

      <div className="text-center text-[9px] text-slate-300">
        {t("companionDataInfo")}
      </div>

    </motion.div>
  );
}
'''

with open(component_file, "w", encoding="utf-8") as f:
    f.write(component_content)

print(f"✓ Criado: {component_file}")

# ------------------------------------------------
# 4. Criar backup do App.tsx
# ------------------------------------------------

app_file = "src/App.tsx"

if os.path.exists(app_file):

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    backup = f"src/App.tsx.backup_companion_base_{timestamp}"

    shutil.copy2(app_file, backup)

    print(f"✓ Backup criado: {backup}")

else:
    print("⚠ App.tsx não encontrado")

# ------------------------------------------------
# 5. Resumo
# ------------------------------------------------

print()
print("==============================================")
print("BASE DO COMPANHEIRO CRIADA")
print("==============================================")
print()
print("✓ companionAnalysis.ts")
print("✓ Companion.tsx")
print("✓ Backup do App.tsx")
print()
print("IMPORTANTE:")
print("Nenhuma funcionalidade existente foi alterada.")
print("Ainda não ligámos o companheiro aos dados reais.")
print()
print("PRÓXIMO PASSO:")
print("Vamos identificar exatamente onde a Confia")
print("guarda os registos de humor, objetivos, hábitos,")
print("Impulso e restantes dados.")
print()
