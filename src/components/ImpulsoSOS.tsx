import React, { useState, useEffect } from "react";
import { saveEpisode } from "./Impulso";
import ProgressBar from "./ProgressBar";
import { useTranslation } from "react-i18next";
import {
  analyzeReactiveState,
} from "../data/reactive/reactiveEngine";
import {
  recordReactiveResponse,
} from "../data/reactive/reactiveHistoryStorage";
interface ImpulsoSOSProps {
  onAddXp: (amount: number) => void;
}

type Trigger =
  | "🌐 Vi algo na Internet"
  | "🧠 Senti um sintoma"
  | "💬 Alguém falou de doenças"
  | "📱 Recebi uma mensagem"
  | "❓ Não sei";

type Emotion =
  | "😨 Medo"
  | "😟 Ansiedade"
  | "😔 Tristeza"
  | "😣 Frustração"
  | "🤯 Confusão";

type Thought =
  | "Tenho uma doença grave."
  | "Preciso confirmar."
  | "Isto nunca me aconteceu."
  | "Vou perder o controlo."
  | "Não sei.";


export const ImpulsoSOS: React.FC<ImpulsoSOSProps> = ({ onAddXp }) => {
const { t } = useTranslation();
const triggers = [
  t("triggerInternet"),
  t("triggerSymptom"),
  t("triggerDiseaseTalk"),
  t("triggerMessage"),
  t("triggerUnknown"),
];

const emotions = [
  t("emotionFear"),
  t("emotionAnxiety"),
  t("emotionSadness"),
  t("emotionFrustration"),
  t("emotionConfusion"),
];

const thoughts = [
  t("thoughtSeriousDisease"),
  t("thoughtNeedConfirm"),
  t("thoughtNeverHappened"),
  t("thoughtLoseControl"),
  t("thoughtDontKnow"),
];
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [intensity, setIntensity] = useState(5);
  const [finalIntensity, setFinalIntensity] = useState(5);
const lastUse = localStorage.getItem("confia_last_impulse_use_v1");

const impulseCount = Number(
  localStorage.getItem("confia_impulse_count_v1") || "0"
);

const daysWithoutUse =
  lastUse !== null
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(lastUse).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // Estados de seleção
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [thought, setThought] = useState<Thought | null>(null);
  
  const [completed, setCompleted] = useState(false);
  const [reactiveMessageKey, setReactiveMessageKey] =
    useState<string | null>(null);

  // Estados do Cronómetro (180 segundos = 3 minutos)
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  // Atualizado para 7 passos no total
  const totalSteps = 8;
  const progress = Math.round((step / totalSteps) * 100);

  // Lógica do efeito do Cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // Formatar segundos em MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
const getJustificationPhrase = () => {
  const tGatilho = trigger ? trigger.replace(/^[^w]*/, "") : t("unexpectedTrigger");
  const tEmocao = emotion ? emotion.toLowerCase() : t("apprehension");
  const tPensamento = thought ? thought.replace(/\.$/, "") : t("needsConfirmation");

  return t("justificationPhrase", {
    trigger: tGatilho,
    emotion: tEmocao,
    thought: tPensamento
  });
};

const getPsychoeducationMessage = () => {
  switch (trigger) {
    case "🌐 Vi algo na Internet":
      return t("psychoInternet");

    case "🧠 Senti um sintoma":
      return t("psychoSymptom");

    case "💬 Alguém falou de doenças":
      return t("psychoDiseaseTalk");

    default:
      return t("psychoDefault");
  }
};


  const finishSOS = () => {
    /**
     * Guardar primeiro o episódio.
     *
     * O motor reativo consegue assim analisar imediatamente
     * a diferença entre intensidade inicial e final.
     */
    saveEpisode({
      createdAt: new Date().toISOString(),
      initialIntensity: intensity,
      finalIntensity,
      completed: true,
      xpEarned: 30,
    });

    const reactiveResult = analyzeReactiveState({
      source: "impulse",
      initialIntensity: intensity,
      finalIntensity,
    });

    setReactiveMessageKey(
      reactiveResult.response.translationKey
    );

    /**
     * Esta resposta foi provocada diretamente
     * pela conclusão de um Impulso.
     */
    recordReactiveResponse({
      responseId: reactiveResult.response.id,
      situation: reactiveResult.situation,
      intent: reactiveResult.intent,
      timestamp: new Date().toISOString(),
    });

    onAddXp(30);
    setCompleted(true);
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishSOS();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // 1. Ecrã de Conclusão (Sucesso)
  if (completed) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <h2>{t("sosCompleted")}</h2>

        <p>{t("impulseCongratulations")}</p>

        {reactiveMessageKey && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid #E8DDD7",
              background: "#FFF9F5",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: "#FFFFFF",
                }}
              >
                ✨
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#4E3B36",
                  }}
                >
                  Confia
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#64748B",
                  }}
                >
                  {t(reactiveMessageKey)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Ecrã Inicial (Passo 0)
  if (!started) {
    return (
      <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>{t("sosMoment")}</h2>
        <p>{t("sosDescription")}</p>
        <button 
onClick={() => {
  localStorage.setItem(
    "confia_last_impulse_use_v1",
    new Date().toISOString()
  );

  const count = Number(
    localStorage.getItem("confia_impulse_count_v1") || "0"
  );

  localStorage.setItem(
    "confia_impulse_count_v1",
    String(count + 1)
  );

  setStarted(true);
  setStep(1);
}}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", marginTop: "15px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold" }}
        >
          {t("startExercise")}
        </button>
<div
  style={{
    marginTop: "18px",
    padding: "14px",
    borderRadius: "12px",
    background: "#F8F1EA",
    border: "1px solid #E5A88B",
    textAlign: "left"
  }}
>
<strong>🛡️ {t("impulseHistoryTitle")}</strong>

  <p style={{ marginTop: "10px" }}>
    {lastUse
     ? t("impulseLastUsed", { days: daysWithoutUse })
     : t("impulseNeverUsed")}
  </p>

  <p>
   {t("impulseTotalUses", { count: impulseCount })}
  </p>
</div>
      </div>
    );
  }

  // 3. Layout Principal do Exercício
  return (
    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* Barra de Progresso */}
      <div style={{ background: "#eee", borderRadius: "5px", height: "10px", width: "100%" }}>
        <div style={{ background: "#4CAF50", height: "10px", borderRadius: "5px", width: `${progress}%`, transition: "width 0.3s" }}></div>
      </div>
      <p style={{ textAlign: "right", fontSize: "12px", color: "#666", margin: "5px 0 20px 0" }}>{t("progress")}: {progress}%</p>

      {/* Conteúdo Dinâmico dos Passos */}
      <div style={{ margin: "20px 0", minHeight: "260px" }}>
        {step === 1 && (
          <div>
            <h3>{t("impulseStep1")}</h3>
            <input 
              type="range" min="1" max="10" 
              value={intensity} 
              onChange={(e) => setIntensity(Number(e.target.value))} 
              style={{ width: "100%" }}
            />
            <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "24px", color: "#0d6efd" }}>{intensity}</p>
          </div>
        )}

        {step === 2 && (
          <div>
           <h3>{t("impulseStep2")}</h3>
            {triggers.map((t) => (
              <button 
                key={t} 
                onClick={() => setTrigger(t)}
                style={{ display: "block", width: "100%", margin: "8px 0", padding: "10px", background: trigger === t ? "#d1e7dd" : "#f8f9fa", border: trigger === t ? "1px solid #198754" : "1px solid #ccc", borderRadius: "4px", textAlign: "left", cursor: "pointer" }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
           <h3>{t("impulseStep3")}</h3>
            {emotions.map((e) => (
              <button 
                key={e} 
                onClick={() => setEmotion(e)}
                style={{ display: "block", width: "100%", margin: "8px 0", padding: "10px", background: emotion === e ? "#d1e7dd" : "#f8f9fa", border: emotion === e ? "1px solid #198754" : "1px solid #ccc", borderRadius: "4px", textAlign: "left", cursor: "pointer" }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
{step === 4 && (
        <div>
         <h3>{t("impulseStep4")}</h3>
          {thoughts.map((t) => (
            <button
              key={t}
              onClick={() => {
                setThought(t);
                setStep(5); // <-- Adicionado para avançar para o Passo 5!
              }}
              style={{
                display: "block",
                width: "100%",
                margin: "8px 0",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #E8DDD2",
                background: "#FFFFFF",
                cursor: "pointer",
                fontSize: "16px",
                textAlign: "left"
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
{step === 5 && (
  <div style={{ lineHeight: "1.8" }}>
   <h3>🧠 {t("impulseStep5")}</h3>
<div
  style={{
    background: "#FFFFFF",
    border: "1px solid #E8DDD2",
    borderRadius: "10px",
    padding: "18px",
    marginTop: "18px",
    marginBottom: "20px",
  }}
>



  <h4
    style={{
      textAlign: "center",
      color: "#8B5E3C",
      marginTop: 0,
      marginBottom: "20px",
    }}
  >
   {t("identifiedSoFar")}
  </h4>

  <div style={{ marginBottom: "15px" }}>
   <strong>📍 {t("trigger")}</strong>
    <div style={{ marginTop: "6px", fontSize: "17px" }}>
      {trigger}
    </div>
  </div>

  <hr />

  <div style={{ margin: "15px 0" }}>
   <strong>❤️ {t("emotion")}</strong>
    <div style={{ marginTop: "6px", fontSize: "17px" }}>
      {emotion}
    </div>
  </div>

  <hr />

  <div style={{ marginTop: "15px" }}>
   <strong>💭 {t("thought")}</strong>
    <div style={{ marginTop: "6px", fontSize: "17px" }}>
      {thought}
    </div>
  </div>
</div>
    <div
      style={{
        background: "#FFF8F2",
        border: "1px solid #F1D4B8",
        borderRadius: "8px",
        padding: "18px",
        marginTop: "15px",
      }}
    >
      <div
        style={{
          whiteSpace: "pre-line",
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#4A3A2A",
          marginBottom: "25px",
        }}
      >
        {getPsychoeducationMessage()}
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "8px",
          padding: "18px",
          border: "1px solid #E7D8C9",
        }}
      >
        <h4
          style={{
            textAlign: "center",
            marginBottom: "18px",
            color: "#8B5E3C",
          }}
        >
         {t("anxietyCycle")}
        </h4>

        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            lineHeight: "2",
            color: "#6B4F3A",
            fontSize: "16px",
          }}
        >
         😟 {t("cycleAnxiety")}
          <br />
          ↓
          <br />
          🔍 {t("cycleSearch")}
          <br />
          ↓
          <br />
         😌 {t("cycleTemporaryRelief")}
          <br />
          ↓
          <br />
          ❓ {t("cycleNewDoubts")}
          <br />
          ↓
          <br />
          😟 {t("cycleMoreAnxiety")}
        </div>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#555",
            fontStyle: "italic",
          }}
        >
         {t("cycleExplanation")}
        </p>
      </div>
    </div>
  </div>
)}
        {step === 6 && (
          <div style={{ textAlign: "center", lineHeight: "1.8" }}>
           <h3>{t("impulseStep6")}</h3>
            <strong>{t("inhale")}</strong> {t("inhaleDescription")}
           <strong>{t("holdBreath")}</strong> {t("holdBreathDescription")}
           <strong>{t("exhale")}</strong> {t("exhaleDescription")}
            <p style={{ fontStyle: "italic", marginTop: "20px", color: "#666" }}>{t("repeatBreathing")}</p>
          </div>
        )}

        {step === 7 && (
          <div style={{ textAlign: "center", lineHeight: "1.5" }}>
           <h3>{t("impulseStep7")}</h3>
            
            {/* Caixa de Texto Dinâmica */}
            <div style={{ fontSize: "14px", color: "#2c3e50", backgroundColor: "#eef2f7", padding: "15px", borderRadius: "6px", textAlign: "left", borderLeft: "4px solid #0d6efd", marginBottom: "15px" }}>
              {getJustificationPhrase()}
            </div>

            <p style={{ fontSize: "15px" }}>
             {t("gratitudeExercise")}
            </p>

            {/* Secção do Cronómetro */}
            <div style={{ margin: "20px 0" }}>
              <div style={{ fontSize: "36px", fontWeight: "bold", fontFamily: "monospace", color: timeLeft < 30 ? "#dc3545" : "#333" }}>
                {formatTime(timeLeft)}
              </div>
              <button 
                onClick={() => setTimerRunning(!timerRunning)}
                style={{ marginTop: "10px", padding: "8px 16px", background: timerRunning ? "#ffc107" : "#198754", color: timerRunning ? "#000" : "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
               {timerRunning ? t("pause") : t("startTimer")}
              </button>
              <button 
                onClick={() => { setTimerRunning(false); setTimeLeft(180); }}
                style={{ marginLeft: "10px", padding: "8px 16px", background: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
               {t("reset")}
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div>
           <h3>{t("impulseStep8")}</h3>
            <input 
              type="range" min="1" max="10" 
              value={finalIntensity} 
              onChange={(e) => setFinalIntensity(Number(e.target.value))} 
              style={{ width: "100%" }}
            />
            <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "24px", color: "#198754" }}>{finalIntensity}</p>
          </div>
        )}
      </div>

      {/* Botões de Navegação (Rodapé) */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
        <button 
          onClick={prevStep} 
          disabled={step === 1} 
          style={{ padding: "10px 20px", cursor: "pointer", background: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
        >
          {t("back")}
        </button>
        <button 
          onClick={nextStep} 
          style={{ padding: "10px 20px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
         {step === totalSteps ? t("finish") : t("next")}
        </button>
      </div>
    </div>
  );
};
