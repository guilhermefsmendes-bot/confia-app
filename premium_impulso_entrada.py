from pathlib import Path
import json
import shutil
import sys

component_path = Path("src/components/ImpulsoSOS.tsx")

locales = {
    "pt": {
        "eyebrow": "IMPULSO",
        "title": "Um momento para voltares a ti.",
        "subtitle": "Não precisas de saber exatamente o que fazer. Diz-nos apenas o que precisas agora.",
        "question": "O que precisas agora?",
        "calmTitle": "Acalmar",
        "calmDesc": "Reduzir a intensidade e criar algum espaço.",
        "mindTitle": "Organizar a mente",
        "mindDesc": "Abrandar pensamentos que estão a ocupar demasiado espaço.",
        "controlTitle": "Recuperar o controlo",
        "controlDesc": "Parar, orientar-me e escolher o próximo passo.",
        "supportTitle": "Sentir apoio",
        "supportDesc": "Não quero atravessar este momento sozinho.",
        "continue": "Continuar",
        "chooseFirst": "Escolhe o que mais se aproxima do que precisas agora.",
        "history": "O teu percurso",
        "historyUses": "{{count}} utilizações",
        "historyFirst": "Este espaço aprende contigo a cada utilização."
    },

    "en": {
        "eyebrow": "IMPULSE",
        "title": "A moment to come back to yourself.",
        "subtitle": "You don't need to know exactly what to do. Just tell us what you need right now.",
        "question": "What do you need right now?",
        "calmTitle": "Calm down",
        "calmDesc": "Lower the intensity and create some space.",
        "mindTitle": "Clear my mind",
        "mindDesc": "Slow down thoughts that are taking up too much space.",
        "controlTitle": "Regain control",
        "controlDesc": "Pause, orient myself and choose the next step.",
        "supportTitle": "Feel supported",
        "supportDesc": "I don't want to go through this moment alone.",
        "continue": "Continue",
        "chooseFirst": "Choose what feels closest to what you need right now.",
        "history": "Your journey",
        "historyUses": "{{count}} uses",
        "historyFirst": "This space learns with you each time you use it."
    },

    "es": {
        "eyebrow": "IMPULSO",
        "title": "Un momento para volver a ti.",
        "subtitle": "No necesitas saber exactamente qué hacer. Solo dinos qué necesitas ahora.",
        "question": "¿Qué necesitas ahora?",
        "calmTitle": "Calmarme",
        "calmDesc": "Reducir la intensidad y crear un poco de espacio.",
        "mindTitle": "Organizar la mente",
        "mindDesc": "Frenar los pensamientos que están ocupando demasiado espacio.",
        "controlTitle": "Recuperar el control",
        "controlDesc": "Parar, orientarme y elegir el siguiente paso.",
        "supportTitle": "Sentir apoyo",
        "supportDesc": "No quiero atravesar este momento solo.",
        "continue": "Continuar",
        "chooseFirst": "Elige lo que más se acerque a lo que necesitas ahora.",
        "history": "Tu recorrido",
        "historyUses": "{{count}} usos",
        "historyFirst": "Este espacio aprende contigo cada vez que lo utilizas."
    },

    "fr": {
        "eyebrow": "IMPULSION",
        "title": "Un moment pour revenir à toi.",
        "subtitle": "Tu n'as pas besoin de savoir exactement quoi faire. Dis-nous simplement ce dont tu as besoin maintenant.",
        "question": "De quoi as-tu besoin maintenant ?",
        "calmTitle": "Me calmer",
        "calmDesc": "Réduire l'intensité et créer un peu d'espace.",
        "mindTitle": "Organiser mon esprit",
        "mindDesc": "Ralentir les pensées qui prennent trop de place.",
        "controlTitle": "Reprendre le contrôle",
        "controlDesc": "M'arrêter, me recentrer et choisir la prochaine étape.",
        "supportTitle": "Me sentir soutenu",
        "supportDesc": "Je ne veux pas traverser ce moment seul.",
        "continue": "Continuer",
        "chooseFirst": "Choisis ce qui correspond le mieux à ce dont tu as besoin maintenant.",
        "history": "Ton parcours",
        "historyUses": "{{count}} utilisations",
        "historyFirst": "Cet espace apprend avec toi à chaque utilisation."
    },
}

if not component_path.exists():
    print("ERRO: src/components/ImpulsoSOS.tsx não encontrado.")
    sys.exit(1)

text = component_path.read_text(encoding="utf-8")
original = text


# ============================================================
# 1. Importar ícones Lucide
# ============================================================

anchor = '''import { useTranslation } from "react-i18next";'''

new_import = '''import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Brain,
  Compass,
  HeartHandshake,
  Sparkles,
  Wind,
} from "lucide-react";'''

if new_import not in text:
    if text.count(anchor) != 1:
        print("ERRO: import useTranslation não encontrado exatamente uma vez.")
        sys.exit(1)

    text = text.replace(anchor, new_import, 1)


# ============================================================
# 2. Tipo para a intenção atual
# ============================================================

type_anchor = '''interface ImpulsoSOSProps {
  onAddXp: (amount: number) => void;
}'''

type_replacement = '''interface ImpulsoSOSProps {
  onAddXp: (amount: number) => void;
}

type ImpulseNeed =
  | "calm"
  | "mind"
  | "control"
  | "support";'''

if "type ImpulseNeed =" not in text:
    if text.count(type_anchor) != 1:
        print("ERRO: interface ImpulsoSOSProps não encontrada.")
        sys.exit(1)

    text = text.replace(type_anchor, type_replacement, 1)


# ============================================================
# 3. Estado local
# ============================================================

state_anchor = '''const [thought, setThought] = useState<Thought | null>(null);'''

state_replacement = '''const [thought, setThought] = useState<Thought | null>(null);
const [impulseNeed, setImpulseNeed] = useState<ImpulseNeed | null>(null);'''

if "const [impulseNeed, setImpulseNeed]" not in text:
    if text.count(state_anchor) != 1:
        print("ERRO: estado thought não encontrado.")
        sys.exit(1)

    text = text.replace(state_anchor, state_replacement, 1)


# ============================================================
# 4. Substituir APENAS o ecrã inicial
# ============================================================

start_marker = '''  // 2. Ecrã Inicial (Passo 0)
  if (!started) {'''

end_marker = '''  // 3. Layout Principal do Exercício'''

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: não foi possível localizar o ecrã inicial atual.")
    sys.exit(1)

old_initial = text[start:end]

required_old = [
    't("sosMoment")',
    't("sosDescription")',
    't("startExercise")',
    '"confia_last_impulse_use_v1"',
    '"confia_impulse_count_v1"',
    "setStarted(true)",
    "setStep(1)",
]

for fragment in required_old:
    if fragment not in old_initial:
        print(f"ERRO: bloco inicial inesperado. Falta: {fragment}")
        sys.exit(1)


new_initial = '''  // 2. Entrada premium do Impulso
  if (!started) {
    const needs: Array<{
      id: ImpulseNeed;
      icon: React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
      }>;
      title: string;
      description: string;
    }> = [
      {
        id: "calm",
        icon: Wind,
        title: t("impulsePremium.calmTitle"),
        description: t("impulsePremium.calmDesc"),
      },
      {
        id: "mind",
        icon: Brain,
        title: t("impulsePremium.mindTitle"),
        description: t("impulsePremium.mindDesc"),
      },
      {
        id: "control",
        icon: Compass,
        title: t("impulsePremium.controlTitle"),
        description: t("impulsePremium.controlDesc"),
      },
      {
        id: "support",
        icon: HeartHandshake,
        title: t("impulsePremium.supportTitle"),
        description: t("impulsePremium.supportDesc"),
      },
    ];

    const beginImpulse = () => {
      if (!impulseNeed) return;

      localStorage.setItem(
        "confia_last_impulse_use_v1",
        new Date().toISOString()
      );

      const count = Number(
        localStorage.getItem("confia_impulse_count_v1") || "0"
      );

      localStorage.setItem(
        "confia_impulse_count_v1",
        String(count + 1)
      );

      setStarted(true);
      setStep(1);
    };

    return (
      <section className="relative overflow-hidden rounded-[34px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-white shadow-[0_18px_50px_rgba(92,64,52,0.08)]">
        {/* Atmosfera */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#F4D9CA]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-52 h-40 w-40 rounded-full bg-[#F7EBDD]/45 blur-3xl"
        />

        <div className="relative px-5 pb-5 pt-6">
          {/* Identidade */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5A88B]/20 bg-white/80">
              <Sparkles
                size={15}
                strokeWidth={1.8}
                className="text-[#C97B5E]"
              />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C97B5E]">
              {t("impulsePremium.eyebrow")}
            </p>
          </div>

          <div className="mt-5 max-w-[330px]">
            <h1 className="text-[25px] font-black leading-[1.08] tracking-[-0.03em] text-[#4E3B36] font-display">
              {t("impulsePremium.title")}
            </h1>

            <p className="mt-3 text-[12px] font-semibold leading-relaxed text-slate-400">
              {t("impulsePremium.subtitle")}
            </p>
          </div>

          {/* Separador visual */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#E8DDD7] to-transparent" />

          {/* Escolha da necessidade */}
          <div>
            <p className="text-sm font-black text-[#4E3B36]">
              {t("impulsePremium.question")}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {needs.map((need) => {
                const NeedIcon = need.icon;
                const selected = impulseNeed === need.id;

                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setImpulseNeed(need.id)}
                    aria-pressed={selected}
                    className={`min-h-[132px] rounded-[22px] border p-3.5 text-left transition-all duration-200 ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_8px_22px_rgba(201,123,94,0.10)]"
                        : "border-[#E8DDD7]/65 bg-white/75 active:bg-[#FFF9F5]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-white text-[#C97B5E]"
                          : "bg-[#FFF8F4] text-[#A87968]"
                      }`}
                    >
                      <NeedIcon
                        size={17}
                        strokeWidth={1.8}
                      />
                    </div>

                    <p className="mt-3 text-[12px] font-black leading-tight text-[#4E3B36]">
                      {need.title}
                    </p>

                    <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                      {need.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={!impulseNeed}
            onClick={beginImpulse}
            className={`mt-5 flex w-full items-center justify-between rounded-[20px] px-4 py-4 transition-all duration-200 ${
              impulseNeed
                ? "bg-[#C97B5E] text-white shadow-[0_10px_24px_rgba(201,123,94,0.18)] active:scale-[0.99]"
                : "cursor-not-allowed bg-[#EEE7E2] text-[#B7AAA4]"
            }`}
          >
            <span className="text-xs font-black">
              {impulseNeed
                ? t("impulsePremium.continue")
                : t("impulsePremium.chooseFirst")}
            </span>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ArrowRight
                size={16}
                strokeWidth={2}
              />
            </span>
          </button>

          {/* Histórico discreto */}
          <div className="mt-5 flex items-center justify-between border-t border-[#E8DDD7]/55 pt-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#A87968]">
                {t("impulsePremium.history")}
              </p>

              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                {impulseCount > 0
                  ? t("impulsePremium.historyUses", {
                      count: impulseCount,
                    })
                  : t("impulsePremium.historyFirst")}
              </p>
            </div>

            {lastUse && daysWithoutUse !== null && (
              <span className="shrink-0 rounded-full border border-[#E8DDD7]/60 bg-white/75 px-2.5 py-1 text-[9px] font-bold text-slate-400">
                {t("impulseLastUsed", {
                  days: daysWithoutUse,
                })}
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

'''

text = text[:start] + new_initial + text[end:]


# ============================================================
# 5. Traduções PT / EN / ES / FR
# ============================================================

locale_data = {}

for lang, values in locales.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        print(f"ERRO: {path} não encontrado.")
        sys.exit(1)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO ao ler {path}: {exc}")
        sys.exit(1)

    if "impulsePremium" in data:
        if data["impulsePremium"] != values:
            print(
                f"ERRO: impulsePremium já existe com conteúdo diferente em {lang}."
            )
            sys.exit(1)
    else:
        data["impulsePremium"] = values

    locale_data[path] = data


# ============================================================
# 6. Verificações de segurança
# ============================================================

required_new = [
    "type ImpulseNeed =",
    "const [impulseNeed, setImpulseNeed]",
    "const beginImpulse = () =>",
    'id: "calm"',
    'id: "mind"',
    'id: "control"',
    'id: "support"',
    't("impulsePremium.question")',
    't("impulsePremium.continue")',
    't("impulsePremium.history")',
    'setStarted(true)',
    'setStep(1)',
]

for fragment in required_new:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)


# Garantir que a lógica crítica do Impulso continua presente.
critical_existing = [
    "const finishSOS = () =>",
    "saveEpisode({",
    'source: "impulse"',
    "initialIntensity: intensity",
    "finalIntensity",
    "recordReactiveResponse({",
    "onAddXp(30)",
    "const totalSteps = 8",
    "{step === 1 && (",
    "{step === 8 && (",
]

for fragment in critical_existing:
    if fragment not in text:
        print(f"ERRO: lógica crítica desapareceu: {fragment}")
        sys.exit(1)


# Não pode ficar o antigo botão azul no ecrã inicial.
if 'background: "#0d6efd"' in old_initial and old_initial in text:
    print("ERRO: ecrã inicial antigo ainda está presente.")
    sys.exit(1)


if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)


# ============================================================
# 7. Backups fora do projeto
# ============================================================

shutil.copy2(
    component_path,
    "/tmp/ImpulsoSOS.tsx.before_premium_entry"
)

for path in locale_data:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_premium_impulse_entry"
    )


# ============================================================
# 8. Escrita
# ============================================================

component_path.write_text(text, encoding="utf-8")

for path, data in locale_data.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )


print("=" * 72)
print("CONFIA — IMPULSO PREMIUM 1C.2")
print("=" * 72)
print("✓ Nova entrada premium criada")
print("✓ Acalmar disponível")
print("✓ Organizar a mente disponível")
print("✓ Recuperar o controlo disponível")
print("✓ Sentir apoio disponível")
print("✓ Escolha guardada apenas em estado React")
print("✓ Fluxo original de 8 passos preservado")
print("✓ Intensidade inicial/final preservada")
print("✓ saveEpisode preservado")
print("✓ Reactive Engine preservado")
print("✓ XP preservado")
print("✓ Histórico de utilização preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — entrada premium do Impulso criada.")
