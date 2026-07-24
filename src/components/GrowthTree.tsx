import React from "react";
import { useTranslation } from "react-i18next";

interface GrowthTreeProps {
  level?: number;
}

export function GrowthTree({ level = 1 }: GrowthTreeProps) {
  const { t } = useTranslation();

  const getTree = () => {
    if (level <= 1) return "🌱";
    if (level === 2) return "🌿";
    if (level === 3) return "🌳";
    if (level === 4) return "🌲";
    return "🌸";
  };

  const getLevelName = () => {
    if (level <= 1) return t("treeLevel1");
    if (level === 2) return t("treeLevel2");
    if (level === 3) return t("treeLevel3");
    if (level === 4) return t("treeLevel4");
    return t("treeLevel5");
  };

  return (
    <div className="bg-white border border-[#E5A88B]/15 rounded-3xl p-6 shadow-sm text-center mb-6">

      <h2 className="text-xl font-bold text-[#4E3B36]">
        {t("treeTitle")}
      </h2>

      <p className="text-sm text-[#7A6158] mt-2 mb-5">
        {t("treeDescription")}
      </p>

      <div className="text-7xl mb-4">
        {getTree()}
      </div>

      <div className="font-bold text-[#4E3B36]">
        {getLevelName()}
      </div>

    </div>
  );
}
