import React from "react";
import { useTranslation } from "react-i18next";

export const PatternWellbeingComparison: React.FC = () => {

  const { t } = useTranslation();

  const history = JSON.parse(
    localStorage.getItem(
      "confia_patterns_history_v1"
    ) || "[]"
  );


  const ratings = JSON.parse(
    localStorage.getItem(
      "confia_ratings_v2"
    ) || "[]"
  );


  if (!history.length || !ratings.length) {
    return null;
  }


const betterDates = history
  .filter((item:any) => item.value === "better")
  .map((item:any) =>
    item.date.slice(0,10)
  );


const betterRatings = ratings.filter(
  (item:any) =>
    betterDates.includes(item.date)
);


const normalRatings = ratings.filter(
  (item:any) =>
    !betterDates.includes(item.date)
);


const calculateAverage = (items:any[]) => {

  if(!items.length) return 0;

  return items.reduce(
    (sum,item)=>{

      const morning = item.morning || 0;
      const afternoon = item.afternoon || 0;

      return sum + ((morning + afternoon) / 2);

    },
    0
  ) / items.length;

};


const betterAverage =
  calculateAverage(betterRatings);


const normalAverage =
  calculateAverage(normalRatings);


  return (

    <div className="mt-6 bg-white rounded-3xl shadow-lg p-6">

      <h3 className="font-black text-xl">
        📊 {t("patterns.dashboard.wellbeing")}
      </h3>


      <p className="mt-4 text-[#7A5E57]">

        {t("patterns.dashboard.wellbeingMessage")}

      </p>


      <div className="mt-5 text-3xl font-black text-[#C97B5E]">

<div>
  🟢 {t("patterns.dashboard.betterDays")}

  <strong>
    {betterAverage.toFixed(1)}/10
  </strong>
</div>


<div className="mt-3">
  🟡 {t("patterns.dashboard.otherDays")}

  <strong>
    {normalAverage.toFixed(1)}/10
  </strong>
</div>

      </div>


    </div>

  );

};
