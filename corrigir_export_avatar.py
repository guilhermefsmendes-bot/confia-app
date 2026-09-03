from pathlib import Path
import shutil

path = Path("src/components/Avatar.tsx")

if not path.exists():
    print("❌ Avatar.tsx não encontrado")
    raise SystemExit(1)

text = path.read_text()

# Backup de segurança
backup = Path("src/components/Avatar.tsx.export-backup")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"✓ Backup criado: {backup}")
else:
    print(f"→ Backup já existe: {backup}")

# --------------------------------------------------
# CORREÇÃO DOS EXPORTS
# --------------------------------------------------

# Caso o componente tenha sido renomeado para AvatarComponent
if "const AvatarComponent: React.FC<AvatarProps>" in text:

    # Garante que existe o named export esperado pelo HomeWorld
    text = text.replace(
        "export default React.memo(Avatar);",
        "export const Avatar = React.memo(AvatarComponent);\nexport default Avatar;",
    )

    # Caso não exista ainda o export final
    if "export const Avatar = React.memo(AvatarComponent);" not in text:
        # Procura o final do componente
        marker = "export default Avatar;"

        if marker in text:
            text = text.replace(
                marker,
                "export const Avatar = React.memo(AvatarComponent);\nexport default Avatar;",
                1
            )
        else:
            print("❌ Não consegui localizar o export final")
            raise SystemExit(1)

# Caso o script anterior tenha transformado diretamente para
# React.memo mas removido o named export.
elif "export default React.memo(Avatar);" in text:

    text = text.replace(
        "export default React.memo(Avatar);",
        "export const Avatar = React.memo(Avatar);\nexport default Avatar;",
        1
    )

# Caso Avatar continue como componente normal
elif "export const Avatar: React.FC<AvatarProps>" in text:

    # Renomeia a declaração para podermos aplicar memo
    text = text.replace(
        "export const Avatar: React.FC<AvatarProps>",
        "const Avatar: React.FC<AvatarProps>",
        1
    )

    text = text.replace(
        "export default Avatar;",
        "export const Avatar = React.memo(Avatar);\nexport default Avatar;",
        1
    )

else:
    print("❌ Estrutura inesperada do Avatar.tsx")
    print("Não alterei o ficheiro.")
    raise SystemExit(1)

path.write_text(text)

# --------------------------------------------------
# VERIFICAÇÃO
# --------------------------------------------------

text = path.read_text()

print()
print("=" * 55)
print(" VERIFICAÇÃO")
print("=" * 55)

if "export const Avatar = React.memo(AvatarComponent);" in text:
    print("✓ Named export Avatar: OK")
    print("✓ React.memo: OK")
elif "export const Avatar = React.memo(Avatar);" in text:
    print("✓ Named export Avatar: OK")
    print("✓ React.memo: OK")
else:
    print("❌ Named export Avatar NÃO encontrado")
    raise SystemExit(1)

if "export default Avatar;" in text:
    print("✓ Default export Avatar: OK")
else:
    print("❌ Default export Avatar NÃO encontrado")
    raise SystemExit(1)

print()
print("✓ Correção concluída.")
print("✓ HomeWorld poderá continuar a usar:")
print('  import { Avatar } from "./Avatar";')
print()
