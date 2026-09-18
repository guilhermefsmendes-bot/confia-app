from pathlib import Path
import json
import shutil
import re
import sys

APP = Path("src/App.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUP_DIR = Path("/tmp/confia_home_fase2_v2")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("CONFIA — HOME / FASE 2 — A CONFIA REPAROU")
print("=" * 80)

# ============================================================
# 1. VERIFICAÇÃO DOS FICHEIROS
# ============================================================

for path in [APP, *LOCALES.values()]:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(1)

source = APP.read_text(encoding="utf-8")

# ============================================================
# 2. IMPEDIR DUPLICAÇÃO
# ============================================================

if 't("reactiveInsightTitle")' in source:
    print("AVISO: reactiveInsightTitle já existe no App.tsx.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(0)

# ============================================================
# 3. LOCALIZAR BLOCO REATIVO
# ============================================================

start_marker = "{reactiveMessageKey && ("

start_positions = [
    m.start()
    for m in re.finditer(re.escape(start_marker), source)
]

if len(start_positions) != 1:
    print(
        f"ERRO: esperava exatamente 1 bloco reactiveMessageKey, "
        f"encontrei {len(start_positions)}."
    )
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

start = start_positions[0]

# O bloco atual termina no primeiro fechamento de JSX
# correspondente ao padrão existente.
end_match = re.search(
    r'\n\s*\)\}\s*(?=\n\s*</div>)',
    source[start:]
)

if not end_match:
    print("ERRO: não foi possível localizar o fim do bloco reativo.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

end = start + end_match.end()

old_block = source[start:end]

print("OK: bloco reativo encontrado.")
print()

# ============================================================
# 4. LOCALIZAR HOMEPROGRESSSUMMARY
# ============================================================

summary_matches = list(
    re.finditer(r'<HomeProgressSummary\s*/>', source)
)

if len(summary_matches) != 1:
    print(
        f"ERRO: esperava exatamente 1 <HomeProgressSummary />, "
        f"encontrei {len(summary_matches)}."
    )
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

summary_end = summary_matches[0].end()

print("OK: HomeProgressSummary encontrado.")
print()

# ============================================================
# 5. NOVO BLOCO REATIVO
# ============================================================

new_block = '''{reactiveMessageKey && (
  <div className="mt-5 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
        ✨
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[#C97B5E] font-display">
          {t("reactiveInsightTitle")}
        </p>

        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
          {t(reactiveMessageKey)}
        </p>
      </div>
    </div>
  </div>
)}'''

# ============================================================
# 6. REMOVER O BLOCO DA POSIÇÃO ATUAL
# ============================================================

without_reactive = source[:start] + source[end:]

# Confirmar que desapareceu
if without_reactive.count("{reactiveMessageKey && (") != 0:
    print("ERRO: o bloco antigo não foi removido corretamente.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# 7. RECALCULAR HOME PROGRESS SUMMARY APÓS REMOÇÃO
# ============================================================

summary_matches_after = list(
    re.finditer(r'<HomeProgressSummary\s*/>', without_reactive)
)

if len(summary_matches_after) != 1:
    print("ERRO: HomeProgressSummary desapareceu ou ficou duplicado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

summary_end_after = summary_matches_after[0].end()

# ============================================================
# 8. INSERIR A RESPOSTA LOGO APÓS O RESUMO
# ============================================================

updated = (
    without_reactive[:summary_end_after]
    + "\n\n  "
    + new_block
    + without_reactive[summary_end_after:]
)

# ============================================================
# 9. VALIDAÇÕES DO APPTSX
# ============================================================

checks = {
    "reactiveInsightTitle": 't("reactiveInsightTitle")' in updated,
    "reactiveMessageKey": updated.count("{reactiveMessageKey && (") == 1,
    "HomeProgressSummary": updated.count("<HomeProgressSummary />") == 1,
    "analyzeReactiveState": "analyzeReactiveState" in updated,
    "handleSaveRatings": "handleSaveRatings" in updated,
}

for name, ok in checks.items():
    print(("OK:" if ok else "ERRO:"), name)

if not all(checks.values()):
    print()
    print("ERRO: validação estrutural do App.tsx falhou.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# 10. VALIDAR TRADUÇÕES ANTES DE ALTERAR
# ============================================================

translations = {
    "pt": "A Confia reparou...",
    "en": "Confia noticed...",
    "es": "Confia ha notado...",
    "fr": "Confia a remarqué...",
}

locale_data = {}

for lang, path in LOCALES.items():

    text = path.read_text(encoding="utf-8")

    try:
        data = json.loads(text)
    except Exception as exc:
        print(f"ERRO: {path} não é JSON válido: {exc}")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(1)

    if "reactiveInsightTitle" in data:
        print(f"ERRO: reactiveInsightTitle já existe em {lang}.")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(1)

    locale_data[lang] = text

    print(f"OK: {lang}.json é JSON válido.")

# ============================================================
# 11. BACKUPS
# ============================================================

shutil.copy2(APP, BACKUP_DIR / "App.tsx")

for lang, path in LOCALES.items():
    shutil.copy2(path, BACKUP_DIR / f"{lang}.json")

print()
print(f"OK: backups criados em {BACKUP_DIR}")
print()

# ============================================================
# 12. ESCREVER APPTSX
# ============================================================

APP.write_text(updated, encoding="utf-8")

# ============================================================
# 13. ADICIONAR TRADUÇÕES SEM REFORMATAR JSON
# ============================================================

for lang, path in LOCALES.items():

    text = locale_data[lang]

    # Inserir antes do último } do objeto JSON.
    match = re.search(r'\}\s*$', text)

    if not match:
        print(f"ERRO: não encontrei o fecho final de {path}.")
        print("A restaurar backups...")

        shutil.copy2(BACKUP_DIR / "App.tsx", APP)

        for l, p in LOCALES.items():
            shutil.copy2(BACKUP_DIR / f"{l}.json", p)

        sys.exit(1)

    insertion = (
        ',\n'
        f'  "reactiveInsightTitle": {json.dumps(translations[lang], ensure_ascii=False)}\n'
    )

    new_text = (
        text[:match.start()]
        + insertion
        + text[match.start():]
    )

    path.write_text(new_text, encoding="utf-8")

# ============================================================
# 14. VALIDAÇÃO FINAL
# ============================================================

final_app = APP.read_text(encoding="utf-8")

if final_app.count('t("reactiveInsightTitle")') != 1:
    print("ERRO: reactiveInsightTitle inválido no App.tsx.")

    shutil.copy2(BACKUP_DIR / "App.tsx", APP)

    for lang, path in LOCALES.items():
        shutil.copy2(BACKUP_DIR / f"{lang}.json", path)

    sys.exit(1)

for lang, path in LOCALES.items():

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO: {lang}.json deixou de ser JSON válido: {exc}")

        print("A restaurar backups...")

        shutil.copy2(BACKUP_DIR / "App.tsx", APP)

        for l, p in LOCALES.items():
            shutil.copy2(BACKUP_DIR / f"{l}.json", p)

        sys.exit(1)

    expected = translations[lang]

    if data.get("reactiveInsightTitle") != expected:
        print(
            f"ERRO: tradução {lang} incorreta. "
            f"Esperado={expected!r}, encontrado={data.get('reactiveInsightTitle')!r}"
        )

        shutil.copy2(BACKUP_DIR / "App.tsx", APP)

        for l, p in LOCALES.items():
            shutil.copy2(BACKUP_DIR / f"{l}.json", p)

        sys.exit(1)

    print(f"OK: {lang} — tradução validada.")

# ============================================================
# 15. RESULTADO
# ============================================================

print()
print("=" * 80)
print("CONFIA — HOME / FASE 2 APLICADA")
print("=" * 80)
print()
print("OK: resposta reativa removida da parte inferior do formulário.")
print("OK: resposta reativa colocada imediatamente após HomeProgressSummary.")
print("OK: novo título contextualizado.")
print("OK: PT — A Confia reparou...")
print("OK: EN — Confia noticed...")
print("OK: ES — Confia ha notado...")
print("OK: FR — Confia a remarqué...")
print("OK: nenhuma alteração no reactiveEngine.")
print("OK: nenhuma alteração nas respostas reativas.")
print("OK: nenhuma alteração no histórico.")
print("OK: nenhuma alteração na memória.")
print("OK: JSONs continuam válidos.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar git diff.")
print("=" * 80)
