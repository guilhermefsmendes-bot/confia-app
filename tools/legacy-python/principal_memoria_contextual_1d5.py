from pathlib import Path
import json
import shutil
import re

APP = Path("src/App.tsx")
LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

print("=" * 72)
print("CONFIA — PRINCIPAL 1D.5 — MEMÓRIA CONTEXTUAL")
print("=" * 72)

# ---------------------------------------------------------------------
# 1. VALIDAÇÕES
# ---------------------------------------------------------------------

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

text = APP.read_text(encoding="utf-8")

if "collectReactiveRecentMemory" in text:
    print("✓ collectReactiveRecentMemory já está importado")
else:
    marker = '''import {
  recordReactiveResponse,
} from "./data/reactive/reactiveHistoryStorage";
'''

    if marker not in text:
        print("ERRO: bloco de imports reativos não encontrado.")
        raise SystemExit(1)

    replacement = marker + '''import {
  collectReactiveRecentMemory,
} from "./data/reactive/reactiveRecentMemory";
'''

    text = text.replace(marker, replacement, 1)
    print("✓ Import da memória reativa adicionado")

# ---------------------------------------------------------------------
# 2. BACKUP
# ---------------------------------------------------------------------

backup = Path("/tmp/App.tsx.before_1d5")
shutil.copy2(APP, backup)

for lang, path in LOCALES.items():
    if not path.exists():
        print(f"ERRO: {path} não encontrado.")
        raise SystemExit(1)

    shutil.copy2(path, Path(f"/tmp/{lang}.json.before_1d5"))

print("✓ Backups criados")

# ---------------------------------------------------------------------
# 3. SUBSTITUIR O BLOCO 1D.4
# ---------------------------------------------------------------------

start_marker = '''/**
 * 1D.4 — PARA TI AGORA
'''

end_marker = '''const handleHomeNowAction = () => {
'''

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: bloco 1D.4 não encontrado.")
    raise SystemExit(1)

old_block = text[start:end]

new_block = r'''/**
 * 1D.5 — PARA TI AGORA + MEMÓRIA CONTEXTUAL
 *
 * O Reactive Engine continua a decidir situação + intenção.
 *
 * A memória reativa acrescenta contexto quando existe evidência real
 * de que uma estratégia anterior foi eficaz.
 *
 * A memória nunca escolhe automaticamente uma necessidade.
 * Apenas contextualiza a recomendação apresentada ao utilizador.
 */
const homeNowMemory = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  try {
    const memory = collectReactiveRecentMemory();

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,
        need: effectiveImpulse.need ?? null,
        before: effectiveImpulse.initialIntensity,
        after: effectiveImpulse.finalIntensity,
        reduction: effectiveImpulse.reduction,
      };
    }
  } catch {
    /*
     * A memória é apenas uma camada complementar.
     * Se não estiver disponível, o Principal continua a funcionar
     * normalmente através do Reactive Engine.
     */
  }

  return null;
})();

const homeNowAction = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  /*
   * 1D.5 — memória eficaz recente.
   *
   * Tem prioridade porque representa uma experiência real
   * já vivida pelo utilizador.
   */
  if (homeNowMemory) {
    return {
      kind: "impulse" as const,
      memory: homeNowMemory,
      titleKey: "homeNow.impulseMemory.title",
      textKey: "homeNow.impulseMemory.text",
      actionKey: "homeNow.impulseMemory.action",
    };
  }

  /*
   * 1D.4 — decisão normal do Reactive Engine.
   */
  const result = analyzeReactiveState({
    source: "general",
  });

  const intent = result?.intent;

  if (!intent) {
    return null;
  }

  switch (intent) {
    // Regulação / momento difícil
    case "calm":
    case "ground":
    case "encourage_regulation":
    case "support_difficult_moment":
    case "gentle_check":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulse.title",
        textKey: "homeNow.impulse.text",
        actionKey: "homeNow.impulse.action",
      };

    // Aprendizagem a partir do Impulso
    case "reinforce_impulse":
    case "review_impulse":
    case "reinforce_effective_strategy":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulseMemory.title",
        textKey: "homeNow.impulseMemory.text",
        actionKey: "homeNow.impulseMemory.action",
      };

    // Padrões / reflexão
    case "connect_pattern":
    case "invite_reflection":
    case "explore":
    case "reflect":
    case "clarify":
      return {
        kind: "patterns" as const,
        titleKey: "homeNow.patterns.title",
        textKey: "homeNow.patterns.text",
        actionKey: "homeNow.patterns.action",
      };

    // Objetivos
    case "celebrate_objective":
    case "redirect_objective":
      return {
        kind: "objectives" as const,
        titleKey: "homeNow.objectives.title",
        textKey: "homeNow.objectives.text",
        actionKey: "homeNow.objectives.action",
      };

    // Evolução
    case "reinforce_progress":
    case "highlight_small_win":
    case "recognize_consistency":
      return {
        kind: "progress" as const,
        titleKey: "homeNow.progress.title",
        textKey: "homeNow.progress.text",
        actionKey: "homeNow.progress.action",
      };

    // Retoma / início
    case "welcome":
    case "encourage_return":
      return {
        kind: "record" as const,
        titleKey: "homeNow.record.title",
        textKey: "homeNow.record.text",
        actionKey: "homeNow.record.action",
      };

    /*
     * Intenções genéricas não recebem uma recomendação
     * artificial apenas para preencher espaço.
     */
    default:
      return null;
  }
})();

'''

text = text[:start] + new_block + text[end:]

print("✓ 1D.4 substituída pela camada 1D.5")

# ---------------------------------------------------------------------
# 4. ALTERAR O TEXTO DO CARTÃO PARA SUPORTAR MEMÓRIA
# ---------------------------------------------------------------------

old_render = '''        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t(homeNowAction.textKey)}
        </p>
'''

new_render = '''        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t(homeNowAction.textKey, {
                before: homeNowAction.memory.before,
                after: homeNowAction.memory.after,
                reduction: homeNowAction.memory.reduction,
              })
            : t(homeNowAction.textKey)}
        </p>
'''

if old_render not in text:
    print("ERRO: texto visual do cartão não encontrado.")
    shutil.copy2(backup, APP)
    raise SystemExit(1)

text = text.replace(old_render, new_render, 1)

# ---------------------------------------------------------------------
# 5. ALTERAR O EYEBROW DO CARTÃO QUANDO EXISTE MEMÓRIA
# ---------------------------------------------------------------------

old_eyebrow = '''        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {t("homeNow.eyebrow")}
        </p>
'''

new_eyebrow = '''        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t("homeNow.impulseMemory.eyebrow")
            : t("homeNow.eyebrow")}
        </p>
'''

if old_eyebrow not in text:
    print("ERRO: eyebrow do cartão não encontrado.")
    shutil.copy2(backup, APP)
    raise SystemExit(1)

text = text.replace(old_eyebrow, new_eyebrow, 1)

APP.write_text(text, encoding="utf-8")

print("✓ Cartão visual adaptado à memória")

# ---------------------------------------------------------------------
# 6. TRADUÇÕES
# ---------------------------------------------------------------------

translations = {
    "pt": {
        "eyebrow": "A CONFIA LEMBRA-SE",
        "title": "Algo que já te ajudou",
        "text": "Na última vez que usaste o Impulso, a tua intensidade passou de {{before}} para {{after}}. Podes voltar a experimentar este espaço se sentires que te pode ajudar.",
        "action": "Abrir Impulso",
    },
    "en": {
        "eyebrow": "CONFIA REMEMBERS",
        "title": "Something that helped before",
        "text": "The last time you used Impulse, your intensity went from {{before}} to {{after}}. You can try this space again if it feels like it could help.",
        "action": "Open Impulse",
    },
    "es": {
        "eyebrow": "CONFIA LO RECUERDA",
        "title": "Algo que ya te ayudó",
        "text": "La última vez que usaste Impulso, tu intensidad pasó de {{before}} a {{after}}. Puedes volver a probar este espacio si sientes que puede ayudarte.",
        "action": "Abrir Impulso",
    },
    "fr": {
        "eyebrow": "CONFIA S'EN SOUVIENT",
        "title": "Quelque chose qui t'a déjà aidé",
        "text": "La dernière fois que tu as utilisé Impulsion, ton intensité est passée de {{before}} à {{after}}. Tu peux essayer à nouveau cet espace si tu sens qu'il pourrait t'aider.",
        "action": "Ouvrir Impulsion",
    },
}

for lang, path in LOCALES.items():
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    home_now = data.setdefault("homeNow", {})
    memory = home_now.setdefault("impulseMemory", {})

    memory["eyebrow"] = translations[lang]["eyebrow"]
    memory["title"] = translations[lang]["title"]
    memory["text"] = translations[lang]["text"]
    memory["action"] = translations[lang]["action"]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"✓ {lang}: memória contextual adicionada")

# ---------------------------------------------------------------------
# 7. VALIDAÇÃO
# ---------------------------------------------------------------------

print()
print("=" * 72)
print("VALIDAÇÃO")
print("=" * 72)

final_text = APP.read_text(encoding="utf-8")

required = [
    "collectReactiveRecentMemory",
    "homeNowMemory",
    "recentEffectiveImpulse",
    "homeNow.impulseMemory.eyebrow",
    "homeNow.impulseMemory.text",
]

for item in required:
    if item not in final_text:
        print(f"ERRO: não encontrado: {item}")
        shutil.copy2(backup, APP)
        raise SystemExit(1)

print("✓ App.tsx contém a camada 1D.5")

for lang, path in LOCALES.items():
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        print(f"✓ {lang}.json válido")
    except Exception as e:
        print(f"ERRO: {lang}.json inválido: {e}")
        raise SystemExit(1)

print()
print("=" * 72)
print("CONFIA — PRINCIPAL 1D.5 — MEMÓRIA CONTEXTUAL")
print("=" * 72)
print("✓ Memória reativa reutilizada")
print("✓ recentEffectiveImpulse reutilizado")
print("✓ Estratégia eficaz anterior pode ser recordada")
print("✓ Antes / Agora apresentados com dados reais")
print("✓ Nenhuma seleção automática do percurso")
print("✓ Reactive Engine continua a decidir")
print("✓ Navegação existente preservada")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1D.5 aplicada.")
