import React, { useState } from 'react';
import { triggerOptions, saveEpisode } from './Impulso';

interface ImpulsoSOSProps {
  onAddXp: (amount: number) => void;
}

export const ImpulsoSOS: React.FC<ImpulsoSOSProps> = ({ onAddXp }) => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [trigger, setTrigger] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [completed, setCompleted] = useState(false);

  const triggers = [
    '🧠 Ansiedade',
    '🌐 Vi algo na Internet',
    '❤️ Medo de estar doente',
    '📱 Recebi uma mensagem',
    '❓ Não sei'
  ];

  const finishImpulse = () => {
    setCompleted(true);
    onAddXp(20);
  };

  if (completed) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm text-center space-y-5">
        <div className="text-5xl">🎉</div>

        <h2 className="text-xl font-black text-[#4E3B36]">
          Excelente!
        </h2>

        <p className="text-sm text-slate-600">
          Conseguistes ultrapassar este impulso sem deixar que ele controlasse a tua decisão.
        </p>

        <div className="bg-[#FFF0E8] rounded-2xl p-4 text-[#C97B5E] font-bold">
          +20 XP conquistados
        </div>

        <button
          onClick={() => {
            setCompleted(false);
            setStarted(false);
            setStep(0);
            setTrigger('');
          }}
          className="w-full py-3 bg-[#E5A88B] text-white rounded-xl font-bold"
        >
          Novo momento
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {!started && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm text-center space-y-5">

          <div className="text-5xl">
            🆘
          </div>

          <h2 className="text-2xl font-black text-[#4E3B36] text-center">
  ⚡ Impulso
</h2>

<p className="text-sm text-slate-600 text-center leading-relaxed">
  Este momento não te define.
  <br /><br />
  Antes de procurares uma resposta,
  vamos atravessar este impulso juntos.
</p>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 bg-[#E5A88B] text-white rounded-2xl font-black"
          >
            🆘 COMEÇAR SOS
          </button>

        </div>
      )}


      {started && step === 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-5">

          <h3 className="font-black text-[#4E3B36]">
            Qual a intensidade deste impulso?
          </h3>

          <div className="text-center text-3xl font-black text-[#C97B5E]">
            {intensity}/10
          </div>

          <input
            type="range"
            min="0"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />

          <button
            onClick={() => setStep(1)}
            className="w-full py-3 bg-[#E5A88B] text-white rounded-xl font-bold"
          >
            Continuar
          </button>

        </div>
      )}


      {started && step === 1 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-4">

          <h3 className="font-black text-[#4E3B36]">
            O que desencadeou este impulso?
          </h3>

          {triggers.map(item => (
            <button
              key={item}
              onClick={() => {
                setTrigger(item);
                setStep(2);
              }}
              className="w-full p-4 bg-[#FAF5F0] rounded-xl text-left font-bold"
            >
              {item}
            </button>
          ))}

        </div>
      )}


      {started && step === 2 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-5">

          <h3 className="font-black text-[#4E3B36]">
            O teu cérebro está a tentar obter segurança.
          </h3>

          <p className="text-sm text-slate-600">
            A consulta pode aliviar durante alguns minutos,
            mas muitas vezes mantém o ciclo da ansiedade.
          </p>

          <div className="bg-[#FFF0E8] rounded-2xl p-4 text-sm">
            Gatilho identificado:
            <br />
            <strong>{trigger}</strong>
          </div>

          <button
            onClick={finishImpulse}
            className="w-full py-4 bg-[#E5A88B] text-white rounded-xl font-black"
          >
            Consegui esperar e controlar o impulso
          </button>

        </div>
      )}

    </div>
  );
};
