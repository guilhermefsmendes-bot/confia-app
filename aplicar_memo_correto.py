from pathlib import Path
import shutil

print("=" * 60)
print(" CONFIA — REACT.MEMO HOMEWORLD + AVATAR")
print("=" * 60)

targets = [
    ("src/components/HomeWorld.tsx", "HomeWorld"),
    ("src/components/Avatar.tsx", "Avatar"),
]

for filename, component in targets:
    path = Path(filename)

    if not path.exists():
        print(f"❌ Ficheiro não encontrado: {filename}")
        continue

    text = path.read_text()

    # --------------------------------------------------
    # BACKUP
    # --------------------------------------------------

    backup = Path(str(path) + ".memo-backup")

    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"✓ Backup criado: {backup}")
    else:
        print(f"→ Backup já existe: {backup}")

    # --------------------------------------------------
    # HOMEWORLD
    # --------------------------------------------------

    if component == "HomeWorld":

        if "export default React.memo(HomeWorld);" in text:
            print("→ HomeWorld já usa React.memo")
            continue

        old = "export default HomeWorld;"
        new = "export default React.memo(HomeWorld);"

        if old not in text:
            print("❌ Não encontrei 'export default HomeWorld;'")
            continue

        text = text.replace(old, new, 1)

        path.write_text(text)

        print("✓ React.memo aplicado: HomeWorld")

    # --------------------------------------------------
    # AVATAR
    # --------------------------------------------------

    elif component == "Avatar":

        if "export default React.memo(Avatar);" in text:
            print("→ Avatar já usa React.memo")
            continue

        old = "export default Avatar;"
        new = "export default React.memo(Avatar);"

        if old not in text:
            print("❌ Não encontrei 'export default Avatar;'")
            continue

        text = text.replace(old, new, 1)

        path.write_text(text)

        print("✓ React.memo aplicado: Avatar")


print()
print("=" * 60)
print(" VERIFICAÇÃO")
print("=" * 60)

for filename, component in targets:
    text = Path(filename).read_text()

    if f"export default React.memo({component});" in text:
        print(f"✓ {component}: React.memo ATIVO")
    else:
        print(f"❌ {component}: React.memo NÃO encontrado")

print()
print("Nenhuma lógica foi alterada.")
print("Nenhuma prop foi alterada.")
print("Nenhuma navegação foi alterada.")
print("Nenhum armazenamento foi alterado.")
print("=" * 60)
