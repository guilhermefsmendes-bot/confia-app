import json
import os

LOCALES = [
    "pt",
    "en",
    "es",
    "fr"
]

BASE = "src/locales"

# Traduções novas da comunidade
NEW_KEYS = {
    "report": {
        "pt": "Denunciar",
        "en": "Report",
        "es": "Denunciar",
        "fr": "Signaler"
    },
    "blockUser": {
        "pt": "Bloquear utilizador",
        "en": "Block user",
        "es": "Bloquear usuario",
        "fr": "Bloquer utilisateur"
    },
    "communityTerms": {
        "pt": "Termos da Comunidade",
        "en": "Community Guidelines",
        "es": "Términos de la comunidad",
        "fr": "Règles de la communauté"
    },
    "communitySafeSpace": {
        "pt": "Este é um espaço seguro de partilha. Respeita os outros membros.",
        "en": "This is a safe space for sharing. Respect other members.",
        "es": "Este es un espacio seguro para compartir. Respeta a los demás miembros.",
        "fr": "C'est un espace sûr de partage. Respectez les autres membres."
    },
    "inappropriateContent": {
        "pt": "Conteúdo inadequado",
        "en": "Inappropriate content",
        "es": "Contenido inapropiado",
        "fr": "Contenu inapproprié"
    },
    "deleteMyData": {
        "pt": "Eliminar os meus dados",
        "en": "Delete my data",
        "es": "Eliminar mis datos",
        "fr": "Supprimer mes données"
    }
}


for lang in LOCALES:

    path = f"{BASE}/{lang}.json"

    if not os.path.exists(path):
        print(f"Falta: {path}")
        continue

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)


    changed = False

    for key, translations in NEW_KEYS.items():

        if key not in data:
            data[key] = translations[lang]
            changed = True
            print(f"{lang}: adicionada {key}")


    if changed:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2
            )

        print(f"{lang}.json atualizado")

    else:
        print(f"{lang}: sem alterações")


print("Concluído.")
