from pathlib import Path
import shutil
import sys

FILE = Path("src/components/Avatar.tsx")
BACKUP = Path("/tmp/Avatar.tsx.before_companheiro_premium_a4_4")

if not FILE.exists():
    print("ERRO: Avatar.tsx não encontrado.")
    sys.exit(1)

source = FILE.read_text(encoding="utf-8")
avatar = source

required = [
    "const creatureState: ConfiaCreatureState",
    "levelUpTrigger || celebrating",
    "animate={isJumping ? {",
    "<ConfiaCreature",
    "level={avatar.level}",
    "state={creatureState}",
]

for marker in required:
    if marker not in avatar:
        print("ERRO: estrutura esperada não encontrada:", marker)
        sys.exit(1)

shutil.copy2(FILE, BACKUP)

try:

    # ============================================================
    # 1. GRANDE EVOLUÇÃO
    # ============================================================

    if "const isMajorEvolution =" not in avatar:

        marker = "const creatureState: ConfiaCreatureState"

        pos = avatar.find(marker)

        if pos == -1:
            raise RuntimeError(
                "creatureState não encontrado"
            )

        insertion = '''/**
 * ==========================================================
 * A4.4 — MOMENTO DE GRANDE EVOLUÇÃO
 * ==========================================================
 *
 * Reutiliza levelUpTrigger já existente.
 * Não cria estado nem timer.
 *
 * Novas formas começam nos níveis 2, 4, 6 e 9.
 */
const isMajorEvolution =
  Boolean(levelUpTrigger) &&
  (
    avatar.level === 2 ||
    avatar.level === 4 ||
    avatar.level === 6 ||
    avatar.level === 9
  );

'''

        avatar = (
            avatar[:pos]
            + insertion
            + avatar[pos:]
        )

    # ============================================================
    # 2. SUBSTITUIR APENAS O BLOCO MOTION DO AVATAR
    # ============================================================

    motion_start = avatar.find(
        "<motion.div",
        avatar.find("return (")
    )

    if motion_start == -1:
        raise RuntimeError(
            "motion.div do Avatar não encontrado"
        )

    class_marker = '  className="flex flex-col items-center"\n>'

    motion_end = avatar.find(
        class_marker,
        motion_start
    )

    if motion_end == -1:
        raise RuntimeError(
            "fim do cabeçalho motion.div não encontrado"
        )

    motion_end += len(class_marker)

    current_motion_header = avatar[
        motion_start:motion_end
    ]

    if "isMajorEvolution" not in current_motion_header:

        new_motion_header = '''<motion.div
  animate={
    isJumping
      ? {
          y: [-30, 0],
          scaleY: [0.9, 1.1, 1],
          scaleX: [1.1, 0.9, 1]
        }
      : isMajorEvolution
        ? {
            y: [0, -10, -4, 0],
            scale: [1, 1.08, 1.035, 1],
            rotate: [0, -1.5, 1.5, 0]
          }
        : levelUpTrigger || celebrating
          ? {
              y: [0, -5, 0],
              scale: [1, 1.035, 1]
            }
          : {}
  }
  transition={
    isMajorEvolution
      ? {
          duration: 1.15,
          ease: "easeOut"
        }
      : {
          duration: 0.6,
          ease: "easeOut"
        }
  }
  className="relative flex flex-col items-center"
>'''

        avatar = (
            avatar[:motion_start]
            + new_motion_header
            + avatar[motion_end:]
        )

    # ============================================================
    # 3. HALO PREMIUM
    # ============================================================

    creature_pos = avatar.find(
        "<ConfiaCreature"
    )

    if creature_pos == -1:
        raise RuntimeError(
            "ConfiaCreature não encontrada"
        )

    if "A4.4 — halo de evolução" not in avatar:

        halo = '''{isMajorEvolution && (
    <motion.div
      aria-hidden="true"
      initial={{
        opacity: 0,
        scale: 0.72
      }}
      animate={{
        opacity: [0, 0.34, 0.18],
        scale: [0.72, 1.08, 1]
      }}
      transition={{
        duration: 1.1,
        ease: "easeOut"
      }}
      className="
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        h-[205px]
        w-[205px]
        -translate-x-1/2
        -translate-y-1/2
        rounded-full
        bg-[radial-gradient(circle,rgba(255,238,190,0.62)_0%,rgba(229,168,139,0.22)_48%,rgba(255,255,255,0)_72%)]
        blur-[2px]
      "
    />
  )}

  {/* A4.4 — halo de evolução */}
  '''

        avatar = (
            avatar[:creature_pos]
            + halo
            + avatar[creature_pos:]
        )

    # ============================================================
    # 4. GUARDAR
    # ============================================================

    FILE.write_text(
        avatar,
        encoding="utf-8"
    )

    written = FILE.read_text(
        encoding="utf-8"
    )

    # ============================================================
    # 5. VALIDAÇÃO
    # ============================================================

    checks = {
        "isMajorEvolution":
            "const isMajorEvolution =" in written,

        "nível 2":
            "avatar.level === 2" in written,

        "nível 4":
            "avatar.level === 4" in written,

        "nível 6":
            "avatar.level === 6" in written,

        "nível 9":
            "avatar.level === 9" in written,

        "usa trigger existente":
            "Boolean(levelUpTrigger)" in written,

        "movimento evolução":
            "scale: [1, 1.08, 1.035, 1]"
            in written,

        "celebração normal":
            "levelUpTrigger || celebrating"
            in written,

        "halo condicionado":
            "{isMajorEvolution && ("
            in written,

        "halo identificado":
            "A4.4 — halo de evolução"
            in written,

        "touch preservado":
            "setIsJumping(true)" in written
            and "onPet();" in written,

        "timer touch preservado":
            "}, 800);" in written,

        "criatura preservada":
            "<ConfiaCreature" in written
            and "level={avatar.level}" in written
            and "state={creatureState}" in written,

        "reação contextual preservada":
            "reactionState ??" in written,

        "sem interval":
            "setInterval(" not in written,

        "sem rAF":
            "requestAnimationFrame(" not in written,

        "sem canvas":
            "<canvas" not in written,

        "sem repeat infinito":
            "repeat: Infinity" not in written,
    }

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:
    shutil.copy2(
        BACKUP,
        FILE
    )

    print("ERRO:", exc)
    print()
    print(
        "Avatar.tsx restaurado automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A4.4")
print("=" * 76)
print()
print("✓ Grandes evoluções: níveis 2 / 4 / 6 / 9")
print("✓ levelUpTrigger existente reutilizado")
print("✓ Nenhum novo estado")
print("✓ Nenhum novo timer")
print("✓ Level-up normal preservado")
print("✓ Grande evolução com movimento próprio")
print("✓ Halo premium condicionado à evolução")
print("✓ Touch preservado")
print("✓ Timer de 800 ms do touch preservado")
print("✓ Estados emocionais preservados")
print("✓ ConfiaCreature preservada")
print("✓ Nenhum interval")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma animação infinita")
print("✓ Nenhuma dependência nova")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A4.4 aplicado.")
print("=" * 76)
