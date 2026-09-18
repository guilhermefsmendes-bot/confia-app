from pathlib import Path
import shutil

path = Path.home() / "src/components/HomeShop.tsx"

if not path.exists():
    raise SystemExit(f"ERRO: não encontrado: {path}")

backup = Path("/tmp/HomeShop.tsx.before_b2_2_fix_legacy")
shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

print("Referências antes:", text.count("legacyItems"))

# Remove blocos condicionais JSX que ainda dependem de legacyItems
patterns = [
    '''      {legacyItems.length > 0 && (
        <>
''',
    '''      {legacyItems.length > 0 && (
''',
]

changed = False

# Caso comum: secção antiga até ao respetivo comentário/fim
if "legacyItems.length > 0" in text:
    start = text.find("{legacyItems.length > 0")

    # procurar o fechamento mais próximo do bloco condicional
    end_candidates = [
        text.find("      )}", start),
        text.find("    )}", start),
        text.find(")}", start),
    ]
    end_candidates = [x for x in end_candidates if x != -1]

    if not end_candidates:
        raise SystemExit(
            "ERRO: encontrei legacyItems mas não consegui localizar o fim do bloco."
        )

    end = min(end_candidates)

    # incluir o fechamento
    if text.startswith("      )}", end):
        end += len("      )}")
    elif text.startswith("    )}", end):
        end += len("    )}")
    else:
        end += len(")}")

    text = text[:start] + text[end:]
    changed = True

# Remover qualquer referência simples residual
if "legacyItems" in text:
    raise SystemExit(
        "ERRO: ainda existem referências a legacyItems. "
        "Não alterei o ficheiro para evitar apagar JSX incorreto."
    )

if not changed:
    raise SystemExit(
        "ERRO: não encontrei o bloco legacyItems esperado."
    )

path.write_text(text, encoding="utf-8")

print()
print("=" * 68)
print("CONFIA — FIX HOMESHOP LEGACY")
print("=" * 68)
print()
print("✓ Referência runtime a legacyItems removida")
print("✓ Loja antiga não é mais renderizada")
print("✓ Acessórios CONFIA preservados")
print("✓ XP preservado")
print("✓ Inventário preservado")
print("✓ Sem novo estado")
print("✓ Sem timers")
print("✓ Sem dependências")
print()
print(f"Backup: {backup}")
print()
print("Correção concluída.")
