from pathlib import Path
import json
import shutil

HOME = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")

LOCALES = [
    Path("src/locales/pt.json"),
    Path("src/locales/en.json"),
    Path("src/locales/es.json"),
    Path("src/locales/fr.json"),
]

BACKUP_HOME = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_a8_2"
)

BACKUP_LOCALES = [
    Path("/tmp/pt.json.before_a8_2"),
    Path("/tmp/en.json.before_a8_2"),
    Path("/tmp/es.json.before_a8_2"),
    Path("/tmp/fr.json.before_a8_2"),
]


def backup():
    shutil.copy2(HOME, BACKUP_HOME)

    for original, backup_file in zip(
        LOCALES,
        BACKUP_LOCALES,
    ):
        shutil.copy2(
            original,
            backup_file,
        )


def restore():
    try:
        if BACKUP_HOME.exists():
            shutil.copy2(
                BACKUP_HOME,
                HOME,
            )

        for backup_file, original in zip(
            BACKUP_LOCALES,
            LOCALES,
        ):
            if backup_file.exists():
                shutil.copy2(
                    backup_file,
                    original,
                )
    except Exception:
        pass


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
    print("CONFIA — A8.2 — AÇÃO CONTEXTUAL")
    print("=" * 76)

    try:

        # ============================================================
        # 1. VERIFICAR FICHEIROS
        # ============================================================

        required_files = [
            HOME,
            *LOCALES,
        ]

        for path in required_files:
            if not path.exists():
                raise RuntimeError(
                    f"ficheiro ausente: {path}"
                )

        home = HOME.read_text(
            encoding="utf-8"
        )

        # ============================================================
        # 2. BACKUPS
        # ============================================================

        backup()

        # ============================================================
        # 3. VERIFICAR RESOLVER EXISTENTE
        # ============================================================

        if (
            "resolveCompanionRelationalAction"
            not in home
        ):
            old_import = """  resolveCompanionRelationalMemory,
  resolveCompanionRelationalExpression,
  type CompanionRelationalMemoryResult,
"""

            new_import = """  resolveCompanionRelationalMemory,
  resolveCompanionRelationalExpression,
  resolveCompanionRelationalAction,
  type CompanionRelationalMemoryResult,
"""

            if old_import not in home:
                raise RuntimeError(
                    "estrutura do import relacional não encontrada"
                )

            home = home.replace(
                old_import,
                new_import,
                1,
            )

        # ============================================================
        # 4. ADICIONAR CALLBACK À INTERFACE
        # ============================================================

        if "onCompanionAction:" not in home:

            marker = """  relationalMemory: ReactiveRecentMemory | null;
  worldMood:
"""

            replacement = """  relationalMemory: ReactiveRecentMemory | null;
  onCompanionAction: (
    target:
      | "impulse"
      | "patterns"
      | "progress"
      | "record"
  ) => void;
  worldMood:
"""

            if marker not in home:
                raise RuntimeError(
                    "marker da interface "
                    "ConfiaCompanionHomeProps não encontrado"
                )

            home = home.replace(
                marker,
                replacement,
                1,
            )

        # ============================================================
        # 5. RECEBER CALLBACK NA FUNÇÃO
        # ============================================================

        if "  onCompanionAction," not in home:

            marker = """  relationalMemory,
  worldMood,
}: ConfiaCompanionHomeProps) {
"""

            replacement = """  relationalMemory,
  onCompanionAction,
  worldMood,
}: ConfiaCompanionHomeProps) {
"""

            if marker not in home:
                raise RuntimeError(
                    "destructuring do CompanionHome não encontrado"
                )

            home = home.replace(
                marker,
                replacement,
                1,
            )

        # ============================================================
        # 6. CRIAR DECISÃO DA AÇÃO
        # ============================================================

        if (
            "const companionRelationalAction ="
            not in home
        ):

            marker = """  const companionMessage = useMemo(() => {
"""

            if marker not in home:
                raise RuntimeError(
                    "const companionMessage não encontrado"
                )

            action_block = """  /**
   * ============================================================
   * A8.2 — AÇÃO CONTEXTUAL
   * ============================================================
   *
   * A6 escolhe a memória.
   * A7 escolhe a forma de expressão.
   * A8 transforma o contexto numa ação concreta.
   *
   * O resolver já existente determina o destino.
   * Não existe um segundo sistema de memória.
   *
   * Reações prioritárias >= 70 permanecem protegidas.
   */

  const companionRelationalAction =
    companionReaction &&
    companionReaction.priority < 70
      ? resolveCompanionRelationalAction(
          companionRelationalExpression?.kind ??
            companionReaction.kind
        )
      : null;

"""

            home = home.replace(
                marker,
                action_block + marker,
                1,
            )

        # ============================================================
        # 7. ADICIONAR BOTÃO À BOLHA
        # ============================================================

        if (
            "companionRelationalAction.target"
            not in home
        ):

            marker = """          </p>
        </div>
      </div>
"""

            if marker not in home:
                raise RuntimeError(
                    "estrutura final da bolha não encontrada"
                )

            action_button = """          </p>

          {companionRelationalAction && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  onCompanionAction(
                    companionRelationalAction.target
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#E5C9BC]
                  bg-[#FFF8F4]
                  px-4
                  py-2
                  text-[11px]
                  font-extrabold
                  text-[#A86450]
                  shadow-sm
                  transition
                  active:scale-[0.98]
                "
              >
                {t(
                  companionRelationalAction.translationKey
                )}
              </button>
            </div>
          )}
        </div>
      </div>
"""

            home = home.replace(
                marker,
                action_button,
                1,
            )

        # ============================================================
        # 8. VALIDAR DESTINOS DO RESOLVER
        # ============================================================

        memory_file = Path(
            "src/data/reactive/"
            "companionRelationalMemory.ts"
        )

        if not memory_file.exists():
            raise RuntimeError(
                "companionRelationalMemory.ts não encontrado"
            )

        memory = memory_file.read_text(
            encoding="utf-8"
        )

        if (
            "resolveCompanionRelationalAction"
            not in memory
        ):
            raise RuntimeError(
                "resolveCompanionRelationalAction "
                "não existe no resolver"
            )

        required_targets = [
            '"impulse"',
            '"patterns"',
            '"progress"',
            '"record"',
        ]

        for target in required_targets:

            if target not in memory:
                raise RuntimeError(
                    f"target ausente no resolver: {target}"
                )

        # ============================================================
        # 9. GARANTIR TRADUÇÕES
        # ============================================================

        translations = {

            "pt": {
                "impulse":
                    "Abrir Impulso",

                "patterns":
                    "Explorar os meus padrões",

                "progress":
                    "Ver a minha evolução",

                "record":
                    "Registar como estou",
            },

            "en": {
                "impulse":
                    "Open Impulse",

                "patterns":
                    "Explore my patterns",

                "progress":
                    "View my progress",

                "record":
                    "Record how I am",
            },

            "es": {
                "impulse":
                    "Abrir Impulso",

                "patterns":
                    "Explorar mis patrones",

                "progress":
                    "Ver mi evolución",

                "record":
                    "Registrar cómo estoy",
            },

            "fr": {
                "impulse":
                    "Ouvrir Impulsion",

                "patterns":
                    "Explorer mes schémas",

                "progress":
                    "Voir mon évolution",

                "record":
                    "Indiquer comment je vais",
            },
        }

        languages = [
            "pt",
            "en",
            "es",
            "fr",
        ]

        for path, lang in zip(
            LOCALES,
            languages,
        ):

            data = load_json(path)

            relational_memory = data.get(
                "companionRelationalMemory"
            )

            if not isinstance(
                relational_memory,
                dict,
            ):
                raise RuntimeError(
                    f"{lang}: "
                    "companionRelationalMemory ausente"
                )

            actions = relational_memory.get(
                "actions"
            )

            if not isinstance(
                actions,
                dict,
            ):
                actions = {}

            for key, value in (
                translations[lang].items()
            ):

                if key not in actions:
                    actions[key] = value

            relational_memory[
                "actions"
            ] = actions

            data[
                "companionRelationalMemory"
            ] = relational_memory

            save_json(
                path,
                data,
            )

        # ============================================================
        # 10. GARANTIAS DE PERFORMANCE
        # ============================================================
        #
        # IMPORTANTE:
        #
        # Não exigimos zero ocorrências.
        #
        # O CompanionHome pode já conter referências
        # antigas a estes mecanismos.
        #
        # A8.2 apenas não pode INTRODUZIR novas ocorrências.
        # ============================================================

        original_home = (
            BACKUP_HOME.read_text(
                encoding="utf-8"
            )
        )

        forbidden = [
            "Math.random",
            "setTimeout",
            "setInterval",
            "requestAnimationFrame",
            "localStorage.setItem",
        ]

        for token in forbidden:

            before_count = (
                original_home.count(token)
            )

            after_count = (
                home.count(token)
            )

            if after_count > before_count:

                raise RuntimeError(
                    f"A8.2 introduziu novo uso de "
                    f"{token} "
                    f"(antes={before_count}, "
                    f"depois={after_count})"
                )

        # ============================================================
        # 11. GARANTIAS ESTRUTURAIS
        # ============================================================

        required_home_tokens = [

            "resolveCompanionRelationalAction",

            "onCompanionAction:",

            "  onCompanionAction,",

            "const companionRelationalAction =",

            "companionRelationalAction.target",

            "companionRelationalAction.translationKey",
        ]

        for token in required_home_tokens:

            if token not in home:

                raise RuntimeError(
                    "elemento obrigatório não encontrado: "
                    + token
                )

        # ============================================================
        # 12. VALIDAR JSON
        # ============================================================

        for path in LOCALES:
            load_json(path)

        # ============================================================
        # 13. GRAVAR HOME
        # ============================================================

        HOME.write_text(
            home,
            encoding="utf-8",
        )

        # ============================================================
        # 14. RESULTADO
        # ============================================================

        print()
        print(
            "✓ Resolver "
            "CompanionRelationalAction existente preservado"
        )

        print(
            "✓ Callback onCompanionAction adicionado"
        )

        print(
            "✓ Callback recebido pelo CompanionHome"
        )

        print(
            "✓ Ação contextual ligada ao kind existente"
        )

        print(
            "✓ Prioridade >= 70 preservada"
        )

        print(
            "✓ Botão contextual adicionado à bolha"
        )

        print(
            "✓ Navegação existente reutilizada"
        )

        print(
            "✓ PT / EN / ES / FR"
        )

        print(
            "✓ JSON dos 4 idiomas validado"
        )

        print(
            "✓ Nenhum novo storage"
        )

        print(
            "✓ Nenhum novo sistema de memória"
        )

        print(
            "✓ Nenhum novo timer"
        )

        print(
            "✓ Nenhum novo requestAnimationFrame"
        )

        print(
            "✓ Nenhum novo Math.random"
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
            "A8.2 aplicado."
        )

        print("=" * 76)

    except Exception as e:

        restore()

        print()
        print(
            f"ERRO: {e}"
        )

        print()
        print(
            "A8.2 revertido através dos backups."
        )

        print("=" * 76)


if __name__ == "__main__":
    main()
