from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2D
# Pequenas vitórias + objetivo personalizado
# VERSÃO ROBUSTA
#
# ALTERA:
# - src/components/ObjectivosList.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# NÃO ALTERA:
# - lógica de conclusão
# - XP
# - histórico
# - storage
# - WeeklyGoal
# - Reactive Engine
# ============================================================

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/ObjectivosList.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUP_COMPONENT = Path(
    "/tmp/ObjectivosList.tsx.before_objectives_2d"
)

LOCALE_BACKUPS = {
    lang: Path(
        f"/tmp/{lang}.json.before_objectives_2d"
    )
    for lang in LOCALES
}


def fail(message: str):
    print()
    print("ERRO:")
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

if not COMPONENT.exists():
    fail(f"Não encontrei {COMPONENT}")

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"Não encontrei {path}")


# ============================================================
# 2. LER TUDO ANTES DE ESCREVER
# ============================================================

component_original = COMPONENT.read_text(
    encoding="utf-8"
)

locale_data = {}

for lang, path in LOCALES.items():
    try:
        locale_data[lang] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(
            f"{path} não é JSON válido antes da alteração: "
            f"{exc}"
        )


# ============================================================
# 3. GUARDRAILS 2C
# ============================================================

required = [
    "const featuredObjective =",
    "const remainingObjectives =",
    "const allObjectivesCompleted =",
    't("objectivesPremium.nextStep")',
    't("objectivesPremium.smallWins")',
    "remainingObjectives.map(objective =>",
    "onToggleComplete(featuredObjective.id)",
    "onToggleComplete(objective.id)",
    "onAddCustomObjective(newText.trim(), newCategory)",
    "onDeleteObjective(objective.id)",
    "/* Custom Objective Trigger Button */",
    "/* 2C — Pequenas vitórias */",
]

for marker in required:
    if marker not in component_original:
        fail(
            "ObjectivosList.tsx não corresponde "
            "à versão 2C esperada.\n"
            f"Falta: {marker}"
        )

if "objectivesPremium.completedLabel" in component_original:
    fail(
        "A 2D parece já estar aplicada."
    )


# ============================================================
# 4. LOCALIZAR BLOCO DO OBJETIVO PERSONALIZADO
# ============================================================

custom_marker = (
    "      {/* Custom Objective Trigger Button */}"
)

wins_marker = (
    "      {/* 2C — Pequenas vitórias */}"
)

if component_original.count(custom_marker) != 1:
    fail(
        "Marcador do objetivo personalizado "
        "ausente ou duplicado."
    )

if component_original.count(wins_marker) != 1:
    fail(
        "Marcador Pequenas vitórias "
        "ausente ou duplicado."
    )

custom_start = component_original.index(
    custom_marker
)

wins_start = component_original.index(
    wins_marker
)

if custom_start >= wins_start:
    fail(
        "A hierarquia atual não corresponde à 2C: "
        "esperava objetivo personalizado antes "
        "das Pequenas vitórias."
    )

# Tudo entre estes marcadores é exclusivamente
# o trigger/formulário personalizado.
custom_block = component_original[
    custom_start:wins_start
]

if custom_block.count(
    "onAddCustomObjective(newText.trim(), newCategory)"
) != 0:
    # O callback está na função handleSubmit, não dentro
    # deste bloco JSX. Isto serve como proteção estrutural.
    fail(
        "Estrutura inesperada dentro do bloco personalizado."
    )

if 't("addCustomGoal")' not in custom_block:
    fail(
        "O bloco personalizado não contém addCustomGoal."
    )

if 't("goalPlaceholder")' not in custom_block:
    fail(
        "O bloco personalizado não contém goalPlaceholder."
    )


# ============================================================
# 5. REMOVER TEMPORARIAMENTE BLOCO PERSONALIZADO
# ============================================================

component_new = (
    component_original[:custom_start]
    + component_original[wins_start:]
)


# ============================================================
# 6. LOCALIZAR MAP DAS PEQUENAS VITÓRIAS
# ============================================================

map_start_marker = (
    "              {remainingObjectives.map(objective => {"
)

if component_new.count(map_start_marker) != 1:
    fail(
        "Não encontrei exatamente um "
        "remainingObjectives.map."
    )

map_start = component_new.index(
    map_start_marker
)

# Em vez de comparar o cartão inteiro literalmente,
# localizamos estruturalmente o final do map.
#
# O fim esperado é:
#
# </motion.div>
# );
# })}
#
# Aceitamos diferenças de espaços através de procura
# progressiva por tokens.

motion_close = component_new.find(
    "</motion.div>",
    map_start
)

if motion_close == -1:
    fail(
        "Não encontrei </motion.div> no cartão "
        "das Pequenas vitórias."
    )

map_close = component_new.find(
    "})}",
    motion_close
)

if map_close == -1:
    fail(
        "Não encontrei o fecho do "
        "remainingObjectives.map."
    )

map_end = map_close + len("})}")


# ============================================================
# 7. NOVO MAP — PEQUENAS VITÓRIAS PREMIUM
# ============================================================

new_map = """              {remainingObjectives.map(objective => {
                const catStyles = getCategoryStyles(objective.category);

                return (
                  <motion.div
                    key={objective.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`group relative overflow-hidden rounded-[22px] border p-3.5 transition-all ${
                      objective.completed
                        ? "border-[#E5A88B]/20 bg-gradient-to-r from-[#FFF8F4] to-[#FFFDFC]"
                        : "border-[#EEE5E0] bg-white shadow-sm hover:border-[#E5A88B]/30 hover:shadow-md"
                    }`}
                  >
                    {objective.completed && (
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#E5A88B]"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleComplete(objective.id)
                        }
                        aria-label={
                          objective.completed
                            ? t("objectivesPremium.markPending")
                            : t("objectivesPremium.markCompleted")
                        }
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                          objective.completed
                            ? "border-[#E5A88B] bg-[#E5A88B] text-white shadow-sm shadow-[#E5A88B]/20"
                            : "border-[#E7DDD7] bg-[#FCFAF8] text-[#B49B90] hover:border-[#E5A88B] hover:bg-[#FFF5F0] hover:text-[#C97B5E]"
                        }`}
                      >
                        {objective.completed ? (
                          <Check
                            size={16}
                            strokeWidth={3}
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full border border-current" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`min-w-0 text-xs leading-relaxed ${
                              objective.completed
                                ? "font-semibold text-[#8D7B73]"
                                : "font-bold text-[#55433D]"
                            }`}
                          >
                            {t(objective.text)}
                          </p>

                          {objective.completed && (
                            <span className="shrink-0 rounded-full bg-[#E5A88B]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#C97B5E]">
                              {t("objectivesPremium.completedLabel")}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${catStyles.badge}`}
                          >
                            {catStyles.icon}
                            <span>{catStyles.label}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black ${
                              objective.completed
                                ? "bg-[#FFF0E8] text-[#C97B5E]"
                                : "bg-[#FAF6F3] text-[#9B7B6D]"
                            }`}
                          >
                            <Sparkles size={9} />
                            +{objective.xpReward} XP
                          </span>
                        </div>
                      </div>

                      {objective.isCustom && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteObjective(objective.id)
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#C7B8B1] transition-colors hover:bg-red-50 hover:text-red-400 cursor-pointer"
                          title={t("remove")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}"""

component_new = (
    component_new[:map_start]
    + new_map
    + component_new[map_end:]
)


# ============================================================
# 8. REDESENHAR OBJETIVO PERSONALIZADO
# ============================================================

old_button_start = """        <button
          onClick={() => setShowForm(true)}"""

new_button_start = """        <button
          type="button"
          onClick={() => setShowForm(true)}"""

if custom_block.count(old_button_start) != 1:
    fail(
        "Não encontrei o botão de abertura "
        "do objetivo personalizado."
    )

custom_block = custom_block.replace(
    old_button_start,
    new_button_start,
    1
)


old_trigger_class = (
    '          className="w-full py-4 bg-white '
    'hover:bg-[#FFF0E8] text-[#C97B5E] border '
    'border-[#E5A88B]/25 border-dashed rounded-2xl '
    'text-xs font-bold flex items-center '
    'justify-center gap-1.5 transition-all '
    'shadow-sm cursor-pointer"'
)

if old_trigger_class not in custom_block:
    fail(
        "Não encontrei a classe atual do botão "
        "Adicionar Objetivo."
    )

new_trigger_class = (
    '          className="flex w-full items-center '
    'justify-between rounded-[22px] border '
    'border-dashed border-[#E5A88B]/25 bg-[#FFFCFA] '
    'px-4 py-3.5 text-left transition-all '
    'hover:border-[#E5A88B]/45 hover:bg-[#FFF8F4] '
    'cursor-pointer"'
)

custom_block = custom_block.replace(
    old_trigger_class,
    new_trigger_class,
    1
)


old_trigger_content = (
    '          <Plus size={16} /> {t("addCustomGoal")}'
)

if custom_block.count(old_trigger_content) != 1:
    fail(
        "Não encontrei o conteúdo atual "
        "do botão personalizado."
    )

new_trigger_content = """          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
              <Plus size={16} />
            </span>

            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-[#A88A7D]">
                {t("objectivesPremium.yourGoalEyebrow")}
              </span>

              <span className="mt-0.5 block text-xs font-black text-[#5C4841]">
                {t("addCustomGoal")}
              </span>
            </span>
          </span>

          <span className="text-lg leading-none text-[#C7B1A7]">
            +
          </span>"""

custom_block = custom_block.replace(
    old_trigger_content,
    new_trigger_content,
    1
)


# ============================================================
# 9. REFINAR FORMULÁRIO
# ============================================================

old_form_class = (
    '          className="bg-white border '
    'border-[#E5A88B]/15 rounded-[24px] p-5 '
    'space-y-4 shadow-xl shadow-amber-100/10"'
)

if old_form_class not in custom_block:
    fail(
        "Não encontrei a classe atual do formulário."
    )

new_form_class = (
    '          className="rounded-[26px] border '
    'border-[#E5A88B]/20 bg-gradient-to-br '
    'from-white to-[#FFF9F5] p-5 space-y-4 '
    'shadow-md shadow-[#E5A88B]/5"'
)

custom_block = custom_block.replace(
    old_form_class,
    new_form_class,
    1
)


form_inner_anchor = """        >
          <div className="space-y-1.5">"""

if custom_block.count(form_inner_anchor) != 1:
    fail(
        "Não encontrei a entrada interna "
        "do formulário."
    )

form_inner_new = """        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
              <Plus size={17} />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A88A7D]">
                {t("objectivesPremium.yourGoalEyebrow")}
              </p>

              <h3 className="mt-0.5 text-sm font-black text-[#4E3B36]">
                {t("objectivesPremium.createOwnTitle")}
              </h3>
            </div>
          </div>

          <div className="space-y-1.5">"""

custom_block = custom_block.replace(
    form_inner_anchor,
    form_inner_new,
    1
)

custom_block = custom_block.replace(
    "      {/* Custom Objective Trigger Button */}",
    "      {/* 2D — Objetivo criado pelo utilizador */}",
    1
)


# ============================================================
# 10. REINSERIR OBJETIVO PERSONALIZADO NO FINAL
# ============================================================

main_end = """    </div>
  );
};"""

if component_new.count(main_end) != 1:
    fail(
        "Não encontrei o final único "
        "de ObjectivosList."
    )

component_new = component_new.replace(
    main_end,
    custom_block.rstrip()
    + "\n\n"
    + main_end,
    1
)


# ============================================================
# 11. TRADUÇÕES 2D
# ============================================================

translations = {
    "pt": {
        "completedLabel": "Concluído",
        "markPending": "Marcar objetivo como por fazer",
        "markCompleted": "Marcar objetivo como concluído",
        "yourGoalEyebrow": "À tua maneira",
        "createOwnTitle": "Cria uma pequena ação tua"
    },
    "en": {
        "completedLabel": "Completed",
        "markPending": "Mark goal as pending",
        "markCompleted": "Mark goal as completed",
        "yourGoalEyebrow": "Your way",
        "createOwnTitle": "Create a small action of your own"
    },
    "es": {
        "completedLabel": "Completado",
        "markPending": "Marcar objetivo como pendiente",
        "markCompleted": "Marcar objetivo como completado",
        "yourGoalEyebrow": "A tu manera",
        "createOwnTitle": "Crea una pequeña acción propia"
    },
    "fr": {
        "completedLabel": "Accompli",
        "markPending": "Marquer l'objectif comme à faire",
        "markCompleted": "Marquer l'objectif comme accompli",
        "yourGoalEyebrow": "À ta manière",
        "createOwnTitle": "Crée une petite action à toi"
    },
}

placeholders = {
    "pt": "Ex.: Ler 2 páginas, regar as plantas...",
    "en": "E.g. Read 2 pages, water the plants...",
    "es": "Ej.: Leer 2 páginas, regar las plantas...",
    "fr": "Ex. : Lire 2 pages, arroser les plantes..."
}


# ============================================================
# 12. PREPARAR LOCALES EM MEMÓRIA
# ============================================================

locale_new_text = {}

for lang, data in locale_data.items():
    premium = data.get("objectivesPremium")

    if not isinstance(premium, dict):
        fail(
            f"{lang}: objectivesPremium não existe."
        )

    required_previous = {
        "eyebrow",
        "title",
        "subtitle",
        "today",
        "todayProgress",
        "progressHint",
        "nextStep",
        "nextStepTitle",
        "nextStepHint",
        "completeStep",
        "smallWinsEyebrow",
        "smallWins",
        "completedEyebrow",
        "completedTitle",
        "allDone",
        "allDoneHint",
        "noObjectives",
        "actionCategory",
    }

    missing = (
        required_previous
        - set(premium.keys())
    )

    if missing:
        fail(
            f"{lang}: faltam chaves da 2B/2C: "
            + ", ".join(sorted(missing))
        )

    collisions = (
        set(translations[lang].keys())
        & set(premium.keys())
    )

    if collisions:
        fail(
            f"{lang}: as seguintes chaves 2D "
            "já existem: "
            + ", ".join(sorted(collisions))
        )

    if "goalPlaceholder" not in data:
        fail(
            f"{lang}: goalPlaceholder não existe."
        )

    new_data = dict(data)

    new_premium = dict(premium)
    new_premium.update(
        translations[lang]
    )

    new_data["objectivesPremium"] = new_premium
    new_data["goalPlaceholder"] = placeholders[lang]

    rendered = json.dumps(
        new_data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    try:
        parsed = json.loads(rendered)
    except Exception as exc:
        fail(
            f"{lang}: JSON preparado inválido: "
            f"{exc}"
        )

    for key, value in translations[lang].items():
        if (
            parsed["objectivesPremium"].get(key)
            != value
        ):
            fail(
                f"{lang}: validação falhou "
                f"em objectivesPremium.{key}"
            )

    if (
        parsed.get("goalPlaceholder")
        != placeholders[lang]
    ):
        fail(
            f"{lang}: validação falhou "
            "em goalPlaceholder."
        )

    locale_new_text[lang] = rendered


# ============================================================
# 13. GUARDRAILS PÓS-TRANSFORMAÇÃO
# ============================================================

post_required = [
    't("objectivesPremium.completedLabel")',
    't("objectivesPremium.markPending")',
    't("objectivesPremium.markCompleted")',
    't("objectivesPremium.yourGoalEyebrow")',
    't("objectivesPremium.createOwnTitle")',
    "remainingObjectives.map(objective =>",
    "onToggleComplete(objective.id)",
    "onToggleComplete(featuredObjective.id)",
    "onDeleteObjective(objective.id)",
    "/* 2D — Objetivo criado pelo utilizador */",
]

for marker in post_required:
    if marker not in component_new:
        fail(
            "Guardrail pós-transformação falhou:\n"
            f"{marker}"
        )


# Hierarquia visual:
# próximo passo
# pequenas vitórias
# objetivo próprio

featured_pos = component_new.find(
    "/* 2C — Próximo passo */"
)

wins_pos = component_new.find(
    "/* 2C — Pequenas vitórias */"
)

custom_pos = component_new.find(
    "/* 2D — Objetivo criado pelo utilizador */"
)

if not (
    featured_pos != -1
    and wins_pos != -1
    and custom_pos != -1
    and featured_pos < wins_pos < custom_pos
):
    fail(
        "Hierarquia visual final incorreta."
    )


# O callback original de adição tem de continuar
# na função handleSubmit.
if (
    "onAddCustomObjective(newText.trim(), newCategory)"
    not in component_new
):
    fail(
        "Callback de criação foi perdido."
    )


# ============================================================
# 14. BACKUPS
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP_COMPONENT
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        LOCALE_BACKUPS[lang]
    )


# ============================================================
# 15. ESCREVER
# ============================================================

COMPONENT.write_text(
    component_new,
    encoding="utf-8"
)

for lang, path in LOCALES.items():
    path.write_text(
        locale_new_text[lang],
        encoding="utf-8"
    )


# ============================================================
# 16. VALIDAÇÃO FINAL EM DISCO
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

for marker in post_required:
    if marker not in written:
        print()
        print("ATENÇÃO:")
        print(
            "A escrita ocorreu mas a validação final "
            f"não encontrou: {marker}"
        )
        print()
        print(
            "Backup disponível em:"
        )
        print(BACKUP_COMPONENT)
        sys.exit(1)

for lang, path in LOCALES.items():
    try:
        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        print()
        print(
            f"ATENÇÃO: locale {lang} inválido "
            f"após escrita: {exc}"
        )
        sys.exit(1)

    if (
        parsed.get("goalPlaceholder")
        != placeholders[lang]
    ):
        print()
        print(
            f"ATENÇÃO: goalPlaceholder incorreto "
            f"em {lang}"
        )
        sys.exit(1)

    for key, value in translations[lang].items():
        if (
            parsed["objectivesPremium"].get(key)
            != value
        ):
            print()
            print(
                "ATENÇÃO: validação final falhou em "
                f"{lang}.{key}"
            )
            sys.exit(1)


# ============================================================
# 17. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2D")
print("=" * 72)
print()
print("✓ Pequenas vitórias redesenhadas")
print("✓ Objetivos ativos ganharam maior legibilidade")
print("✓ Objetivos concluídos parecem conquistas")
print("✓ Conclusão continua reversível")
print("✓ Categorias preservadas")
print("✓ XP individual preservado")
print("✓ Objetivo personalizado movido para o final")
print("✓ Formulário personalizado refinado")
print("✓ goalPlaceholder corrigido nos 4 idiomas")
print("✓ Callbacks originais preservados")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ PT / EN / ES / FR validados")
print()
print("Backups:")
print(f"  {BACKUP_COMPONENT}")

for lang in LOCALES:
    print(f"  {LOCALE_BACKUPS[lang]}")

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
