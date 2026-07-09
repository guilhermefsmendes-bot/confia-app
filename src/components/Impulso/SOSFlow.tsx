import React, { useState } from "react";
import type { SosStep } from "./types";

interface SOSFlowProps {
  onAddXp: (amount: number) => void;
}

export default function SOSFlow({ onAddXp }: SOSFlowProps) {
  const [step] = useState<SosStep>("welcome");

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm">
      <h2 className="text-xl font-black text-[#4E3B36]">
        Fluxo SOS
      </h2>

      <p className="text-slate-600 mt-3">
        Passo atual:
      </p>

      <div className="mt-2 font-bold text-[#C97B5E]">
        {step}
      </div>
    </div>
  );
}
