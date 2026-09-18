from pathlib import Path
import shutil
import sys

path = Path("src/components/world/Clouds.tsx")

if not path.exists():
    print("ERRO: Clouds.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")

if "☁️" not in text:
    print("ERRO: Clouds.tsx já não contém a implementação emoji esperada.")
    sys.exit(1)

shutil.copy2(
    path,
    "/tmp/Clouds.tsx.before_premium_clouds"
)

new_text = '''import { memo } from "react";

function Clouds() {
  return (
    <div
      className="absolute inset-0 z-[6] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Nuvem principal — ampla e suave */}
      <svg
        viewBox="0 0 180 70"
        className="
          absolute
          left-[5%]
          top-[7%]
          w-[145px]
          opacity-55
        "
      >
        <defs>
          <linearGradient id="confiaCloudMain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#EEF5F4" stopOpacity="0.62" />
          </linearGradient>
        </defs>

        <path
          d="
            M24 55
            C11 55 7 43 15 35
            C20 30 27 29 33 31
            C35 18 46 10 59 12
            C69 13 76 19 80 28
            C87 20 97 16 108 18
            C120 20 128 29 129 40
            C136 35 146 36 152 42
            C162 52 154 62 143 62
            H27
            C21 62 18 58 24 55
            Z
          "
          fill="url(#confiaCloudMain)"
        />

        <path
          d="M35 57 C67 62 112 62 145 56"
          fill="none"
          stroke="#DDEBEA"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.42"
        />
      </svg>

      {/* Nuvem distante */}
      <svg
        viewBox="0 0 150 60"
        className="
          absolute
          right-[8%]
          top-[17%]
          w-[105px]
          opacity-35
        "
      >
        <defs>
          <linearGradient id="confiaCloudFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E8F1F2" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <path
          d="
            M18 47
            C9 46 8 36 15 31
            C20 27 25 27 31 29
            C34 18 44 12 54 14
            C62 15 68 20 71 27
            C78 20 88 18 96 21
            C105 24 110 31 110 39
            C117 35 126 37 130 43
            C136 51 128 55 120 55
            H22
            C17 55 14 50 18 47
            Z
          "
          fill="url(#confiaCloudFar)"
        />
      </svg>

      {/* Fragmento atmosférico muito distante */}
      <svg
        viewBox="0 0 120 45"
        className="
          absolute
          left-[47%]
          top-[4%]
          w-[72px]
          opacity-20
        "
      >
        <path
          d="
            M13 36
            C7 33 9 27 15 25
            C19 23 23 24 26 26
            C29 17 38 13 46 16
            C52 18 55 22 56 27
            C62 22 70 22 75 26
            C80 29 82 34 80 38
            H17
            C14 38 12 37 13 36
            Z
          "
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

export default memo(Clouds);
'''

path.write_text(new_text, encoding="utf-8")

verify = path.read_text(encoding="utf-8")

required = [
    "confiaCloudMain",
    "confiaCloudFar",
    'z-[6]',
    'pointer-events-none',
    'aria-hidden="true"',
]

for item in required:
    if item not in verify:
        print(f"ERRO: elemento esperado ausente: {item}")
        sys.exit(1)

if "☁️" in verify:
    print("ERRO: emoji de nuvem ainda presente.")
    sys.exit(1)

if "animate-" in verify:
    print("ERRO: animação permanente inesperada.")
    sys.exit(1)

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4D.1")
print("=" * 72)
print("✓ Nuvens emoji removidas")
print("✓ Nuvens vetoriais premium aplicadas")
print("✓ Três planos atmosféricos criados")
print("✓ Profundidade por escala e opacidade")
print("✓ Paleta integrada no mundo CONFIA")
print("✓ Zero animações permanentes")
print("✓ Zero imagens externas")
print("✓ Zero dependências novas")
print("✓ Zero texto visível novo")
print("✓ PT / EN / ES / FR não afetados")
print()
print("OK — Clouds premium aplicado.")
