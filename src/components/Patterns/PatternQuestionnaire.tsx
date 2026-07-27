import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { QUESTIONS } from "./questions";
import { savePatternProfile } from "./storage";

interface PatternQuestionnaireProps {
  onFinish?: () => void;
}

const OPTIONS = [
  "never",
  "rarely",
  "sometimes",
  "often",
  "almostAlways",
];

export const PatternQuestionnaire: React.FC<PatternQuestionnaireProps> = ({
  onFinish,
}) => {
  const { t } = useTranslation();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const question = QUESTIONS[currentQuestion];

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

if (currentQuestion === QUESTIONS.length - 1) {

  savePatternProfile({
    completed: true,
    answers: newAnswers,
    createdAt: new Date().toISOString(),
  });

  onFinish?.();
  return;
}
    setCurrentQuestion((prev) => prev + 1);
  };

  return (
    <div className="bg-[#FFF8F5] rounded-2xl p-5">

      <h2 className="text-xl font-black text-[#4E3B36] mb-2">
        🌱 {t("patterns.questionnaire.title")}
      </h2>

      <p className="text-sm text-[#7A5E57] mb-6">
        {currentQuestion + 1} / {QUESTIONS.length}
      </p>

      <div className="bg-white rounded-xl p-5 mb-6">

        <p className="text-lg font-semibold text-[#4E3B36]">
          {t(question.translationKey)}
        </p>

      </div>

      <div className="space-y-3">

        {OPTIONS.map((option, index) => (

          <button
            key={option}
            onClick={() => handleAnswer(index)}
            className="w-full rounded-xl border border-[#E5D4CB] bg-white p-4 text-left hover:bg-[#FFF3EE]"
          >
            {t(`patterns.answers.${option}`)}
          </button>

        ))}

      </div>

    </div>
  );
};
