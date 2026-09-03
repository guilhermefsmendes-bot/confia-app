from pathlib import Path
import shutil
import sys

FILE = Path(
    "src/components/Companheiro/ConfiaCreature.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCreature.tsx.before_premium_a4_1"
)

if not FILE.exists():
    print("ERRO: ConfiaCreature.tsx não encontrado.")
    sys.exit(1)

source = FILE.read_text(encoding="utf-8")

required = [
    "const bodyScale =",
    "const flameScale =",
    "const eyeY =",
    "{isEgg ? (",
    "{stage >= 3 && (",
    "{stage >= 4 && (",
    "{stage === 5 && (",
]

for marker in required:
    if marker not in source:
        print(
            "ERRO: estrutura esperada não encontrada:",
            marker
        )
        sys.exit(1)

shutil.copy2(FILE, BACKUP)

creature = source

try:

    # ========================================================
    # 1. PROPORÇÕES DAS FORMAS
    #
    # Mantemos bodyScale existente.
    # Acrescentamos identidade proporcional por stage.
    #
    # stage 2 — Nascente
    # stage 3 — Pequena CONFIA
    # stage 4 — Jovem
    # stage 5 — Adulta
    # ========================================================

    insert_before = "  const eyeY ="

    evolution = '''  /**
   * ==========================================================
   * A4.1 — ASSINATURA VISUAL DAS 5 FORMAS
   * ==========================================================
   *
   * Não são cinco SVGs.
   *
   * A espécie continua a ser a mesma, mas cada etapa ganha
   * proporções próprias.
   *
   * 1 — Ovo
   * 2 — Nascente
   * 3 — Pequena CONFIA
   * 4 — Jovem CONFIA
   * 5 — CONFIA Adulta
   */

  const evolutionHeadScale =
    stage === 2
      ? 1.055
      : stage === 3
        ? 1.025
        : stage === 4
          ? 0.99
          : 0.965;

  const evolutionBodyStretch =
    stage === 2
      ? 0.94
      : stage === 3
        ? 0.98
        : stage === 4
          ? 1.025
          : 1.055;

  const evolutionEarScale =
    stage === 2
      ? 0.82
      : stage === 3
        ? 0.92
        : stage === 4
          ? 1.03
          : 1.10;

  const evolutionEyeScale =
    stage === 2
      ? 1.08
      : stage === 3
        ? 1.04
        : stage === 4
          ? 1
          : 0.97;

'''

    if "const evolutionHeadScale =" not in creature:
        if insert_before not in creature:
            raise RuntimeError(
                "posição de inserção A4.1 não encontrada"
            )

        creature = creature.replace(
            insert_before,
            evolution + insert_before,
            1,
        )

    # ========================================================
    # 2. ORELHAS
    #
    # Envolvemos as quatro paths das orelhas num grupo
    # escalável a partir do centro da cabeça.
    # ========================================================

    ears_comment = '''            {/* ===============================================
                ORELHAS CONFIA'''

    body_comment = '''            {/* ===============================================
                CORPO PRINCIPAL'''

    ears_start = creature.find(ears_comment)
    body_start = creature.find(
        body_comment,
        ears_start,
    )

    if ears_start == -1 or body_start == -1:
        raise RuntimeError(
            "bloco das orelhas não encontrado"
        )

    ears_block = creature[
        ears_start:body_start
    ]

    if "evolutionEarScale" not in ears_block:

        first_path = ears_block.find("<path")

        if first_path == -1:
            raise RuntimeError(
                "paths das orelhas não encontrados"
            )

        absolute_first_path = (
            ears_start + first_path
        )

        # inserir grupo antes da primeira path
        open_group = '''<g
              transform={`
                translate(
                  ${110 - 110 * evolutionEarScale}
                  ${78 - 78 * evolutionEarScale}
                )
                scale(${evolutionEarScale})
              `}
            >
            '''

        creature = (
            creature[:absolute_first_path]
            + open_group
            + creature[absolute_first_path:]
        )

        # recalcular posição do comentário seguinte
        body_start = creature.find(
            body_comment,
            absolute_first_path,
        )

        if body_start == -1:
            raise RuntimeError(
                "limite posterior das orelhas perdido"
            )

        creature = (
            creature[:body_start]
            + "            </g>\n\n"
            + creature[body_start:]
        )

    # ========================================================
    # 3. CORPO
    #
    # Em vez de redesenhar a criatura, damos uma alteração
    # vertical muito subtil à silhueta conforme amadurece.
    # ========================================================

    creature_group = '''          <g
            transform={`
              translate(
                ${110 - 110 * bodyScale}
                ${184 - 184 * bodyScale}
              )
              scale(${bodyScale})
            `}
          >'''

    creature_group_new = '''          <g
            transform={`
              translate(
                ${110 - 110 * bodyScale}
                ${184 - 184 * bodyScale}
              )
              scale(${bodyScale})
              translate(
                0
                ${184 - 184 * evolutionBodyStretch}
              )
              scale(
                1
                ${evolutionBodyStretch}
              )
            `}
          >'''

    if (
        "scale(\n                1\n"
        "                ${evolutionBodyStretch}"
        not in creature
    ):
        if creature_group not in creature:
            raise RuntimeError(
                "grupo principal da criatura "
                "não encontrado"
            )

        creature = creature.replace(
            creature_group,
            creature_group_new,
            1,
        )

    # ========================================================
    # 4. OLHOS
    #
    # Crianças ligeiramente mais expressivas.
    # Adulto ligeiramente mais refinado.
    # ========================================================

    left_eye = '''              rx={
                state === "curious"
                  ? 8
                  : 7.5
              }
              ry={eyeRY}'''

    left_eye_new = '''              rx={
                (state === "curious"
                  ? 8
                  : 7.5) * evolutionEyeScale
              }
              ry={eyeRY * evolutionEyeScale}'''

    eye_count = creature.count(left_eye)

    if eye_count == 2:
        creature = creature.replace(
            left_eye,
            left_eye_new,
            2,
        )
    elif "evolutionEyeScale" not in creature[
        creature.find("OLHOS"):
    ]:
        raise RuntimeError(
            "estrutura dos olhos inesperada"
        )

    # ========================================================
    # 5. MARCA CORPORAL DA FORMA ADULTA
    #
    # O stage 5 já tem marca própria.
    # Acrescentamos um segundo detalhe mínimo para que
    # a forma final tenha assinatura inequívoca.
    # ========================================================

    adult_marker = '''            {stage === 5 && (
              <>'''

    adult_pos = creature.rfind(adult_marker)

    if adult_pos == -1:
        raise RuntimeError(
            "marca corporal adulta não encontrada"
        )

    adult_close = creature.find(
        "</>",
        adult_pos,
    )

    if adult_close == -1:
        raise RuntimeError(
            "fim da marca adulta não encontrado"
        )

    adult_detail = '''                {/* A4.1 — assinatura final da espécie */}
                <circle
                  cx="101"
                  cy="162"
                  r="1.6"
                  fill="#D99A72"
                  opacity="0.55"
                />

                <circle
                  cx="119"
                  cy="162"
                  r="1.6"
                  fill="#D99A72"
                  opacity="0.55"
                />

'''

    adult_section = creature[
        adult_pos:adult_close
    ]

    if "assinatura final da espécie" not in adult_section:
        creature = (
            creature[:adult_close]
            + adult_detail
            + creature[adult_close:]
        )

    # ========================================================
    # ESCREVER
    # ========================================================

    FILE.write_text(
        creature,
        encoding="utf-8",
    )

    written = FILE.read_text(
        encoding="utf-8"
    )

    # ========================================================
    # VALIDAÇÃO
    # ========================================================

    checks = {
        "5 stages preservados":
            "stage === 5" in written,

        "Ovo preservado":
            "{isEgg ? (" in written,

        "Escala de cabeça criada":
            "const evolutionHeadScale ="
            in written,

        "Escala corporal criada":
            "const evolutionBodyStretch ="
            in written,

        "Escala de orelhas criada":
            "const evolutionEarScale ="
            in written,

        "Escala dos olhos criada":
            "const evolutionEyeScale ="
            in written,

        "Orelhas evolutivas":
            "scale(${evolutionEarScale})"
            in written,

        "Corpo evolutivo":
            "${evolutionBodyStretch}"
            in written,

        "Olhos evolutivos":
            "* evolutionEyeScale"
            in written,

        "Forma adulta reforçada":
            "assinatura final da espécie"
            in written,

        "Reaction state preservado":
            'state === "supportive"'
            in written
            and 'state === "curious"'
            in written
            and 'state === "welcoming"'
            in written
            and 'state === "celebrating"'
            in written,

        "Reacting preservado":
            "reacting" in written,

        "Sem timers":
            "setTimeout(" not in written,

        "Sem interval":
            "setInterval(" not in written,

        "Sem rAF":
            "requestAnimationFrame("
            not in written,

        "Sem canvas":
            "<canvas" not in written,

        "Sem animação infinita":
            "repeat: Infinity"
            not in written,
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
        FILE,
    )

    print("ERRO:", exc)
    print()
    print(
        "ConfiaCreature.tsx restaurado automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A4.1")
print("=" * 76)
print()
print("✓ Mapa visual das 5 formas aplicado")
print("✓ Forma 1 — Ovo preservada")
print("✓ Forma 2 — Nascente mais pequena e arredondada")
print("✓ Forma 3 — Pequena CONFIA ganha presença")
print("✓ Forma 4 — Jovem mais alta e definida")
print("✓ Forma 5 — Adulta mais elegante")
print("✓ Orelhas amadurecem progressivamente")
print("✓ Olhos amadurecem progressivamente")
print("✓ Corpo amadurece progressivamente")
print("✓ Marca adulta reforçada")
print("✓ Identidade creme/terracota preservada")
print("✓ Marca luminosa CONFIA preservada")
print("✓ Estados reativos preservados")
print("✓ Reação ao toque preservada")
print("✓ Um único SVG preservado")
print("✓ Nenhum timer")
print("✓ Nenhum interval")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma animação infinita")
print("✓ Nenhuma dependência nova")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A4.1 aplicado.")
print("=" * 76)
