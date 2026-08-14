import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { collectCompanionData } from "../../data/companionData";
import { analyzeCompanionData } from "../../data/companionEngine";

interface CompanionProps {
  avatarLevel?: number;
  avatarXp?: number;
}

function Companion({
  avatarLevel = 1,
  avatarXp = 0,
}: CompanionProps) {

  const { t } = useTranslation();

  /*
   * O Companheiro lê os dados existentes da aplicação
   * e não cria um sistema de registos paralelo.
   */
  const analysis = useMemo(() => {

    try {

      const data = collectCompanionData();

      return analyzeCompanionData(data);

    } catch (error) {

      console.error(
        "COMPANHEIRO: erro ao analisar dados",
        error
      );

      return null;
    }

  }, []);

  /*
   * Mensagens personalizadas
   *
   * O motor determina o sinal mais forte.
   * O componente traduz o resultado através do i18n.
   */
  const signal = analysis?.strongestSignal || "insufficient";

  const mainMessage = analysis
    ? t(`companionMessage${signal.charAt(0).toUpperCase() + signal.slice(1)}`)
    : t("companionInitialMessage");

  const suggestion = analysis
    ? t(`companionSuggestion${signal.charAt(0).toUpperCase() + signal.slice(1)}`)
    : t("companionSuggestionInitial");

  const gratitude = analysis
    ? t(`companionGratitude${signal.charAt(0).toUpperCase() + signal.slice(1)}`)
    : t("companionGratitudeInsufficient");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-6"
    >

      {/* CABEÇALHO */}

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


      {/* MENSAGEM PRINCIPAL */}

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
          {mainMessage}
        </p>

      </div>


      {/* OBSERVAÇÃO */}

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
          {suggestion}
        </p>

      </div>


      {/* GRATIDÃO */}

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
          {gratitude}
        </p>

      </div>


      {/* INFORMAÇÃO TÉCNICA DISCRETA */}

      <div className="text-center text-[9px] text-slate-300">
        {t("companionDataInfo")}
      </div>

    </motion.div>
  );
}

export default memo(Companion);
