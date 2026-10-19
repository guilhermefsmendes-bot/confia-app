import type { SharePost, TriageStep } from '../types';

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
