import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

const habits = [
  "search",
  "social",
  "series",
  "games",
  "smoking",
  "alcohol",
  "emotionalEating",
  "caffeine",
  "shopping",
  "confirmation",
  "other"
];

const levels = [
  "veryLow",
  "low",
  "moderate",
  "high",
  "veryHigh"
];

export default function HabitAssessment({ onBack }: Props) {

  const { t } = useTranslation();

  const [selected, setSelected] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string,string>>({});


  function toggleHabit(habit:string){

    if(selected.includes(habit)){
      setSelected(selected.filter(h => h !== habit));
    } 
    else {
      setSelected([...selected, habit]);
    }

  }


  function saveAssessment(){

    localStorage.setItem(
      "confia_habit_assessment",
      JSON.stringify(ratings)
    );

    alert(t("patterns.saved"));

  }


  return (

    <div className="min-h-screen p-6 bg-white">


      <button
        onClick={onBack}
        className="mb-6 text-[#7A5E57]"
      >
        ← {t("back")}
      </button>


      <h1 className="text-2xl font-bold text-[#4A352F] mb-3">
        🧠 {t("patterns.assessmentTitle")}
      </h1>


      <p className="text-[#7A5E57] mb-6">
        {t("patterns.assessmentDescription")}
      </p>


      <div className="space-y-3">


        {habits.map(habit => (

          <button
            key={habit}
            onClick={() => toggleHabit(habit)}
            className={`w-full p-4 rounded-xl text-left ${
              selected.includes(habit)
              ? "bg-[#DDE8D5]"
              : "bg-[#F7F1EA]"
            }`}
          >

            {selected.includes(habit) ? "✅ " : ""}
            {t(`patterns.habits.${habit}`)}

          </button>

        ))}


      </div>



      {selected.length > 0 && (

        <div className="mt-8">


          <h2 className="font-semibold text-lg mb-4">
            {t("patterns.classify")}
          </h2>



          {selected.map(habit => (

            <div key={habit} className="mb-5">


              <p className="mb-2 font-medium">
                {t(`patterns.habits.${habit}`)}
              </p>



              <div className="grid grid-cols-5 gap-2">


                {levels.map((level,index)=>(


                  <button
                    key={level}
                    onClick={() =>
                      setRatings({
                        ...ratings,
                        [habit]: level
                      })
                    }

                    className={`p-2 rounded-lg text-xs ${
                      ratings[habit] === level
                      ? "bg-[#C8B6A6]"
                      : "bg-[#F7F1EA]"
                    }`}
                  >

                    {index + 1}

                  </button>


                ))}


              </div>


            </div>


          ))}



          {Object.keys(ratings).length === selected.length && (

            <button
              onClick={saveAssessment}
              className="w-full mt-6 p-4 rounded-xl bg-[#7A5E57] text-white font-semibold"
            >

              {t("patterns.save")}

            </button>

          )}


        </div>

      )}


    </div>

  );

}
