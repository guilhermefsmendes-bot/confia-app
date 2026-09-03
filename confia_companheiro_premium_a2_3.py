from pathlib import Path
import shutil
import sys

TARGET = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_premium_a2_3"
)

if not TARGET.exists():
    print("ERRO: ConfiaCompanionHome.tsx não encontrado.")
    sys.exit(1)

old = TARGET.read_text(encoding="utf-8")

required = [
    "function ConfiaCompanionHome",
    "<Avatar",
    "avatarMemoryMessage",
    "worldMood",
    "progress",
]

for marker in required:
    if marker not in old:
        print(f"ERRO: estrutura esperada não encontrada: {marker}")
        sys.exit(1)

shutil.copy2(TARGET, BACKUP)

code = r'''import React, { memo, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "../Avatar";
import type { AvatarState } from "../../types";

interface ConfiaCompanionHomeProps {
  avatar: AvatarState;
  avatarCelebrating: boolean;
  avatarMemoryMessage: string;
  morningRating?: number;
  afternoonRating?: number;
  handlePetAvatar: () => void;
  worldMood:
    | "growing"
    | "settling"
    | "discovering"
    | "neutral";
}

/**
 * ============================================================
 * CONFIA — CASA PREMIUM A2.3
 * ============================================================
 *
 * Objetivo:
 * - transformar o topo numa presença emocional;
 * - eliminar duplicação visual;
 * - dar protagonismo à criatura;
 * - preparar a zona de fala para o A3;
 * - preservar toda a lógica atual.
 *
 * PERFORMANCE:
 * - sem timers
 * - sem canvas
 * - sem requestAnimationFrame
 * - sem animações permanentes
 * - sem novas dependências
 */

function ConfiaCompanionHome({
  avatar,
  avatarCelebrating,
  avatarMemoryMessage,
  morningRating,
  afternoonRating,
  handlePetAvatar,
  worldMood,
}: ConfiaCompanionHomeProps) {
  const { t } = useTranslation();

  const currentMoodRating = useMemo(() => {
    if (typeof afternoonRating === "number") {
      return afternoonRating;
    }

    if (typeof morningRating === "number") {
      return morningRating;
    }

    return undefined;
  }, [morningRating, afternoonRating]);

  const progress = useMemo(() => {
    if (!avatar.maxXp || avatar.maxXp <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round((avatar.xp / avatar.maxXp) * 100)
      )
    );
  }, [avatar.xp, avatar.maxXp]);

  const stateAppearance =
    worldMood === "growing"
      ? {
          dot: "bg-emerald-400",
          glow: "bg-emerald-100/40",
        }
      : worldMood === "settling"
        ? {
            dot: "bg-amber-400",
            glow: "bg-orange-100/40",
          }
        : worldMood === "discovering"
          ? {
              dot: "bg-sky-400",
              glow: "bg-sky-100/40",
            }
          : {
              dot: "bg-[#D89A80]",
              glow: "bg-[#F4D8C9]/40",
            };

  const companionMessage = useMemo(() => {
    if (
      avatarMemoryMessage &&
      avatarMemoryMessage.trim().length > 0
    ) {
      return avatarMemoryMessage;
    }

    if (
      currentMoodRating !== undefined &&
      currentMoodRating <= 3
    ) {
      return t("avatarLowMood");
    }

    if (
      currentMoodRating !== undefined &&
      currentMoodRating >= 8
    ) {
      return t("avatarHighMood");
    }

    if (avatar.level === 1) {
      return t("avatarStageMessage1");
    }

    if (avatar.level >= 10) {
      return t("avatarStageMessage10");
    }

    if (avatar.level >= 5) {
      return t("avatarStageMessage5");
    }

    return t("avatarWelcome");
  }, [
    avatar.level,
    avatarMemoryMessage,
    currentMoodRating,
    t,
  ]);

  return (
    <section
      className="
        relative
        isolate
        overflow-hidden
        rounded-[32px]
        border border-[#E8DDD7]/70
        bg-gradient-to-b
        from-[#FFFDFB]
        via-[#FFF9F5]
        to-[#FFF4EE]
        shadow-[0_16px_42px_rgba(89,58,45,0.08)]
      "
      aria-label={t("companion")}
    >
      {/* atmosfera premium estática */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          left-1/2
          top-[42%]
          h-80
          w-80
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          ${stateAppearance.glow}
          blur-3xl
        `}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-20
          h-48
          w-48
          rounded-full
          bg-white/65
          blur-3xl
        "
      />

      {/* CABEÇALHO */}
      <div
        className="
          relative
          z-10
          flex
          items-start
          justify-between
          px-5
          pt-5
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                shrink-0
                rounded-full
                ${stateAppearance.dot}
              `}
            />

            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.2em]
                text-[#C97B5E]
              "
            >
              CONFIA
            </p>
          </div>

          <h2
            className="
              mt-1.5
              text-[22px]
              font-black
              tracking-[-0.035em]
              text-[#4E3B36]
            "
          >
            {t("companion")}
          </h2>
        </div>

        <div
          className="
            flex
            shrink-0
            items-center
            gap-1.5
            rounded-full
            border border-[#E5A88B]/20
            bg-white/72
            px-3
            py-1.5
            shadow-[0_5px_16px_rgba(89,58,45,0.045)]
            backdrop-blur-sm
          "
        >
          <Sparkles
            size={11}
            strokeWidth={2}
            className="text-[#C97B5E]"
          />

          <span
            className="
              text-[10px]
              font-black
              text-[#76584D]
            "
          >
            {t("level")} {avatar.level}
          </span>
        </div>
      </div>

      {/* PALCO */}
      <div
        className="
          relative
          z-10
          flex
          min-h-[285px]
          items-center
          justify-center
          overflow-hidden
          px-2
          pt-1
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-9
            left-1/2
            h-9
            w-48
            -translate-x-1/2
            rounded-[50%]
            bg-[#8F604D]/[0.065]
            blur-lg
          "
        />

        <div
          className="
            relative
            flex
            min-h-[270px]
            w-full
            items-center
            justify-center
          "
        >
          <Avatar
            avatar={avatar}
            onPet={handlePetAvatar}
            levelUpTrigger={avatarCelebrating}
            moodRating={currentMoodRating}
            memoryMessage={avatarMemoryMessage}
            companionWorldMood={worldMood}
          />
        </div>
      </div>

      {/* VOZ DA CONFIA */}
      <div
        className="
          relative
          z-10
          -mt-3
          px-5
        "
      >
        <div
          className="
            relative
            rounded-[22px]
            border border-white/85
            bg-white/62
            px-4
            py-3.5
            shadow-[0_8px_22px_rgba(89,58,45,0.045)]
            backdrop-blur-sm
          "
        >
          <div
            aria-hidden="true"
            className="
              absolute
              -top-2
              left-1/2
              h-4
              w-4
              -translate-x-1/2
              rotate-45
              border-l border-t
              border-white/85
              bg-white/62
            "
          />

          <p
            className="
              relative
              text-center
              text-[13px]
              font-semibold
              leading-[1.55]
              text-[#6A5148]
            "
          >
            {companionMessage}
          </p>
        </div>
      </div>

      {/* EVOLUÇÃO */}
      <div
        className="
          relative
          z-10
          px-5
          pb-5
          pt-4
        "
      >
        <div className="px-1">
          <div
            className="
              mb-2
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.15em]
                text-[#9B7B6F]
              "
            >
              {t("level")} {avatar.level}
            </span>

            <span
              className="
                text-[10px]
                font-black
                text-[#C97B5E]
              "
            >
              {progress}%
            </span>
          </div>

          <div
            className="
              h-1.5
              overflow-hidden
              rounded-full
              bg-[#EFE3DD]
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-[#D99879]
                via-[#C97B5E]
                to-[#B45E4C]
                transition-[width]
                duration-500
                ease-out
              "
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(ConfiaCompanionHome);
'''

TARGET.write_text(code, encoding="utf-8")

written = TARGET.read_text(encoding="utf-8")

checks = {
    "Componente preservado":
        "function ConfiaCompanionHome" in written,

    "Avatar preservado":
        "<Avatar" in written,

    "Memória preservada":
        "avatarMemoryMessage" in written,

    "Humor preservado":
        "currentMoodRating" in written,

    "World mood preservado":
        "worldMood" in written,

    "Mensagem preparada":
        "companionMessage" in written,

    "Progresso preservado":
        "progress" in written,

    "Sem timer":
        "setTimeout(" not in written,

    "Sem intervalos":
        "setInterval(" not in written,

    "Sem rAF":
        "requestAnimationFrame(" not in written,

    "Sem canvas":
        "<canvas" not in written,

    "Sem motion":
        "<motion" not in written,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    shutil.copy2(BACKUP, TARGET)

    print("ERRO: validação falhou.")

    for item in failed:
        print(" -", item)

    print()
    print("Ficheiro restaurado automaticamente.")
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A2.3")
print("=" * 76)
print()
print("✓ Casa premium reorganizada")
print("✓ Criatura ganhou maior protagonismo")
print("✓ Badge 'Companheiro' removido")
print("✓ Informação visual reduzida")
print("✓ Zona de fala criada")
print("✓ Memória existente usada na fala")
print("✓ Humor atual usado como fallback")
print("✓ Evolução preservada")
print("✓ Nível preservado")
print("✓ XP preservado")
print("✓ Toque preservado")
print("✓ worldMood preservado")
print("✓ O teu espaço continua imediatamente depois")
print("✓ Zero timers novos")
print("✓ Zero requestAnimationFrame")
print("✓ Zero canvas")
print("✓ Zero animações permanentes")
print("✓ Zero dependências novas")
print("✓ Sem alterações de localStorage")
print("✓ Sem alterações de navegação")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A2.3 aplicado.")
print("=" * 76)
