import { Objective, SharePost, TriageStep } from '../types';

const OBJECTIVES_LIBRARY: Objective[] = [
  { id: 'breathe3', text: 'dailyObjectives.breathe3', category: 'mental', xpReward: 10, completed: false },
  { id: 'hugExercise', text: 'dailyObjectives.hugExercise', category: 'mental', xpReward: 15, completed: false },
  { id: 'relaxShoulders', text: 'dailyObjectives.relaxShoulders', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'pausePhone', text: 'dailyObjectives.pausePhone', category: 'mental', xpReward: 10, completed: false },
  { id: 'slowBreathing', text: 'dailyObjectives.slowBreathing', category: 'mental', xpReward: 10, completed: false },
  { id: 'sosTechnique', text: 'dailyObjectives.sosTechnique', category: 'mental', xpReward: 20, completed: false },
  { id: 'questionThought', text: 'dailyObjectives.questionThought', category: 'mental', xpReward: 15, completed: false },
  { id: 'writeWorry', text: 'dailyObjectives.writeWorry', category: 'mental', xpReward: 10, completed: false },
  { id: 'positiveReplace', text: 'dailyObjectives.positiveReplace', category: 'mental', xpReward: 15, completed: false },
  { id: 'goodMoment', text: 'dailyObjectives.goodMoment', category: 'mental', xpReward: 10, completed: false },

  { id: 'focusTask', text: 'dailyObjectives.focusTask', category: 'mental', xpReward: 15, completed: false },
  { id: 'avoidSearch', text: 'dailyObjectives.avoidSearch', category: 'mental', xpReward: 15, completed: false },
  { id: 'drinkWater', text: 'dailyObjectives.drinkWater', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'stretch', text: 'dailyObjectives.stretch', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'walk', text: 'dailyObjectives.walk', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'sunlight', text: 'dailyObjectives.sunlight', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'mindfulMeal', text: 'dailyObjectives.mindfulMeal', category: 'nutricao', xpReward: 10, completed: false },
  { id: 'relaxFace', text: 'dailyObjectives.relaxFace', category: 'corporeo', xpReward: 10, completed: false },

  { id: 'petCompanionGoal', text: 'dailyObjectives.petCompanionGoal', category: 'social', xpReward: 10, completed: false },
  { id: 'messageSomeone', text: 'dailyObjectives.messageSomeone', category: 'social', xpReward: 15, completed: false },
  { id: 'compliment', text: 'dailyObjectives.compliment', category: 'social', xpReward: 10, completed: false },
  { id: 'familyMoment', text: 'dailyObjectives.familyMoment', category: 'social', xpReward: 15, completed: false },

  { id: 'gratitude', text: 'dailyObjectives.gratitude', category: 'mental', xpReward: 10, completed: false },
  { id: 'askHelp', text: 'dailyObjectives.askHelp', category: 'social', xpReward: 20, completed: false },
  { id: 'avoidSomething', text: 'dailyObjectives.avoidSomething', category: 'mental', xpReward: 20, completed: false },
  { id: 'organize', text: 'dailyObjectives.organize', category: 'vida', xpReward: 10, completed: false },
  { id: 'learn', text: 'dailyObjectives.learn', category: 'vida', xpReward: 15, completed: false },
  { id: 'healthyChoice', text: 'dailyObjectives.healthyChoice', category: 'vida', xpReward: 10, completed: false },
  { id: 'smallVictory', text: 'dailyObjectives.smallVictory', category: 'mental', xpReward: 10, completed: false },
  { id: 'dailyFeeling', text: 'dailyObjectives.dailyFeeling', category: 'mental', xpReward: 15, completed: false }
];
const daySeed = Math.floor(Date.now() / 86400000);

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const dailyObjectives = [...OBJECTIVES_LIBRARY];

dailyObjectives.sort((a, b) => {
  const ra = seededRandom(
    daySeed + a.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0)
  );

  const rb = seededRandom(
    daySeed + b.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0)
  );

  return ra - rb;
});
export const INITIAL_OBJECTIVES: Objective[] = dailyObjectives.slice(0, 5);

export const SOOTHING_PHRASES: string[] = [
  "hugPhrase1",
  "hugPhrase2",
  "hugPhrase3",
  "hugPhrase4",
  "hugPhrase5",
  "hugPhrase8",
  "hugPhrase9"
];

export const INITIAL_POSTS: SharePost[] = [
  {
    id: 'post-1',
    userName: 'Sofia M.',
    feeling: 'Aliviada',
    message: 'Hoje consegui ir ao supermercado sozinha! A ansiedade bateu à porta logo na entrada, mas fiz três respirações profundas e segui em frente. Um pequeno passo, mas uma grande vitória para mim! 😊🌿',
    timestamp: 'Há 2 horas',
    likes: 14,
    likedByUser: false
  },
  {
    id: 'post-2',
    userName: 'Pedro Silva',
    feeling: 'Ansioso',
    message: 'Dia difícil no trabalho, sinto o peito um pouco apertado. Vim aqui para o separador "Abraço" respirar um bocadinho e já me sinto um pouco mais ancorado. Força para todos nós.',
    timestamp: 'Há 4 horas',
    likes: 22,
    likedByUser: false
  },
  {
    id: 'post-3',
    userName: 'Ana Rita',
    feeling: 'Grata',
    message: 'Agradecer pelas pequenas coisas: o cheiro a café logo pela manhã, o sol a bater na janela e este cantinho seguro chamado Confia. O meu avatar acabou de evoluir para o estágio de Bebé Calmo! 🥰 Stage: Egg -> Baby!',
    timestamp: 'Há 6 horas',
    likes: 19,
    likedByUser: false
  },
  {
    id: 'post-4',
    userName: 'Lucas_98',
    feeling: 'Focado',
    message: 'Lembrete do dia: Tu não és os teus pensamentos de catástrofe. Eles são apenas hipóteses que a tua mente ansiosa cria. Tu és a consciência por trás deles. Fiquem bem! 💫',
    timestamp: 'Há 1 dia',
    likes: 31,
    likedByUser: false
  }
];

export const TRIAGE_FLOW: TriageStep[] = [
  {
    id: 1,
    title: 'Como te sentes no teu corpo?',
    description: 'A ansiedade manifesta-se muito fisicamente. Identificar o que sentes ajuda a desmistificar a crise e a indicar ao teu cérebro que podes lidar com ela.',
    options: [
      'Coração muito acelerado ou palpitações',
      'Falta de ar ou aperto forte no peito',
      'Tremores, calafrios ou suores frios',
      'Músculos muito tensos (mandíbula, pescoço)',
      'Pensamentos em turbilhão e medo de perder o controlo'
    ],
    type: 'question'
  },
  {
    id: 2,
    title: 'Desacelerar o Coração (Respiração 4-2-4)',
    description: 'Quando o coração acelera, respiramos rápido demais, o que aumenta a ansiedade. Vamos forçar um ritmo lento. Acompanha o círculo abaixo para equilibrar o teu sistema nervoso.',
    type: 'breathing'
  },
  {
    id: 3,
    title: 'Ancoragem Sensorial (Método 5-4-3-2-1)',
    description: 'A ansiedade puxa a tua mente para cenários futuros assustadores. Vamos trazer-te de volta ao presente usando os teus cinco sentidos. Responde mentalmente ou em voz alta:',
    type: 'grounding'
  },
  {
    id: 4,
    title: 'Afirmação de Segurança',
    description: 'Lembra-te: o que estás a sentir é um pico de adrenalina. É desconfortável, mas NÃO é perigoso. Vai passar por si só em poucos minutos. Diz para ti mesmo:',
    type: 'instruction'
  }
];
