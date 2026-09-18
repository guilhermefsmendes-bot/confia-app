from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

text = text.replace("{/* Lago premium */}", "")

path.write_text(text)

print("✓ Comentário antigo do lago removido.")
