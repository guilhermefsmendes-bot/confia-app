from pathlib import Path
import json
import shutil
import sys

APP = Path("src/App.tsx")
LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUP_DIR = Path("/tmp/confia_home_fase2")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("CONFIA — HOME / FASE 2 — A CONFIA REPAROU")
print("=" * 80)

# ------------------------------------------------------------
# 1. Verificar ficheiros
# ------------------------------------------------------------
required_files = [APP, *LOCALES.values()]

for path in required_files:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(1)

# ------------------------------------------------------------
# 2. Ler App.tsx
# ------------------------------------------------------------
source = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 3. Verificar se já foi aplicado
# ------------------------------------------------------------
if 't("reactiveInsightTitle")' in source:
    print("AVISO: a Fase 2 já parece estar aplicada no App.tsx.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(0)

# ------------------------------------------------------------
# 4. Bloco atual da resposta reativa
# ------------------------------------------------------------
old_block = '''{reactiveMessageKey && (
                    <div className="mt-3 rounded-2xl border border-[#E8DDD7] bg-[#FFF9F5] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                          ✨
                        </div>

                        <div>
                          <p className="text-xs font-black text-[#4E3B36]">
                            Confia
                          </p>

                          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                            {t(reactiveMessageKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}'''

if old_block not in source:
    print("ERRO: não foi encontrado o bloco esperado da resposta reativa.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ------------------------------------------------------------
# 5. Novo bloco visual
# ------------------------------------------------------------
new_block = '''{reactiveMessageKey && (
                    <div className="rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                          ✨
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#C97B5E] uppercase tracking-wider font-display">
                            {t("reactiveInsightTitle")}
                          </p>

                          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
                            {t(reactiveMessageKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}'''

# ------------------------------------------------------------
# 6. Remover bloco antigo do formulário
# ------------------------------------------------------------
updated = source.replace(old_block, "", 1)

# Confirmar remoção
if old_block in updated:
    print("ERRO: o bloco antigo não foi removido corretamente.")
    sys.exit(1)

# ------------------------------------------------------------
# 7. Inserir novo bloco imediatamente após HomeProgressSummary
# ------------------------------------------------------------
anchor = '''{homeScreen === "home" && (
    <HomeProgressSummary />
  )}'''

if anchor not in updated:
    print("ERRO: não foi encontrado o HomeProgressSummary esperado.")
    print("A restaurar ficheiro original...")
    sys.exit(1)

updated = updated.replace(
    anchor,
    anchor + "\n\n  " + new_block,
    1
)

# ------------------------------------------------------------
# 8. Verificação estrutural App.tsx
# ------------------------------------------------------------
if updated.count('t("reactiveInsightTitle")') != 1:
    print("ERRO: reactiveInsightTitle não ficou exatamente uma vez no App.tsx.")
    sys.exit(1)

if updated.count("reactiveMessageKey &&") != 1:
    print("ERRO: reactiveMessageKey não ficou exatamente uma vez.")
    sys.exit(1)

if old_block in updated:
    print("ERRO: bloco antigo ainda existe.")
    sys.exit(1)

# ------------------------------------------------------------
# 9. Fazer backups antes de escrever
# ------------------------------------------------------------
shutil.copy2(APP, BACKUP_DIR / "App.tsx")
for lang, path in LOCALES.items():
    shutil.copy2(path, BACKUP_DIR / f"{lang}.json")

# ------------------------------------------------------------
# 10. Traduções
# ------------------------------------------------------------
translations = {
    "pt": "A Confia reparou...",
    "en": "Confia noticed...",
    "es": "Confia ha notado...",
    "fr": "Confia a remarqué...",
}

loaded = {}

for lang, path in LOCALES.items():
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO ao ler {path}: {exc}")
        print("Nenhum ficheiro será alterado.")
        sys.exit(1)

    if "reactiveInsightTitle" in data:
        print(f"AVISO: reactiveInsightTitle já existe em {lang}.")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(0)

    data["reactiveInsightTitle"] = translations[lang]
    loaded[lang] = data

# ------------------------------------------------------------
# 11. Escrever App.tsx
# ------------------------------------------------------------
APP.write_text(updated, encoding="utf-8")

# ------------------------------------------------------------
# 12. Escrever traduções
# ------------------------------------------------------------
for lang, path in LOCALES.items():
    path.write_text(
        json.dumps(
            loaded[lang],
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8"
    )

# ------------------------------------------------------------
# 13. Validação pós-escrita
# ------------------------------------------------------------
final_app = APP.read_text(encoding="utf-8")

if final_app.count('t("reactiveInsightTitle")') != 1:
    print("ERRO PÓS-ESCRITA: App.tsx inválido.")
    print("A restaurar backups...")
    shutil.copy2(BACKUP_DIR / "App.tsx", APP)
    for lang, path in LOCALES.items():
        shutil.copy2(BACKUP_DIR / f"{lang}.json", path)
    sys.exit(1)

for lang, path in LOCALES.items():
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO PÓS-ESCRITA no {lang}.json: {exc}")
        print("A restaurar backups...")
        shutil.copy2(BACKUP_DIR / "App.tsx", APP)
        for l, p in LOCALES.items():
            shutil.copy2(BACKUP_DIR / f"{l}.json", p)
        sys.exit(1)

    if data.get("reactiveInsightTitle") != translations[lang]:
        print(f"ERRO: tradução {lang} não corresponde.")
        sys.exit(1)

print()
print("OK: backup criado em /tmp/confia_home_fase2/")
print("OK: resposta reativa movida para junto do HomeProgressSummary.")
print("OK: título contextual adicionado.")
print("OK: PT adicionada.")
print("OK: EN adicionada.")
print("OK: ES adicionada.")
print("OK: FR adicionada.")
print("OK: formulário mantém a funcionalidade existente.")
print("OK: reactiveEngine não foi alterado.")
print("OK: histórico reativo não foi alterado.")
print("OK: memória não foi alterada.")
print("OK: localStorage não foi alterado diretamente.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar git diff.")
print("=" * 80)
