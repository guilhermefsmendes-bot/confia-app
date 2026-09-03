from pathlib import Path
import json
import shutil
import sys

component = Path("src/components/ImpulsoSOS.tsx")

locale_values = {
    "pt": {
        "routeLabel": "Percurso escolhido",
        "calmRoute": "Acalmar o corpo",
        "mindRoute": "Dar espaço à mente",
        "controlRoute": "Recuperar orientação",
        "supportRoute": "Sentir apoio",
        "supportStepTitle": "Fica aqui um momento.",
        "supportStepText": "Não precisas de resolver tudo agora. Reconhece apenas o que estás a sentir e permite-te não carregar este momento sozinho.",
        "supportPrompt": "Se houver alguém seguro para ti, podes considerar enviar uma mensagem simples. Não precisas de explicar tudo.",
        "supportExample": "Podes dizer: “Estou a ter um momento difícil. Podes ficar comigo um pouco?”",
        "supportContinue": "Quando estiveres pronto, vamos perceber como estás agora."
    },

    "en": {
        "routeLabel": "Chosen path",
        "calmRoute": "Calm the body",
        "mindRoute": "Give the mind some space",
        "controlRoute": "Regain orientation",
        "supportRoute": "Feel supported",
        "supportStepTitle": "Stay here for a moment.",
        "supportStepText": "You don't have to solve everything right now. Just acknowledge what you're feeling and allow yourself not to carry this moment alone.",
        "supportPrompt": "If there is someone you feel safe with, you could consider sending a simple message. You don't have to explain everything.",
        "supportExample": "You could say: “I'm having a difficult moment. Can you stay with me for a little while?”",
        "supportContinue": "When you're ready, let's notice how you feel now."
    },

    "es": {
        "routeLabel": "Recorrido elegido",
        "calmRoute": "Calmar el cuerpo",
        "mindRoute": "Dar espacio a la mente",
        "controlRoute": "Recuperar orientación",
        "supportRoute": "Sentir apoyo",
        "supportStepTitle": "Quédate aquí un momento.",
        "supportStepText": "No necesitas resolverlo todo ahora. Reconoce simplemente lo que estás sintiendo y permítete no cargar con este momento solo.",
        "supportPrompt": "Si hay alguien con quien te sientas seguro, puedes considerar enviarle un mensaje sencillo. No necesitas explicarlo todo.",
        "supportExample": "Puedes decir: “Estoy pasando por un momento difícil. ¿Puedes estar conmigo un rato?”",
        "supportContinue": "Cuando estés preparado, vamos a ver cómo estás ahora."
    },

    "fr": {
        "routeLabel": "Parcours choisi",
        "calmRoute": "Apaiser le corps",
        "mindRoute": "Donner de l'espace à l'esprit",
        "controlRoute": "Retrouver des repères",
        "supportRoute": "Me sentir soutenu",
        "supportStepTitle": "Reste ici un moment.",
        "supportStepText": "Tu n'as pas besoin de tout résoudre maintenant. Reconnais simplement ce que tu ressens et autorise-toi à ne pas porter ce moment seul.",
        "supportPrompt": "S'il y a une personne avec qui tu te sens en sécurité, tu peux envisager de lui envoyer un message simple. Tu n'as pas besoin de tout expliquer.",
        "supportExample": "Tu peux dire : « Je traverse un moment difficile. Tu peux rester un peu avec moi ? »",
        "supportContinue": "Quand tu seras prêt, regardons comment tu te sens maintenant."
    },
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not component.exists():
    fail("src/components/ImpulsoSOS.tsx não encontrado.")

text = component.read_text(encoding="utf-8")
original = text


# ==========================================================
# 1. PERCURSOS ADAPTATIVOS
# ==========================================================

old_progress_logic = """  // Atualizado para 7 passos no total
  const totalSteps = 8;
  const progress = Math.round((step / totalSteps) * 100);"""

new_progress_logic = """  // Percursos adaptativos do Impulso.
  // Os números correspondem aos passos existentes do componente.
  const impulseRoutes: Record<ImpulseNeed, number[]> = {
    calm: [1, 6, 8],
    mind: [1, 4, 5, 8],
    control: [1, 2, 3, 5, 8],
    support: [1, 3, 7, 8],
  };

  const activeRoute = impulseNeed
    ? impulseRoutes[impulseNeed]
    : [1, 8];

  const currentRouteIndex = activeRoute.indexOf(step);

  const progress =
    started && currentRouteIndex >= 0
      ? Math.round(
          ((currentRouteIndex + 1) / activeRoute.length) * 100
        )
      : 0;

  const routeLabelKey: Record<ImpulseNeed, string> = {
    calm: "impulseAdaptive.calmRoute",
    mind: "impulseAdaptive.mindRoute",
    control: "impulseAdaptive.controlRoute",
    support: "impulseAdaptive.supportRoute",
  };"""

if old_progress_logic not in text:
    fail("bloco totalSteps/progress não encontrado.")

text = text.replace(
    old_progress_logic,
    new_progress_logic,
    1
)


# ==========================================================
# 2. NAVEGAÇÃO ADAPTATIVA
# ==========================================================

old_navigation = """  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishSOS();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };"""

new_navigation = """  const nextStep = () => {
    const routeIndex = activeRoute.indexOf(step);

    if (routeIndex === -1) {
      setStep(activeRoute[0]);
      return;
    }

    const isLastRouteStep =
      routeIndex === activeRoute.length - 1;

    if (isLastRouteStep) {
      finishSOS();
      return;
    }

    setStep(activeRoute[routeIndex + 1]);
  };

  const prevStep = () => {
    const routeIndex = activeRoute.indexOf(step);

    if (routeIndex > 0) {
      setStep(activeRoute[routeIndex - 1]);
    }
  };"""

if old_navigation not in text:
    fail("bloco nextStep/prevStep não encontrado.")

text = text.replace(
    old_navigation,
    new_navigation,
    1
)


# ==========================================================
# 3. PASSO 4 — AVANÇO AUTOMÁTICO RESPEITA A ROTA
# ==========================================================

old_thought = """                setThought(t);
                setStep(5); // <-- Adicionado para avançar para o Passo 5!"""

new_thought = """                setThought(t);

                const routeIndex =
                  activeRoute.indexOf(4);

                if (
                  routeIndex >= 0 &&
                  routeIndex < activeRoute.length - 1
                ) {
                  setStep(
                    activeRoute[routeIndex + 1]
                  );
                }"""

if old_thought not in text:
    fail("avanço automático do passo 4 não encontrado.")

text = text.replace(
    old_thought,
    new_thought,
    1
)


# ==========================================================
# 4. APRESENTAÇÃO PREMIUM DO PROGRESSO
# Procura a linha independentemente da indentação.
# ==========================================================

progress_target = (
    '<p style={{ textAlign: "right", fontSize: "12px", '
    'color: "#666", margin: "5px 0 20px 0" }}>'
    '{t("progress")}: {progress}%</p>'
)

progress_line = next(
    (
        line
        for line in text.splitlines()
        if line.strip() == progress_target
    ),
    None,
)

if progress_line is None:
    fail("linha visual do progresso não encontrada.")

new_progress_ui = """      <div className="mb-5 mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
            {t("impulseAdaptive.routeLabel")}
          </p>

          <p className="mt-0.5 truncate text-[11px] font-bold text-[#4E3B36]">
            {impulseNeed
              ? t(routeLabelKey[impulseNeed])
              : t("impulse")}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#FFF8F4] px-2.5 py-1 text-[9px] font-black text-[#C97B5E]">
          {progress}%
        </span>
      </div>"""

text = text.replace(
    progress_line,
    new_progress_ui,
    1
)


# ==========================================================
# 5. PASSO 7 — APOIO GANHA INTERVENÇÃO PRÓPRIA
# ==========================================================

start_marker = """        {step === 7 && (
          <div style={{ textAlign: "center", lineHeight: "1.5" }}>"""

end_marker = """        {step === 8 && ("""

start = text.find(start_marker)

if start == -1:
    fail("início do passo 7 não encontrado.")

end = text.find(end_marker, start)

if end == -1:
    fail("fim do passo 7 não encontrado.")

old_step7 = text[start:end]

if 't("gratitudeExercise")' not in old_step7:
    fail("conteúdo esperado do passo 7 não encontrado.")

new_step7 = """        {step === 7 && (
          <>
            {impulseNeed === "support" ? (
              <div className="space-y-4 text-left">
                <div className="rounded-[26px] border border-[#E8DDD7]/70 bg-gradient-to-br from-[#FFF9F5] to-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                    {t("impulsePremium.supportTitle")}
                  </p>

                  <h3 className="mt-2 text-xl font-black leading-tight text-[#4E3B36]">
                    {t("impulseAdaptive.supportStepTitle")}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                    {t("impulseAdaptive.supportStepText")}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#E8DDD7]/60 bg-white p-4">
                  <p className="text-xs font-bold leading-relaxed text-[#4E3B36]">
                    {t("impulseAdaptive.supportPrompt")}
                  </p>

                  <div className="mt-3 rounded-[16px] bg-[#FFF8F4] px-4 py-3">
                    <p className="text-[11px] font-semibold italic leading-relaxed text-[#8B6B60]">
                      {t("impulseAdaptive.supportExample")}
                    </p>
                  </div>
                </div>

                <p className="px-1 text-center text-[11px] font-semibold leading-relaxed text-slate-400">
                  {t("impulseAdaptive.supportContinue")}
                </p>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "#2c3e50",
                    backgroundColor: "#eef2f7",
                    padding: "15px",
                    borderRadius: "6px",
                    textAlign: "left",
                    borderLeft: "4px solid #0d6efd",
                    marginBottom: "15px",
                  }}
                >
                  {getJustificationPhrase()}
                </div>

                <p style={{ fontSize: "15px" }}>
                  {t("gratitudeExercise")}
                </p>

                <div style={{ margin: "20px 0" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      color:
                        timeLeft < 30
                          ? "#dc3545"
                          : "#333",
                    }}
                  >
                    {formatTime(timeLeft)}
                  </div>

                  <button
                    onClick={() =>
                      setTimerRunning(!timerRunning)
                    }
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      background: timerRunning
                        ? "#ffc107"
                        : "#198754",
                      color: timerRunning
                        ? "#000"
                        : "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {timerRunning
                      ? t("pause")
                      : t("startTimer")}
                  </button>

                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(180);
                    }}
                    style={{
                      marginLeft: "10px",
                      padding: "8px 16px",
                      background: "#6c757d",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {t("reset")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

"""

text = (
    text[:start]
    + new_step7
    + text[end:]
)


# ==========================================================
# 6. BOTÃO VOLTAR — PRIMEIRO PASSO DA ROTA
# ==========================================================

old_disabled = """           disabled={step === 1}"""

if old_disabled not in text:
    # fallback independente da indentação
    disabled_line = next(
        (
            line
            for line in text.splitlines()
            if line.strip()
            == "disabled={step === 1}"
        ),
        None,
    )

    if disabled_line is None:
        fail("disabled do botão Voltar não encontrado.")

    text = text.replace(
        disabled_line,
        disabled_line.replace(
            "disabled={step === 1}",
            "disabled={currentRouteIndex <= 0}",
        ),
        1,
    )

else:
    text = text.replace(
        old_disabled,
        """           disabled={currentRouteIndex <= 0}""",
        1,
    )


# ==========================================================
# 7. BOTÃO SEGUINTE / TERMINAR
# ==========================================================

finish_target = (
    '{step === totalSteps ? '
    't("finish") : t("next")}'
)

finish_line = next(
    (
        line
        for line in text.splitlines()
        if line.strip() == finish_target
    ),
    None,
)

if finish_line is None:
    fail("label Next/Finish antigo não encontrado.")

finish_indent = (
    finish_line[:len(finish_line) - len(finish_line.lstrip())]
)

new_finish = (
    finish_indent
    + '{currentRouteIndex === activeRoute.length - 1\n'
    + finish_indent
    + '  ? t("finish")\n'
    + finish_indent
    + '  : t("next")}'
)

text = text.replace(
    finish_line,
    new_finish,
    1
)


# ==========================================================
# 8. TRADUÇÕES PT / EN / ES / FR
# ==========================================================

updated_locales = {}

for lang, values in locale_values.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        fail(f"{path} não encontrado.")

    try:
        data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(f"JSON inválido em {path}: {exc}")

    if "impulseAdaptive" in data:
        if data["impulseAdaptive"] != values:
            fail(
                "impulseAdaptive já existe com "
                f"conteúdo diferente em {lang}."
            )
    else:
        data["impulseAdaptive"] = values

    updated_locales[path] = data


# ==========================================================
# 9. VERIFICAÇÕES DE SEGURANÇA
# ==========================================================

required = [
    'calm: [1, 6, 8]',
    'mind: [1, 4, 5, 8]',
    'control: [1, 2, 3, 5, 8]',
    'support: [1, 3, 7, 8]',
    "const activeRoute",
    "const currentRouteIndex",
    "const nextStep = () =>",
    "const prevStep = () =>",
    'impulseNeed === "support"',
    't("impulseAdaptive.supportStepTitle")',
    't("impulseAdaptive.routeLabel")',
    "finishSOS();",
    "saveEpisode({",
    'source: "impulse"',
    "recordReactiveResponse({",
    "onAddXp(30)",
]

for fragment in required:
    if fragment not in text:
        fail(
            "verificação final falhou: "
            + fragment
        )

if "const totalSteps = 8" in text:
    fail("totalSteps antigo ainda existe.")

if "step === totalSteps" in text:
    fail(
        "referência antiga a totalSteps ainda existe."
    )

if text == original:
    fail("nenhuma alteração realizada.")


# ==========================================================
# 10. BACKUPS EM /tmp
# ==========================================================

shutil.copy2(
    component,
    "/tmp/ImpulsoSOS.tsx.before_adaptive_routes"
)

for path in updated_locales:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_impulse_adaptive"
    )


# ==========================================================
# 11. ESCREVER APENAS DEPOIS DE TODAS AS VERIFICAÇÕES
# ==========================================================

component.write_text(
    text,
    encoding="utf-8"
)

for path, data in updated_locales.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )


print("=" * 72)
print("CONFIA — IMPULSO PREMIUM 1C.3")
print("=" * 72)
print("✓ Percurso Acalmar: 1 → 6 → 8")
print("✓ Percurso Mente: 1 → 4 → 5 → 8")
print("✓ Percurso Controlo: 1 → 2 → 3 → 5 → 8")
print("✓ Percurso Apoio: 1 → 3 → 7 → 8")
print("✓ Progresso adaptado ao percurso real")
print("✓ Botão Voltar adaptado ao percurso")
print("✓ Botão Seguinte adaptado ao percurso")
print("✓ Conclusão continua a usar finishSOS")
print("✓ Intensidade inicial/final preservada")
print("✓ saveEpisode preservado")
print("✓ Reactive Engine preservado")
print("✓ XP preservado")
print("✓ Apoio ganhou intervenção própria")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — Impulso agora tem percursos adaptativos.")
