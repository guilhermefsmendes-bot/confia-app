from pathlib import Path
import shutil
import sys

path = Path("src/components/HomeWorld.tsx")

if not path.exists():
    print("ERRO: HomeWorld.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

# ============================================================
# CONFIA — 1B.4D.3C
# AVATAR: EDIT MODE + PERSISTÊNCIA + POINTER ROBUSTO
# ============================================================

# ------------------------------------------------------------
# 1. Estado atual do Avatar
# ------------------------------------------------------------

old_state = '''const [avatarPosition, setAvatarPosition] = useState({
  x: 0,
  y: 0
});'''

new_state = '''const [avatarPosition, setAvatarPosition] = useState(() => {
  const saved = getPositions().__avatar__;

  return {
    left: saved?.left ?? "50%",
    top: saved?.top ?? "50%"
  };
});'''

if text.count(old_state) != 1:
    print(
        "ERRO: estado avatarPosition atual deveria existir "
        "exatamente uma vez."
    )
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

text = text.replace(old_state, new_state, 1)

# ------------------------------------------------------------
# 2. Encontrar o início exato do wrapper atual do Avatar
# ------------------------------------------------------------

avatar_start_marker = '''<div
  className="absolute z-[35] cursor-move"
  style={{
    left: `calc(50% + ${avatarPosition.x}px)`,
    top: `calc(50% + ${avatarPosition.y}px)`,
    transform: "translate(-50%, -50%) scale(0.5)",
    touchAction: "none"
  }}'''

avatar_start = text.find(avatar_start_marker)

if avatar_start == -1:
    print("ERRO: início atual do wrapper do Avatar não encontrado.")
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

# A sombra já existente marca o fim da zona que queremos substituir.
shadow_marker = '''<div
  className="
    absolute
    bottom-1
    left-[45%]'''

shadow_start = text.find(shadow_marker, avatar_start)

if shadow_start == -1:
    print("ERRO: sombra existente do Avatar não encontrada.")
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

old_avatar_interaction = text[avatar_start:shadow_start]

# ------------------------------------------------------------
# 3. Validar que estamos realmente a substituir a lógica antiga
# ------------------------------------------------------------

expected_old_fragments = [
    'className="absolute z-[35] cursor-move"',
    "avatarPosition.x",
    "avatarPosition.y",
    "setDraggingAvatar(true)",
    "if(!draggingAvatar) return;",
    "e.movementX",
    "e.movementY",
    "setDraggingAvatar(false)",
]

for fragment in expected_old_fragments:
    if fragment not in old_avatar_interaction:
        print(
            "ERRO: bloco do Avatar não corresponde à versão esperada:"
        )
        print(fragment)
        print("Nenhuma alteração efetuada.")
        sys.exit(1)

# ------------------------------------------------------------
# 4. Novo wrapper/interação
# ------------------------------------------------------------

new_avatar_interaction = '''<div
  className={`absolute z-[35] ${
    editMode ? "cursor-move" : "cursor-pointer"
  }`}
  style={{
    left: avatarPosition.left,
    top: avatarPosition.top,
    transform: "translate(-50%, -50%) scale(0.5)",
    touchAction: editMode ? "none" : "manipulation"
  }}

  onPointerDown={(e) => {
    if (!editMode) return;

    e.preventDefault();

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

    setDraggingAvatar(true);
  }}

  onPointerMove={(e) => {
    if (!editMode || !draggingAvatar) return;

    e.preventDefault();

    const rect =
      e.currentTarget.parentElement!.getBoundingClientRect();

    const left = Math.max(
      8,
      Math.min(
        92,
        ((e.clientX - rect.left) / rect.width) * 100
      )
    );

    const top = Math.max(
      18,
      Math.min(
        82,
        ((e.clientY - rect.top) / rect.height) * 100
      )
    );

    setAvatarPosition({
      left: `${left}%`,
      top: `${top}%`
    });
  }}

  onPointerUp={(e) => {
    if (!editMode || !draggingAvatar) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      );
    }

    const nextPositions = {
      ...objectPositions,
      __avatar__: {
        left: avatarPosition.left,
        top: avatarPosition.top
      }
    };

    setObjectPositions(nextPositions);
    savePositions(nextPositions);
    setDraggingAvatar(false);
  }}
>
'''

text = (
    text[:avatar_start]
    + new_avatar_interaction
    + text[shadow_start:]
)

# ------------------------------------------------------------
# 5. Verificações finais ANTES de gravar
# ------------------------------------------------------------

required = [
    "getPositions().__avatar__",
    'left: saved?.left ?? "50%"',
    'top: saved?.top ?? "50%"',
    'editMode ? "cursor-move" : "cursor-pointer"',
    'touchAction: editMode ? "none" : "manipulation"',
    "if (!editMode) return;",
    "if (!editMode || !draggingAvatar) return;",
    "getBoundingClientRect()",
    "e.clientX",
    "e.clientY",
    "__avatar__:",
    "setObjectPositions(nextPositions)",
    "savePositions(nextPositions)",
    'transform: "translate(-50%, -50%) scale(0.5)"',
    'z-[35]',
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: elemento esperado ausente: {fragment}")
        print("Nenhuma alteração efetuada.")
        sys.exit(1)

legacy = [
    "avatarPosition.x",
    "avatarPosition.y",
    "e.movementX",
    "e.movementY",
    'className="absolute z-[35] cursor-move"',
]

for fragment in legacy:
    if fragment in text:
        print(f"ERRO: lógica antiga ainda presente: {fragment}")
        print("Nenhuma alteração efetuada.")
        sys.exit(1)

# Preservar elementos estruturais importantes
preserved = [
    "<PremiumRefuge",
    "<PremiumEnvironment",
    "<PremiumSky",
    "<PremiumLighting",
    "<PremiumGround",
    "<PremiumPath",
    "<Avatar",
    'h-[600px]',
    "bg-black/20",
    "handlePetAvatar",
]

for fragment in preserved:
    if fragment not in text:
        print(f"ERRO: elemento importante desapareceu: {fragment}")
        print("Nenhuma alteração efetuada.")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração seria efetuada.")
    sys.exit(1)

# ------------------------------------------------------------
# 6. Só agora criar backup e gravar
# ------------------------------------------------------------

shutil.copy2(
    path,
    "/tmp/HomeWorld.tsx.before_avatar_world_integration"
)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4D.3C")
print("=" * 72)
print("✓ Estado antigo x/y substituído")
print("✓ Avatar usa homePositions existente")
print("✓ Chave reservada __avatar__ aplicada")
print("✓ Posição inicial 50% / 50% preservada")
print("✓ Avatar só pode ser arrastado em modo Editar")
print("✓ Fora de Editar mantém interação normal")
print("✓ movementX / movementY removidos")
print("✓ Pointer calculado relativamente ao HomeWorld")
print("✓ Limites seguros de movimento aplicados")
print("✓ Posição persistida ao terminar o drag")
print("✓ objectPositions sincronizado")
print("✓ Zero localStorage paralelo")
print("✓ Escala 0.5 preservada")
print("✓ Avatar continua em z35")
print("✓ Sombra existente preservada")
print("✓ Mundo premium preservado")
print("✓ Nenhum texto novo")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — integração premium do Avatar aplicada.")
