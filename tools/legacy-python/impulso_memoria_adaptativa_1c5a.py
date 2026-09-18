from pathlib import Path
import shutil
import sys


FILES = {
    "types": Path("src/components/Impulso/types.ts"),
    "sos": Path("src/components/ImpulsoSOS.tsx"),
    "companion": Path("src/data/companionData.ts"),
    "memory": Path("src/data/reactive/reactiveRecentMemory.ts"),
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


for name, path in FILES.items():
    if not path.exists():
        fail(f"ficheiro não encontrado: {path}")


contents = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}


# ============================================================
# 1. ImpulseEpisode
# ============================================================

types_text = contents["types"]

old = """export interface ImpulseEpisode {
  createdAt: string;

  initialIntensity: Intensity;"""

new = """export type ImpulseNeed =
  | "calm"
  | "mind"
  | "control"
  | "support";

export interface ImpulseEpisode {
  createdAt: string;

  /**
   * Necessidade escolhida pelo utilizador
   * no início do Impulso.
   *
   * Opcional para manter compatibilidade
   * com episódios guardados antes da 1C.5.
   */
  need?: ImpulseNeed;

  initialIntensity: Intensity;"""

if old not in types_text:
    fail("estrutura de ImpulseEpisode não encontrada.")

types_text = types_text.replace(old, new, 1)


# ============================================================
# 2. ImpulsoSOS — guardar impulseNeed no episódio
# ============================================================

sos_text = contents["sos"]

old = """    saveEpisode({
      createdAt: new Date().toISOString(),
      initialIntensity: intensity,
      finalIntensity,
      completed: true,
      xpEarned: 30,
    });"""

new = """    saveEpisode({
      createdAt: new Date().toISOString(),
      need: impulseNeed ?? undefined,
      initialIntensity: intensity,
      finalIntensity,
      completed: true,
      xpEarned: 30,
    });"""

if old not in sos_text:
    fail("saveEpisode atual não encontrado em ImpulsoSOS.tsx.")

sos_text = sos_text.replace(old, new, 1)


# ============================================================
# 3. CompanionImpulseRecord
# ============================================================

companion_text = contents["companion"]

old = """export interface CompanionImpulseRecord {
  date: string;
  intensity?: number;
  finalIntensity?: number;
  emotion?: string;
  trigger?: string;
  automaticThought?: string;
}"""

new = """export interface CompanionImpulseRecord {
  date: string;

  /**
   * Percurso escolhido no Impulso.
   *
   * Opcional porque episódios antigos
   * não possuem esta informação.
   */
  need?:
    | "calm"
    | "mind"
    | "control"
    | "support";

  intensity?: number;
  finalIntensity?: number;
  emotion?: string;
  trigger?: string;
  automaticThought?: string;
}"""

if old not in companion_text:
    fail("CompanionImpulseRecord não encontrado.")

companion_text = companion_text.replace(old, new, 1)


old = """    return episodes.map((episode) => ({
      date: episode.createdAt,
      intensity: episode.initialIntensity,
      finalIntensity: episode.finalIntensity,
      emotion: episode.emotion,
      trigger: episode.trigger,
      automaticThought: episode.thought,
    }));"""

new = """    return episodes.map((episode) => ({
      date: episode.createdAt,
      need: episode.need,
      intensity: episode.initialIntensity,
      finalIntensity: episode.finalIntensity,
      emotion: episode.emotion,
      trigger: episode.trigger,
      automaticThought: episode.thought,
    }));"""

if old not in companion_text:
    fail("mapeamento de readImpulseHistory não encontrado.")

companion_text = companion_text.replace(old, new, 1)


# ============================================================
# 4. ReactiveMemoryImpulse
# ============================================================

memory_text = contents["memory"]

old = """export interface ReactiveMemoryImpulse {
  date: string;

  initialIntensity: number;
  finalIntensity: number;"""

new = """export interface ReactiveMemoryImpulse {
  date: string;

  /**
   * Necessidade/percurso utilizado.
   *
   * Só existe em episódios registados
   * após a introdução da memória adaptativa.
   */
  need?:
    | "calm"
    | "mind"
    | "control"
    | "support";

  initialIntensity: number;
  finalIntensity: number;"""

if old not in memory_text:
    fail("ReactiveMemoryImpulse não encontrado.")

memory_text = memory_text.replace(old, new, 1)


old = """  return {
    date: episode.date,

    initialIntensity:
      episode.intensity,"""

new = """  return {
    date: episode.date,

    need:
      episode.need,

    initialIntensity:
      episode.intensity,"""

if old not in memory_text:
    fail("normalizeImpulse não encontrado.")

memory_text = memory_text.replace(old, new, 1)


# ============================================================
# 5. VERIFICAÇÕES
# ============================================================

checks = [
    (
        types_text,
        'need?: ImpulseNeed;',
        "ImpulseEpisode.need",
    ),
    (
        sos_text,
        'need: impulseNeed ?? undefined,',
        "saveEpisode.need",
    ),
    (
        companion_text,
        'need: episode.need,',
        "CompanionImpulseRecord mapping",
    ),
    (
        memory_text,
        "need:\n      episode.need,",
        "ReactiveMemoryImpulse mapping",
    ),
    (
        memory_text,
        "recentEffectiveImpulse",
        "recentEffectiveImpulse preservado",
    ),
    (
        memory_text,
        "effectiveImpulseCount",
        "effectiveImpulseCount preservado",
    ),
]

for text, fragment, label in checks:
    if fragment not in text:
        fail(f"verificação falhou: {label}")


# Não devemos introduzir qualquer nova chave de localStorage.
new_combined = "\n".join([
    types_text,
    sos_text,
    companion_text,
    memory_text,
])

old_combined = "\n".join(contents.values())

if new_combined.count("localStorage.setItem(") != old_combined.count(
    "localStorage.setItem("
):
    fail("foi detetada alteração inesperada em localStorage.setItem.")

if new_combined.count("localStorage.getItem(") != old_combined.count(
    "localStorage.getItem("
):
    fail("foi detetada alteração inesperada em localStorage.getItem.")


# ============================================================
# 6. BACKUPS EM /tmp
# ============================================================

for name, path in FILES.items():
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_1c5a"
    )


# ============================================================
# 7. ESCREVER
# ============================================================

FILES["types"].write_text(
    types_text,
    encoding="utf-8",
)

FILES["sos"].write_text(
    sos_text,
    encoding="utf-8",
)

FILES["companion"].write_text(
    companion_text,
    encoding="utf-8",
)

FILES["memory"].write_text(
    memory_text,
    encoding="utf-8",
)


print("=" * 72)
print("CONFIA — IMPULSO 1C.5A — MEMÓRIA ADAPTATIVA")
print("=" * 72)
print("✓ ImpulseEpisode passa a guardar a necessidade escolhida")
print("✓ calm / mind / control / support suportados")
print("✓ finishSOS grava impulseNeed no episódio existente")
print("✓ CompanionImpulseRecord transporta a necessidade")
print("✓ ReactiveMemoryImpulse transporta a necessidade")
print("✓ recentEffectiveImpulse passa a poder identificar o percurso")
print("✓ Episódios antigos continuam compatíveis")
print("✓ Nenhum histórico apagado")
print("✓ Nenhuma chave de localStorage criada")
print("✓ Nenhuma dependência nova")
print("✓ Nenhum texto visível novo")
print("✓ Traduções não necessitam de alteração nesta fase")
print()
print("OK — 1C.5A concluída.")
