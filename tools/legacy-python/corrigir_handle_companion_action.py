from pathlib import Path
import shutil

print("=" * 76)
print("CONFIA — CORREÇÃO DO CALLBACK DO COMPANHEIRO")
print("=" * 76)

path = Path("src/App.tsx")
backup = Path("/tmp/App.tsx.before_fix_handle_companion_action")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

text = path.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(path, backup)

# ============================================================
# BLOCO INVÁLIDO INSERIDO DENTRO DO JSX
# ============================================================

old = '''const handleCompanionAction = (
  target:
    | "impulse"
    | "patterns"
    | "progress"
    | "record"
) => {
  if (target === "impulse") {
    setHomeScreen("home");
    setCurrentTab(3);
    return;
  }

  if (target === "patterns") {
    setHomeScreen("patterns");
    setCurrentTab(0);
    return;
  }

  if (target === "progress") {
    setHomeScreen("progress");
    setCurrentTab(0);
    return;
  }

  if (target === "record") {
    setHomeScreen("home");
    setCurrentTab(0);
  }
};

'''

if old not in text:
    print("ERRO: bloco inválido do handleCompanionAction não encontrado.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

# ============================================================
# REMOVER A DECLARAÇÃO DO JSX
# ============================================================

text = text.replace(old, "", 1)

# ============================================================
# SUBSTITUIR O CALLBACK DO COMPONENTE
# ============================================================

old_prop = '''  onCompanionAction={handleCompanionAction}
'''

new_prop = '''  onCompanionAction={(target) => {
    if (target === "impulse") {
      setHomeScreen("home");
      setCurrentTab(3);
      return;
    }

    if (target === "patterns") {
      setHomeScreen("patterns");
      setCurrentTab(0);
      return;
    }

    if (target === "progress") {
      setHomeScreen("progress");
      setCurrentTab(0);
      return;
    }

    if (target === "record") {
      setHomeScreen("home");
      setCurrentTab(0);
    }
  }}
'''

if old_prop not in text:
    print("ERRO: propriedade onCompanionAction não encontrada.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

text = text.replace(old_prop, new_prop, 1)

# ============================================================
# VALIDAÇÕES
# ============================================================

if "const handleCompanionAction = (" in text:
    print("ERRO: declaração inválida ainda existe.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

if "onCompanionAction={(target) => {" not in text:
    print("ERRO: callback inline não foi criado.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# Garantir que as quatro rotas continuam presentes
for item in [
    'target === "impulse"',
    'target === "patterns"',
    'target === "progress"',
    'target === "record"',
]:
    if item not in text:
        print(f"ERRO: rota desapareceu: {item}")
        shutil.copy2(backup, path)
        raise SystemExit(1)

# ============================================================
# ESCRITA
# ============================================================

path.write_text(text, encoding="utf-8")

print()
print("✓ Declaração ilegal dentro do JSX removida")
print("✓ Callback onCompanionAction preservado")
print("✓ Destino impulse preservado")
print("✓ Destino patterns preservado")
print("✓ Destino progress preservado")
print("✓ Destino record preservado")
print("✓ Navegação existente preservada")
print("✓ Nenhum storage alterado")
print("✓ Nenhum sistema de memória alterado")
print("✓ Nenhum componente alterado")
print()
print(f"Backup: {backup}")
print()
print("CORREÇÃO APLICADA.")
print("=" * 76)
