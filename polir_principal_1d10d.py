from pathlib import Path
import shutil
import sys


APP_FILE = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_1d10d")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


def replace_once(text, old, new, label):
    count = text.count(old)

    if count != 1:
        fail(
            f"{label}: esperava 1 ocorrência, "
            f"encontrei {count}."
        )

    return text.replace(old, new, 1)


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.10D")
print("POLIMENTO PREMIUM — O TEU ESPAÇO")
print("=" * 72)


# ============================================================
# 1. CARREGAR — SEM ESCREVER
# ============================================================

if not APP_FILE.exists():
    fail("src/App.tsx não encontrado.")

original = APP_FILE.read_text(encoding="utf-8")
app = original


# ============================================================
# 2. VALIDAR ESTADO ORIGINAL
# ============================================================

required = [
    "O teu espaço — navegação secundária premium",
    '{t("homeSpace.title")}',
    '{t("homeSpace.subtitle")}',
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
]

for marker in required:
    if marker not in original:
        fail(
            f"Marcador obrigatório não encontrado: {marker}"
        )


# Impede aplicar esta versão duas vezes.
premium_area_marker = (
    'min-h-[88px] flex-col items-center '
    'justify-center gap-2.5 rounded-[20px]'
)

if premium_area_marker in original:
    fail(
        "O teu espaço parece já ter recebido "
        "a 1D.10D."
    )


# ============================================================
# 3. SUPERFÍCIE PRINCIPAL
# ============================================================

app = replace_once(
    app,
    '''className="overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF8F4] shadow-[0_10px_30px_rgba(92,64,52,0.05)]"''',
    '''className="relative overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF6F1] shadow-[0_12px_32px_rgba(92,64,52,0.055)]"''',
    "superfície de O teu espaço",
)


# ============================================================
# 4. CABEÇALHO
# ============================================================

app = replace_once(
    app,
    '''<div className="px-5 pt-5 pb-3">''',
    '''<div className="relative px-5 pb-4 pt-5">
      <div
        aria-hidden="true"
        className="absolute left-5 top-0 h-px w-10 bg-[#E5A88B]/45"
      />''',
    "cabeçalho de O teu espaço",
)


# ============================================================
# 5. COMPANHEIRO — PROTAGONISTA
# ============================================================

app = replace_once(
    app,
    '''className="w-full flex items-center justify-between gap-4 rounded-[22px] border border-[#E5A88B]/15 bg-white/85 px-4 py-3.5 text-left shadow-[0_6px_18px_rgba(92,64,52,0.04)] transition-colors duration-200 active:bg-[#FFF8F4]"''',
    '''className="relative w-full overflow-hidden flex items-center justify-between gap-4 rounded-[24px] border border-[#E5A88B]/20 bg-gradient-to-br from-white via-white to-[#FFF3EC] px-4 py-4 text-left shadow-[0_8px_22px_rgba(92,64,52,0.055)] transition-colors duration-200 active:bg-[#FFF8F4]"''',
    "cartão do Companheiro",
)

app = replace_once(
    app,
    '''<div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF5EF] to-[#F7E9E0]">''',
    '''<div
          aria-hidden="true"
          className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#F4D8C9]/20"
        />

        <div className="relative flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[#E5A88B]/15 bg-gradient-to-br from-[#FFF8F4] to-[#F3E2D8] shadow-[0_5px_14px_rgba(92,64,52,0.04)]">''',
    "identidade visual do Companheiro",
)

app = replace_once(
    app,
    '''className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF5EF] text-base font-light text-[#C97B5E]"''',
    '''className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/15 bg-white/90 text-base font-light text-[#C97B5E] shadow-sm"''',
    "seta do Companheiro",
)


# ============================================================
# 6. GRELHA DAS ÁREAS
# ============================================================

app = replace_once(
    app,
    '''<div className="mt-3 grid grid-cols-3 px-3">''',
    '''<div className="mt-3 grid grid-cols-3 gap-2 px-3">''',
    "grelha das áreas",
)


# ============================================================
# 7. HÁBITOS E LOJA
#
# Estas duas áreas partilham exatamente a mesma classe
# original. Validamos que existem 2 ocorrências e alteramos
# a primeira. Depois ficará apenas a Loja por converter.
# ============================================================

shared_area_old = '''className="group flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl px-2 transition-colors duration-200 active:bg-[#FFF8F4]"'''

area_new = '''className="group flex min-h-[88px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-[#E8DDD7]/60 bg-white/65 px-2 shadow-[0_5px_16px_rgba(92,64,52,0.035)] transition-colors duration-200 active:bg-[#FFF8F4]"'''

if app.count(shared_area_old) != 2:
    fail(
        "Esperava exatamente 2 ocorrências da classe "
        "partilhada por Hábitos/Loja; "
        f"encontrei {app.count(shared_area_old)}."
    )

# Primeira ocorrência = Hábitos.
app = app.replace(
    shared_area_old,
    area_new,
    1,
)

if app.count(shared_area_old) != 1:
    fail(
        "Após converter Hábitos deveria restar "
        "1 ocorrência para Loja."
    )


# ============================================================
# 8. INVENTÁRIO
# ============================================================

inventory_old = '''className="group flex min-h-[76px] flex-col items-center justify-center gap-2 border-x border-[#E8DDD7]/55 rounded-2xl px-2 transition-colors duration-200 active:bg-[#FFF8F4]"'''

if app.count(inventory_old) != 1:
    fail(
        "Inventário: esperava 1 ocorrência, "
        f"encontrei {app.count(inventory_old)}."
    )

app = app.replace(
    inventory_old,
    area_new,
    1,
)


# ============================================================
# 9. LOJA
# ============================================================

if app.count(shared_area_old) != 1:
    fail(
        "Loja: esperava 1 ocorrência restante, "
        f"encontrei {app.count(shared_area_old)}."
    )

app = app.replace(
    shared_area_old,
    area_new,
    1,
)

if shared_area_old in app:
    fail(
        "Permaneceu uma área com o estilo antigo."
    )

if app.count(area_new) != 3:
    fail(
        "Esperava exatamente 3 áreas premium; "
        f"encontrei {app.count(area_new)}."
    )


# ============================================================
# 10. ÍCONES DAS 3 ÁREAS
# ============================================================

area_icon_old = (
    '<div className="flex h-9 w-9 items-center justify-center '
    'rounded-xl bg-[#FFF5EF]">'
)

area_icon_new = (
    '<div className="flex h-10 w-10 items-center justify-center '
    'rounded-[14px] border border-[#E5A88B]/10 '
    'bg-gradient-to-br from-[#FFF7F2] to-[#F8EAE2]">'
)

if app.count(area_icon_old) != 3:
    fail(
        "Esperava exatamente 3 ícones das áreas; "
        f"encontrei {app.count(area_icon_old)}."
    )

app = app.replace(
    area_icon_old,
    area_icon_new,
)

if app.count(area_icon_new) != 3:
    fail(
        "Falhou a conversão dos 3 ícones das áreas."
    )

if area_icon_old in app:
    fail(
        "Permaneceu um ícone com o estilo antigo."
    )


# ============================================================
# 11. DEFINIÇÕES — CONTINUA SECUNDÁRIO
# ============================================================

app = replace_once(
    app,
    '''<div className="mx-4 mt-1 border-t border-[#E8DDD7]/55">''',
    '''<div className="mx-4 mt-3 border-t border-[#E8DDD7]/55">''',
    "separador das Definições",
)

app = replace_once(
    app,
    '''className="flex w-full items-center justify-end gap-1.5 px-1 py-3 text-slate-400 transition-colors duration-200 active:text-[#C97B5E]"''',
    '''className="flex w-full items-center justify-end gap-1.5 px-1 py-3.5 text-slate-400 transition-colors duration-200 active:text-[#C97B5E]"''',
    "Definições",
)


# ============================================================
# 12. GUARDRAILS DE NAVEGAÇÃO
# ============================================================

navigation_markers = [
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    'setPatternsPage("menu")',
]

for marker in navigation_markers:
    before = original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Navegação alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 13. GUARDRAILS DE CONTEÚDO
# ============================================================

content_markers = [
    '{t("homeSpace.title")}',
    '{t("homeSpace.subtitle")}',
    '{t("companion")}',
    '{t("patternsPremium.habits")}',
    '{t("inventory")}',
    '{t("shop")}',
    '{t("settings")}',
]

for marker in content_markers:
    before = original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Conteúdo alterado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 14. GARANTIR QUE SOS NÃO FOI TOCADO
# ============================================================

sos_marker = (
    "{/* Apoio — acesso SOS discreto "
    "e sempre disponível */}"
)

sos_start_original = original.find(sos_marker)
sos_start_new = app.find(sos_marker)

if sos_start_original == -1:
    fail(
        "Não consegui localizar o SOS no ficheiro original."
    )

if sos_start_new == -1:
    fail(
        "Não consegui localizar o SOS após as alterações."
    )

original_sos = original[sos_start_original:]
new_sos = app[sos_start_new:]

if original_sos != new_sos:
    fail(
        "O bloco SOS foi alterado. "
        "A 1D.10D não deve tocar nele."
    )


# ============================================================
# 15. GUARDRAILS DE OUTRAS ÁREAS
# ============================================================

external_markers = [
    "<HomeWorld",
    "<HomeProgressSummary",
    "reactiveMessageKey",
    "homeNowAction",
    "homeNowContext",
    "handleHomeNowAction",
    'id="home-daily-record"',
]

for marker in external_markers:
    before = original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Área externa alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 16. SEM NOVO STORAGE / LISTENERS
# ============================================================

side_effects = [
    "localStorage.setItem(",
    "localStorage.removeItem(",
    "addEventListener(",
    "onSnapshot(",
]

for marker in side_effects:
    before = original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Efeito inesperado detetado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 17. VERIFICAÇÃO FINAL DO RESULTADO VISUAL
# ============================================================

final_markers = [
    'relative overflow-hidden rounded-[30px]',
    'rounded-[24px] border border-[#E5A88B]/20',
    'min-h-[88px]',
    'rounded-[20px] border border-[#E8DDD7]/60',
    'h-10 w-10 items-center justify-center',
]

for marker in final_markers:
    if marker not in app:
        fail(
            "Resultado visual incompleto. "
            f"Falta: {marker}"
        )


# ============================================================
# 18. GARANTIR ALTERAÇÃO REAL
# ============================================================

if app == original:
    fail(
        "App.tsx não sofreu alterações."
    )


# ============================================================
# 19. BACKUP
#
# Só é criado depois de TODAS as validações passarem.
# ============================================================

shutil.copy2(
    APP_FILE,
    BACKUP,
)


# ============================================================
# 20. WRITE
# ============================================================

APP_FILE.write_text(
    app,
    encoding="utf-8",
)


print("✓ Estrutura de O teu espaço preservada")
print("✓ Companheiro continua protagonista")
print("✓ Companheiro ganhou maior presença visual")
print("✓ Hábitos convertido em área premium")
print("✓ Inventário convertido em área premium")
print("✓ Loja convertida em área premium")
print("✓ 3 ícones das áreas refinados")
print("✓ Definições continuam secundárias")
print("✓ Navegação preservada")
print("✓ Textos existentes preservados")
print("✓ SOS não alterado")
print("✓ HomeWorld não alterado")
print("✓ Hoje/Registar não alterado")
print("✓ Motor reativo não alterado")
print("✓ Nenhuma tradução nova")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print()
print("Nova hierarquia:")
print("  O TEU ESPAÇO")
print("      ├─ COMPANHEIRO — protagonista")
print("      ├─ Hábitos")
print("      ├─ Inventário")
print("      ├─ Loja")
print("      └─ Definições — utilidade secundária")
print()
print(f"✓ Backup: {BACKUP}")
print("=" * 72)
print("OK — 1D.10D APLICADA")
print("=" * 72)
