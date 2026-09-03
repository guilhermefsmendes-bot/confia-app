from pathlib import Path
import shutil

app = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_titulo_definicoes")

shutil.copy2(app, backup)
print(f"Backup criado: {backup}")

text = app.read_text(encoding="utf-8")

old = """      <h2 className="text-xl font-black text-[#4E3B36]">
        Definições
      </h2>"""

new = """      <h2 className="text-xl font-black text-[#4E3B36]">
        {t("settings")}
      </h2>"""

if old not in text:
    print("⚠ Bloco não encontrado. Nenhuma alteração feita.")
else:
    text = text.replace(old, new, 1)
    app.write_text(text, encoding="utf-8")
    print("✓ Título 'Definições' passou para tradução")
    
print()
print("=== VERIFICAÇÃO ===")

text = app.read_text(encoding="utf-8")

if '{t("settings")}' in text:
    print("✓ t(\"settings\") encontrado")
else:
    print("⚠ t(\"settings\") não encontrado")

if "Definições" in text:
    print("⚠ Ainda existe 'Definições' hardcoded")
else:
    print("✓ 'Definições' removido do App.tsx")
