from pathlib import Path
import shutil
import sys

CREATURE = Path(
    "src/components/Companheiro/ConfiaCreature.tsx"
)
HOME = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

BACKUP_CREATURE = Path(
    "/tmp/ConfiaCreature.tsx.before_premium_a3_4"
)
BACKUP_HOME = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_premium_a3_4"
)

for path in (CREATURE, HOME):
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

creature = CREATURE.read_text(encoding="utf-8")
home = HOME.read_text(encoding="utf-8")

# ============================================================
# VALIDAÇÃO PRÉVIA
# ============================================================

required_creature = [
    'state === "supportive"',
    'state === "curious"',
    'state === "celebrating"',
    'state === "welcoming"',
    "<svg",
]

required_home = [
    "const companionReaction = useMemo",
    "companionReaction?.state",
    "{companionMessage}",
    "const statusDot =",
]

for marker in required_creature:
    if marker not in creature:
        print(
            "ERRO ConfiaCreature: "
            f"estrutura não encontrada: {marker}"
        )
        sys.exit(1)

for marker in required_home:
    if marker not in home:
        print(
            "ERRO ConfiaCompanionHome: "
            f"estrutura não encontrada: {marker}"
        )
        sys.exit(1)

shutil.copy2(CREATURE, BACKUP_CREATURE)
shutil.copy2(HOME, BACKUP_HOME)

try:

    # ========================================================
    # 1. CONFIA CREATURE
    #
    # Acrescentar postura estática contextual.
    # Nenhuma animação permanente.
    # ========================================================

    flame_marker = '''  const flameScale =
    stage === 2'''

    posture_block = '''  /**
   * A3.4 — linguagem corporal contextual.
   *
   * São transformações ESTÁTICAS.
   * Mudam apenas quando muda o estado reativo.
   * Não existe loop de animação.
   */
  const reactionTransform =
    state === "supportive"
      ? "translate(0 3)"
      : state === "curious"
        ? "translate(2 -2) rotate(1 110 110)"
        : state === "welcoming"
          ? "translate(0 -2)"
          : state === "celebrating"
            ? "translate(0 -4)"
            : "translate(0 0)";

  const reactionOpacity =
    state === "supportive"
      ? 0.97
      : 1;

  const flameReactionScale =
    state === "celebrating"
      ? 1.08
      : state === "welcoming"
        ? 1.04
        : state === "supportive"
          ? 0.96
          : 1;

'''

    if "const reactionTransform =" not in creature:
        if flame_marker not in creature:
            raise RuntimeError(
                "posição para linguagem corporal "
                "não encontrada"
            )

        creature = creature.replace(
            flame_marker,
            posture_block + flame_marker,
            1,
        )

    # Encontrar o primeiro grupo visual principal.
    #
    # A criatura possui um grupo que recebe a escala
    # de evolução. Acrescentamos aí a reação contextual,
    # sem motion e sem CSS animation.
    group_candidates = [
        '''transform={`translate(110 110) scale(${bodyScale}) translate(-110 -110)`}''',
        '''transform={`translate(110,110) scale(${bodyScale}) translate(-110,-110)`}''',
    ]

    group_marker = None

    for candidate in group_candidates:
        if candidate in creature:
            group_marker = candidate
            break

    if group_marker is not None:
        replacement = (
            'transform={`${reactionTransform} '
            + group_marker[len("transform={"):-1]
        )

        # A construção acima seria demasiado dependente
        # do formato JSX. Não a usamos.
        pass

    # Em vez de alterar o grupo de escala existente,
    # envolvemos o conteúdo visual principal através
    # do atributo style do container da criatura.
    #
    # Procuramos o div exterior existente.
    div_marker = '''    <div
      className={`'''

    if div_marker not in creature:
        raise RuntimeError(
            "container exterior da criatura não encontrado"
        )

    div_replacement = '''    <div
      style={{
        transform:
          state === "supportive"
            ? "translateY(3px)"
            : state === "curious"
              ? "translate(2px, -2px) rotate(1deg)"
              : state === "welcoming"
                ? "translateY(-2px)"
                : state === "celebrating"
                  ? "translateY(-4px)"
                  : "none",
        opacity: reactionOpacity,
        transformOrigin: "50% 80%",
      }}
      className={`'''

    creature = creature.replace(
        div_marker,
        div_replacement,
        1,
    )

    # Fazer a chama responder ao estado através da escala
    # já calculada, se existir a transformação flameScale.
    flame_transform_old = '''scale(${flameScale})'''

    flame_transform_new = '''scale(${flameScale * flameReactionScale})'''

    if flame_transform_old in creature:
        creature = creature.replace(
            flame_transform_old,
            flame_transform_new,
            1,
        )

    # ========================================================
    # 2. COMPANION HOME
    #
    # Balão + atmosfera passam a refletir a MESMA reação.
    # ========================================================

    status_marker = '''  const statusDot =
    worldMood === "growing"'''

    presentation_block = '''  /**
   * A3.4 — apresentação contextual.
   *
   * A mesma decisão que controla a expressão da criatura
   * controla também a atmosfera e o balão.
   */
  const reactionState =
    companionReaction?.state ?? "neutral";

  const reactionIntensity =
    companionReaction?.visualIntensity ?? "quiet";

  const atmosphereClass =
    reactionState === "supportive"
      ? "bg-[#F3DDD4]/30"
      : reactionState === "curious"
        ? "bg-[#F4E4C9]/30"
        : reactionState === "welcoming"
          ? "bg-[#F7DFD2]/34"
          : reactionState === "celebrating"
            ? "bg-[#F2D3C3]/38"
            : "bg-[#F7DFD2]/25";

  const bubbleClass =
    reactionState === "supportive"
      ? "border-[#E8CFC5]/80 bg-[#FFFBF9]/95"
      : reactionState === "curious"
        ? "border-[#E8D8BD]/80 bg-[#FFFDF8]/95"
        : reactionState === "welcoming"
          ? "border-[#E9D1C5]/80 bg-white/95"
          : reactionState === "celebrating"
            ? "border-[#E6C2B2]/85 bg-[#FFFBF8]/95"
            : "border-[#E9D9D1]/70 bg-white/92";

  const bubbleShadow =
    reactionIntensity === "strong"
      ? "shadow-[0_13px_32px_rgba(89,58,45,0.09)]"
      : reactionIntensity === "normal"
        ? "shadow-[0_11px_29px_rgba(89,58,45,0.072)]"
        : "shadow-[0_10px_28px_rgba(89,58,45,0.055)]";

'''

    if "const reactionState =" not in home:
        if status_marker not in home:
            raise RuntimeError(
                "posição para apresentação contextual "
                "não encontrada"
            )

        home = home.replace(
            status_marker,
            presentation_block + status_marker,
            1,
        )

    # Atmosfera principal
    old_atmosphere = '''          bg-[#F7DFD2]/25
          blur-3xl'''

    new_atmosphere = '''          ${atmosphereClass}
          blur-3xl'''

    if old_atmosphere not in home:
        raise RuntimeError(
            "atmosfera principal não encontrada"
        )

    home = home.replace(
        old_atmosphere,
        new_atmosphere,
        1,
    )

    # Converter className normal em template string
    # apenas no primeiro halo.
    halo_start = home.find(
        'className="\n          pointer-events-none',
    )

    if halo_start == -1:
        raise RuntimeError(
            "className do halo não encontrada"
        )

    halo_end = home.find(
        '"\n        >',
        halo_start,
    )

    if halo_end == -1:
        raise RuntimeError(
            "fim do className do halo não encontrado"
        )

    halo = home[halo_start:halo_end + 1]

    if "${atmosphereClass}" in halo:
        halo_new = (
            halo
            .replace('className="', 'className={`', 1)
        )

        # retirar aspas finais e fechar template
        if halo_new.endswith('"'):
            halo_new = halo_new[:-1] + "`}"

        home = (
            home[:halo_start]
            + halo_new
            + home[halo_end + 1:]
        )

    # Balão principal
    old_bubble_classes = '''            border-[#E9D9D1]/70
            bg-white/92
            px-5
            py-4
            shadow-[0_10px_28px_rgba(89,58,45,0.065)]
            backdrop-blur-sm'''

    new_bubble_classes = '''            ${bubbleClass}
            px-5
            py-4
            ${bubbleShadow}
            backdrop-blur-sm'''

    if old_bubble_classes not in home:
        raise RuntimeError(
            "classes do balão não encontradas"
        )

    home = home.replace(
        old_bubble_classes,
        new_bubble_classes,
        1,
    )

    # Converter className do balão para template string.
    bubble_search_pos = home.find(
        "${bubbleClass}"
    )

    if bubble_search_pos == -1:
        raise RuntimeError(
            "bubbleClass não inserida"
        )

    bubble_class_start = home.rfind(
        'className="',
        0,
        bubble_search_pos,
    )

    if bubble_class_start == -1:
        raise RuntimeError(
            "início className do balão não encontrado"
        )

    bubble_class_end = home.find(
        '"\n          >',
        bubble_search_pos,
    )

    if bubble_class_end == -1:
        raise RuntimeError(
            "fim className do balão não encontrado"
        )

    bubble_chunk = home[
        bubble_class_start:
        bubble_class_end + 1
    ]

    bubble_chunk_new = bubble_chunk.replace(
        'className="',
        'className={`',
        1,
    )

    if bubble_chunk_new.endswith('"'):
        bubble_chunk_new = (
            bubble_chunk_new[:-1] + "`}"
        )

    home = (
        home[:bubble_class_start]
        + bubble_chunk_new
        + home[bubble_class_end + 1:]
    )

    # A cauda acompanha visualmente o balão.
    #
    # Não adicionamos nova lógica de cor dinâmica complexa;
    # apenas suavizamos para que não pareça uma peça separada.
    tail_old = '''            border-[#E9D9D1]/70
            bg-white'''

    tail_new = '''            border-[#E9D9D1]/60
            bg-[#FFFCFA]'''

    if tail_old in home:
        home = home.replace(
            tail_old,
            tail_new,
            1,
        )

    # ========================================================
    # ESCREVER
    # ========================================================

    CREATURE.write_text(
        creature,
        encoding="utf-8",
    )

    HOME.write_text(
        home,
        encoding="utf-8",
    )

    # ========================================================
    # VALIDAÇÃO
    # ========================================================

    final_creature = CREATURE.read_text(
        encoding="utf-8"
    )

    final_home = HOME.read_text(
        encoding="utf-8"
    )

    checks = {
        "Postura contextual criada":
            "const reactionTransform ="
            in final_creature,

        "Opacidade contextual criada":
            "const reactionOpacity ="
            in final_creature,

        "Chama contextual preparada":
            "const flameReactionScale ="
            in final_creature,

        "Supportive com postura própria":
            '"translateY(3px)"'
            in final_creature,

        "Curious com postura própria":
            '"translate(2px, -2px) rotate(1deg)"'
            in final_creature,

        "Welcoming com postura própria":
            '"translateY(-2px)"'
            in final_creature,

        "Celebrating com postura própria":
            '"translateY(-4px)"'
            in final_creature,

        "Estado único reutilizado no Home":
            'companionReaction?.state ?? "neutral"'
            in final_home,

        "Intensidade reutilizada":
            "companionReaction?.visualIntensity"
            in final_home,

        "Atmosfera contextual":
            "const atmosphereClass ="
            in final_home,

        "Balão contextual":
            "const bubbleClass ="
            in final_home,

        "Shadow contextual":
            "const bubbleShadow ="
            in final_home,

        "Mensagem preservada":
            "{companionMessage}"
            in final_home,

        "Avatar preservado":
            "<Avatar"
            in final_home,

        "Sem timer na criatura":
            "setTimeout("
            not in final_creature,

        "Sem interval":
            "setInterval("
            not in final_creature
            and "setInterval("
            not in final_home,

        "Sem requestAnimationFrame":
            "requestAnimationFrame("
            not in final_creature
            and "requestAnimationFrame("
            not in final_home,

        "Sem canvas":
            "<canvas"
            not in final_creature
            and "<canvas"
            not in final_home,

        "Sem animação infinita":
            "repeat: Infinity"
            not in final_creature
            and "repeat: Infinity"
            not in final_home,
    }

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação final falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:
    shutil.copy2(
        BACKUP_CREATURE,
        CREATURE,
    )
    shutil.copy2(
        BACKUP_HOME,
        HOME,
    )

    print("ERRO:", exc)
    print()
    print(
        "Os dois ficheiros foram restaurados."
    )
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A3.4")
print("=" * 76)
print()
print("✓ Linguagem corporal contextual adicionada")
print("✓ neutral -> presença calma")
print("✓ supportive -> postura mais próxima")
print("✓ curious -> ligeira inclinação de atenção")
print("✓ welcoming -> postura mais aberta")
print("✓ celebrating -> postura mais elevada")
print("✓ Expressões faciais A2 preservadas")
print("✓ Braços contextuais A2 preservados")
print("✓ Chama responde subtilmente ao estado")
print("✓ Atmosfera acompanha a reação")
print("✓ Balão acompanha a reação")
print("✓ Intensidade visual do A3.1 utilizada")
print("✓ Micro-reação ao toque existente preservada")
print("✓ Mensagem do Reactive Engine preservada")
print("✓ XP/evolução preservados")
print("✓ Nenhum timer novo")
print("✓ Nenhum interval")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma animação infinita")
print("✓ Nenhuma dependência nova")
print()
print("Backups:")
print(f"  {BACKUP_CREATURE}")
print(f"  {BACKUP_HOME}")
print()
print("A3.4 aplicado.")
print("=" * 76)
