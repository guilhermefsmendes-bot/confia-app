import React from "react";
import { useTranslation } from "react-i18next";

export const PatternEvolution: React.FC = () => {

  const { t } = useTranslation();


  const history = JSON.parse(
    localStorage.getItem(
      "confia_patterns_history_v1"
    ) || "[]"
  );


  const lastDays = history.slice(-7);


  const score = lastDays.reduce(
    (total:any, item:any) => {

      if(item.value === "better")
        return total + 1;

      if(item.value === "harder")
        return total - 1;

      return total;

    },
    0
  );


  const percentage = Math.max(
    0,
    Math.min(
      100,
      50 + (score * 10)
    )
  );


  return (

    <div className="mt-6 bg-white rounded-3xl shadow-lg p-6">

      <h3 className="font-black text-xl">
        📈 {t("patterns.dashboard.evolution")}
      </h3>


      <div className="mt-4 h-4 bg-[#EEE5DF] rounded-full">

        <div
          className="h-4 rounded-full bg-[#C97B5E]"
          style={{
            width:`${percentage}%`
          }}
        />

      </div>


      <p className="mt-4 text-[#7A5E57]">

        {percentage}%

      </p>


    </div>

  );

};
