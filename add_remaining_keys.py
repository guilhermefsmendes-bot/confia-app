import json
from pathlib import Path

translations = {
    "pt": {
        "deleteDataConfirm": "Tens a certeza que queres eliminar todos os teus dados? Esta ação não pode ser desfeita.",
        "deleteDataSuccess": "Os teus dados foram apagados com sucesso.",
        "deleteDataError": "Não foi possível apagar os teus dados. Tenta novamente.",
        "communityDescription": "A comunidade Confia foi criada para partilha e apoio entre utilizadores.",
        "deleteAccountDescription": "Elimina as tuas publicações, reações, conversas e restantes dados associados à tua conta."
    },
    "en": {
        "deleteDataConfirm": "Are you sure you want to delete all your data? This action cannot be undone.",
        "deleteDataSuccess": "Your data has been deleted successfully.",
        "deleteDataError": "Could not delete your data. Please try again.",
        "communityDescription": "The Confia community was created for sharing and support between users.",
        "deleteAccountDescription": "Deletes your posts, reactions, conversations and remaining data associated with your account."
    },
    "es": {
        "deleteDataConfirm": "¿Seguro que quieres eliminar todos tus datos? Esta acción no se puede deshacer.",
        "deleteDataSuccess": "Tus datos se han eliminado correctamente.",
        "deleteDataError": "No se han podido eliminar tus datos. Inténtalo de nuevo.",
        "communityDescription": "La comunidad Confia fue creada para compartir y apoyar a los usuarios.",
        "deleteAccountDescription": "Elimina tus publicaciones, reacciones, conversaciones y otros datos asociados a tu cuenta."
    },
    "fr": {
        "deleteDataConfirm": "Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.",
        "deleteDataSuccess": "Vos données ont été supprimées avec succès.",
        "deleteDataError": "Impossible de supprimer vos données. Réessayez.",
        "communityDescription": "La communauté Confia a été créée pour le partage et le soutien entre utilisateurs.",
        "deleteAccountDescription": "Supprime vos publications, réactions, conversations et autres données associées à votre compte."
    }
}

for lang, values in translations.items():
    path = Path(f"src/locales/{lang}.json")

    data = json.loads(path.read_text(encoding="utf-8"))

    for key, value in values.items():
        data[key] = value

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"{lang} atualizado")
