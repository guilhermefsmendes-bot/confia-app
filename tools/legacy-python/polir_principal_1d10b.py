from pathlib import Path
import shutil
import sys

FILE = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_1d10b")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.10B")
print("LIGAÇÃO VISUAL: PERCEBEU → PARA TI AGORA")
print("=" * 72)

if not FILE.exists():
    fail("src/App.tsx não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. ÂNCORAS EXATAS
# ============================================================

old_reactive = '''{reactiveMessageKey && (
  <div className="mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">'''

new_reactive = '''{reactiveMessageKey && (
  <div
    className={`mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm ${
      homeNowAction ? "rounded-b-[22px]" : ""
    }`}
  >'''

old_action = '''{/* Para ti agora — ação contextual da CONFIA */}
{homeScreen === "home" && homeNowAction && (
  <section
    className="rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF7F2] via-white to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(92,64,52,0.05)]"
    aria-label={t("homeNow.eyebrow")}
  >'''

new_action = '''{/* Para ti agora — ação contextual da CONFIA */}
{homeScreen === "home" && homeNowAction && (
  <div className={reactiveMessageKey ? "-mt-2 pt-2" : ""}>
    {reactiveMessageKey && (
      <div
        aria-hidden="true"
        className="mx-auto h-5 w-px bg-gradient-to-b from-[#E5A88B]/45 to-[#E5A88B]/10"
      />
    )}

    <section
      className={`rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF7F2] via-white to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(92,64,52,0.05)] ${
        reactiveMessageKey ? "relative overflow-hidden" : ""
      }`}
      aria-label={t("homeNow.eyebrow")}
    >
      {reactiveMessageKey && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-6 h-12 w-[3px] rounded-r-full bg-[#E5A88B]/55"
        />
      )}'''

old_action_end = '''    </div>
  </section>
)}

{/* Hoje — resumo + registo diário */}'''

new_action_end = '''    </div>
    </section>
  </div>
)}

{/* Hoje — resumo + registo diário */}'''


# ============================================================
# 2. VALIDAR ANTES DE ALTERAR
# ============================================================

for name, anchor in [
    ("cartão reativo", old_reactive),
    ("início Para ti agora", old_action),
    ("fim Para ti agora", old_action_end),
]:
    count = text.count(anchor)

    if count != 1:
        fail(
            f"{name}: esperava 1 ocorrência, "
            f"encontrei {count}."
        )


# Guardrails de lógica

logic_markers = [
    "reactiveMessageKey",
    "homeNowAction",
    "homeNowContext",
    "handleHomeNowAction",
    "homeNowAction.titleKey",
    "homeNowAction.textKey",
    "homeNowAction.actionKey",
]

before_counts = {
    marker: original.count(marker)
    for marker in logic_markers
}


# ============================================================
# 3. APLICAR EM MEMÓRIA
# ============================================================

text = text.replace(
    old_reactive,
    new_reactive,
    1,
)

text = text.replace(
    old_action,
    new_action,
    1,
)

text = text.replace(
    old_action_end,
    new_action_end,
    1,
)


# ============================================================
# 4. VALIDAR RESULTADO
# ============================================================

if text == original:
    fail("nenhuma alteração foi produzida.")

if old_reactive in text:
    fail("estrutura antiga do cartão reativo permaneceu.")

if old_action in text:
    fail("estrutura antiga de Para ti agora permaneceu.")

if text.count('aria-hidden="true"') < original.count('aria-hidden="true"') + 2:
    fail("elementos visuais de ligação não foram introduzidos.")

# A lógica existente pode ganhar referências visuais a
# reactiveMessageKey/homeNowAction, mas não pode perder nenhuma.
for marker in logic_markers:
    after = text.count(marker)

    if after < before_counts[marker]:
        fail(
            f"a referência lógica '{marker}' diminuiu "
            f"de {before_counts[marker]} para {after}."
        )

# Estas referências críticas devem manter exatamente a contagem.
for marker in [
    "homeNowContext",
    "handleHomeNowAction",
    "homeNowAction.titleKey",
    "homeNowAction.textKey",
    "homeNowAction.actionKey",
]:
    if text.count(marker) != before_counts[marker]:
        fail(
            f"lógica crítica alterada: {marker}."
        )

# Não tocar nas áreas seguintes.
for marker in [
    "<HomeWorld",
    "<HomeProgressSummary",
    'id="home-daily-record"',
    "O teu espaço — navegação secundária premium",
]:
    if text.count(marker) != original.count(marker):
        fail(f"guardrail falhou: {marker}")


# ============================================================
# 5. BACKUP + WRITE
# ============================================================

shutil.copy2(FILE, BACKUP)

FILE.write_text(
    text,
    encoding="utf-8",
)


print("✓ Mensagem reativa preservada")
print("✓ Para ti agora preservado")
print("✓ Ligação vertical subtil adicionada")
print("✓ Ação ganha continuidade visual quando há insight")
print("✓ Apresentação isolada continua válida")
print("✓ homeNowContext preservado")
print("✓ handleHomeNowAction preservado")
print("✓ Hoje não alterado")
print("✓ HomeWorld não alterado")
print("✓ O teu espaço não alterado")
print("✓ Nenhum texto novo")
print("✓ Nenhuma tradução nova")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print()
print("Experiência:")
print("  A CONFIA percebeu")
print("          ↓")
print("  Para ti agora")
print()
print(f"✓ Backup: {BACKUP}")
print("=" * 72)
print("OK — 1D.10B APLICADA")
print("=" * 72)
