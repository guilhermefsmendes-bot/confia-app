from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3D — AÇÃO INTELIGENTE DO DIA
#
# Objetivo:
#
# Dar ao "Momento de Hoje" uma única pequena ação,
# escolhida pela inteligência que já existe.
#
# PRINCÍPIO CENTRAL:
#
# dailyContext.suggestedAction
#          ↓
# homeNowAction
#          ↓
# handleHomeNowAction
#
# NÃO criamos:
# - segundo motor;
# - segundo switch de navegação;
# - nova decisão;
# - novo storage;
# - novo state;
# - novo effect;
# - timers;
# - listeners;
# - XP;
# - dependências.
#
# O botão só existe quando:
#
# - dailyContext existe;
# - não é first_contact;
# - dailyContext.suggestedAction existe;
# - homeNowAction existe;
# - ambos apontam para o mesmo kind.
#
# Desta forma o Momento de Hoje nunca recomenda
# uma coisa diferente de "Para ti agora".
#
# ALTERA:
# src/App.tsx
# src/locales/pt.json
# src/locales/en.json
# src/locales/es.json
# src/locales/fr.json
#
# BACKUPS:
# /tmp/App.tsx.before_fase3d_acao_inteligente
# /tmp/pt.json.before_fase3d_acao_inteligente
# /tmp/en.json.before_fase3d_acao_inteligente
# /tmp/es.json.before_fase3d_acao_inteligente
# /tmp/fr.json.before_fase3d_acao_inteligente
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUPS = {
    APP: Path(
        "/tmp/App.tsx.before_fase3d_acao_inteligente"
    ),
    LOCALES["pt"]: Path(
        "/tmp/pt.json.before_fase3d_acao_inteligente"
    ),
    LOCALES["en"]: Path(
        "/tmp/en.json.before_fase3d_acao_inteligente"
    ),
    LOCALES["es"]: Path(
        "/tmp/es.json.before_fase3d_acao_inteligente"
    ),
    LOCALES["fr"]: Path(
        "/tmp/fr.json.before_fase3d_acao_inteligente"
    ),
}


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3D NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

for path in [APP, *LOCALES.values()]:
    if not path.exists():
        fail(f"Não encontrei:\n{path}")

app_original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR ARQUITETURA
# ============================================================

required_architecture = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "const dailyContext =",
    "suggestedAction,",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    'dailyContext.state !== "first_contact"',
    "const homeNowAction =",
    "const handleHomeNowAction",
    "onClick={handleHomeNowAction}",
]

missing = [
    marker
    for marker in required_architecture
    if marker not in app_original
]

if missing:
    fail(
        "A arquitetura atual não corresponde "
        "à versão esperada.\n\nFalta:\n"
        + "\n".join(missing)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
    in app_original
):
    fail(
        "A Fase 3D já parece estar aplicada."
    )


# ============================================================
# 4. LOCALIZAR APENAS O BLOCO 3C.1
# ============================================================

start_marker = (
    "CONFIA 3C.1 — MOMENTO DE HOJE"
)

end_marker = (
    '{homeScreen === "home" && (\n  <>'
)

start = app_original.find(
    start_marker
)

if start == -1:
    fail(
        "Não encontrei o início da 3C.1."
    )

end = app_original.find(
    end_marker,
    start
)

if end == -1:
    fail(
        "Não encontrei o final visual da 3C.1."
    )

old_visual_block = app_original[
    start:end
]


# ============================================================
# 5. VALIDAR PONTO EXATO DE INSERÇÃO
#
# Inserimos a ação depois do texto do Momento de Hoje
# e depois do indicador de dias, mas antes do fecho
# do conteúdo principal.
# ============================================================

needle = '''        {dailyContext.state === "return_after_absence" &&
         typeof dailyContext.daysSincePreviousOpen === "number" &&
         dailyContext.daysSincePreviousOpen >= 2 && (
          <div className="mt-3 inline-flex items-center rounded-full border border-[#E5A88B]/15 bg-white/80 px-3 py-1.5">
            <span className="text-[9px] font-bold text-[#9A7567]">
              {t("dailyMoment.return.days", {
                count: dailyContext.daysSincePreviousOpen,
              })}
            </span>
          </div>
        )}
'''

if old_visual_block.count(needle) != 1:
    fail(
        "Não encontrei exatamente uma vez o bloco "
        "de dias da 3C.1.\n\n"
        "Não vou alterar a UI sem uma âncora exata."
    )


# ============================================================
# 6. AÇÃO INTELIGENTE
#
# Importante:
#
# A igualdade suggestedAction === homeNowAction.kind
# garante que o contexto diário não ficou dessincronizado
# da recomendação atual.
#
# O texto principal do botão reutiliza actionKey.
#
# A pequena legenda é nova e traduzida nos 4 idiomas.
# ============================================================

action_block = r'''
        {dailyContext.suggestedAction &&
         homeNowAction &&
         dailyContext.suggestedAction === homeNowAction.kind && (
          <div className="mt-4 border-t border-[#E8DDD7]/60 pt-3">
            {/* CONFIA 3D — AÇÃO INTELIGENTE DO DIA */}
            <p className="text-[9px] font-bold leading-relaxed text-slate-400">
              {t("dailyMoment.actionHint")}
            </p>

            <button
              type="button"
              onClick={handleHomeNowAction}
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#E5A88B]/20 bg-white/85 px-4 py-2 text-[10px] font-black text-[#C97B5E] shadow-[0_5px_16px_rgba(92,64,52,0.045)] transition-[transform,opacity,background-color] active:scale-[0.98] active:opacity-75"
            >
              <span>
                {t(homeNowAction.actionKey)}
              </span>

              <span
                aria-hidden="true"
                className="text-sm leading-none"
              >
                →
              </span>
            </button>
          </div>
        )}
'''


new_visual_block = old_visual_block.replace(
    needle,
    needle + action_block,
    1,
)

if new_visual_block == old_visual_block:
    fail(
        "A ação não foi inserida."
    )


# ============================================================
# 7. PREPARAR APP
# ============================================================

app_updated = (
    app_original[:start]
    + new_visual_block
    + app_original[end:]
)


# ============================================================
# 8. VALIDAR 3D NO BLOCO CERTO
# ============================================================

new_start = app_updated.find(
    start_marker
)

new_end = app_updated.find(
    end_marker,
    new_start
)

if new_start == -1 or new_end == -1:
    fail(
        "Não consegui isolar a 3C/3D após alteração."
    )

combined_block = app_updated[
    new_start:new_end
]

required_action = [
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
    "dailyContext.suggestedAction &&",
    "homeNowAction &&",
    "dailyContext.suggestedAction === homeNowAction.kind",
    "onClick={handleHomeNowAction}",
    't("dailyMoment.actionHint")',
    "t(homeNowAction.actionKey)",
]

for marker in required_action:
    if marker not in combined_block:
        fail(
            "A ação diária ficou incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 9. GARANTIR QUE NÃO CRIÁMOS NOVA NAVEGAÇÃO
# ============================================================

new_action_start = combined_block.find(
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
)

action_region = combined_block[
    new_action_start:
]

for forbidden in [
    "setCurrentTab(",
    "setHomeScreen(",
    "changeTab(",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "localStorage.",
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener",
]:
    if forbidden in action_region:
        fail(
            "A 3D introduziu lógica que deveria "
            "continuar centralizada:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 10. CONTAGENS GLOBAIS
#
# A única ocorrência adicional esperada é:
# onClick={handleHomeNowAction}
#
# Todo o resto deve permanecer igual.
# ============================================================

tracked = [
    "useState(",
    "useEffect(",
    "localStorage.getItem",
    "localStorage.setItem",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
]

for token in tracked:
    before = app_original.count(token)
    after = app_updated.count(token)

    if before != after:
        fail(
            f"A contagem de {token} mudou.\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


handler_before = app_original.count(
    "onClick={handleHomeNowAction}"
)

handler_after = app_updated.count(
    "onClick={handleHomeNowAction}"
)

if handler_after != handler_before + 1:
    fail(
        "Era esperada exatamente +1 utilização "
        "de handleHomeNowAction.\n\n"
        f"Antes: {handler_before}\n"
        f"Depois: {handler_after}"
    )


# ============================================================
# 11. VALIDAR QUE O HANDLER EXISTENTE NÃO FOI ALTERADO
#
# Não precisamos interpretar o handler.
# Basta garantir que a sua definição continua exatamente
# uma vez e que não foi criada uma segunda.
# ============================================================

if (
    app_updated.count(
        "const handleHomeNowAction"
    )
    != app_original.count(
        "const handleHomeNowAction"
    )
):
    fail(
        "A definição de handleHomeNowAction mudou."
    )


# ============================================================
# 12. TRADUÇÕES
#
# Só acrescentamos uma pequena legenda.
#
# O CTA principal reutiliza homeNowAction.actionKey,
# portanto continua automaticamente coerente com:
# - Impulso
# - Padrões
# - Objetivos
# - Progresso
# - Registar
# ============================================================

translations = {
    "pt": "Uma pequena ação para continuares a partir daqui.",
    "en": "One small action to continue from here.",
    "es": "Una pequeña acción para continuar desde aquí.",
    "fr": "Une petite action pour continuer à partir d’ici.",
}


locale_original_text = {}
locale_updated_text = {}


for language, path in LOCALES.items():
    text = path.read_text(
        encoding="utf-8"
    )

    locale_original_text[language] = text

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(
            f"{path} contém JSON inválido:\n{exc}"
        )

    if "dailyMoment" not in data:
        fail(
            f"{language}: dailyMoment não existe."
        )

    if not isinstance(
        data["dailyMoment"],
        dict
    ):
        fail(
            f"{language}: dailyMoment não é um objeto."
        )

    if "actionHint" in data["dailyMoment"]:
        fail(
            f"{language}: dailyMoment.actionHint "
            "já existe."
        )

    data["dailyMoment"]["actionHint"] = (
        translations[language]
    )

    locale_updated_text[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# ============================================================
# 13. VALIDAR 4 IDIOMAS
# ============================================================

for language in [
    "pt",
    "en",
    "es",
    "fr",
]:
    data = json.loads(
        locale_updated_text[language]
    )

    value = (
        data
        .get("dailyMoment", {})
        .get("actionHint")
    )

    if (
        not isinstance(value, str)
        or not value.strip()
    ):
        fail(
            f"{language}: actionHint inválido."
        )


# ============================================================
# 14. PRESERVAR 3A / 3B / 3C / PRINCIPAL
# ============================================================

preserved = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "const dailyContext =",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "dailyContext.state",
    "homeNowMemory",
    "homeNowAction",
    "homeNowContext",
    "reactiveMessageKey",
    "isFirstContact",
    "<HomeWorld",
    "Para ti agora — ação contextual da CONFIA",
]

for marker in preserved:
    if marker not in app_updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 15. IMPORTS INTACTOS
# ============================================================

original_imports = "\n".join(
    line
    for line in app_original.splitlines()
    if line.startswith("import ")
)

updated_imports = "\n".join(
    line
    for line in app_updated.splitlines()
    if line.startswith("import ")
)

if original_imports != updated_imports:
    fail(
        "A 3D não deveria alterar imports."
    )


# ============================================================
# 16. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 17. ESCREVER
# ============================================================

APP.write_text(
    app_updated,
    encoding="utf-8"
)

for language, path in LOCALES.items():
    path.write_text(
        locale_updated_text[language],
        encoding="utf-8"
    )


# ============================================================
# 18. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:
    written_app = APP.read_text(
        encoding="utf-8"
    )

    if (
        "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
        not in written_app
    ):
        raise RuntimeError(
            "Marcador 3D não encontrado."
        )

    if (
        written_app.count(
            "onClick={handleHomeNowAction}"
        )
        != handler_after
    ):
        raise RuntimeError(
            "Utilização do handler não corresponde "
            "ao resultado validado."
        )

    for language, path in LOCALES.items():
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        if (
            "actionHint"
            not in data.get(
                "dailyMoment",
                {}
            )
        ):
            raise RuntimeError(
                f"actionHint em falta: {language}"
            )

except Exception as exc:
    for source, backup in BACKUPS.items():
        shutil.copy2(
            backup,
            source
        )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
    print("=" * 78)
    print()
    print(exc)
    print()
    print(
        "Todos os ficheiros foram restaurados."
    )
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 19. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3D / AÇÃO INTELIGENTE DO DIA")
print("=" * 78)
print()

print("✓ Momento de Hoje passa a poder agir")
print("✓ Apenas uma pequena ação apresentada")
print("✓ Ação vem de dailyContext.suggestedAction")
print("✓ Ação confirmada contra homeNowAction.kind")
print("✓ CTA reutiliza homeNowAction.actionKey")
print("✓ Navegação reutiliza handleHomeNowAction")
print("✓ Nenhum segundo switch de navegação")
print("✓ Nenhuma nova decisão do Reactive Engine")
print("✓ Nenhuma nova recolha de memória")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum XP adicional")
print("✓ Nenhuma dependência")
print("✓ Primeiro contacto continua sem duplicação")
print("✓ Para ti agora preservado")
print("✓ PT")
print("✓ EN")
print("✓ ES")
print("✓ FR")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase3d_acao_inteligente")
print("  /tmp/pt.json.before_fase3d_acao_inteligente")
print("  /tmp/en.json.before_fase3d_acao_inteligente")
print("  /tmp/es.json.before_fase3d_acao_inteligente")
print("  /tmp/fr.json.before_fase3d_acao_inteligente")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
