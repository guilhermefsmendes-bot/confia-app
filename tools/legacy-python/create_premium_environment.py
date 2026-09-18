from pathlib import Path
import shutil
import sys

path = Path("src/components/world/PremiumEnvironment.tsx")

if path.exists():
    shutil.copy2(path, "/tmp/PremiumEnvironment.tsx.before_1B4B4")

content = r'''import React, { memo } from "react";

interface Props {
  level: number;
}

function PremiumEnvironment({ level }: Props) {
  return (
    <>
      {/* ======================================================
          NÍVEL 2 — JARDIM
          Crescimento delicado junto ao refúgio
         ====================================================== */}
      {level >= 2 && (
        <>
          <div
            className="
              absolute
              bottom-[28%]
              left-[17%]
              z-[19]
              h-14
              w-24
              pointer-events-none
            "
            aria-hidden="true"
          >
            {/* folhas */}
            <span className="absolute bottom-0 left-3 h-8 w-3 -rotate-[18deg] rounded-[100%_0] bg-emerald-700/80" />
            <span className="absolute bottom-0 left-8 h-10 w-3 rotate-[14deg] rounded-[100%_0] bg-emerald-800/75" />
            <span className="absolute bottom-0 left-14 h-7 w-3 -rotate-[12deg] rounded-[100%_0] bg-emerald-700/75" />
            <span className="absolute bottom-0 left-[76px] h-9 w-3 rotate-[16deg] rounded-[100%_0] bg-emerald-800/70" />

            {/* flores */}
            <span className="absolute bottom-7 left-2 h-3.5 w-3.5 rounded-full bg-[#D88978] ring-2 ring-[#F1C5B5]/70" />
            <span className="absolute bottom-9 left-8 h-3 w-3 rounded-full bg-[#E7B36D] ring-2 ring-[#F6D7A2]/70" />
            <span className="absolute bottom-6 left-14 h-3.5 w-3.5 rounded-full bg-[#C987A0] ring-2 ring-[#E9BCCB]/70" />
            <span className="absolute bottom-8 left-[75px] h-3 w-3 rounded-full bg-[#E5A88B] ring-2 ring-[#F3CDBA]/70" />
          </div>

          {/* pequeno canteiro do lado direito */}
          <div
            className="
              absolute
              bottom-[29%]
              right-[18%]
              z-[19]
              h-10
              w-16
              pointer-events-none
            "
            aria-hidden="true"
          >
            <span className="absolute bottom-0 left-2 h-7 w-2.5 -rotate-[15deg] rounded-full bg-emerald-800/65" />
            <span className="absolute bottom-0 left-7 h-9 w-2.5 rotate-[10deg] rounded-full bg-emerald-700/70" />
            <span className="absolute bottom-0 left-12 h-6 w-2.5 -rotate-[8deg] rounded-full bg-emerald-800/65" />
          </div>
        </>
      )}

      {/* ======================================================
          NÍVEL 4 — HORTA
          Pequena área cultivada, integrada no terreno
         ====================================================== */}
      {level >= 4 && (
        <div
          className="
            absolute
            right-[6%]
            bottom-[7%]
            z-[18]
            h-[74px]
            w-[108px]
            pointer-events-none
          "
          aria-hidden="true"
        >
          {/* solo */}
          <div
            className="
              absolute
              inset-x-0
              bottom-0
              h-12
              -rotate-[4deg]
              rounded-[48%]
              bg-gradient-to-b
              from-[#876447]
              to-[#604936]
              opacity-90
            "
          />

          {/* linhas de cultivo */}
          <div className="absolute bottom-3 left-3 h-[2px] w-[78px] -rotate-[4deg] rounded-full bg-[#B8956E]/45" />
          <div className="absolute bottom-6 left-4 h-[2px] w-[74px] -rotate-[4deg] rounded-full bg-[#B8956E]/35" />

          {/* rebentos */}
          <span className="absolute bottom-8 left-5 h-5 w-2 -rotate-[20deg] rounded-[100%_0] bg-emerald-600" />
          <span className="absolute bottom-10 left-9 h-6 w-2 rotate-[18deg] rounded-[100%_0] bg-emerald-700" />
          <span className="absolute bottom-8 left-[54px] h-5 w-2 -rotate-[16deg] rounded-[100%_0] bg-emerald-600" />
          <span className="absolute bottom-9 left-[72px] h-6 w-2 rotate-[15deg] rounded-[100%_0] bg-emerald-700" />
          <span className="absolute bottom-7 left-[88px] h-5 w-2 -rotate-[14deg] rounded-[100%_0] bg-emerald-600" />
        </div>
      )}

      {/* ======================================================
          NÍVEL 5 — BOSQUE / SANTUÁRIO
          Profundidade adicional nas margens
         ====================================================== */}
      {level >= 5 && (
        <>
          <div
            className="
              absolute
              left-[-26px]
              bottom-[31%]
              z-[17]
              h-[190px]
              w-[120px]
              pointer-events-none
            "
            aria-hidden="true"
          >
            <div className="absolute bottom-0 left-12 h-24 w-5 rounded-full bg-[#654838]" />
            <div className="absolute bottom-16 left-2 h-24 w-24 rounded-[46%] bg-emerald-900/95" />
            <div className="absolute bottom-24 left-10 h-20 w-20 rounded-[48%] bg-emerald-800" />
            <div className="absolute bottom-20 left-0 h-16 w-16 rounded-full bg-emerald-700/90" />
            <div className="absolute bottom-[112px] left-12 h-10 w-12 rounded-full bg-emerald-600/35" />
          </div>

          <div
            className="
              absolute
              right-[-34px]
              bottom-[32%]
              z-[17]
              h-[210px]
              w-[130px]
              pointer-events-none
            "
            aria-hidden="true"
          >
            <div className="absolute bottom-0 left-12 h-28 w-6 rounded-full bg-[#604536]" />
            <div className="absolute bottom-20 left-1 h-28 w-28 rounded-[48%] bg-emerald-950/95" />
            <div className="absolute bottom-28 left-12 h-20 w-20 rounded-full bg-emerald-800" />
            <div className="absolute bottom-24 left-0 h-20 w-20 rounded-full bg-emerald-700/90" />
            <div className="absolute bottom-[132px] left-12 h-12 w-14 rounded-full bg-emerald-600/30" />
          </div>
        </>
      )}
    </>
  );
}

export default memo(PremiumEnvironment);
'''

path.write_text(content, encoding="utf-8")

text = path.read_text(encoding="utf-8")

required = [
    "level >= 2",
    "level >= 4",
    "level >= 5",
    "NÍVEL 2",
    "NÍVEL 4",
    "NÍVEL 5",
    "export default memo(PremiumEnvironment)",
]

for item in required:
    if item not in text:
        print(f"ERRO: componente incompleto: {item}")
        sys.exit(1)

print("=" * 72)
print("CONFIA — PREMIUM ENVIRONMENT 1B.4B.4A")
print("=" * 72)
print("✓ PremiumEnvironment criado")
print("✓ Jardim premium preparado para nível 2")
print("✓ Horta premium preparada para nível 4")
print("✓ Bosque premium preparado para nível 5")
print("✓ Sem emojis")
print("✓ Sem imagens externas")
print("✓ Sem animações permanentes")
print("✓ Sem bibliotecas")
print("✓ Sem armazenamento")
print("✓ Zero textos visíveis")
print("✓ PT / EN / ES / FR não afetados")
print()
print("IMPORTANTE:")
print("O componente ainda NÃO foi integrado no HomeWorld.")
print()
print("OK — componente ambiental criado isoladamente.")
