import json
from pathlib import Path
from shutil import copy2

BASE = Path("src/locales")

translations = {
    "pt": {
        "communityGuidelines": "Regras da comunidade",
        "communityGuidelinesDescription": "A comunidade Confia foi criada para partilha e apoio entre utilizadores. Respeita os outros membros e evita publicar conteúdo ofensivo, ameaçador ou informações pessoais.",
        "communityGuidelinesShort": "Conhece as regras para uma comunidade segura e respeitosa.",
        "viewCommunityGuidelines": "Ver regras da comunidade",
        "deleteMyData": "Eliminar os meus dados",
        "deleteMyDataDescription": "Elimina as tuas publicações, reações, conversas e restantes dados associados à tua conta."
    },

    "en": {
        "communityGuidelines": "Community Guidelines",
        "communityGuidelinesDescription": "The Confia community was created for sharing and support between users. Respect other members and avoid posting offensive, threatening, or personal information.",
        "communityGuidelinesShort": "Learn the rules for a safe and respectful community.",
        "viewCommunityGuidelines": "View community guidelines",
        "deleteMyData": "Delete my data",
        "deleteMyDataDescription": "Delete your posts, reactions, conversations, and other data associated with your account."
    },

    "es": {
        "communityGuidelines": "Normas de la comunidad",
        "communityGuidelinesDescription": "La comunidad Confia fue creada para compartir y apoyarse entre usuarios. Respeta a los demás miembros y evita publicar contenido ofensivo, amenazante o información personal.",
        "communityGuidelinesShort": "Conoce las normas para una comunidad segura y respetuosa.",
        "viewCommunityGuidelines": "Ver normas de la comunidad",
        "deleteMyData": "Eliminar mis datos",
        "deleteMyDataDescription": "Elimina tus publicaciones, reacciones, conversaciones y demás datos asociados a tu cuenta."
    },

    "fr": {
        "communityGuidelines": "Règles de la communauté",
        "communityGuidelinesDescription": "La communauté Confia a été créée pour permettre le partage et le soutien entre utilisateurs. Respecte les autres membres et évite de publier du contenu offensant, menaçant ou des informations personnelles.",
        "communityGuidelinesShort": "Découvre les règles pour une communauté sûre et respectueuse.",
        "viewCommunityGuidelines": "Voir les règles de la communauté",
        "deleteMyData": "Supprimer mes données",
        "deleteMyDataDescription": "Supprime tes publications, réactions, conversations et autres données associées à ton compte."
    }
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )
        f.write("\n")


print("\n=== CORREÇÃO DAS TRADUÇÕES DAS DEFINIÇÕES ===\n")

for lang, values in translations.items():

    path = BASE / f"{lang}.json"

    if not path.exists():
        print(f"❌ Ficheiro não encontrado: {path}")
        continue

    # Backup
    backup = BASE / f"{lang}.json.backup_definicoes"
    copy2(path, backup)

    try:
        data = load_json(path)
    except json.JSONDecodeError as e:
        print(f"❌ JSON inválido em {path}: {e}")
        continue

    print(f"📄 {path}")

    for key, value in values.items():

        if key in data:
            if data[key] == value:
                print(f"   ✓ {key} já está correto")
            else:
                print(f"   ↻ {key} atualizado")
                data[key] = value
        else:
            print(f"   + {key} adicionado")
            data[key] = value

    save_json(path, data)

    # Confirmar que continua JSON válido
    try:
        load_json(path)
        print("   ✓ JSON válido\n")
    except json.JSONDecodeError:
        print("   ❌ ERRO: JSON ficou inválido!")
        print(f"   Restaurando backup: {backup}")
        copy2(backup, path)


print("=== VERIFICAÇÃO FINAL ===\n")

required_keys = list(translations["pt"].keys())

for lang in ["pt", "en", "es", "fr"]:

    path = BASE / f"{lang}.json"

    try:
        data = load_json(path)
    except Exception:
        print(f"❌ {lang}.json não pôde ser lido")
        continue

    missing = [
        key for key in required_keys
        if key not in data
    ]

    if missing:
        print(f"❌ {lang}: faltam {missing}")
    else:
        print(f"✓ {lang}: todas as {len(required_keys)} chaves existem")


print("\nCorreção concluída.")
print("Backups criados com o sufixo: .backup_definicoes")
