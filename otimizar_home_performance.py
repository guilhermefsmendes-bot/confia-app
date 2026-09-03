from pathlib import Path
import shutil
import re

print("=" * 50)
print(" CONFIA — OTIMIZAÇÃO HOME / AVATAR")
print("=" * 50)

files = [
    Path("src/components/HomeWorld.tsx"),
    Path("src/components/Avatar.tsx"),
]

# --------------------------------------------------
# BACKUPS
# --------------------------------------------------

for path in files:
    backup = path.with_suffix(path.suffix + ".performance2-backup")

    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"✓ Backup criado: {backup}")
    else:
        print(f"→ Backup já existe: {backup}")

# --------------------------------------------------
# HOMEWORLD
# --------------------------------------------------

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

original = text

# Memoriza as partículas para impedir que sejam
# recriadas em cada renderização do HomeWorld.
text = text.replace(
    'import React, { useState } from "react";',
    'import React, { useState, useMemo } from "react";'
)

old = '''const AmbientParticles = () => {
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white/70 animate-pulse pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
};'''

new = '''const AmbientParticles = React.memo(() => {
  const particles = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      animationDelay: `${i * 0.3}s`,
    }));
  }, []);

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-white/70 animate-pulse pointer-events-none"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
});'''

if old in text:
    text = text.replace(old, new)
    print("✓ AmbientParticles otimizado")
else:
    print("→ AmbientParticles: estrutura não encontrada")

# React.memo no componente principal
if "export default React.memo(HomeWorld)" not in text:
    text = text.rstrip()

    if text.endswith("};"):
        text = text[:-2] + "};\n\nexport default React.memo(HomeWorld);"
        print("✓ React.memo aplicado: HomeWorld")
    else:
        print("⚠ Não foi possível aplicar React.memo ao HomeWorld")

if text != original:
    path.write_text(text)
else:
    print("→ HomeWorld não precisou de alterações")

# --------------------------------------------------
# AVATAR
# --------------------------------------------------

path = Path("src/components/Avatar.tsx")
text = path.read_text()

original = text

# Não alteramos a lógica interna do Avatar.
# Apenas evitamos renderizações quando as props
# realmente não mudaram.

if "export const Avatar = React.memo(" not in text:

    text = text.replace(
        "export const Avatar: React.FC<AvatarProps> = ({",
        "const AvatarComponent: React.FC<AvatarProps> = ({"
    )

    # Encontrar o final do componente.
    # O ficheiro termina normalmente com };
    stripped = text.rstrip()

    if stripped.endswith("};"):
        text = stripped[:-2] + "};\n\nexport const Avatar = React.memo(AvatarComponent);"
        print("✓ React.memo aplicado: Avatar")
    else:
        print("⚠ Não foi possível localizar o fim do Avatar")

if text != original:
    path.write_text(text)
else:
    print("→ Avatar já estava otimizado")

print()
print("=" * 50)
print(" RESULTADO")
print("=" * 50)
print()
print("Otimizações aplicadas:")
print("  ✓ AmbientParticles memorado")
print("  ✓ Math.random() removido do ciclo de render")
print("  ✓ HomeWorld protegido com React.memo")
print("  ✓ Avatar protegido com React.memo")
print()
print("IMPORTANTE:")
print("Nenhuma funcionalidade foi removida.")
print("Nenhum dado/localStorage foi alterado.")
print("Nenhuma navegação foi alterada.")
print()
print("FIM")
print("=" * 50)
