import { Objective, SharePost, TriageStep } from '../types';

const OBJECTIVES_LIBRARY: Objective[] = [
  { id: 'breathe3', text: 'dailyObjectives.breathe3', category: 'mental', xpReward: 10, completed: false },
  { id: 'hugExercise', text: 'dailyObjectives.hugExercise', category: 'mental', xpReward: 15, completed: false },
  { id: 'pausePhone', text: 'dailyObjectives.pausePhone', category: 'mental', xpReward: 10, completed: false },
  { id: 'slowBreathing', text: 'dailyObjectives.slowBreathing', category: 'mental', xpReward: 10, completed: false },
  { id: 'sosTechnique', text: 'dailyObjectives.sosTechnique', category: 'mental', xpReward: 20, completed: false },
  { id: 'questionThought', text: 'dailyObjectives.questionThought', category: 'mental', xpReward: 15, completed: false },
  { id: 'writeWorry', text: 'dailyObjectives.writeWorry', category: 'mental', xpReward: 10, completed: false },
  { id: 'positiveReplace', text: 'dailyObjectives.positiveReplace', category: 'mental', xpReward: 15, completed: false },
  { id: 'goodMoment', text: 'dailyObjectives.goodMoment', category: 'mental', xpReward: 10, completed: false },
  { id: 'gratitude', text: 'dailyObjectives.gratitude', category: 'mental', xpReward: 10, completed: false },
  { id: 'smallVictory', text: 'dailyObjectives.smallVictory', category: 'mental', xpReward: 10, completed: false },
  { id: 'slowBreathing2', text: 'dailyObjectives.slowBreathing2', category: 'mental', xpReward: 10, completed: false },
  { id: 'deepBreaths', text: 'dailyObjectives.deepBreaths', category: 'mental', xpReward: 10, completed: false },
  { id: 'eyesClosedBreathing', text: 'dailyObjectives.eyesClosedBreathing', category: 'mental', xpReward: 10, completed: false },
  { id: 'fiveThings', text: 'dailyObjectives.fiveThings', category: 'mental', xpReward: 15, completed: false },
  { id: 'touchTexture', text: 'dailyObjectives.touchTexture', category: 'mental', xpReward: 10, completed: false },
  { id: 'listenSounds', text: 'dailyObjectives.listenSounds', category: 'mental', xpReward: 10, completed: false },
  { id: 'writeFeeling', text: 'dailyObjectives.writeFeeling', category: 'mental', xpReward: 10, completed: false },
  { id: 'questionEvidence', text: 'dailyObjectives.questionEvidence', category: 'mental', xpReward: 15, completed: false },
  { id: 'alternativeExplanation', text: 'dailyObjectives.alternativeExplanation', category: 'mental', xpReward: 15, completed: false },
  { id: 'rememberStrength', text: 'dailyObjectives.rememberStrength', category: 'mental', xpReward: 15, completed: false },
  { id: 'pauseStress', text: 'dailyObjectives.pauseStress', category: 'mental', xpReward: 10, completed: false },
  { id: 'endWithGratitude', text: 'dailyObjectives.endWithGratitude', category: 'mental', xpReward: 10, completed: false },
  { id: 'relaxShoulders', text: 'dailyObjectives.relaxShoulders', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'drinkWater', text: 'dailyObjectives.drinkWater', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'stretch', text: 'dailyObjectives.stretch', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'walk', text: 'dailyObjectives.walk', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'sunlight', text: 'dailyObjectives.sunlight', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'relaxFace', text: 'dailyObjectives.relaxFace', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'walkStress', text: 'dailyObjectives.walkStress', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'outdoorTime', text: 'dailyObjectives.outdoorTime', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'walkNoPhone', text: 'dailyObjectives.walkNoPhone', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'relaxHands', text: 'dailyObjectives.relaxHands', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'lowerShoulders', text: 'dailyObjectives.lowerShoulders', category: 'corporeo', xpReward: 10, completed: false },
  { id: 'calmShower', text: 'dailyObjectives.calmShower', category: 'corporeo', xpReward: 15, completed: false },
  { id: 'avoidSearch', text: 'dailyObjectives.avoidSearch', category: 'mental', xpReward: 15, completed: false },
  { id: 'delayConfirmation', text: 'dailyObjectives.delayConfirmation', category: 'mental', xpReward: 15, completed: false },
  { id: 'noSymptomChecking', text: 'dailyObjectives.noSymptomChecking', category: 'mental', xpReward: 20, completed: false },
  { id: 'focusTask', text: 'dailyObjectives.focusTask', category: 'acao', xpReward: 10, completed: false },
  { id: 'avoidSomething', text: 'dailyObjectives.avoidSomething', category: 'acao', xpReward: 15, completed: false },
  { id: 'breakRoutine', text: 'dailyObjectives.breakRoutine', category: 'acao', xpReward: 10, completed: false },
  { id: 'organize', text: 'dailyObjectives.organize', category: 'acao', xpReward: 10, completed: false },
  { id: 'learn', text: 'dailyObjectives.learn', category: 'acao', xpReward: 10, completed: false },
  { id: 'finishSimpleTask', text: 'dailyObjectives.finishSimpleTask', category: 'acao', xpReward: 15, completed: false },
  { id: 'tidySmallArea', text: 'dailyObjectives.tidySmallArea', category: 'acao', xpReward: 10, completed: false },
  { id: 'dailyAchievement', text: 'dailyObjectives.dailyAchievement', category: 'acao', xpReward: 10, completed: false },
  { id: 'pleasureTime', text: 'dailyObjectives.pleasureTime', category: 'acao', xpReward: 10, completed: false },
  { id: 'petCompanionGoal', text: 'dailyObjectives.petCompanionGoal', category: 'social', xpReward: 10, completed: false },
  { id: 'messageSomeone', text: 'dailyObjectives.messageSomeone', category: 'social', xpReward: 15, completed: false },
  { id: 'compliment', text: 'dailyObjectives.compliment', category: 'social', xpReward: 15, completed: false },
  { id: 'familyMoment', text: 'dailyObjectives.familyMoment', category: 'social', xpReward: 15, completed: false },
  { id: 'askHelp', text: 'dailyObjectives.askHelp', category: 'social', xpReward: 20, completed: false },
  { id: 'timeWithSomeone', text: 'dailyObjectives.timeWithSomeone', category: 'social', xpReward: 15, completed: false },
  { id: 'kindWords', text: 'dailyObjectives.kindWords', category: 'social', xpReward: 10, completed: false },
  { id: 'mindfulMeal', text: 'dailyObjectives.mindfulMeal', category: 'nutricao', xpReward: 10, completed: false },
  { id: 'healthyChoice', text: 'dailyObjectives.healthyChoice', category: 'nutricao', xpReward: 10, completed: false },
  { id: 'drinkWaterMindful', text: 'dailyObjectives.drinkWaterMindful', category: 'nutricao', xpReward: 10, completed: false },
  { id: 'mealNoPhone', text: 'dailyObjectives.mealNoPhone', category: 'nutricao', xpReward: 10, completed: false },
  { id: 'dailyFeeling', text: 'dailyObjectives.dailyFeeling', category: 'mental', xpReward: 10, completed: false }
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


export const INITIAL_OBJECTIVES: Objective[] =
  dailyObjectives.slice(0, 5);



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
    id: "post-1",
    authorId: "user-sofia",
    userName: "Sofia M.",
    feeling: "Aliviada",
    message: "Hoje consegui ir ao supermercado sozinha! A ansiedade bateu à porta logo na entrada, mas fiz três respirações profundas e segui em frente.",
    timestamp: "Há 2 horas",
    yellowLikes: 14,
    greenLikes: 5,
    redLikes: 0
  },
  {
    id: "post-2",
    authorId: "user-pedro",
    userName: "Pedro Silva",
    feeling: "Ansioso",
    message: "Dia difícil no trabalho, sinto o peito apertado. Vim ao Abraço respirar um pouco e já me sinto melhor.",
    timestamp: "Há 4 horas",
    yellowLikes: 22,
    greenLikes: 3,
    redLikes: 1
  },
  {
    id: "post-3",
    authorId: "user-ana",
    userName: "Ana Rita",
    feeling: "Grata",
    message: "Agradecer pelas pequenas coisas: o café da manhã, o sol e este cantinho seguro chamado Confia.",
    timestamp: "Há 6 horas",
    yellowLikes: 19,
    greenLikes: 8,
    redLikes: 0
  },
  {
    id: "post-4",
    authorId: "user-lucas",
    userName: "Lucas_98",
    feeling: "Focado",
    message: "Tu não és os teus pensamentos de catástrofe. São apenas hipóteses que a mente cria.",
    timestamp: "Há 1 dia",
    yellowLikes: 31,
    greenLikes: 10,
    redLikes: 0
  }
];



export const TRIAGE_FLOW: TriageStep[] = [
  {
    id: 1,
    title: "Como te sentes no teu corpo?",
    description: "A ansiedade manifesta-se muito fisicamente.",
    options: [
      "Coração acelerado",
      "Aperto no peito",
      "Tremores",
      "Tensão muscular",
      "Pensamentos em turbilhão"
    ],
    type: "question"
  },
  {
    id: 2,
    title: "Respiração 4-2-4",
    description: "Vamos desacelerar o sistema nervoso.",
    type: "breathing"
  },
  {
    id: 3,
    title: "Ancoragem Sensorial",
    description: "Volta ao presente usando os sentidos.",
    type: "grounding"
  },
  {
    id: 4,
    title: "Afirmação de Segurança",
    description: "Este momento vai passar.",
    type: "instruction"
  }
];
