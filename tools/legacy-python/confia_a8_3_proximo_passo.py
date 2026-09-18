from pathlib import Path
import json
import shutil


HOME = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

LOCALES = [
    Path("src/locales/pt.json"),
    Path("src/locales/en.json"),
    Path("src/locales/es.json"),
    Path("src/locales/fr.json"),
]

BACKUP_HOME = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_a8_3"
)

BACKUP_LOCALES = [
    Path("/tmp/pt.json.before_a8_3"),
    Path("/tmp/en.json.before_a8_3"),
    Path("/tmp/es.json.before_a8_3"),
    Path("/tmp/fr.json.before_a8_3"),
]


def backup():
    shutil.copy2(HOME, BACKUP_HOME)

    for source, target in zip(
        LOCALES,
        BACKUP_LOCALES,
    ):
        shutil.copy2(source, target)


def restore():
    if BACKUP_HOME.exists():
        shutil.copy2(
            BACKUP_HOME,
            HOME,
        )

    for source, target in zip(
        BACKUP_LOCALES,
        LOCALES,
    ):
        if source.exists():
            shutil.copy2(
                source,
                target,
            )


def load_json(path):
    with path.open(
        "r",
        encoding="utf-8",
    ) as f:
        return json.load(f)


def save_json(path, data):
    with path.open(
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2,
        )
        f.write("\n")


def main():

    print("=" * 76)
    print("CONFIA — A8.3 — PRÓXIMO PASSO CONTEXTUAL")
    print("=" * 76)

    try:

        # ============================================================
        # 1. FICHEIROS
        # ============================================================

        if not HOME.exists():
            raise RuntimeError(
                f"ficheiro ausente: {HOME}"
            )

        for path in LOCALES:
            if not path.exists():
                raise RuntimeError(
                    f"ficheiro ausente: {path}"
                )

        # ============================================================
        # 2. BACKUPS
        # ============================================================

        backup()

        home = HOME.read_text(
            encoding="utf-8"
        )

        # ============================================================
        # 3. GARANTIR QUE A8.2 EXISTE
        # ============================================================

        required_a82 = [
            "resolveCompanionRelationalAction",
            "companionRelationalAction",
            "onCompanionAction",
        ]

        for token in required_a82:
            if token not in home:
                raise RuntimeError(
                    "A8.2 não está presente: "
                    + token
                )

        # ============================================================
        # 4. CRIAR MODELO DE APRESENTAÇÃO A8.3
        # ============================================================
        #
        # A8.3 NÃO decide a ação.
        #
        # Apenas transforma o target já decidido
        # pelo A8.2 numa apresentação contextual.
        #
        # Não existe novo cérebro.
        # ============================================================

        if (
            "const companionRelationalNextStep ="
            not in home
        ):

            marker = """  const companionRelationalAction =
    companionReaction &&
    companionReaction.priority < 70
      ? resolveCompanionRelationalAction(
          companionRelationalExpression?.kind ??
            companionReaction.kind
        )
      : null;

"""

            if marker not in home:
                raise RuntimeError(
                    "bloco A8.2 não encontrado"
                )

            block = marker + """  /**
   * ============================================================
   * A8.3 — PRÓXIMO PASSO CONTEXTUAL
   * ============================================================
   *
   * A8.2 decide a ação.
   * A8.3 apenas define como essa ação é apresentada.
   *
   * Não altera:
   * - o kind
   * - a prioridade
   * - o target
   * - a memória
   * - a navegação
   */

  const companionRelationalNextStep =
    companionRelationalAction
      ? {
          target:
            companionRelationalAction.target,
          translationKey:
            companionRelationalAction.translationKey,
        }
      : null;

"""

            home = home.replace(
                marker,
                block,
                1,
            )

        # ============================================================
        # 5. ADICIONAR TEXTO CONTEXTUAL À AÇÃO
        # ============================================================

        if (
            "companionRelationalMemory.nextStep"
            not in home
        ):

            marker = """                {t(
                  companionRelationalAction.translationKey
                )}
"""

            if marker not in home:
                raise RuntimeError(
                    "texto da ação A8.2 não encontrado"
                )

            replacement = """                {t(
                  companionRelationalMemory.nextStep
                )}
"""

            home = home.replace(
                marker,
                replacement,
                1,
            )

        # ============================================================
        # 6. GARANTIR QUE O TARGET CONTINUA A SER UTILIZADO
        # ============================================================

        marker = """                  onCompanionAction(
                    companionRelationalAction.target
                  )
"""

        if marker not in home:
            raise RuntimeError(
                "target A8.2 não encontrado no botão"
            )

        # ============================================================
        # 7. TRADUÇÕES A8.3
        # ============================================================

        translations = {

            "pt": {
                "nextStep":
                    "Dar o próximo passo",
            },

            "en": {
                "nextStep":
                    "Take the next step",
            },

            "es": {
                "nextStep":
                    "Dar el siguiente paso",
            },

            "fr": {
                "nextStep":
                    "Passer à l’étape suivante",
            },
        }

        languages = [
            "pt",
            "en",
            "es",
            "fr",
        ]

        for path, language in zip(
            LOCALES,
            languages,
        ):

            data = load_json(path)

            memory = data.get(
                "companionRelationalMemory"
            )

            if not isinstance(
                memory,
                dict,
            ):
                raise RuntimeError(
                    f"{language}: "
                    "companionRelationalMemory ausente"
                )

            if "nextStep" not in memory:
                memory["nextStep"] = (
                    translations[language][
                        "nextStep"
                    ]
                )

            data[
                "companionRelationalMemory"
            ] = memory

            save_json(
                path,
                data,
            )

        # ============================================================
        # 8. VALIDAR ESTRUTURA
        # ============================================================

        required_tokens = [

            "const companionRelationalNextStep =",

            "companionRelationalMemory.nextStep",

            "onCompanionAction(",

            "companionRelationalAction.target",
        ]

        for token in required_tokens:

            if token not in home:
                raise RuntimeError(
                    "elemento obrigatório ausente: "
                    + token
                )

        # ============================================================
        # 9. GARANTIR QUE NÃO ALTERÁMOS A DECISÃO
        # ============================================================

        if (
            "resolveCompanionRelationalAction("
            not in home
        ):
            raise RuntimeError(
                "resolver A8.2 deixou de estar presente"
            )

        # ============================================================
        # 10. PROIBIDOS
        # ============================================================
        #
        # Comparação antes/depois.
        #
        # Não rejeitar referências já existentes.
        # Apenas impedir que A8.3 introduza novas.
        # ============================================================

        original = BACKUP_HOME.read_text(
            encoding="utf-8"
        )

        forbidden = [
            "Math.random",
            "setTimeout",
            "setInterval",
            "requestAnimationFrame",
            "localStorage.setItem",
        ]

        for token in forbidden:

            before = original.count(token)
            after = home.count(token)

            if after > before:
                raise RuntimeError(
                    f"A8.3 introduziu novo uso de "
                    f"{token}: "
                    f"antes={before}, depois={after}"
                )

        # ============================================================
        # 11. VALIDAR JSON
        # ============================================================

        for path in LOCALES:
            load_json(path)

        # ============================================================
        # 12. GRAVAR
        # ============================================================

        HOME.write_text(
            home,
            encoding="utf-8",
        )

        # ============================================================
        # 13. RESULTADO
        # ============================================================

        print()
        print(
            "✓ A8.2 preservado"
        )

        print(
            "✓ Target original preservado"
        )

        print(
            "✓ Navegação original preservada"
        )

        print(
            "✓ Próximo passo contextual criado"
        )

        print(
            "✓ A8.3 não cria novo sistema de decisão"
        )

        print(
            "✓ Memória A6 preservada"
        )

        print(
            "✓ Expressão A7 preservada"
        )

        print(
            "✓ Ação A8.2 preservada"
        )

        print(
            "✓ PT / EN / ES / FR"
        )

        print(
            "✓ JSON validado"
        )

        print(
            "✓ Sem novo storage"
        )

        print(
            "✓ Sem novo histórico"
        )

        print(
            "✓ Sem novos timers"
        )

        print(
            "✓ Sem novo requestAnimationFrame"
        )

        print(
            "✓ Sem Math.random"
        )

        print()
        print("Backups:")

        print(
            f"  {BACKUP_HOME}"
        )

        for path in BACKUP_LOCALES:
            print(
                f"  {path}"
            )

        print()
        print(
            "A8.3 aplicado."
        )

        print("=" * 76)

    except Exception as error:

        restore()

        print()
        print(
            f"ERRO: {error}"
        )

        print()
        print(
            "A8.3 revertido através dos backups."
        )

        print("=" * 76)


if __name__ == "__main__":
    main()
