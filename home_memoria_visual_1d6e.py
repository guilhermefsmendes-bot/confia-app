from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — MEMÓRIA VISUAL — 1D.6E")
print("=" * 72)


if not APP.exists():
    fail("src/App.tsx não encontrado.")


text = APP.read_text(encoding="utf-8")

backup = Path("/tmp/App.tsx.before_1d6e")
shutil.copy2(APP, backup)


old = '''        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t("homeNow.impulseMemory.eyebrow")
            : t("homeNow.eyebrow")}
        </p>

        <h3 className="mt-1 text-sm font-black leading-snug text-[#4E3B36]">
          {t(homeNowAction.titleKey)}
        </h3>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t(homeNowAction.textKey, {
                before: homeNowAction.memory.before,
                after: homeNowAction.memory.after,
                reduction: homeNowAction.memory.reduction,
              })
            : t(homeNowAction.textKey)}
        </p>
'''

if old not in text:
    fail(
        "bloco visual antigo do Para ti agora não encontrado. "
        "Nenhuma alteração foi feita."
    )


new = '''        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {homeNowMemory?.kind === "impulseLearning"
            ? t("impulseLearning.eyebrow")
            : t("homeNow.eyebrow")}
        </p>

        <h3 className="mt-1 text-sm font-black leading-snug text-[#4E3B36]">
          {t(homeNowAction.titleKey)}
        </h3>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t(homeNowAction.textKey)}
        </p>
'''


text = text.replace(old, new, 1)


# ============================================================
# GARANTIAS
# ============================================================

if 'homeNowAction.memory' in text:
    shutil.copy2(backup, APP)
    fail(
        "a referência antiga homeNowAction.memory ainda existe."
    )

if '"memory" in homeNowAction' in text:
    shutil.copy2(backup, APP)
    fail(
        "a lógica antiga de memória dentro da ação ainda existe."
    )

if 'homeNowMemory?.kind === "impulseLearning"' not in text:
    shutil.copy2(backup, APP)
    fail(
        "referência à memória 1D.6 não foi inserida."
    )


APP.write_text(text, encoding="utf-8")


print("✓ Cartão deixou de procurar memória dentro de homeNowAction")
print("✓ homeNowMemory passou a ser a fonte da memória visual")
print("✓ homeNowAction continua exclusivamente responsável pela ação")
print("✓ Reactive Engine preservado")
print("✓ Memória 1D.6 preservada")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Backup criado em /tmp/App.tsx.before_1d6e")

print("=" * 72)
print("OK — 1D.6E APLICADA")
print("=" * 72)
