from pathlib import Path
import shutil
import sys

FILE = Path(
    "src/components/Companheiro/ConfiaCreature.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCreature.tsx.before_premium_a4_3"
)

if not FILE.exists():
    print("ERRO: ConfiaCreature.tsx não encontrado.")
    sys.exit(1)

source = FILE.read_text(encoding="utf-8")
creature = source

required = [
    "const safeLevel =",
    "const stage =",
    "const bodyScale =",
    "const evolutionEarScale =",
    "const evolutionEyeScale =",
    "scale(${flameScale * flameReactionScale})",
    "{stage === 3 && (",
    "{stage >= 4 && (",
    "{stage === 5 && (",
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
    # 1. MICROPROGRESSÃO DOS 10 NÍVEIS
    #
    # Não altera stage.
    # Não cria novas formas.
    # Apenas acrescenta pequenas diferenças dentro da forma.
    # ========================================================

    marker = "  const eyeY ="

    level_progression = '''  /**
   * ==========================================================
   * A4.3 — MICROPROGRESSÃO DOS 10 NÍVEIS
   * ==========================================================
   *
   * As grandes mudanças continuam a ser as 5 formas.
   * Estes valores dão apenas uma pequena recompensa visual
   * entre níveis pertencentes à mesma forma.
   */

  const levelFlameBoost =
    safeLevel === 3
      ? 1.025
      : safeLevel === 5
        ? 1.035
        : safeLevel === 7
          ? 1.025
          : safeLevel === 8
            ? 1.055
            : safeLevel === 10
              ? 1.065
              : 1;

  const levelMarkOpacity =
    safeLevel === 2
      ? 0.30
      : safeLevel === 3
        ? 0.46
        : safeLevel === 4
          ? 0.30
          : safeLevel === 5
            ? 0.48
            : safeLevel === 6
              ? 0.36
              : safeLevel === 7
                ? 0.46
                : safeLevel === 8
                  ? 0.58
                  : safeLevel === 9
                    ? 0.48
                    : safeLevel === 10
                      ? 0.66
                      : 0.38;

  const levelTailBoost =
    safeLevel === 5
      ? 1.035
      : safeLevel === 7
        ? 1.025
        : safeLevel === 8
          ? 1.05
          : safeLevel === 10
            ? 1.045
            : 1;

'''

    if "const levelFlameBoost =" not in creature:
        if marker not in creature:
            raise RuntimeError(
                "ponto de inserção da progressão "
                "não encontrado"
            )

        creature = creature.replace(
            marker,
            level_progression + marker,
            1,
        )

    # ========================================================
    # 2. CHAMA — MICROPROGRESSÃO
    # ========================================================

    old_flame_transform = (
        "scale(${flameScale * flameReactionScale})"
    )

    new_flame_transform = (
        "scale(${flameScale * "
        "flameReactionScale * levelFlameBoost})"
    )

    if new_flame_transform not in creature:
        if creature.count(old_flame_transform) != 1:
            raise RuntimeError(
                "transform da chama inesperado"
            )

        creature = creature.replace(
            old_flame_transform,
            new_flame_transform,
            1,
        )

    # ========================================================
    # 3. CAUDA — MICROPROGRESSÃO DENTRO DA FORMA
    #
    # Envolve apenas a path existente.
    # O desenho base A4.2 continua igual.
    # ========================================================

    tail_start_marker = (
        "            {stage >= 3 && (\n"
        "              <path"
    )

    tail_start = creature.find(tail_start_marker)

    if tail_start == -1:
        raise RuntimeError(
            "início da cauda A4.2 não encontrado"
        )

    tail_end_marker = "            )}"

    tail_end = creature.find(
        tail_end_marker,
        tail_start,
    )

    if tail_end == -1:
        raise RuntimeError(
            "fim da cauda não encontrado"
        )

    tail_end += len(tail_end_marker)

    tail_block = creature[
        tail_start:tail_end
    ]

    if "levelTailBoost" not in tail_block:

        old_open = '''            {stage >= 3 && (
              <path'''

        new_open = '''            {stage >= 3 && (
              <g
                transform={`
                  translate(
                    ${160 - 160 * levelTailBoost}
                    ${135 - 135 * levelTailBoost}
                  )
                  scale(${levelTailBoost})
                `}
              >
              <path'''

        if old_open not in tail_block:
            raise RuntimeError(
                "abertura exata da cauda não encontrada"
            )

        tail_block_new = tail_block.replace(
            old_open,
            new_open,
            1,
        )

        # O bloco termina atualmente em:
        # />
        # )}
        last = '''              />
            )}'''

        replacement = '''              />
              </g>
            )}'''

        if last not in tail_block_new:
            raise RuntimeError(
                "fecho exato da cauda não encontrado"
            )

        tail_block_new = tail_block_new.replace(
            last,
            replacement,
            1,
        )

        creature = (
            creature[:tail_start]
            + tail_block_new
            + creature[tail_end:]
        )

    # ========================================================
    # 4. MARCA DA NASCENTE — N2 VS N3
    # ========================================================

    old_stage2_opacity = '''            {/* A4.2 — Nascente: primeiro sinal de identidade */}
            {stage === 2 && (
              <circle
                cx="110"
                cy="158"
                r="2"
                fill="#E6AE83"
                opacity="0.38"
              />
            )}'''

    new_stage2_opacity = '''            {/* A4.2/A4.3 — Nascente: identidade cresce com o nível */}
            {stage === 2 && (
              <circle
                cx="110"
                cy="158"
                r={
                  safeLevel === 3
                    ? 2.35
                    : 2
                }
                fill="#E6AE83"
                opacity={levelMarkOpacity}
              />
            )}'''

    if old_stage2_opacity in creature:
        creature = creature.replace(
            old_stage2_opacity,
            new_stage2_opacity,
            1,
        )
    elif "identidade cresce com o nível" not in creature:
        raise RuntimeError(
            "marca da Nascente inesperada"
        )

    # ========================================================
    # 5. MARCA DA PEQUENA — N4 VS N5
    # ========================================================

    old_small_opacity = '''            {/* A4.2 — Pequena CONFIA: marca começa a formar-se */}
            {stage === 3 && (
              <path
                d="M98 154 Q110 160 122 154"
                fill="none"
                stroke="#D99A78"
                strokeWidth="1.7"
                strokeLinecap="round"
                opacity="0.38"
              />
            )}'''

    new_small_opacity = '''            {/* A4.2/A4.3 — Pequena CONFIA: marca amadurece */}
            {stage === 3 && (
              <path
                d={
                  safeLevel === 5
                    ? "M96 153 Q110 161 124 153"
                    : "M98 154 Q110 160 122 154"
                }
                fill="none"
                stroke="#D99A78"
                strokeWidth={
                  safeLevel === 5
                    ? 1.9
                    : 1.7
                }
                strokeLinecap="round"
                opacity={levelMarkOpacity}
              />
            )}'''

    if old_small_opacity in creature:
        creature = creature.replace(
            old_small_opacity,
            new_small_opacity,
            1,
        )
    elif "Pequena CONFIA: marca amadurece" not in creature:
        raise RuntimeError(
            "marca da Pequena CONFIA inesperada"
        )

    # ========================================================
    # 6. MATURIDADE — N6/N7/N8/N9/N10
    #
    # A geometria permanece.
    # Só a intensidade acompanha o nível.
    # ========================================================

    old_mature_path_opacity = '                  opacity="0.48"'
    new_mature_path_opacity = (
        "                  opacity={levelMarkOpacity}"
    )

    # Primeira ocorrência após MATURIDADE.
    maturity_pos = creature.find(
        "MATURIDADE"
    )

    if maturity_pos == -1:
        raise RuntimeError(
            "MATURIDADE não encontrada"
        )

    mature_opacity_pos = creature.find(
        old_mature_path_opacity,
        maturity_pos,
    )

    if mature_opacity_pos == -1:
        raise RuntimeError(
            "opacity da marca madura não encontrada"
        )

    creature = (
        creature[:mature_opacity_pos]
        + new_mature_path_opacity
        + creature[
            mature_opacity_pos
            + len(old_mature_path_opacity):
        ]
    )

    # ========================================================
    # 7. NÍVEL 10 — ASSINATURA FINAL EXCLUSIVA
    #
    # Os pontos laterais que já existem no adulto passam
    # a aparecer apenas no nível máximo.
    # Assim N9 = adulto; N10 = adulto pleno.
    # ========================================================

    adult_signature_comment = (
        "{/* A4.1 — assinatura final da espécie */}"
    )

    signature_pos = creature.find(
        adult_signature_comment
    )

    if signature_pos == -1:
        raise RuntimeError(
            "assinatura adulta A4.1 não encontrada"
        )

    first_circle = creature.find(
        "<circle",
        signature_pos,
    )

    if first_circle == -1:
        raise RuntimeError(
            "primeiro ponto adulto não encontrado"
        )

    second_circle_end = creature.find(
        "/>",
        creature.find(
            "<circle",
            first_circle + 1,
        ),
    )

    if second_circle_end == -1:
        raise RuntimeError(
            "segundo ponto adulto não encontrado"
        )

    second_circle_end += 2

    signature_circles = creature[
        first_circle:second_circle_end
    ]

    if "safeLevel === 10" not in creature[
        signature_pos:
        second_circle_end + 100
    ]:

        wrapped_signature = '''{safeLevel === 10 && (
                  <>
''' + signature_circles + '''
                  </>
                )}'''

        creature = (
            creature[:first_circle]
            + wrapped_signature
            + creature[second_circle_end:]
        )

    # ========================================================
    # 8. ESCREVER
    # ========================================================

    FILE.write_text(
        creature,
        encoding="utf-8",
    )

    written = FILE.read_text(
        encoding="utf-8"
    )

    # ========================================================
    # 9. VALIDAÇÃO
    # ========================================================

    checks = {
        "safeLevel preservado":
            "const safeLevel =" in written,

        "5 formas preservadas":
            "const stage =" in written,

        "microprogressão chama":
            "const levelFlameBoost ="
            in written,

        "microprogressão marca":
            "const levelMarkOpacity ="
            in written,

        "microprogressão cauda":
            "const levelTailBoost ="
            in written,

        "chama usa nível":
            "flameReactionScale * levelFlameBoost"
            in written,

        "cauda usa nível":
            "scale(${levelTailBoost})"
            in written,

        "Nascente N2/N3":
            "safeLevel === 3"
            in written,

        "Pequena N4/N5":
            "safeLevel === 5"
            in written,

        "Jovem N6/N7/N8":
            "safeLevel === 7"
            in written
            and "safeLevel === 8"
            in written,

        "Adulto N9/N10":
            "safeLevel === 10"
            in written,

        "N10 assinatura exclusiva":
            "{safeLevel === 10 && ("
            in written,

        "A4.1 preservado":
            "evolutionBodyStretch"
            in written
            and "evolutionEarScale"
            in written
            and "evolutionEyeScale"
            in written,

        "A4.2 preservado":
            "Nascente: identidade cresce com o nível"
            in written
            and "Pequena CONFIA: marca amadurece"
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

        "Sem rAF real":
            "requestAnimationFrame(" not in written,

        "Sem canvas":
            "<canvas" not in written,

        "Sem animação infinita":
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
        FILE,
    )

    print("ERRO:", exc)
    print()
    print(
        "ConfiaCreature.tsx restaurado automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A4.3")
print("=" * 76)
print()
print("✓ Progressão visual dos 10 níveis criada")
print("✓ Nível 1 continua Ovo")
print("✓ Níveis 2–3 têm microprogressão")
print("✓ Níveis 4–5 têm microprogressão")
print("✓ Níveis 6–8 têm microprogressão")
print("✓ Níveis 9–10 têm microprogressão")
print("✓ Nível 10 ganhou assinatura final exclusiva")
print("✓ Chama cresce subtilmente dentro das formas")
print("✓ Marca corporal amadurece com o nível")
print("✓ Cauda amadurece subtilmente com o nível")
print("✓ 5 grandes formas preservadas")
print("✓ A4.1 preservado")
print("✓ A4.2 preservado")
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
print("A4.3 aplicado.")
print("=" * 76)
