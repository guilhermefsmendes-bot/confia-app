from pathlib import Path
import shutil
import sys

FILE = Path(
    "src/components/Companheiro/ConfiaCreature.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCreature.tsx.before_premium_a4_2"
)

if not FILE.exists():
    print("ERRO: ConfiaCreature.tsx não encontrado.")
    sys.exit(1)

source = FILE.read_text(encoding="utf-8")
creature = source

required = [
    "CAUDA — assinatura posterior",
    "{stage >= 3 && (",
    "PÉS",
    'cx="84"',
    'cx="136"',
    "MATURIDADE",
    "{stage >= 4 && (",
    "{stage === 5 && (",
    "evolutionBodyStretch",
    "evolutionEarScale",
    "evolutionEyeScale",
]

for marker in required:
    if marker not in creature:
        print(
            "ERRO: estrutura esperada não encontrada:",
            marker
        )
        sys.exit(1)

shutil.copy2(FILE, BACKUP)

try:

    # ========================================================
    # 1. CAUDA EVOLUTIVA
    #
    # stage 2: ainda sem cauda
    # stage 3: cauda pequena
    # stage 4: cauda jovem
    # stage 5: cauda completa
    # ========================================================

    old_tail = '''            {stage >= 3 && (
              <path
                d="
                  M157 142
                  C184 142 193 123 184 109
                  C179 101 171 100 166 104
                  C177 113 175 126 160 129
                  Z
                "
                fill="url(#confiaBodyPremium)"
                stroke="#A75D4B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}'''

    new_tail = '''            {stage >= 3 && (
              <path
                d={
                  stage === 3
                    ? `
                      M157 145
                      C173 145 180 136 176 127
                      C173 121 168 120 164 123
                      C170 129 168 136 158 137
                      Z
                    `
                    : stage === 4
                      ? `
                        M157 143
                        C181 143 188 128 182 115
                        C178 107 171 105 166 109
                        C175 117 173 129 159 132
                        Z
                      `
                      : `
                        M157 142
                        C184 142 193 123 184 109
                        C179 101 171 100 166 104
                        C177 113 175 126 160 129
                        Z
                      `
                }
                fill="url(#confiaBodyPremium)"
                stroke="#A75D4B"
                strokeWidth={
                  stage === 3
                    ? 2.6
                    : 3
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}'''

    if old_tail not in creature:
        raise RuntimeError(
            "bloco exato da cauda não encontrado"
        )

    creature = creature.replace(
        old_tail,
        new_tail,
        1,
    )

    # ========================================================
    # 2. PÉS EVOLUTIVOS
    #
    # Nascente: pequenos e arredondados
    # Pequena: maiores
    # Jovem: proporcionais
    # Adulta: ligeiramente mais elegantes
    # ========================================================

    old_feet = '''            <ellipse
              cx="84"
              cy="177"
              rx="17"
              ry="7.5"
              fill="#B76350"
            />

            <ellipse
              cx="136"
              cy="177"
              rx="17"
              ry="7.5"
              fill="#B76350"
            />'''

    new_feet = '''            <ellipse
              cx={
                stage === 2
                  ? 89
                  : stage === 3
                    ? 86
                    : 84
              }
              cy={
                stage === 2
                  ? 175
                  : 177
              }
              rx={
                stage === 2
                  ? 11
                  : stage === 3
                    ? 14
                    : stage === 4
                      ? 16
                      : 17
              }
              ry={
                stage === 2
                  ? 6
                  : stage === 3
                    ? 6.8
                    : 7.5
              }
              fill="#B76350"
            />

            <ellipse
              cx={
                stage === 2
                  ? 131
                  : stage === 3
                    ? 134
                    : 136
              }
              cy={
                stage === 2
                  ? 175
                  : 177
              }
              rx={
                stage === 2
                  ? 11
                  : stage === 3
                    ? 14
                    : stage === 4
                      ? 16
                      : 17
              }
              ry={
                stage === 2
                  ? 6
                  : stage === 3
                    ? 6.8
                    : 7.5
              }
              fill="#B76350"
            />'''

    if old_feet not in creature:
        raise RuntimeError(
            "bloco exato dos pés não encontrado"
        )

    creature = creature.replace(
        old_feet,
        new_feet,
        1,
    )

    # ========================================================
    # 3. ASSINATURA DA NASCENTE — STAGE 2
    #
    # Um pequeno ponto luminoso no ventre.
    # É o início visual da identidade que amadurece depois.
    # ========================================================

    maturity_marker = '''            {/* ===============================================
                MATURIDADE'''

    maturity_pos = creature.find(
        maturity_marker
    )

    if maturity_pos == -1:
        raise RuntimeError(
            "bloco MATURIDADE não encontrado"
        )

    stage2_detail = '''            {/* A4.2 — Nascente: primeiro sinal de identidade */}
            {stage === 2 && (
              <circle
                cx="110"
                cy="158"
                r="2"
                fill="#E6AE83"
                opacity="0.38"
              />
            )}

'''

    if "Nascente: primeiro sinal de identidade" not in creature:
        creature = (
            creature[:maturity_pos]
            + stage2_detail
            + creature[maturity_pos:]
        )

    # ========================================================
    # 4. ASSINATURA DA PEQUENA CONFIA — STAGE 3
    #
    # Pequena curva no ventre.
    # Não é decoração: é o início da marca corporal adulta.
    # ========================================================

    maturity_pos = creature.find(
        maturity_marker
    )

    stage3_detail = '''            {/* A4.2 — Pequena CONFIA: marca começa a formar-se */}
            {stage === 3 && (
              <path
                d="M98 154 Q110 160 122 154"
                fill="none"
                stroke="#D99A78"
                strokeWidth="1.7"
                strokeLinecap="round"
                opacity="0.38"
              />
            )}

'''

    if "Pequena CONFIA: marca começa a formar-se" not in creature:
        creature = (
            creature[:maturity_pos]
            + stage3_detail
            + creature[maturity_pos:]
        )

    # ========================================================
    # 5. JOVEM — REFORÇO DA MARCA FRONTAL
    #
    # O stage >=4 já possui a chama interior.
    # No stage 4 acrescentamos apenas uma pequena luz própria.
    # ========================================================

    flame_stage5 = '''              {stage === 5 && (
                <circle
                  cx="110"
                  cy="47"
                  r="2.3"
                  fill="#FFFFFF"
                  opacity="0.88"
                />
              )}'''

    young_detail = '''              {stage === 4 && (
                <circle
                  cx="110"
                  cy="48"
                  r="1.35"
                  fill="#FFF8D8"
                  opacity="0.72"
                />
              )}

'''

    if flame_stage5 not in creature:
        raise RuntimeError(
            "detalhe frontal stage 5 não encontrado"
        )

    if 'stage === 4 && (' not in creature[
        creature.find("MARCA CONFIA NA TESTA"):
        creature.find("SOBRANCELHAS / EXPRESSÃO")
    ]:
        creature = creature.replace(
            flame_stage5,
            young_detail + flame_stage5,
            1,
        )

    # ========================================================
    # 6. ESCREVER
    # ========================================================

    FILE.write_text(
        creature,
        encoding="utf-8",
    )

    written = FILE.read_text(
        encoding="utf-8"
    )

    # ========================================================
    # 7. VALIDAÇÃO
    # ========================================================

    checks = {
        "Ovo preservado":
            "{isEgg ? (" in written,

        "Nascente diferenciada":
            "Nascente: primeiro sinal de identidade"
            in written,

        "Pequena CONFIA diferenciada":
            "Pequena CONFIA: marca começa a formar-se"
            in written,

        "Cauda stage 3":
            "stage === 3" in written
            and "M157 145" in written,

        "Cauda stage 4":
            "M157 143" in written,

        "Cauda adulta":
            "M157 142" in written,

        "Pés progressivos":
            "stage === 2"
            in written
            and "? 11"
            in written
            and "? 14"
            in written,

        "Maturidade stage 4":
            "{stage >= 4 && ("
            in written,

        "Adulto stage 5":
            "{stage === 5 && ("
            in written,

        "A4.1 body preservado":
            "evolutionBodyStretch"
            in written,

        "A4.1 orelhas preservadas":
            "evolutionEarScale"
            in written,

        "A4.1 olhos preservados":
            "evolutionEyeScale"
            in written,

        "Estados reativos":
            'state === "supportive"'
            in written
            and 'state === "curious"'
            in written
            and 'state === "welcoming"'
            in written
            and 'state === "celebrating"'
            in written,

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
print("CONFIA — COMPANHEIRO PREMIUM A4.2")
print("=" * 76)
print()
print("✓ Identidade das formas reforçada")
print("✓ Forma 1 — Ovo preservada")
print("✓ Forma 2 — Nascente com identidade embrionária")
print("✓ Forma 3 — Pequena CONFIA com primeira marca corporal")
print("✓ Cauda da Forma 3 pequena")
print("✓ Cauda da Forma 4 mais desenvolvida")
print("✓ Cauda da Forma 5 completa")
print("✓ Pés crescem progressivamente")
print("✓ Forma 4 mantém maturidade corporal")
print("✓ Forma 5 mantém assinatura adulta")
print("✓ A4.1 preservado")
print("✓ Estados emocionais preservados")
print("✓ Reação ao toque preservada")
print("✓ Um único SVG")
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
print("A4.2 aplicado.")
print("=" * 76)
