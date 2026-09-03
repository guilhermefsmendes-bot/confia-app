import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

interface DailyRecord {
  date: string;
  level: string;
}

export default function HabitEvolution({ onBack }: Props) {
  const { t } = useTranslation();

  const [record, setRecord] = useState<DailyRecord | null>(null);


  useEffect(() => {

    const saved = localStorage.getItem("confia_habits_daily");

    if (saved) {
      setRecord(JSON.parse(saved));
    }

  }, []);


  return (
    <div className="min-h-screen p-6 bg-white">


      <button
        onClick={onBack}
        className="mb-6 text-[#7A5E57]"
      >
← {t("back")}
      </button>


      <h1 className="text-2xl font-bold text-[#4A352F] mb-4">
        📊 A minha evolução
      </h1>
📊 {t("patternsNew.evolution")}

      <p className="text-[#7A5E57] mb-6">
{t("patternsNew.evolutionDescription")}
      </p>


      {!record && (

        <div className="p-5 rounded-2xl bg-[#F7F1EA]">

          <p>
{t("patternsNew.noRecords")}
          </p>

          <p className="text-sm mt-2">
{t("patternsNew.startEvolution")}
          </p>

        </div>

      )}


      {record && (

        <div className="p-5 rounded-2xl bg-[#F7F1EA]">

          <h2 className="font-semibold mb-3">
{t("patternsNew.lastRecord")}
          </h2>


          <p>
📅 {t("patternsNew.date")}: {record.date}
          </p>


          <p className="mt-2">
🌱 {t("patternsNew.habitManagement")}: <strong>{record.level}</strong>
          </p>


        </div>

      )}


    </div>
  );
}
