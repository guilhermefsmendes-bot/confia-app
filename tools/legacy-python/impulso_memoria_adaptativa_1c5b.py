from pathlib import Path
import json
import shutil
import sys
import re


COMPONENT = Path("src/components/ImpulsoSOS.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

TRANSLATIONS = {
    "pt": {
        "memoryEyebrow": "A CONFIA LEMBRA-SE",
        "memoryText": "Recentemente escolheste {{need}} e a intensidade passou de {{before}} para {{after}}. Esta abordagem pareceu ajudar-te.",
        "helpedRecently": "Ajudou-te recentemente"
    },
    "en": {
        "memoryEyebrow": "CONFIA REMEMBERS",
        "memoryText": "Recently, you chose {{need}} and the intensity went from {{before}} to {{after}}. This approach seemed to help you.",
        "helpedRecently": "Helped you recently"
    },
    "es": {
        "memoryEyebrow": "CONFIA LO RECUERDA",
        "memoryText": "Recientemente elegiste {{need}} y la intensidad pasó de {{before}} a {{after}}. Este enfoque pareció ayudarte.",
        "helpedRecently": "Te ayudó recientemente"
    },
    "fr": {
        "memoryEyebrow": "CONFIA S'EN SOUVIENT",
        "memoryText": "Récemment, tu as choisi {{need}} et l'intensité est passée de {{before}} à {{after}}. Cette approche semble t'avoir aidé.",
        "helpedRecently": "T'a aidé récemment"
    },
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


# ============================================================
# 0. VALIDAR FICHEIROS
# ============================================================

if not COMPONENT.exists():
    fail(f"ficheiro não encontrado: {COMPONENT}")

for path in LOCALES.values():
    if not path.exists():
        fail(f"ficheiro não encontrado: {path}")


text = COMPONENT.read_text(encoding="utf-8")
original = text


# ============================================================
# 1. IMPORT DA MEMÓRIA REATIVA
# ============================================================

memory_import = """import {
  collectReactiveRecentMemory,
} from "../data/reactive/reactiveRecentMemory";
"""

if "collectReactiveRecentMemory" not in text:
    anchor = 'import { useTranslation } from "react-i18next";'

    if anchor not in text:
        fail("import useTranslation não encontrado.")

    text = text.replace(
        anchor,
        anchor + "\n" + memory_import.rstrip(),
        1,
    )


# ============================================================
# 2. MEMÓRIA DA SESSÃO
# ============================================================

memory_state = """
  /**
   * Memória existente quando o utilizador entra no Impulso.
   *
   * É reconstruída uma única vez por montagem através
   * dos registos que a aplicação já possui.
   */
  const [impulseMemory] = useState(
    () => collectReactiveRecentMemory()
  );

  const rememberedImpulse =
    impulseMemory.recentEffectiveImpulse?.need
      ? impulseMemory.recentEffectiveImpulse
      : undefined;

  const rememberedNeed =
    rememberedImpulse?.need;
"""

if "const [impulseMemory]" not in text:
    pattern = re.compile(
        r'(\s*const\s+\[reactiveMessageKey,\s*setReactiveMessageKey\]\s*=\s*'
        r'useState<string\s*\|\s*null>\(null\);)'
    )

    match = pattern.search(text)

    if not match:
        fail(
            "declaração real de reactiveMessageKey "
            "não encontrada."
        )

    insert_at = match.end()

    text = (
        text[:insert_at]
        + "\n"
        + memory_state
        + text[insert_at:]
    )


# ============================================================
# 3. LOCALIZAR A ENTRADA PREMIUM E O ARRAY needs
# ============================================================

needs_start = text.find("const needs:")

if needs_start == -1:
    needs_start = text.find("const needs =")

if needs_start == -1:
    fail("array 'needs' da entrada premium não encontrado.")

needs_array_end = text.find("];", needs_start)

if needs_array_end == -1:
    fail("fim do array 'needs' não encontrado.")

needs_array_end += 2


# ============================================================
# 4. FUNÇÃO PARA OBTER O NOME TRADUZIDO DA NECESSIDADE
# ============================================================

helper = """

    const getNeedLabel = (
      need: ImpulseNeed
    ): string => {
      const match = needs.find(
        (item) => item.id === need
      );

      return match?.title ?? need;
    };

    const rememberedNeedLabel =
      rememberedNeed
        ? getNeedLabel(rememberedNeed)
        : undefined;
"""

if "const rememberedNeedLabel" not in text:
    text = (
        text[:needs_array_end]
        + helper
        + text[needs_array_end:]
    )


# ============================================================
# 5. ENCONTRAR needs.map
# ============================================================

map_pos = text.find("needs.map", needs_array_end)

if map_pos == -1:
    fail("needs.map não encontrado.")


# ============================================================
# 6. ENCONTRAR O GRID QUE CONTÉM needs.map
# ============================================================

search_start = max(
    needs_array_end,
    map_pos - 1800,
)

segment = text[search_start:map_pos]

matches = list(
    re.finditer(
        r'<div\s+className="[^"]*grid[^"]*grid-cols-2[^"]*"[^>]*>',
        segment,
    )
)

if not matches:
    fail("grid das necessidades não encontrado.")

grid_match = matches[-1]

grid_pos = search_start + grid_match.start()


# ============================================================
# 7. CARTÃO "A CONFIA LEMBRA-SE"
# ============================================================

memory_card = """{rememberedImpulse &&
              rememberedNeedLabel && (
                <div className="mb-4 rounded-[22px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white p-4 text-left shadow-[0_8px_24px_rgba(92,64,52,0.04)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-[#E5A88B]/20 bg-white">
                      <Sparkles
                        size={15}
                        strokeWidth={1.8}
                        className="text-[#C97B5E]"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#C97B5E]">
                        {t("impulseMemory.memoryEyebrow")}
                      </p>

                      <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#6B5750]">
                        {t(
                          "impulseMemory.memoryText",
                          {
                            need: rememberedNeedLabel,
                            before:
                              rememberedImpulse.initialIntensity,
                            after:
                              rememberedImpulse.finalIntensity,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              """

if 'impulseMemory.memoryEyebrow' not in text:
    text = (
        text[:grid_pos]
        + memory_card
        + text[grid_pos:]
    )


# ============================================================
# 8. BADGE NA NECESSIDADE QUE AJUDOU
# ============================================================

map_pos = text.find("needs.map", needs_array_end)

if map_pos == -1:
    fail("needs.map desapareceu após inserção.")

title_pos = text.find("{need.title}", map_pos)

if title_pos == -1:
    fail(
        "{need.title} não encontrado no cartão "
        "das necessidades."
    )

# Procurar a tag que contém need.title.
open_tag_start = text.rfind("<", map_pos, title_pos)

if open_tag_start == -1:
    fail("tag do título da necessidade não encontrada.")

open_tag_end = text.find(">", open_tag_start)

if open_tag_end == -1 or open_tag_end > title_pos:
    fail("abertura da tag do título inválida.")

tag_match = re.match(
    r'<([A-Za-z0-9]+)\b',
    text[open_tag_start:open_tag_end + 1],
)

if not tag_match:
    fail("tipo de tag do título não identificado.")

tag_name = tag_match.group(1)

close_tag = f"</{tag_name}>"

title_close = text.find(
    close_tag,
    title_pos,
)

if title_close == -1:
    fail(
        f"fecho {close_tag} do título não encontrado."
    )

title_close += len(close_tag)


badge = """

                      {rememberedNeed === need.id && (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#E5A88B]/25 bg-[#FFF3EC] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#C97B5E]">
                          {t(
                            "impulseMemory.helpedRecently"
                          )}
                        </span>
                      )}"""

if "impulseMemory.helpedRecently" not in text:
    text = (
        text[:title_close]
        + badge
        + text[title_close:]
    )


# ============================================================
# 9. TRADUÇÕES PT / EN / ES / FR
# ============================================================

locale_data = {}

for lang, path in LOCALES.items():
    try:
        data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(f"JSON inválido em {path}: {exc}")

    expected = TRANSLATIONS[lang]

    if "impulseMemory" in data:
        if data["impulseMemory"] != expected:
            fail(
                f"'impulseMemory' já existe com "
                f"conteúdo diferente em {lang}."
            )
    else:
        data["impulseMemory"] = expected

    locale_data[path] = data


# ============================================================
# 10. VERIFICAÇÕES
# ============================================================

required = [
    "collectReactiveRecentMemory",
    "const [impulseMemory]",
    "recentEffectiveImpulse?.need",
    "const rememberedNeed",
    "const rememberedNeedLabel",
    "impulseMemory.memoryEyebrow",
    "impulseMemory.memoryText",
    "impulseMemory.helpedRecently",
    "rememberedNeed === need.id",
    "rememberedImpulse.initialIntensity",
    "rememberedImpulse.finalIntensity",
    "need: impulseNeed ?? undefined",
    "saveEpisode({",
    "analyzeReactiveState({",
    "recordReactiveResponse({",
    "onAddXp(30)",
]

for fragment in required:
    if fragment not in text:
        fail(
            f"verificação final falhou: {fragment}"
        )


# Não adicionamos nenhuma chamada localStorage.
if text.count("localStorage.getItem(") != original.count(
    "localStorage.getItem("
):
    fail(
        "alteração inesperada em "
        "localStorage.getItem."
    )

if text.count("localStorage.setItem(") != original.count(
    "localStorage.setItem("
):
    fail(
        "alteração inesperada em "
        "localStorage.setItem."
    )


# Uma única recolha de memória por montagem.
if text.count("collectReactiveRecentMemory()") != 1:
    fail(
        "número inesperado de chamadas a "
        "collectReactiveRecentMemory()."
    )


# ============================================================
# 11. BACKUPS EM /tmp
# ============================================================

shutil.copy2(
    COMPONENT,
    "/tmp/ImpulsoSOS.tsx.before_1c5b"
)

for path in LOCALES.values():
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_1c5b"
    )


# ============================================================
# 12. ESCREVER
# ============================================================

COMPONENT.write_text(
    text,
    encoding="utf-8"
)

for path, data in locale_data.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )


print("=" * 72)
print("CONFIA — IMPULSO 1C.5B — MEMÓRIA VISÍVEL")
print("=" * 72)
print("✓ Memória reativa ligada ao Impulso")
print("✓ recentEffectiveImpulse usado como memória real")
print("✓ Necessidade/percurso anterior identificado")
print("✓ Intensidade Antes / Agora recuperada")
print("✓ Cartão 'A CONFIA lembra-se' adicionado")
print("✓ Abordagem eficaz recente assinalada")
print("✓ Necessidade atual continua sob controlo do utilizador")
print("✓ Nenhuma seleção automática")
print("✓ Episódios antigos sem need continuam compatíveis")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ finishSOS preservado")
print("✓ Reactive Engine preservado")
print("✓ Histórico reativo preservado")
print("✓ +30 XP preservado")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1C.5B concluída.")
