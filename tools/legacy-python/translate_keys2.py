import json

files = {
    "pt": {
        "blockConfirm": "Bloquear este utilizador?",
        "communityTermsButton": "Ver termos da comunidade",
        "blockError": "Não foi possível bloquear este utilizador."
    },
    "en": {
        "blockConfirm": "Block this user?",
        "communityTermsButton": "View community guidelines",
        "blockError": "Could not block this user."
    },
    "es": {
        "blockConfirm": "¿Bloquear este usuario?",
        "communityTermsButton": "Ver normas de la comunidad",
        "blockError": "No se pudo bloquear este usuario."
    },
    "fr": {
        "blockConfirm": "Bloquer cet utilisateur ?",
        "communityTermsButton": "Voir les règles de la communauté",
        "blockError": "Impossible de bloquer cet utilisateur."
    }
}

for lang, data in files.items():
    path=f"src/locales/{lang}.json"

    with open(path,"r",encoding="utf-8") as f:
        content=json.load(f)

    content.update(data)

    with open(path,"w",encoding="utf-8") as f:
        json.dump(content,f,ensure_ascii=False,indent=2)

    print(lang,"ok")
