import { Objective, SharePost, TriageStep } from '../types';

export const INITIAL_OBJECTIVES: Objective[] = [
  {
    id: 'obj-1',
    text: 'Beber um copo de água calmamente, sentindo a frescura',
    category: 'nutricao',
    xpReward: 15,
    completed: false
  },
  {
    id: 'obj-2',
    text: 'Fazer 1 minuto de respiração profunda lenta',
    category: 'mental',
    xpReward: 10,
    completed: false
  },
  {
    id: 'obj-3',
    text: 'Escrever 3 coisas simples pelas quais és grato hoje',
    category: 'mental',
    xpReward: 20,
    completed: false
  },
  {
    id: 'obj-4',
    text: 'Dar um passeio curto de 5 a 10 minutos lá fora',
    category: 'corporeo',
    xpReward: 25,
    completed: false
  },
  {
    id: 'obj-5',
    text: 'Fazer um alongamento suave no pescoço e ombros',
    category: 'corporeo',
    xpReward: 15,
    completed: false
  },
  {
    id: 'obj-6',
    text: 'Enviar uma mensagem curta de carinho a um amigo ou familiar',
    category: 'social',
    xpReward: 20,
    completed: false
  },
  {
    id: 'obj-7',
    text: 'Lanchar uma fruta de forma consciente, sem distrações digitais',
    category: 'nutricao',
    xpReward: 15,
    completed: false
  }
];

export const SOOTHING_PHRASES: string[] = [
  "Inspira profundamente... Segura... Expira devagar. Estás aqui e agora.",
  "Este momento de aperto vai passar. O teu corpo sabe como acalmar-se.",
  "Não tens de resolver tudo agora. Foca-te apenas na tua próxima respiração.",
  "Sente os teus pés bem assentes no chão. Tu és forte e capaz de ultrapassar isto.",
  "Permite que os teus ombros relaxem. Deixa cair o peso que não é teu.",
  "O teu valor não é definido pela quantidade de coisas que fazes hoje.",
  "A ansiedade é apenas uma nuvem passageira no céu da tua mente.",
  "Fizeste o melhor que podias hoje, e isso é o suficiente.",
  "Respira paz... liberta a tensão... estás num espaço seguro.",
  "Não há problema em dar um passo atrás para recuperar o fôlego.",
  "O teu cérebro está apenas a tentar proteger-te, mas estás em segurança.",
  "Um passo de cada vez, uma respiração de cada vez.",
  "Sente o ar fresco a entrar... e o ar morno a sair. Estás vivo e presente.",
  "É seguro desacelerar. O mundo pode esperar um bocadinho.",
  "És muito mais forte do que a tempestade que sentes dentro de ti."
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
