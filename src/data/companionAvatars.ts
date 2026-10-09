export type CompanionAvatarId =
  | "confia" | "dragon" | "samurai" | "astronaut" | "scientist" | "footballer"
  | "knight" | "wizard" | "ninja" | "explorer" | "robot" | "phoenix"
  | "mermaid" | "pirate" | "archer" | "forestGuardian" | "artist" | "musician"
  | "physicist" | "inventor" | "mountaineer" | "diver" | "pilot" | "detective"
  | "alchemist" | "lightGuardian" | "snowAdventurer" | "racer" | "martialArtist" | "timeTraveler";

export interface CompanionAvatarDefinition {
  id: CompanionAvatarId;
  name: string;
  description: string;
  unlockXp: number;
  accent: string;
}

export const companionAvatars: CompanionAvatarDefinition[] = [
  { id: "confia", name: "CONFIA", description: "A tua companheira original", unlockXp: 0, accent: "#D68A70" },
  { id: "dragon", name: "Dragão", description: "Coragem para enfrentar novos desafios", unlockXp: 100, accent: "#5FBA9A" },
  { id: "samurai", name: "Samurai", description: "Disciplina, equilíbrio e serenidade", unlockXp: 200, accent: "#C85F54" },
  { id: "astronaut", name: "Astronauta", description: "Explora novos horizontes", unlockXp: 300, accent: "#719DE0" },
  { id: "scientist", name: "Cientista", description: "Curiosidade para compreender a mente", unlockXp: 400, accent: "#8D82C7" },
  { id: "footballer", name: "Futebolista", description: "Treina, persiste e joga em equipa", unlockXp: 500, accent: "#D5A84E" },
  { id: "knight", name: "Cavaleiro", description: "Protege aquilo que é importante", unlockXp: 650, accent: "#71849B" },
  { id: "wizard", name: "Feiticeiro", description: "Transforma curiosidade em descoberta", unlockXp: 800, accent: "#9270C6" },
  { id: "ninja", name: "Ninja", description: "Agilidade, foco e autocontrolo", unlockXp: 950, accent: "#51566F" },
  { id: "explorer", name: "Explorador", description: "Cada passo abre um caminho", unlockXp: 1100, accent: "#C79A5A" },
  { id: "robot", name: "Robô", description: "Pequenos passos, grandes sistemas", unlockXp: 1250, accent: "#7D9CAA" },
  { id: "phoenix", name: "Fénix", description: "Recomeçar também é força", unlockXp: 1400, accent: "#E77E4E" },
  { id: "mermaid", name: "Sereia", description: "Encontra o teu ritmo nas marés", unlockXp: 1550, accent: "#57B8B3" },
  { id: "pirate", name: "Pirata", description: "Segue a tua própria bússola", unlockXp: 1700, accent: "#B77A52" },
  { id: "archer", name: "Arqueiro", description: "Respira, aponta e avança", unlockXp: 1850, accent: "#79A36D" },
  { id: "forestGuardian", name: "Guardião da Floresta", description: "Cresce ao cuidar do que te rodeia", unlockXp: 2000, accent: "#5D9971" },
  { id: "artist", name: "Artista", description: "Dá cor à tua forma de ver o mundo", unlockXp: 2150, accent: "#D58CA8" },
  { id: "musician", name: "Músico", description: "Encontra harmonia no teu percurso", unlockXp: 2300, accent: "#8D7CC5" },
  { id: "physicist", name: "Físico", description: "Questiona, observa e descobre", unlockXp: 2450, accent: "#4E9AB7" },
  { id: "inventor", name: "Inventor", description: "As ideias ganham forma com prática", unlockXp: 2600, accent: "#D0A34E" },
  { id: "mountaineer", name: "Alpinista", description: "Um passo de cada vez até ao topo", unlockXp: 2750, accent: "#7195A9" },
  { id: "diver", name: "Mergulhador", description: "Explora a calma das profundezas", unlockXp: 2900, accent: "#428BB6" },
  { id: "pilot", name: "Piloto", description: "Mantém o rumo mesmo com vento", unlockXp: 3050, accent: "#7797B7" },
  { id: "detective", name: "Detetive", description: "Repara nos detalhes sem tirar conclusões apressadas", unlockXp: 3200, accent: "#8B7868" },
  { id: "alchemist", name: "Alquimista", description: "Converte experiência em aprendizagem", unlockXp: 3350, accent: "#C4A04C" },
  { id: "lightGuardian", name: "Guardião da Luz", description: "Leva esperança aos dias difíceis", unlockXp: 3500, accent: "#E2BE69" },
  { id: "snowAdventurer", name: "Aventureiro da Neve", description: "Avança com calma em qualquer estação", unlockXp: 3650, accent: "#91BFD8" },
  { id: "racer", name: "Piloto de Corrida", description: "Energia com direção e equilíbrio", unlockXp: 3800, accent: "#D65D58" },
  { id: "martialArtist", name: "Artista Marcial", description: "Força com respeito e serenidade", unlockXp: 3950, accent: "#C59A65" },
  { id: "timeTraveler", name: "Viajante do Tempo", description: "O futuro constrói-se no presente", unlockXp: 4100, accent: "#7C8ED4" },
];

const SELECTED_KEY = "confia_selected_companion_v1";

export function getCompanionXp(): number {
  try {
    const raw = localStorage.getItem("confia_avatar_v2");
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const currentXp = typeof data?.xp === "number" ? Math.max(0, data.xp) : 0;
    const level = typeof data?.level === "number" ? Math.max(1, Math.floor(data.level)) : 1;
    // O XP do companheiro reinicia a cada nível. Convertemo-lo para XP acumulado
    // para que os desbloqueios não desapareçam quando sobe de nível.
    let totalXp = currentXp;
    let levelRequirement = 100;
    for (let currentLevel = 1; currentLevel < level && currentLevel < 100; currentLevel += 1) {
      totalXp += levelRequirement;
      levelRequirement = Math.round(levelRequirement * 1.3);
    }
    return totalXp;
  } catch {
    return 0;
  }
}

export function getSelectedCompanion(): CompanionAvatarId {
  try {
    const id = localStorage.getItem(SELECTED_KEY) as CompanionAvatarId | null;
    return id && companionAvatars.some((avatar) => avatar.id === id) ? id : "confia";
  } catch {
    return "confia";
  }
}

export function selectCompanionAvatar(id: CompanionAvatarId): void {
  const definition = companionAvatars.find((avatar) => avatar.id === id);
  if (!definition || !isCompanionUnlocked(id)) return;
  try {
    localStorage.setItem(SELECTED_KEY, id);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("confia:companion-avatar-changed"));
  } catch { /* A escolha visual não deve interromper a app se o storage estiver indisponível. */ }
}

const UNLOCKED_KEY = "confia_unlocked_companions_v1";

/** Keeps earned characters unlocked even if XP is later recalculated. */
export function getUnlockedCompanionIds(): CompanionAvatarId[] {
  let saved: CompanionAvatarId[] = ["confia"];
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        saved = [...new Set([...saved, ...parsed.filter((id): id is CompanionAvatarId =>
          typeof id === "string" && companionAvatars.some((avatar) => avatar.id === id)
        )])];
      }
    }
    const xp = getCompanionXp();
    for (const avatar of companionAvatars) {
      if (xp >= avatar.unlockXp && !saved.includes(avatar.id)) saved.push(avatar.id);
    }
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(saved));
  } catch { /* Storage indisponível: o progresso atual continua a desbloquear personagens. */ }
  return saved;
}

export function isCompanionUnlocked(id: CompanionAvatarId): boolean {
  const definition = companionAvatars.find((avatar) => avatar.id === id);
  return Boolean(definition && (getUnlockedCompanionIds().includes(id) || getCompanionXp() >= definition.unlockXp));
}
