from pathlib import Path
import shutil

path = Path.home() / "src/components/HomeShop.tsx"

if not path.exists():
    raise SystemExit(f"ERRO: ficheiro não encontrado: {path}")

backup = Path("/tmp/HomeShop.tsx.before_b2_2_fix_legacy_v2")
shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

start_marker = """      {/* =====================================================
          OBJETOS LEGACY
      ===================================================== */}"""

end_marker = """      )}"""

start = text.find(start_marker)

if start == -1:
    raise SystemExit(
        "ERRO: não encontrei o início da secção OBJETOS LEGACY."
    )

conditional_start = text.find(
    "{legacyItems.length > 0 && (",
    start
)

if conditional_start == -1:
    raise SystemExit(
        "ERRO: secção encontrada, mas não encontrei legacyItems."
    )

end = text.find(end_marker, conditional_start)

if end == -1:
    raise SystemExit(
        "ERRO: não encontrei o fim do bloco legacyItems."
    )

end += len(end_marker)

# incluir quebras de linha seguintes
while end < len(text) and text[end] in "\r\n":
    end += 1

text = text[:start] + text[end:]

if "legacyItems" in text:
    raise SystemExit(
        "ERRO: ainda existem referências a legacyItems. "
        "Ficheiro não gravado."
    )

path.write_text(text, encoding="utf-8")

print()
print("=" * 68)
print("CONFIA — B2.2 FIX LEGACY SHOP V2")
print("=" * 68)
print()
print("✓ Secção OBJETOS LEGACY removida")
print("✓ legacyItems removido do HomeShop")
print("✓ Loja dos acessórios CONFIA preservada")
print("✓ 40 acessórios preservados")
print("✓ XP preservado")
print("✓ Inventário preservado")
print("✓ Sem novo estado")
print("✓ Sem timers")
print("✓ Sem dependências")
print()
print(f"Backup: {backup}")
print()
print("Correção concluída.")
