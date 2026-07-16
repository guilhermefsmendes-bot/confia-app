import React, { useState, useEffect } from "react";
import { saveEpisode } from "./Impulso";
import ProgressBar from "./ProgressBar";

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

const triggers: Trigger[] = [
  "🌐 Vi algo na Internet",
  "🧠 Senti um sintoma",
  "💬 Alguém falou de doenças",
  "📱 Recebi uma mensagem",
  "❓ Não sei",
];

const emotions: Emotion[] = [
  "😨 Medo",
  "😟 Ansiedade",
  "😔 Tristeza",
  "😣 Frustração",
  "🤯 Confusão",
];

const thoughts: Thought[] = [
  "Tenho uma doença grave.",
  "Preciso confirmar.",
  "Isto nunca me aconteceu.",
  "Vou perder o controlo.",
  "Não sei.",
];

export const ImpulsoSOS: React.FC<ImpulsoSOSProps> = ({ onAddXp }) => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [intensity, setIntensity] = useState(5);
  const [finalIntensity, setFinalIntensity] = useState(5);
  
  // Estados de seleção
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [thought, setThought] = useState<Thought | null>(null);
  
  const [completed, setCompleted] = useState(false);

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

  // Função para gerar a frase terapêutica com base nas escolhas do utilizador
  const getJustificationPhrase = () => {
const getPsychoeducationMessage = () => {
  let message = "";

  // GATILHO
  switch (trigger) {
    case "🌐 Vi algo na Internet":
      message +=
        "Indicou que o impulso surgiu depois de ver informação na Internet. Quando estamos ansiosos, é muito comum procurar respostas online. Embora isso possa trazer algum alívio imediato, também aumenta a probabilidade de encontrar informação preocupante.\n\n";
      break;

    case "🧠 Senti um sintoma":
      message +=
        "Indicou que tudo começou após sentir um sintoma físico. Quando existe ansiedade, o cérebro tende a interpretar sensações normais do corpo como sinais de perigo.\n\n";
      break;

    case "💬 Alguém falou de doenças":
      message +=
        "Uma conversa sobre doenças pode ativar imediatamente preocupações relacionadas com a nossa própria saúde.\n\n";
      break;

    case "📱 Recebi uma mensagem":
      message +=
        "Algumas mensagens despertam preocupações e fazem o cérebro imaginar cenários negativos antes mesmo de existirem provas.\n\n";
      break;

    default:
      message +=
        "Nem sempre conseguimos identificar o que desencadeou o impulso. Isso é perfeitamente normal.\n\n";
  }

  // EMOÇÃO
  switch (emotion) {
    case "😨 Medo":
      message +=
        "O medo é uma resposta natural do cérebro perante aquilo que interpreta como um perigo.\n\n";
      break;

    case "😟 Ansiedade":
      message +=
        "A ansiedade prepara-nos para lidar com ameaças, mas por vezes ativa-se mesmo quando não existe um perigo real.\n\n";
      break;

    case "😔 Tristeza":
      message +=
        "Quando estamos tristes, é natural procurarmos algo que nos devolva rapidamente uma sensação de segurança.\n\n";
      break;

    case "😣 Frustração":
      message +=
        "A frustração leva frequentemente à procura de respostas imediatas para aliviar o desconforto.\n\n";
      break;

    case "🤯 Confusão":
      message +=
        "Quando existe confusão, é natural procurar certezas. O problema é que essa procura pode alimentar ainda mais a ansiedade.\n\n";
      break;
  }

  // PENSAMENTO
  switch (thought) {
    case "Tenho uma doença grave.":
      message +=
        "O pensamento 'Tenho uma doença grave' é muito frequente na ansiedade relacionada com a saúde. O facto de surgir não significa que seja verdadeiro.\n\n";
      break;

    case "Preciso confirmar.":
      message +=
        "A necessidade de confirmar repetidamente costuma trazer apenas um alívio temporário e acaba por reforçar novamente a ansiedade.\n\n";
      break;

    case "Isto nunca me aconteceu.":
      message +=
        "Situações novas podem parecer mais perigosas do que realmente são, sobretudo quando estamos ansiosos.\n\n";
      break;

    case "Vou perder o controlo.":
      message +=
        "Sentir que vai perder o controlo é uma experiência comum durante momentos de ansiedade intensa. Felizmente, essa sensação tende a diminuir à medida que a ansiedade baixa.\n\n";
      break;

    default:
      message +=
        "Nem sempre conseguimos identificar claramente o pensamento principal. Isso também faz parte da ansiedade.\n\n";
  }

  message +=
    "Neste momento, o objetivo não é eliminar imediatamente a ansiedade. O objetivo é ensinar o cérebro que consegue tolerar esta sensação sem recorrer à pesquisa ou à procura constante de garantias.";

  return message;
};
    // Remove os emojis do texto para a frase soar mais natural
    const tGatilho = trigger ? trigger.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim() : "uma incerteza";
    const tEmocao = emotion ? emotion.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim().toLowerCase() : "apreensão";
    const tPensamento = thought ? thought.replace(/\.$/, '') : "precisa de confirmar algo";

    return `Notei que quando ocorreu "${tGatilho}", a sua mente reagiu com ${tEmocao} sob o pensamento de que "${tPensamento}". Lembre-se de que isto é apenas um momento de forte apreensão do seu sistema de alerta, e não um facto real. O seu corpo está apenas a tentar proteger-se. Respire e acolha este sinal de forma positiva: ele mostra o quanto se importa consigo, mas agora está em segurança.`;
  };

  const finishSOS = () => {
    saveEpisode({
      createdAt: new Date().toISOString(),
      initialIntensity: intensity,
      finalIntensity,
      completed: true,
      xpEarned: 30,
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
      <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>🎉 Concluído com Sucesso!</h2>
        <p>Parabéns por acolher a sua mente e gerir o seu impulso. Ganhou 30 XP!</p>
      </div>
    );
  }

  // 2. Ecrã Inicial (Passo 0)
  if (!started) {
    return (
      <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Instante SOS 🚨</h2>
        <p>Sente um impulso ou ansiedade? Vamos focar-nos e gerir isto juntos.</p>
        <button 
          onClick={() => { setStarted(true); setStep(1); }}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", marginTop: "15px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold" }}
        >
          Começar Exercício
        </button>
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
      <p style={{ textAlign: "right", fontSize: "12px", color: "#666", margin: "5px 0 20px 0" }}>Progresso: {progress}%</p>

      {/* Conteúdo Dinâmico dos Passos */}
      <div style={{ margin: "20px 0", minHeight: "260px" }}>
        {step === 1 && (
          <div>
            <h3>Passo 1: Qual é a intensidade atual do seu impulso? (1 a 10)</h3>
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
            <h3>Passo 2: O que despoletou este impulso?</h3>
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
            <h3>Passo 3: Que emoção está a acompanhar este impulso?</h3>
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
            <h3>Passo 4: Qual é o pensamento principal na sua mente?</h3>
            {thoughts.map((t) => (
              <button 
                key={t} 
                onClick={() => setThought(t)}
                style={{ display: "block", width: "100%", margin: "8px 0", padding: "10px", background: thought === t ? "#d1e7dd" : "#f8f9fa", border: thought === t ? "1px solid #198754" : "1px solid #ccc", borderRadius: "4px", textAlign: "left", cursor: "pointer" }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
{step === 5 && (
  <div style={{ lineHeight: "1.8" }}>
    <h3>🧠 Passo 5: Compreender o que está a acontecer</h3>

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
          Como funciona o ciclo da ansiedade
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
          😟 Ansiedade
          <br />
          ↓
          <br />
          🔍 Pesquisa / Consulta
          <br />
          ↓
          <br />
          😌 Alívio temporário
          <br />
          ↓
          <br />
          ❓ Novas dúvidas
          <br />
          ↓
          <br />
          😟 Mais ansiedade
        </div>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#555",
            fontStyle: "italic",
          }}
        >
          Cada vez que interrompe este ciclo, está a ensinar o seu cérebro que
          consegue lidar com a ansiedade sem recorrer à procura constante de
          garantias.
        </p>
      </div>
    </div>
  </div>
)}
        {step === 6 && (
          <div style={{ textAlign: "center", lineHeight: "1.8" }}>
            <h3>Passo 6: Vamos respirar um pouco 🧘</h3>
            <p><strong>Inspire</strong> profundamente pelo nariz (4s)...</p>
            <p><strong>Retenha</strong> o ar nos pulmões (4s)...</p>
            <p><strong>Expire</strong> lentamente pela boca (4s).</p>
            <p style={{ fontStyle: "italic", marginTop: "20px", color: "#666" }}>Faça isto mais duas vezes antes de avançar.</p>
          </div>
        )}

        {step === 7 && (
          <div style={{ textAlign: "center", lineHeight: "1.5" }}>
            <h3>Passo 7: Âncora de Gratidão (3 Minutos) 📝</h3>
            
            {/* Caixa de Texto Dinâmica */}
            <div style={{ fontSize: "14px", color: "#2c3e50", backgroundColor: "#eef2f7", padding: "15px", borderRadius: "6px", textAlign: "left", borderLeft: "4px solid #0d6efd", marginBottom: "15px" }}>
              {getJustificationPhrase()}
            </div>

            <p style={{ fontSize: "15px" }}>
              Pegue agora numa <strong>folha de papel e caneta</strong>. Escreva um pensamento detalhado de agradecimento sobre algo positivo que o eleve genuinamente (ex: um momento especial com o seu filho, um abraço caloroso, ou algo bom do seu dia).
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
                {timerRunning ? "Pausa" : "Iniciar Tempo"}
              </button>
              <button 
                onClick={() => { setTimerRunning(false); setTimeLeft(180); }}
                style={{ marginLeft: "10px", padding: "8px 16px", background: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div>
            <h3>Passo 8: Como avalia a sua intensidade agora após o exercício?</h3>
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
          Voltar
        </button>
        <button 
          onClick={nextStep} 
          style={{ padding: "10px 20px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          {step === totalSteps ? "Terminar" : "Avançar"}
        </button>
      </div>
    </div>
  );
};
