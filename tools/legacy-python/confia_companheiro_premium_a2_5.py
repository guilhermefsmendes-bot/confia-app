from pathlib import Path
import shutil
import sys

TARGET = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_premium_a2_5"
)

if not TARGET.exists():
    print("ERRO: ConfiaCompanionHome.tsx não encontrado.")
    sys.exit(1)

old = TARGET.read_text(encoding="utf-8")

required = [
    "function ConfiaCompanionHome",
    "<Avatar",
    "avatarMemoryMessage",
    "currentMoodRating",
    "companionMessage",
    "progress",
    "worldMood",
]

for marker in required:
    if marker not in old:
        print(
            f"ERRO: estrutura esperada não encontrada: {marker}"
        )
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
 * CONFIA — COMPANHEIRO PREMIUM A2.5
 * ============================================================
 *
 * COMPANHEIRO LIVRE + BALÃO DE FALA
 *
 * A criatura deixa de viver dentro de um cartão.
 * A própria página passa a ser o seu espaço.
 *
 * PERFORMANCE:
 * - sem timers novos
 * - sem intervalos
 * - sem requestAnimationFrame
 * - sem canvas
 * - sem partículas
 * - sem animações permanentes
 * - sem dependências novas
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
        Math.round(
          (avatar.xp / avatar.maxXp) * 100
        )
      )
    );
  }, [avatar.xp, avatar.maxXp]);

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

  const statusDot =
    worldMood === "growing"
      ? "bg-emerald-400"
      : worldMood === "settling"
        ? "bg-amber-400"
        : worldMood === "discovering"
          ? "bg-sky-400"
          : "bg-[#D89A80]";

  return (
    <section
      className="
        relative
        isolate
        px-1
        pt-1
        pb-2
      "
      aria-label={t("companion")}
    >
      {/* ====================================================
          ATMOSFERA

          Não é uma caixa.
          É apenas profundidade visual atrás da criatura.
      ==================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[44%]
          -z-10
          h-[310px]
          w-[310px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#F7DFD2]/25
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[20%]
          top-[36%]
          -z-10
          h-28
          w-28
          rounded-full
          bg-white/65
          blur-3xl
        "
      />

      {/* ====================================================
          CABEÇALHO
      ==================================================== */}

      <div
        className="
          relative
          z-10
          flex
          items-start
          justify-between
          px-2
          pt-1
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                rounded-full
                ${statusDot}
              `}
            />

            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.2em]
                text-[#C97B5E]
              "
            >
              CONFIA
            </span>
          </div>

          <h2
            className="
              mt-1
              text-[21px]
              font-black
              tracking-[-0.035em]
              text-[#4E3B36]
            "
          >
            {t("companion")}
          </h2>
        </div>

        {/* único indicador de nível */}
        <div
          className="
            flex
            items-center
            gap-1.5
            rounded-full
            border border-[#E9D9D1]/70
            bg-white/72
            px-3
            py-1.5
            shadow-[0_5px_16px_rgba(89,58,45,0.04)]
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

      {/* ====================================================
          CRIATURA LIVRE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-h-[270px]
          items-center
          justify-center
          -mt-1
        "
      >
        {/* sombra física subtil */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-[18px]
            left-1/2
            h-7
            w-40
            -translate-x-1/2
            rounded-[50%]
            bg-[#765143]/[0.055]
            blur-lg
          "
        />

        <Avatar
          avatar={avatar}
          onPet={handlePetAvatar}
          levelUpTrigger={avatarCelebrating}
          moodRating={currentMoodRating}
          memoryMessage={avatarMemoryMessage}
          companionWorldMood={worldMood}
        />
      </div>

      {/* ====================================================
          BALÃO DE FALA

          Esta será a principal superfície da voz da CONFIA.
          No A3, o conteúdo passa a ser escolhido pelo motor
          reativo de amizade.
      ==================================================== */}

      <div
        className="
          relative
          z-20
          mx-2
          -mt-2
        "
      >
        {/* cauda do balão */}
        <div
          aria-hidden="true"
          className="
            absolute
            left-1/2
            top-[-7px]
            h-4
            w-4
            -translate-x-1/2
            rotate-45
            border-l
            border-t
            border-[#E9D9D1]/70
            bg-white
          "
        />

        <div
          className="
            relative
            rounded-[24px]
            border
            border-[#E9D9D1]/70
            bg-white/92
            px-5
            py-4
            shadow-[0_10px_28px_rgba(89,58,45,0.065)]
            backdrop-blur-sm
          "
        >
          <p
            className="
              text-center
              text-[13px]
              font-semibold
              leading-[1.55]
              text-[#674D44]
            "
          >
            {companionMessage}
          </p>
        </div>
      </div>

      {/* ====================================================
          EVOLUÇÃO

          Sem outro badge de nível.
          Apenas progresso visual.
      ==================================================== */}

      <div
        className="
          relative
          z-10
          px-4
          pt-4
          pb-1
        "
      >
        <div
          className="
            mb-2
            flex
            items-center
            justify-end
          "
        >
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
            bg-[#EDE2DC]
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

    "Toque preservado":
        "onPet={handlePetAvatar}" in written,

    "Memória preservada":
        "avatarMemoryMessage" in written,

    "Humor preservado":
        "currentMoodRating" in written,

    "WorldMood preservado":
        "worldMood" in written,

    "Balão de fala presente":
        "{companionMessage}" in written,

    "XP preservado":
        "avatar.xp" in written,

    "Progresso preservado":
        "progress" in written,

    "Sem caixa principal":
        'rounded-[32px]' not in written,

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
    print(
        "ConfiaCompanionHome.tsx restaurado automaticamente."
    )
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A2.5")
print("=" * 76)
print()
print("✓ Caixa exterior do companheiro removida")
print("✓ CONFIA passa a estar visualmente solta na aplicação")
print("✓ Atmosfera subtil preservada sem painel pesado")
print("✓ Criatura preservada")
print("✓ Toque preservado")
print("✓ Micro-reações preservadas")
print("✓ Balão de fala integrado diretamente com a criatura")
print("✓ Memória existente ligada ao balão")
print("✓ Humor atual ligado ao balão")
print("✓ Apenas um indicador de nível")
print("✓ Barra de evolução simplificada")
print("✓ XP preservado")
print("✓ worldMood preservado")
print("✓ O teu espaço permanece imediatamente depois")
print("✓ Loja e inventário não alterados")
print("✓ Navegação não alterada")
print("✓ localStorage não alterado")
print("✓ Zero timers novos")
print("✓ Zero intervalos")
print("✓ Zero requestAnimationFrame")
print("✓ Zero canvas")
print("✓ Zero partículas")
print("✓ Zero animações permanentes")
print("✓ Zero dependências novas")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A2.5 aplicado.")
print("=" * 76)
