import React from "react";
import { useTranslation } from "react-i18next";

export const PatternEvolution: React.FC = () => {

const { t, i18n } = useTranslation();

console.log("IDIOMA ATUAL:", i18n.language);

  const history = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "confia_patterns_history_v1"
        ) || "[]"
      );
    } catch {
      return [];
    }
  })();


  const lastDays = history.slice(-7);


  const betterDays = lastDays.filter(
    (item:any) => item.value === "better"
  ).length;


  const harderDays = lastDays.filter(
    (item:any) => item.value === "harder"
  ).length;


  const pattern = lastDays.length > 0
    ? lastDays[lastDays.length - 1].pattern
    : null;


  const percentage = Math.max(
    0,
    Math.min(
      100,
      50 + ((betterDays - harderDays) * 10)
    )
  );


  const getMessage = () => {

    if (!pattern) {
      return t("patterns.evolution.smallProgress");
    }


    const key =
      betterDays > 0
      ? `patterns.evolution.messages.${pattern}`
      : "patterns.evolution.smallProgress";


    return t(key);

  };


  return (

    <div className="mt-6 bg-white rounded-3xl shadow-lg p-6">


      <h3 className="font-black text-xl text-[#4E3B36]">
        📈 {t("patterns.evolution.title")}
      </h3>


      <p className="mt-2 text-[#7A5E57]">
        {t("patterns.evolution.lastSevenDays")}
      </p>


      <div className="mt-5 h-4 bg-[#EEE5DF] rounded-full">

        <div
          className="h-4 rounded-full bg-[#C97B5E]"
          style={{
            width:`${percentage}%`
          }}
        />

      </div>


      <div className="mt-5 space-y-2 text-[#5B4540]">


        <p>
{t("patterns.evolution.smallProgress")}
        </p>


        {betterDays > 0 && (
          <p>
            ✅ {t("patterns.evolution.betterDays")} {betterDays}
          </p>
        )}


        {harderDays > 0 && (
          <p>
            💪 {t("patterns.evolution.harderDays")} {harderDays}
          </p>
        )}


        <p className="mt-4">
          {getMessage()}
        </p>


      </div>


    </div>

  );

};
