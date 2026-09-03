from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
NEW_COMPONENT = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

APP_BACKUP = Path(
    "/tmp/App.tsx.before_companheiro_premium_a1"
)

COMPONENT_BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_companheiro_premium_a1"
)

# ============================================================
# SEGURANÇA
# ============================================================

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

app = APP.read_text(encoding="utf-8")

old_import = 'import HomeWorld from "./components/HomeWorld";'

if old_import not in app:
    print("ERRO: import de HomeWorld não encontrado.")
    sys.exit(1)

if app.count(old_import) != 1:
    print("ERRO: número inesperado de imports de HomeWorld.")
    sys.exit(1)

old_block = '''<HomeWorld
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}

/>'''

if old_block not in app:
    print("ERRO: bloco HomeWorld esperado não encontrado.")
    print("Nenhuma alteração realizada.")
    sys.exit(1)

if app.count(old_block) != 1:
    print("ERRO: número inesperado de blocos HomeWorld.")
    sys.exit(1)

# ============================================================
# BACKUPS
# ============================================================

shutil.copy2(APP, APP_BACKUP)

if NEW_COMPONENT.exists():
    shutil.copy2(NEW_COMPONENT, COMPONENT_BACKUP)

NEW_COMPONENT.parent.mkdir(parents=True, exist_ok=True)

# ============================================================
# NOVO COMPONENTE
# ============================================================

component = r'''import React, { memo, useMemo } from "react";
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
 * CONFIA — COMPANHEIRO PREMIUM A1
 * ============================================================
 *
 * Casa principal do companheiro.
 *
 * Objetivos desta versão:
 *
 * - substituir visualmente o antigo HomeWorld;
 * - preservar Avatar / XP / níveis;
 * - preservar memória;
 * - preservar reação ao toque;
 * - preservar worldMood;
 * - não criar timers;
 * - não criar requestAnimationFrame;
 * - não criar canvas;
 * - não criar partículas próprias;
 * - não guardar novo estado;
 * - preparar a arquitetura para a criatura premium A2.
 *
 * O HomeWorld continua fisicamente no projeto durante
 * a migração e não é eliminado neste passo.
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
          halo: "from-emerald-100/45 via-white/10 to-transparent",
        }
      : worldMood === "settling"
        ? {
            dot: "bg-amber-400",
            halo: "from-orange-100/45 via-white/10 to-transparent",
          }
        : worldMood === "discovering"
          ? {
              dot: "bg-sky-400",
              halo: "from-sky-100/45 via-white/10 to-transparent",
            }
          : {
              dot: "bg-[#D89A80]",
              halo: "from-[#F8DDD0]/45 via-white/10 to-transparent",
            };

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
      {/* Atmosfera estática premium */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          left-1/2
          top-[42%]
          h-72
          w-72
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-gradient-radial
          ${stateAppearance.halo}
          blur-2xl
        `}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-12
          -top-16
          h-40
          w-40
          rounded-full
          bg-[#F4D8C9]/22
          blur-2xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-20
          -left-16
          h-44
          w-44
          rounded-full
          bg-white/60
          blur-2xl
        "
      />

      {/* Cabeçalho */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
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
                tracking-[0.19em]
                text-[#C97B5E]
              "
            >
              CONFIA
            </p>
          </div>

          <h2
            className="
              mt-1
              text-[17px]
              font-black
              tracking-[-0.02em]
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
            bg-white/75
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

      {/* Palco do companheiro */}
      <div
        className="
          relative
          z-10
          flex
          min-h-[250px]
          items-center
          justify-center
          overflow-hidden
          px-3
          pt-1
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-8
            left-1/2
            h-8
            w-40
            -translate-x-1/2
            rounded-[50%]
            bg-[#9A6852]/[0.07]
            blur-md
          "
        />

        <div
          className="
            relative
            flex
            min-h-[230px]
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

      {/* Progresso da relação / evolução */}
      <div className="relative z-10 px-5 pb-5">
        <div
          className="
            rounded-[22px]
            border border-white/80
            bg-white/55
            px-4
            py-3
            shadow-[0_7px_20px_rgba(89,58,45,0.04)]
            backdrop-blur-sm
          "
        >
          <div className="mb-2 flex items-center justify-between">
            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.14em]
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
              bg-[#F1E6E0]
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-[#D99879]
                to-[#B96452]
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

NEW_COMPONENT.write_text(
    component,
    encoding="utf-8"
)

# ============================================================
# APP.TSX — IMPORT
# ============================================================

new_import = (
    'import ConfiaCompanionHome '
    'from "./components/Companheiro/ConfiaCompanionHome";'
)

app = app.replace(
    old_import,
    new_import,
    1
)

# ============================================================
# APP.TSX — HOME
# ============================================================

new_block = '''<ConfiaCompanionHome
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}
/>'''

app = app.replace(
    old_block,
    new_block,
    1
)

# ============================================================
# VALIDAÇÃO ANTES DE ESCREVER
# ============================================================

if "<HomeWorld" in app:
    print(
        "ERRO: ainda existe uma renderização <HomeWorld "
        "em App.tsx."
    )
    sys.exit(1)

if app.count("<ConfiaCompanionHome") != 1:
    print(
        "ERRO: número inesperado de renderizações "
        "ConfiaCompanionHome."
    )
    sys.exit(1)

if new_import not in app:
    print(
        "ERRO: novo import não foi inserido."
    )
    sys.exit(1)

APP.write_text(
    app,
    encoding="utf-8"
)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A1")
print("=" * 76)
print()
print("✓ HomeWorld removido da renderização do Principal")
print("✓ HomeWorld.tsx preservado no projeto")
print("✓ Nova casa premium do companheiro criada")
print("✓ Avatar atual reutilizado")
print("✓ Ovo / evolução atual preservados")
print("✓ XP e nível preservados")
print("✓ Barra de evolução preservada")
print("✓ Memória do avatar ligada")
print("✓ Humor atual ligado")
print("✓ worldMood ligado")
print("✓ Reação ao toque preservada")
print("✓ Celebração de nível preservada")
print("✓ O teu espaço permanece imediatamente abaixo")
print("✓ Loja preservada")
print("✓ Inventário preservado")
print("✓ Dados antigos não apagados")
print("✓ localStorage não alterado")
print("✓ Nenhum timer novo")
print("✓ Nenhum requestAnimationFrame novo")
print("✓ Nenhum canvas")
print("✓ Nenhuma dependência nova")
print("✓ Sem alterações de traduções")
print()
print("Backup:")
print(f"  {APP_BACKUP}")
if COMPONENT_BACKUP.exists():
    print(f"  {COMPONENT_BACKUP}")
print()
print("Próximo passo:")
print("  PREMIUM A2 — criatura CONFIA original + motor visual leve")
print("=" * 76)
