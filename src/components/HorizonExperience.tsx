import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, LockKeyhole, RotateCcw, Sparkles, Star, Waves } from "lucide-react";
import { useTranslation } from "react-i18next";

type Section = "sky" | "sand" | "sea";
type Capsule = { message:string; buriedAt:string; opensAt:string; cycle:number; feedback?:string };
type WeeklyReflection = { at:string; message:string; guess:string; feedback:string };
type MonthTracker = { startedAt:string; dueAt:string; summary?:string; comparedAt?:string };
type Tone = "heavy" | "neutral" | "light";
type Domino = { id:string; left:string; right:string; tone:Tone; turn?:boolean };
type Direction="right"|"left"|"up"|"down";
type PlacedDomino = { tile:Domino; x:number; y:number; rotate:number; direction?:Direction };
type Quest = { id:string; label:keyof typeof COPY.pt; reward:"extra-choice"|"reroll"|"hint"; icon:string };
type ImpulseQuestion = {id:string;question:string;answers:string[];correct:number;explanation:string};
type Junction = {slot:number;left:string;right:string;explanation:string};
type JunctionPair = {slot:number;left:string;right:string};
type HorizonProgress = {placed:PlacedDomino[];hand?:Domino[];bonuses:{extraChoices:number;rerolls:number;hints:number};unlockedIslands:number[];junctions:Junction[];treasureAnswer:string;quest:Quest;questDone:boolean};

const CAPSULE_KEY="confia_horizon_capsule_v1";
const WEEKLY_LOG_KEY="confia_horizon_weekly_reflections_v1";
const MONTH_TRACKER_KEY="confia_horizon_month_tracker_v1";
const DOMINO_KEY="confia_horizon_domino_v2";
const BONUS_KEY="confia_horizon_bonuses_v1";
const HORIZON_INTRO_KEY="confia_horizon_intro_v2";
const HORIZON_JUNCTIONS_KEY="confia_horizon_junctions_v1";
const HORIZON_PROGRESS_KEY="confia_horizon_progress_v1";
const COMMUNITY_EVENT="confia:community-post-created";

const COPY={
  pt:{horizon:"O teu horizonte",horizonSub:"Céu, areia e mar — três espaços para observar, guardar e transformar o que sentes.",sky:"Céu",sand:"Areia",sea:"Mar da serenidade",skySub:"O que sentes também pode ganhar forma.",sandSub:"Guarda uma carta no teu baú e reencontra-a mais tarde com novos olhos.",seaSub:"Liga emoções, pensamentos e ações. Pequenas escolhas podem mudar o rumo.",capsule:"A tua cápsula do tempo",bury:"Enterrar carta por 7 dias",placeholder:"Escreve algo que gostarias de reencontrar daqui a uma semana…",buried:"O teu baú abre em",open:"Abrir o baú",guess:"Antes de abrir, queres tentar adivinhar o que escreveste há 7 dias?",guessPlaceholder:"Escreve aqui o que pensas que deixaste na cápsula…",reveal:"Agora compara o que imaginavas com aquilo que realmente escreveste.",remembered:"O que imaginavas",actual:"O que escreveste",feedback:"O que dirias hoje ao teu eu daquela semana?",rebury:"Responder e voltar a enterrar por 7 dias",monthTitle:"O teu mês",monthPrompt:"Antes de veres os teus registos: como resumirias este último mês?",monthPlaceholder:"Escreve uma frase ou pequeno resumo do mês…",monthCompare:"Comparar com as minhas semanas",monthYourSummary:"O teu resumo do mês",monthWeekly:"O que foste dizendo semana a semana",monthCombined:"Somatório dos teus feedbacks",monthClose:"Fechar mês e começar novo ciclo",monthWaiting:"Perspetiva mensal",monthIn:"Revisão mensal em",quest:"Iniciativa opcional",choose:"Arrasta uma peça para a água",needWord:"Que palavra precisas?",needWordTitle:"Que palavra precisas?",needWordPrompt:"Pensa na palavra que sentes que precisas para continuar o teu caminho.",needWordPlaceholder:"Escreve uma palavra…",needWordFind:"Procurar peça",needWordNoMatch:"Não encontrei uma peça com essa palavra do lado esquerdo. Experimenta outra palavra.",needWordMoment:"Quando é que esta palavra foi importante para ti esta semana?",needWordMomentPlaceholder:"Escreve um momento concreto da tua semana…",needWordSave:"Guardar e colocar no caminho",needWordSaved:"Este momento ficou guardado no teu caminho.",bonus:"Vantagem desbloqueada",restart:"Novo caminho",resumeTitle:"Continuar o teu percurso?",resumeText:"Encontrámos um percurso que ficou guardado. Podes continuar exatamente onde paraste ou começar um percurso novo.",continueJourney:"Continuar",startJourney:"Começar percurso",savedProgress:"Percurso guardado",hint:"Dica",community:"Partilhar algo na Comunidade",water:"Beber um copo de água",pause:"Fazer 30 segundos de pausa",walk:"Caminhar 2 minutos",breathe:"Fazer 5 respirações lentas",stretch:"Alongar ombros e pescoço",window:"Olhar pela janela durante 30 segundos",invalid:"Agora podes escolher livremente.",dragTip:"As peças já não precisam de ter palavras iguais. Procura uma ligação que faça sentido para ti.",start:"Começa por aqui",introTitle:"Uma nova forma de atravessar o mar",introText:"Em alguns pontos do caminho, a CONFIA vai juntar dois conceitos. A tua tarefa é encontrar uma ligação entre eles. Não existe uma ligação certa ou errada.",introExample:"Por exemplo: MEDO + PESQUISAS. Talvez sintas que, quando aparece o medo, surge também a vontade de pesquisar. A ligação é tua.",introExplain:"Depois explica, com as tuas palavras, porque vês essa ligação. Ao longo do caminho vais fazer 3 destas junções. No fim, o cofre vai olhar para as três e devolver-te uma ponderação sobre o caminho que construíste.",introButton:"Percebi. Começar a viagem",junctionTitle:"Encontra a tua ligação",junctionStep:"Junção {step} de 3",junctionPrompt:"O que pode ligar estes dois conceitos para ti?",junctionExplain:"Escolhe a ligação que fizer sentido para ti. Não há resposta certa.",junctionPlaceholder:"Explica com as tuas palavras porque os ligaste…",junctionSave:"Guardar ligação",junctionSaved:"Ligação guardada.",treasureLabel:"Ilha Tesouro",treasureTitle:"Encontraste o baú",treasureSubtitle:"A tua viagem deixou três ligações para trás.",treasureIntro:"A CONFIA reuniu as três junções que construíste. Em vez de te dar uma conclusão, deixa-te uma ponderação para veres se reconheces algum fio no teu próprio caminho.",treasureThread:"Um possível fio no teu caminho",treasureQuestion:"Isto faz sentido para ti?",treasureClose:"Guardar esta ponderação",treasureEmpty:"Completa as três junções para abrir a ponderação final."},
  en:{horizon:"Your horizon",horizonSub:"Sky, sand and sea — three spaces to observe, keep and transform what you feel.",sky:"Sky",sand:"Sand",sea:"Sea of serenity",skySub:"What you feel can also take shape.",sandSub:"Keep a letter in your chest and meet it again later with fresh eyes.",seaSub:"Connect emotions, thoughts and actions. Small choices can change the path.",capsule:"Your time capsule",bury:"Bury letter for 7 days",placeholder:"Write something you would like to meet again in a week…",buried:"Your chest opens in",open:"Open chest",guess:"Before opening, want to guess what you wrote 7 days ago?",guessPlaceholder:"Write what you think you left in the capsule…",reveal:"Now compare what you imagined with what you actually wrote.",remembered:"What you imagined",actual:"What you wrote",feedback:"What would you tell your past self from that week today?",rebury:"Reply and bury again for 7 days",monthTitle:"Your month",monthPrompt:"Before seeing your records: how would you sum up this past month?",monthPlaceholder:"Write a sentence or short summary of the month…",monthCompare:"Compare with my weeks",monthYourSummary:"Your monthly summary",monthWeekly:"What you said week by week",monthCombined:"Combined weekly feedback",monthClose:"Close month and start a new cycle",monthWaiting:"Monthly perspective",monthIn:"Monthly review in",quest:"Optional initiative",choose:"Drag a tile onto the water",needWord:"What word do you need?",needWordTitle:"What word do you need?",needWordPrompt:"Think of the word you feel you need to continue your path.",needWordPlaceholder:"Write a word…",needWordFind:"Find a tile",needWordNoMatch:"I couldn’t find a tile with that word on the left. Try another word.",needWordMoment:"When was this word important to you this week?",needWordMomentPlaceholder:"Write a specific moment from your week…",needWordSave:"Save and place on the path",needWordSaved:"This moment has been saved to your path.",bonus:"Advantage unlocked",restart:"New path",resumeTitle:"Continue your journey?",resumeText:"We found a saved journey. You can continue exactly where you stopped or start a new journey.",continueJourney:"Continue",startJourney:"Start journey",savedProgress:"Saved journey",hint:"Hint",community:"Share something in Community",water:"Drink a glass of water",pause:"Take a 30-second pause",walk:"Walk for 2 minutes",breathe:"Take 5 slow breaths",stretch:"Stretch shoulders and neck",window:"Look out a window for 30 seconds",invalid:"You can choose freely now.",dragTip:"The tiles no longer need matching words. Look for a connection that makes sense to you.",start:"Start here",introTitle:"A new way to cross the sea",introText:"At some points on the path, CONFIA will bring two concepts together. Your task is to find a connection between them. There is no right or wrong connection.",introExample:"For example: FEAR + RESEARCH. You might feel that when fear appears, the urge to research appears too. The connection is yours.",introExplain:"Then explain, in your own words, why you see that connection. Along the path you will make 3 of these connections. At the end, the chest will look at all three and offer a reflection on the path you built.",introButton:"I understand. Start the journey",junctionTitle:"Find your connection",junctionStep:"Connection {step} of 3",junctionPrompt:"What could connect these two concepts for you?",junctionExplain:"Choose the connection that makes sense to you. There is no right answer.",junctionPlaceholder:"Explain in your own words why you connected them…",junctionSave:"Save connection",junctionSaved:"Connection saved.",treasureLabel:"Treasure Island",treasureTitle:"You found the chest",treasureSubtitle:"Your journey left three connections behind.",treasureIntro:"CONFIA gathered the three connections you built. Instead of giving you a conclusion, it leaves you with a reflection to see whether you recognise a thread in your own path.",treasureThread:"A possible thread in your path",treasureQuestion:"Does this make sense to you?",treasureClose:"Save this reflection",treasureEmpty:"Complete the three connections to open the final reflection."},
  es:{horizon:"Tu horizonte",horizonSub:"Cielo, arena y mar — tres espacios para observar, guardar y transformar lo que sientes.",sky:"Cielo",sand:"Arena",sea:"Mar de serenidad",skySub:"Lo que sientes también puede tomar forma.",sandSub:"Guarda una carta en tu cofre y vuelve a encontrarla más tarde con otra mirada.",seaSub:"Conecta emociones, pensamientos y acciones. Pequeñas elecciones pueden cambiar el rumbo.",capsule:"Tu cápsula del tiempo",bury:"Enterrar carta 7 días",placeholder:"Escribe algo que quieras reencontrar dentro de una semana…",buried:"Tu cofre se abre en",open:"Abrir el cofre",guess:"Antes de abrir, ¿quieres adivinar qué escribiste hace 7 días?",guessPlaceholder:"Escribe lo que crees que dejaste en la cápsula…",reveal:"Ahora compara lo que imaginabas con lo que realmente escribiste.",remembered:"Lo que imaginabas",actual:"Lo que escribiste",feedback:"¿Qué le dirías hoy a tu yo de aquella semana?",rebury:"Responder y volver a enterrar 7 días",quest:"Iniciativa opcional",choose:"Arrastra una ficha al agua",needWord:"¿Qué palabra necesitas?",needWordTitle:"¿Qué palabra necesitas?",needWordPrompt:"Piensa en la palabra que sientes que necesitas para continuar tu camino.",needWordPlaceholder:"Escribe una palabra…",needWordFind:"Buscar ficha",needWordNoMatch:"No encontré una ficha con esa palabra a la izquierda. Prueba con otra palabra.",needWordMoment:"¿Cuándo fue importante esta palabra para ti esta semana?",needWordMomentPlaceholder:"Escribe un momento concreto de tu semana…",needWordSave:"Guardar y colocar en el camino",needWordSaved:"Este momento ha quedado guardado en tu camino.",bonus:"Ventaja desbloqueada",restart:"Nuevo camino",resumeTitle:"¿Continuar tu recorrido?",resumeText:"Encontramos un recorrido guardado. Puedes continuar exactamente donde lo dejaste o empezar uno nuevo.",continueJourney:"Continuar",startJourney:"Empezar recorrido",savedProgress:"Recorrido guardado",hint:"Pista",community:"Compartir algo en Comunidad",water:"Beber un vaso de agua",pause:"Hacer una pausa de 30 segundos",walk:"Caminar 2 minutos",breathe:"Hacer 5 respiraciones lentas",stretch:"Estirar hombros y cuello",window:"Mirar por la ventana 30 segundos",invalid:"Ahora puedes elegir libremente.",dragTip:"Las fichas ya no tienen que compartir palabras. Busca una conexión que tenga sentido para ti.",start:"Empieza aquí",introTitle:"Una nueva forma de atravesar el mar",introText:"En algunos puntos del camino, CONFIA juntará dos conceptos. Tu tarea es encontrar una conexión entre ellos. No existe una conexión correcta o incorrecta.",introExample:"Por ejemplo: MIEDO + INVESTIGACIONES. Puede que sientas que, cuando aparece el miedo, también aparece la necesidad de investigar. La conexión es tuya.",introExplain:"Después explica, con tus palabras, por qué ves esa conexión. A lo largo del camino harás 3 de estas conexiones. Al final, el cofre mirará las tres y te devolverá una reflexión sobre el camino que construiste.",introButton:"Lo entiendo. Empezar el viaje",junctionTitle:"Encuentra tu conexión",junctionStep:"Conexión {step} de 3",junctionPrompt:"¿Qué puede conectar estos dos conceptos para ti?",junctionExplain:"Elige la conexión que tenga sentido para ti. No hay una respuesta correcta.",junctionPlaceholder:"Explica con tus palabras por qué los has conectado…",junctionSave:"Guardar conexión",junctionSaved:"Conexión guardada.",treasureLabel:"Isla del Tesoro",treasureTitle:"Has encontrado el cofre",treasureSubtitle:"Tu viaje dejó tres conexiones atrás.",treasureIntro:"CONFIA reunió las tres conexiones que construiste. En lugar de darte una conclusión, te deja una reflexión para que veas si reconoces algún hilo en tu propio camino.",treasureThread:"Un posible hilo en tu camino",treasureQuestion:"¿Tiene sentido para ti?",treasureClose:"Guardar esta reflexión",treasureEmpty:"Completa las tres conexiones para abrir la reflexión final."},
  fr:{horizon:"Ton horizon",horizonSub:"Ciel, sable et mer — trois espaces pour observer, garder et transformer ce que tu ressens.",sky:"Ciel",sand:"Sable",sea:"Mer de sérénité",skySub:"Ce que tu ressens peut aussi prendre forme.",sandSub:"Garde une lettre dans ton coffre et retrouve-la plus tard avec un autre regard.",seaSub:"Relie émotions, pensées et actions. De petits choix peuvent changer le chemin.",capsule:"Ta capsule temporelle",bury:"Enterrer la lettre 7 jours",placeholder:"Écris quelque chose que tu aimerais retrouver dans une semaine…",buried:"Ton coffre s'ouvre dans",open:"Ouvrir le coffre",guess:"Avant d'ouvrir, veux-tu deviner ce que tu avais écrit il y a 7 jours ?",guessPlaceholder:"Écris ce que tu penses avoir laissé dans la capsule…",reveal:"Compare maintenant ce que tu imaginais avec ce que tu avais réellement écrit.",remembered:"Ce que tu imaginais",actual:"Ce que tu avais écrit",feedback:"Que dirais-tu aujourd'hui à ton toi de cette semaine-là ?",rebury:"Répondre et enterrer à nouveau 7 jours",quest:"Initiative facultative",choose:"Fais glisser une pièce sur l'eau",needWord:"De quel mot as-tu besoin ?",needWordTitle:"De quel mot as-tu besoin ?",needWordPrompt:"Pense au mot dont tu sens avoir besoin pour continuer ton chemin.",needWordPlaceholder:"Écris un mot…",needWordFind:"Chercher une pièce",needWordNoMatch:"Je n’ai pas trouvé de pièce avec ce mot à gauche. Essaie un autre mot.",needWordMoment:"Quand ce mot a-t-il été important pour toi cette semaine ?",needWordMomentPlaceholder:"Écris un moment concret de ta semaine…",needWordSave:"Enregistrer et placer sur le chemin",needWordSaved:"Ce moment a été enregistré sur ton chemin.",bonus:"Avantage débloqué",restart:"Nouveau chemin",resumeTitle:"Continuer ton parcours ?",resumeText:"Nous avons trouvé un parcours enregistré. Tu peux continuer exactement où tu t’es arrêté ou commencer un nouveau parcours.",continueJourney:"Continuer",startJourney:"Commencer le parcours",savedProgress:"Parcours enregistré",hint:"Indice",community:"Partager dans la Communauté",water:"Boire un verre d'eau",pause:"Faire une pause de 30 secondes",walk:"Marcher 2 minutes",breathe:"Faire 5 respirations lentes",stretch:"Étirer les épaules et le cou",window:"Regarder dehors 30 secondes",invalid:"Tu peux maintenant choisir librement.",dragTip:"Les pièces n’ont plus besoin de partager un mot. Cherche une connexion qui a du sens pour toi.",start:"Commence ici",introTitle:"Une nouvelle façon de traverser la mer",introText:"À certains moments du chemin, CONFIA réunira deux concepts. Ton rôle est de trouver une connexion entre eux. Il n’y a pas de bonne ou de mauvaise connexion.",introExample:"Par exemple : PEUR + RECHERCHES. Tu peux sentir que lorsque la peur apparaît, l’envie de chercher des réponses apparaît aussi. La connexion t’appartient.",introExplain:"Ensuite, explique avec tes mots pourquoi tu vois cette connexion. Au fil du chemin, tu feras 3 de ces connexions. À la fin, le coffre regardera les trois et te proposera une réflexion sur le chemin que tu as construit.",introButton:"J’ai compris. Commencer le voyage",junctionTitle:"Trouve ta connexion",junctionStep:"Connexion {step} sur 3",junctionPrompt:"Qu’est-ce qui peut relier ces deux concepts pour toi ?",junctionExplain:"Choisis la connexion qui a du sens pour toi. Il n’y a pas de bonne réponse.",junctionPlaceholder:"Explique avec tes mots pourquoi tu les as reliés…",junctionSave:"Enregistrer la connexion",junctionSaved:"Connexion enregistrée.",treasureLabel:"Île au trésor",treasureTitle:"Tu as trouvé le coffre",treasureSubtitle:"Ton voyage a laissé trois connexions derrière lui.",treasureIntro:"CONFIA a réuni les trois connexions que tu as construites. Au lieu de te donner une conclusion, elle te laisse une réflexion pour voir si tu reconnais un fil dans ton propre chemin.",treasureThread:"Un fil possible dans ton chemin",treasureQuestion:"Est-ce que cela a du sens pour toi ?",treasureClose:"Enregistrer cette réflexion",treasureEmpty:"Complète les trois connexions pour ouvrir la réflexion finale."}
} as const;

const MONTH_COPY={
  pt:{monthTitle:"O teu mês",monthPrompt:"Antes de veres os teus registos: como resumirias este último mês?",monthPlaceholder:"Escreve uma frase ou pequeno resumo do mês…",monthCompare:"Comparar com as minhas semanas",monthYourSummary:"O teu resumo do mês",monthWeekly:"O que foste dizendo semana a semana",monthCombined:"Somatório dos teus feedbacks",monthClose:"Fechar mês e começar novo ciclo",monthWaiting:"Perspetiva mensal",monthIn:"Revisão mensal em"},
  en:{monthTitle:"Your month",monthPrompt:"Before seeing your records: how would you sum up this past month?",monthPlaceholder:"Write a sentence or short summary of the month…",monthCompare:"Compare with my weeks",monthYourSummary:"Your monthly summary",monthWeekly:"What you said week by week",monthCombined:"Combined weekly feedback",monthClose:"Close month and start a new cycle",monthWaiting:"Monthly perspective",monthIn:"Monthly review in"},
  es:{monthTitle:"Tu mes",monthPrompt:"Antes de ver tus registros: ¿cómo resumirías este último mes?",monthPlaceholder:"Escribe una frase o breve resumen del mes…",monthCompare:"Comparar con mis semanas",monthYourSummary:"Tu resumen del mes",monthWeekly:"Lo que fuiste diciendo semana a semana",monthCombined:"Suma de tus comentarios",monthClose:"Cerrar mes y empezar un nuevo ciclo",monthWaiting:"Perspectiva mensual",monthIn:"Revisión mensual en"},
  fr:{monthTitle:"Ton mois",monthPrompt:"Avant de voir tes notes : comment résumerais-tu ce dernier mois ?",monthPlaceholder:"Écris une phrase ou un court résumé du mois…",monthCompare:"Comparer avec mes semaines",monthYourSummary:"Ton résumé du mois",monthWeekly:"Ce que tu as dit semaine après semaine",monthCombined:"Somme de tes retours",monthClose:"Clore le mois et commencer un nouveau cycle",monthWaiting:"Perspective mensuelle",monthIn:"Bilan mensuel dans"}
} as const;

const FEELINGS=["ansioso","pensativo","amedrontado","esperançoso","cansado","confuso","determinado","inseguro","aliviado","frustrado","curioso","sensível","sobrecarregado","otimista","sozinho","grato","irritado","bloqueado","vulnerável","corajoso","nostálgico","tranquilo","impaciente","desanimado","focado","perdido","orgulhoso","tenso","sereno","incerto","motivado","exausto","preocupado","resiliente","agitado","confiante"];

const DOMINOES:Domino[]=[
{id:"stress-agitation",left:"Stress",right:"Agitação",tone:"heavy"},
{id:"stress-worry",left:"Stress",right:"Preocupação",tone:"heavy"},
{id:"stress-tension",left:"Stress",right:"Tensão",tone:"heavy"},
{id:"agitation-tension",left:"Agitação",right:"Tensão",tone:"heavy"},
{id:"agitation-rush",left:"Agitação",right:"Pressa",tone:"heavy"},
{id:"tension-alert",left:"Tensão",right:"Alerta",tone:"heavy"},
{id:"tension-pause",left:"Tensão",right:"Pausa",tone:"light"},
{id:"worry-fear",left:"Preocupação",right:"Medo",tone:"heavy"},
{id:"worry-check",left:"Preocupação",right:"Verificar",tone:"heavy"},
{id:"worry-pause",left:"Preocupação",right:"Pausa",tone:"light"},
{id:"fear-avoid",left:"Medo",right:"Evitar",tone:"heavy"},
{id:"fear-observe",left:"Medo",right:"Observar",tone:"light"},
{id:"alert-check",left:"Alerta",right:"Verificar",tone:"heavy"},
{id:"alert-breath",left:"Alerta",right:"Respiração",tone:"light"},
{id:"rush-overload",left:"Pressa",right:"Sobrecarga",tone:"heavy"},
{id:"overload-fatigue",left:"Sobrecarga",right:"Cansaço",tone:"neutral"},
{id:"overload-pause",left:"Sobrecarga",right:"Pausa",tone:"light"},
{id:"check-relief",left:"Verificar",right:"Alívio breve",tone:"neutral"},
{id:"relief-doubt",left:"Alívio breve",right:"Dúvida",tone:"heavy"},
{id:"doubt-check",left:"Dúvida",right:"Verificar",tone:"heavy"},
{id:"doubt-wait",left:"Dúvida",right:"Esperar",tone:"neutral"},
{id:"avoid-relief",left:"Evitar",right:"Alívio breve",tone:"neutral"},
{id:"avoid-worry",left:"Evitar",right:"Preocupação",tone:"heavy"},
{id:"pause-breath",left:"Pausa",right:"Respiração",tone:"light"},
{id:"pause-space",left:"Pausa",right:"Espaço",tone:"light"},
{id:"pause-observe",left:"Pausa",right:"Observar",tone:"light"},
{id:"pause-joy",left:"Pausa",right:"Alegria",tone:"light"},
{id:"breath-calm",left:"Respiração",right:"Calma",tone:"light"},
{id:"breath-clarity",left:"Respiração",right:"Clareza",tone:"light"},
{id:"observe-perspective",left:"Observar",right:"Perspetiva",tone:"light"},
{id:"observe-accept",left:"Observar",right:"Aceitar",tone:"light"},
{id:"space-perspective",left:"Espaço",right:"Perspetiva",tone:"light"},
{id:"perspective-clarity",left:"Perspetiva",right:"Clareza",tone:"light"},
{id:"clarity-action",left:"Clareza",right:"Ação",tone:"light"},
{id:"action-confidence",left:"Ação",right:"Confiança",tone:"light"},
{id:"confidence-courage",left:"Confiança",right:"Coragem",tone:"light"},
{id:"courage-wellbeing",left:"Coragem",right:"Bem-estar",tone:"light"},
{id:"calm-presence",left:"Calma",right:"Presença",tone:"light"},
{id:"presence-balance",left:"Presença",right:"Equilíbrio",tone:"light"},
{id:"balance-wellbeing",left:"Equilíbrio",right:"Bem-estar",tone:"light"},
{id:"fatigue-rest",left:"Cansaço",right:"Descanso",tone:"light"},
{id:"rest-energy",left:"Descanso",right:"Energia",tone:"light"},
{id:"energy-action",left:"Energia",right:"Ação",tone:"light"},
{id:"accept-calm",left:"Aceitar",right:"Calma",tone:"light"},
{id:"wait-clarity",left:"Esperar",right:"Clareza",tone:"light"},

{id:"inquietacao-antecipacao",left:"Inquietação",right:"Antecipação",tone:"heavy"},
{id:"inquietacao-curiosidade",left:"Inquietação",right:"Curiosidade",tone:"neutral"},
{id:"inquietacao-espaco",left:"Inquietação",right:"Espaço",tone:"light"},
{id:"incerteza-curiosidade",left:"Incerteza",right:"Curiosidade",tone:"neutral"},
{id:"incerteza-esperar",left:"Incerteza",right:"Esperar",tone:"light"},
{id:"incerteza-aceitar",left:"Incerteza",right:"Aceitar",tone:"light"},
{id:"antecipacao-pressa",left:"Antecipação",right:"Pressa",tone:"heavy"},
{id:"antecipacao-planeamento",left:"Antecipação",right:"Planeamento",tone:"neutral"},
{id:"antecipacao-respiracao",left:"Antecipação",right:"Respiração",tone:"light"},
{id:"ruminacao-pensamento",left:"Ruminação",right:"Pensamento",tone:"heavy"},
{id:"ruminacao-pausa",left:"Ruminação",right:"Pausa",tone:"light"},
{id:"ruminacao-perspetiva",left:"Ruminação",right:"Perspetiva",tone:"light"},
{id:"pensamento-curiosidade",left:"Pensamento",right:"Curiosidade",tone:"neutral"},
{id:"pensamento-clareza",left:"Pensamento",right:"Clareza",tone:"light"},
{id:"pensamento-acao",left:"Pensamento",right:"Ação",tone:"light"},
{id:"duvida-curiosidade",left:"Dúvida",right:"Curiosidade",tone:"neutral"},
{id:"duvida-paciencia",left:"Dúvida",right:"Paciência",tone:"light"},
{id:"duvida-perspetiva",left:"Dúvida",right:"Perspetiva",tone:"light"},
{id:"receio-aceitar",left:"Receio",right:"Aceitar",tone:"light"},
{id:"receio-coragem",left:"Receio",right:"Coragem",tone:"light"},
{id:"receio-observar",left:"Receio",right:"Observar",tone:"light"},
{id:"nervosismo-respiracao",left:"Nervosismo",right:"Respiração",tone:"light"},
{id:"nervosismo-pausa",left:"Nervosismo",right:"Pausa",tone:"light"},
{id:"nervosismo-movimento",left:"Nervosismo",right:"Movimento",tone:"light"},
{id:"frustracao-paciencia",left:"Frustração",right:"Paciência",tone:"light"},
{id:"frustracao-aceitar",left:"Frustração",right:"Aceitar",tone:"light"},
{id:"frustracao-acao",left:"Frustração",right:"Ação",tone:"light"},
{id:"irritacao-escolha",left:"Irritação",right:"Escolha",tone:"neutral"},
{id:"irritacao-pausa",left:"Irritação",right:"Pausa",tone:"light"},
{id:"irritacao-movimento",left:"Irritação",right:"Movimento",tone:"light"},
{id:"cansaco-limite",left:"Cansaço",right:"Limite",tone:"neutral"},
{id:"cansaco-recuperacao",left:"Cansaço",right:"Recuperação",tone:"light"},
{id:"cansaco-presenca",left:"Cansaço",right:"Presença",tone:"light"},
{id:"exaustao-descanso",left:"Exaustão",right:"Descanso",tone:"light"},
{id:"exaustao-limite",left:"Exaustão",right:"Limite",tone:"neutral"},
{id:"exaustao-cuidado",left:"Exaustão",right:"Cuidado",tone:"light"},
{id:"sobrecarregado-delegar",left:"Sobrecarga",right:"Delegar",tone:"light"},
{id:"sobrecarga-limite",left:"Sobrecarga",right:"Limite",tone:"neutral"},
{id:"pressao-limite",left:"Pressão",right:"Limite",tone:"neutral"},
{id:"pressao-respiracao",left:"Pressão",right:"Respiração",tone:"light"},
{id:"pressao-prioridade",left:"Pressão",right:"Prioridade",tone:"light"},
{id:"bloqueio-pausa",left:"Bloqueio",right:"Pausa",tone:"light"},
{id:"bloqueio-escolha",left:"Bloqueio",right:"Escolha",tone:"light"},
{id:"bloqueio-aceitar",left:"Bloqueio",right:"Aceitar",tone:"light"},
{id:"evitar-coragem",left:"Evitar",right:"Coragem",tone:"light"},
{id:"evitar-escolha",left:"Evitar",right:"Escolha",tone:"neutral"},
{id:"verificar-incerteza",left:"Verificar",right:"Incerteza",tone:"heavy"},
{id:"verificar-paciencia",left:"Verificar",right:"Paciência",tone:"light"},
{id:"verificar-confiar",left:"Verificar",right:"Confiar",tone:"light"},
{id:"controlo-flexibilidade",left:"Controlo",right:"Flexibilidade",tone:"light"},
{id:"controlo-confiar",left:"Controlo",right:"Confiar",tone:"light"},
{id:"controlo-entrega",left:"Controlo",right:"Entrega",tone:"light"},
{id:"confiar-alivio",left:"Confiar",right:"Alívio",tone:"light"},
{id:"confiar-presenca",left:"Confiar",right:"Presença",tone:"light"},
{id:"confiar-coragem",left:"Confiar",right:"Coragem",tone:"light"},
{id:"alivio-gratidao",left:"Alívio",right:"Gratidão",tone:"light"},
{id:"alivio-alegria",left:"Alívio",right:"Alegria",tone:"light"},
{id:"alivio-serenidade",left:"Alívio",right:"Serenidade",tone:"light"},
{id:"alegria-presenca",left:"Alegria",right:"Presença",tone:"light"},
{id:"alegria-gratidao",left:"Alegria",right:"Gratidão",tone:"light"},
{id:"alegria-energia",left:"Alegria",right:"Energia",tone:"light"},
{id:"esperanca-acao",left:"Esperança",right:"Ação",tone:"light"},
{id:"esperanca-coragem",left:"Esperança",right:"Coragem",tone:"light"},
{id:"esperanca-paciencia",left:"Esperança",right:"Paciência",tone:"light"},
{id:"gratidao-calma",left:"Gratidão",right:"Calma",tone:"light"},
{id:"gratidao-presenca",left:"Gratidão",right:"Presença",tone:"light"},
{id:"gratidao-bemestar",left:"Gratidão",right:"Bem-estar",tone:"light"},
{id:"curiosidade-descoberta",left:"Curiosidade",right:"Descoberta",tone:"neutral"},
{id:"curiosidade-aprendizagem",left:"Curiosidade",right:"Aprendizagem",tone:"light"},
{id:"curiosidade-aceitar",left:"Curiosidade",right:"Aceitar",tone:"light"},
{id:"paciência-esperar",left:"Paciência",right:"Esperar",tone:"light"},
{id:"paciência-presenca",left:"Paciência",right:"Presença",tone:"light"},
{id:"paciência-equilibrio",left:"Paciência",right:"Equilíbrio",tone:"light"},
{id:"limite-cuidado",left:"Limite",right:"Cuidado",tone:"light"},
{id:"limite-descanso",left:"Limite",right:"Descanso",tone:"light"},
{id:"limite-escolha",left:"Limite",right:"Escolha",tone:"neutral"},
{id:"escolha-liberdade",left:"Escolha",right:"Liberdade",tone:"light"},
{id:"escolha-acao",left:"Escolha",right:"Ação",tone:"light"},
{id:"escolha-clareza",left:"Escolha",right:"Clareza",tone:"light"},
{id:"liberdade-leveza",left:"Liberdade",right:"Leveza",tone:"light"},
{id:"liberdade-confianca",left:"Liberdade",right:"Confiança",tone:"light"},
{id:"leveza-alegria",left:"Leveza",right:"Alegria",tone:"light"},
{id:"leveza-respiracao",left:"Leveza",right:"Respiração",tone:"light"},
{id:"serenidade-calma",left:"Serenidade",right:"Calma",tone:"light"},
{id:"serenidade-presenca",left:"Serenidade",right:"Presença",tone:"light"},
{id:"serenidade-espaco",left:"Serenidade",right:"Espaço",tone:"light"},
{id:"cuidado-recuperacao",left:"Cuidado",right:"Recuperação",tone:"light"},
{id:"cuidado-presenca",left:"Cuidado",right:"Presença",tone:"light"},
{id:"cuidado-limite",left:"Cuidado",right:"Limite",tone:"light"},
{id:"recuperacao-energia",left:"Recuperação",right:"Energia",tone:"light"},
{id:"recuperacao-descanso",left:"Recuperação",right:"Descanso",tone:"light"},
{id:"recuperacao-bemestar",left:"Recuperação",right:"Bem-estar",tone:"light"},
{id:"movimento-energia",left:"Movimento",right:"Energia",tone:"light"},
{id:"movimento-presenca",left:"Movimento",right:"Presença",tone:"light"},
{id:"movimento-leveza",left:"Movimento",right:"Leveza",tone:"light"},
{id:"planeamento-prioridade",left:"Planeamento",right:"Prioridade",tone:"neutral"},
{id:"planeamento-clareza",left:"Planeamento",right:"Clareza",tone:"light"},
{id:"planeamento-flexibilidade",left:"Planeamento",right:"Flexibilidade",tone:"light"},
{id:"prioridade-foco",left:"Prioridade",right:"Foco",tone:"light"},
{id:"prioridade-equilibrio",left:"Prioridade",right:"Equilíbrio",tone:"light"},
{id:"foco-presenca",left:"Foco",right:"Presença",tone:"light"},
{id:"foco-acao",left:"Foco",right:"Ação",tone:"light"},
{id:"foco-descanso",left:"Foco",right:"Descanso",tone:"light"},
{id:"flexibilidade-aceitar",left:"Flexibilidade",right:"Aceitar",tone:"light"},
{id:"flexibilidade-equilibrio",left:"Flexibilidade",right:"Equilíbrio",tone:"light"},
{id:"entrega-paz",left:"Entrega",right:"Paz",tone:"light"},
{id:"entrega-confiar",left:"Entrega",right:"Confiar",tone:"light"},
{id:"paz-presenca",left:"Paz",right:"Presença",tone:"light"},
{id:"paz-serenidade",left:"Paz",right:"Serenidade",tone:"light"},
{id:"double-stress",left:"Stress",right:"Stress",tone:"heavy",turn:true},
{id:"double-agitation",left:"Agitação",right:"Agitação",tone:"heavy",turn:true},
{id:"double-tension",left:"Tensão",right:"Tensão",tone:"heavy",turn:true},
{id:"double-worry",left:"Preocupação",right:"Preocupação",tone:"heavy",turn:true},
{id:"double-pause",left:"Pausa",right:"Pausa",tone:"light",turn:true},
{id:"double-calm",left:"Calma",right:"Calma",tone:"light",turn:true},
{id:"double-clarity",left:"Clareza",right:"Clareza",tone:"light",turn:true},
{id:"double-confidence",left:"Confiança",right:"Confiança",tone:"light",turn:true},
{id:"stress-fatigue",left:"Stress",right:"Cansaço",tone:"heavy"},
{id:"stress-pressure",left:"Stress",right:"Pressão",tone:"heavy"},
{id:"stress-rest",left:"Stress",right:"Descanso",tone:"neutral"},
{id:"agitation-worry",left:"Agitação",right:"Preocupação",tone:"heavy"},
{id:"agitation-pause",left:"Agitação",right:"Pausa",tone:"light"},
{id:"tension-breath",left:"Tensão",right:"Respiração",tone:"light"},
{id:"tension-space",left:"Tensão",right:"Espaço",tone:"light"},
{id:"worry-doubt",left:"Preocupação",right:"Dúvida",tone:"heavy"},
{id:"worry-clarity",left:"Preocupação",right:"Clareza",tone:"light"},
{id:"fear-accept",left:"Medo",right:"Aceitar",tone:"light"},
{id:"fear-breath",left:"Medo",right:"Respiração",tone:"light"},
{id:"fear-courage",left:"Medo",right:"Coragem",tone:"light"},
{id:"alert-pause",left:"Alerta",right:"Pausa",tone:"light"},
{id:"alert-observe",left:"Alerta",right:"Observar",tone:"light"},
{id:"rush-pause",left:"Pressa",right:"Pausa",tone:"light"},
{id:"rush-rest",left:"Pressa",right:"Descanso",tone:"light"},
{id:"overload-balance",left:"Sobrecarga",right:"Equilíbrio",tone:"light"},
{id:"overload-rest",left:"Sobrecarga",right:"Descanso",tone:"light"},
{id:"check-pause",left:"Verificar",right:"Pausa",tone:"light"},
{id:"check-clarity",left:"Verificar",right:"Clareza",tone:"light"},
{id:"check-perspective",left:"Verificar",right:"Perspetiva",tone:"light"},
{id:"relief-confidence",left:"Alívio breve",right:"Confiança",tone:"light"},
{id:"relief-calm",left:"Alívio breve",right:"Calma",tone:"light"},
{id:"doubt-pause",left:"Dúvida",right:"Pausa",tone:"light"},
{id:"doubt-accept",left:"Dúvida",right:"Aceitar",tone:"light"},
{id:"avoid-observe",left:"Evitar",right:"Observar",tone:"light"},
{id:"avoid-accept",left:"Evitar",right:"Aceitar",tone:"light"},
{id:"pause-clarity",left:"Pausa",right:"Clareza",tone:"light"},
{id:"pause-presence",left:"Pausa",right:"Presença",tone:"light"},
{id:"pause-balance",left:"Pausa",right:"Equilíbrio",tone:"light"},
{id:"breath-presence",left:"Respiração",right:"Presença",tone:"light"},
{id:"breath-balance",left:"Respiração",right:"Equilíbrio",tone:"light"},
{id:"observe-calm",left:"Observar",right:"Calma",tone:"light"},
{id:"observe-confidence",left:"Observar",right:"Confiança",tone:"light"},
{id:"observe-action",left:"Observar",right:"Ação",tone:"light"},
{id:"space-calm",left:"Espaço",right:"Calma",tone:"light"},
{id:"space-accept",left:"Espaço",right:"Aceitar",tone:"light"},
{id:"perspective-accept",left:"Perspetiva",right:"Aceitar",tone:"light"},
{id:"perspective-action",left:"Perspetiva",right:"Ação",tone:"light"},
{id:"clarity-confidence",left:"Clareza",right:"Confiança",tone:"light"},
{id:"clarity-courage",left:"Clareza",right:"Coragem",tone:"light"},
{id:"action-calm",left:"Ação",right:"Calma",tone:"light"},
{id:"action-balance",left:"Ação",right:"Equilíbrio",tone:"light"},
{id:"confidence-calm",left:"Confiança",right:"Calma",tone:"light"},
{id:"confidence-presence",left:"Confiança",right:"Presença",tone:"light"},
{id:"courage-action",left:"Coragem",right:"Ação",tone:"light"},
{id:"courage-presence",left:"Coragem",right:"Presença",tone:"light"},
{id:"calm-balance",left:"Calma",right:"Equilíbrio",tone:"light"},
{id:"calm-wellbeing",left:"Calma",right:"Bem-estar",tone:"light"},
{id:"presence-clarity",left:"Presença",right:"Clareza",tone:"light"},
{id:"presence-action",left:"Presença",right:"Ação",tone:"light"},
{id:"balance-energy",left:"Equilíbrio",right:"Energia",tone:"light"},
{id:"wellbeing-energy",left:"Bem-estar",right:"Energia",tone:"light"},
{id:"rest-calm",left:"Descanso",right:"Calma",tone:"light"},
{id:"rest-balance",left:"Descanso",right:"Equilíbrio",tone:"light"},
{id:"energy-confidence",left:"Energia",right:"Confiança",tone:"light"},
{id:"accept-clarity",left:"Aceitar",right:"Clareza",tone:"light"},
{id:"accept-presence",left:"Aceitar",right:"Presença",tone:"light"},
{id:"wait-pause",left:"Esperar",right:"Pausa",tone:"light"},
{id:"wait-accept",left:"Esperar",right:"Aceitar",tone:"light"}
];

const IMPULSE_QUESTIONS:ImpulseQuestion[]=[
 {id:"q1",question:"Quando uma pessoa sente ansiedade, qual destas respostas descreve melhor o que pode acontecer?",answers:["A ansiedade obriga sempre a fugir","Pode aumentar a sensação de alerta e influenciar pensamentos e comportamentos","Significa que existe necessariamente um problema físico","Impede qualquer decisão racional"],correct:1,explanation:"A ansiedade pode aumentar o estado de alerta e influenciar a forma como pensamos e agimos, mas não determina uma única resposta."},
 {id:"q2",question:"Qual destas práticas pode ajudar a criar uma pequena pausa perante um momento de stress?",answers:["Parar e fazer algumas respirações lentas","Ignorar sempre o que se sente","Pesquisar sintomas durante horas","Evitar qualquer atividade"],correct:0,explanation:"Uma pausa curta pode criar espaço para observar o que está a acontecer antes de decidir o próximo passo."},
 {id:"q3",question:"O que significa reconhecer um padrão emocional?",answers:["Provar que vai acontecer novamente","Perceber relações que se repetem entre situações, pensamentos, emoções e ações","Diagnosticar uma doença","Eliminar automaticamente a emoção"],correct:1,explanation:"Reconhecer padrões é observar relações que parecem repetir-se; não significa prever o futuro nem fazer um diagnóstico."},
 {id:"q4",question:"Quando uma preocupação aparece repetidamente, qual pode ser uma resposta útil?",answers:["Verificar imediatamente todas as vezes","Criar uma pequena pausa e observar a vontade de verificar","Assumir que a preocupação é verdadeira","Nunca mais pensar no assunto"],correct:1,explanation:"Criar uma pausa permite observar a vontade de agir sem assumir que a preocupação determina o que tens de fazer."},
 {id:"q5",question:"Qual destas afirmações sobre emoções é mais adequada?",answers:["Emoções difíceis são sempre prejudiciais","Uma emoção difícil pode ser observada sem ter de ser eliminada imediatamente","As emoções determinam sempre o comportamento","Só emoções positivas são úteis"],correct:1,explanation:"Uma emoção pode ser reconhecida e observada sem que seja necessário eliminá-la imediatamente."},
 {id:"q6",question:"O que pode acontecer quando tentamos controlar todos os pensamentos?",answers:["Podemos ficar mais atentos a eles","Eles desaparecem sempre","Ficamos sempre calmos","Deixamos de sentir emoções"],correct:0,explanation:"Tentar controlar pensamentos de forma rígida pode aumentar a atenção dada a eles."},
 {id:"q7",question:"Qual é uma forma simples de observar uma emoção?",answers:["Dar-lhe um nome","Negá-la","Fugir sempre","Provar que está errada"],correct:0,explanation:"Dar um nome ao que sentimos pode ajudar a reconhecer a experiência sem a transformar numa certeza."},
 {id:"q8",question:"Uma preocupação é automaticamente um facto?",answers:["Sim, sempre","Não","Só à noite","Só quando parece intensa"],correct:1,explanation:"Uma preocupação é um pensamento ou possibilidade; não é, por si só, prova de que algo aconteceu."},
 {id:"q9",question:"O que pode ajudar a interromper uma reação automática?",answers:["Uma pequena pausa","Agir mais depressa","Verificar repetidamente","Ignorar tudo"],correct:0,explanation:"Uma pausa pode criar espaço entre o impulso e a decisão."},
 {id:"q10",question:"Qual destas opções descreve melhor a respiração lenta?",answers:["Inspirar e expirar sem pressa","Prender a respiração","Respirar o mais rápido possível","Evitar respirar profundamente"],correct:0,explanation:"Respirar de forma confortável e sem pressa pode ser usado como uma pequena pausa."},
 {id:"q11",question:"O que é um padrão?",answers:["Algo que se repete ou apresenta uma relação","Uma previsão certa","Um diagnóstico","Uma regra sem exceções"],correct:0,explanation:"Um padrão é uma repetição ou relação observável; não é uma garantia do que vai acontecer."},
 {id:"q12",question:"Quando sentes vontade de verificar algo outra vez, o que podes observar?",answers:["A vontade antes de agir","A certeza de que algo está errado","A obrigação de verificar","A resposta que queres encontrar"],correct:0,explanation:"Observar a vontade antes de agir pode ajudar a distinguir impulso de decisão."},
 {id:"q13",question:"Qual destas atitudes deixa mais espaço para uma escolha?",answers:["Parar por alguns segundos","Agir imediatamente","Evitar sempre","Pesquisar sem parar"],correct:0,explanation:"Uma breve pausa pode permitir escolher o próximo passo com mais consciência."},
 {id:"q14",question:"Uma emoção pode mudar ao longo do tempo?",answers:["Sim","Não","Só as emoções positivas","Só depois de dormir"],correct:0,explanation:"As emoções podem mudar de intensidade e forma ao longo do tempo."},
 {id:"q15",question:"O que significa aceitar uma emoção?",answers:["Reconhecer que ela está presente","Gostar dela","Concordar com todos os pensamentos","Fazer o que ela manda"],correct:0,explanation:"Aceitar aqui significa reconhecer a experiência sem exigir que desapareça imediatamente."},
 {id:"q16",question:"Qual destas é uma pergunta útil perante um pensamento?",answers:["Tenho a certeza de que isto é verdade?","Como posso verificar 20 vezes?","Como posso eliminar o pensamento?","Como posso evitar senti-lo?"],correct:0,explanation:"Questionar a certeza de um pensamento ajuda a separá-lo de um facto."},
 {id:"q17",question:"O que pode ajudar a perceber uma reação automática?",answers:["Observar situação, pensamento, emoção e ação","Ignorar a sequência","Procurar uma causa única","Assumir que será sempre igual"],correct:0,explanation:"Observar a sequência pode revelar relações sem assumir que existe apenas uma causa."},
 {id:"q18",question:"Qual destas opções pode criar distância de um impulso?",answers:["Esperar um pouco antes de agir","Agir imediatamente","Repetir a ação","Aumentar a verificação"],correct:0,explanation:"Esperar um pouco pode criar espaço para decidir em vez de reagir automaticamente."},
 {id:"q19",question:"O stress significa sempre que algo está errado?",answers:["Não","Sim","Só quando é intenso","Só quando dura um dia"],correct:0,explanation:"Stress é uma resposta que pode surgir perante diferentes exigências e não prova, por si só, que exista um problema."},
 {id:"q20",question:"Qual destas escolhas pode ser uma pequena ação de autocuidado?",answers:["Beber água","Verificar sintomas repetidamente","Ignorar necessidades básicas","Ficar imóvel por obrigação"],correct:0,explanation:"Atender a necessidades básicas pode ser uma pequena ação de cuidado, sem prometer um resultado emocional específico."},
 {id:"q21",question:"O que significa mudar o rumo?",answers:["Escolher um próximo passo diferente","Garantir que tudo corre bem","Eliminar emoções difíceis","Controlar o futuro"],correct:0,explanation:"Mudar o rumo significa escolher uma ação diferente; não significa controlar o resultado."},
 {id:"q22",question:"Qual destas frases separa melhor pensamento e facto?",answers:["Estou a ter o pensamento de que isto vai correr mal","Isto vai certamente correr mal","Se penso, é porque é verdade","Uma preocupação é uma prova"],correct:0,explanation:"Dizer que se está a ter um pensamento ajuda a identificá-lo como pensamento."},
 {id:"q23",question:"O que pode acontecer quando damos atenção a uma preocupação sem agir logo?",answers:["Podemos notar que o impulso muda","A preocupação torna-se automaticamente verdade","Deixamos de pensar para sempre","Garantimos que nada acontece"],correct:0,explanation:"O impulso pode mudar com o tempo; observar não garante um resultado específico."},
 {id:"q24",question:"Qual destas opções é mais adequada para uma pergunta de saúde mental?",answers:["Procurar informação fiável","Assumir o pior cenário","Pesquisar indefinidamente","Tratar uma possibilidade como certeza"],correct:0,explanation:"Informação fiável pode ajudar, enquanto transformar possibilidades em certezas pode aumentar a confusão."}
];

const QUESTS:Quest[]=[
{id:"water",label:"water",reward:"extra-choice",icon:"💧"},{id:"pause",label:"pause",reward:"extra-choice",icon:"⏸️"},
{id:"walk",label:"walk",reward:"reroll",icon:"🚶"},{id:"breathe",label:"breathe",reward:"extra-choice",icon:"🌬️"},
{id:"stretch",label:"stretch",reward:"hint",icon:"🧘"},{id:"window",label:"window",reward:"reroll",icon:"🌤️"},
{id:"community",label:"community",reward:"extra-choice",icon:"🤝"}
];

function readJson<T>(key:string,fallback:T):T{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function sample<T>(xs:T[],n:number){return [...xs].sort(()=>Math.random()-.5).slice(0,n)}
function pickHandTiles(count:number,excludeIds:string[]=[]){
 const excluded=new Set(excludeIds);
 const pool=DOMINOES.filter(d=>!excluded.has(d.id));
 const result:Domino[]=[];
 const candidates=[...pool];
 while(result.length<count&&candidates.length){
  const compatible=candidates.filter(d=>!result.some(r=>d.left.toLocaleLowerCase()===r.right.toLocaleLowerCase()||d.right.toLocaleLowerCase()===r.left.toLocaleLowerCase()));
  const source=compatible.length?compatible:candidates;
  const picked=sample(source,1)[0];
  if(!picked)break;
  result.push(picked);
  const index=candidates.findIndex(d=>d.id===picked.id);
  if(index>=0)candidates.splice(index,1);
 }
 return result;
}
function readHorizonProgress():HorizonProgress|null{return readJson<HorizonProgress|null>(HORIZON_PROGRESS_KEY,null)}
function formatRemaining(ms:number){if(ms<=0)return "0 d 00 h 00 m 00 s";const d=Math.floor(ms/86400000);const h=Math.floor(ms%86400000/3600000);const m=Math.floor(ms%3600000/60000);const s=Math.floor(ms%60000/1000);return `${d} d ${String(h).padStart(2,"0")} h ${String(m).padStart(2,"0")} m ${String(s).padStart(2,"0")} s`}

function PirateChest({open=false}:{open?:boolean}){
 return <div className="relative mx-auto h-[150px] w-[210px]" aria-hidden="true">
  <div className="absolute bottom-2 left-1/2 h-8 w-[190px] -translate-x-1/2 rounded-[50%] bg-[#b9844f]/25 blur-sm"/>
  <motion.svg animate={{y:[0,-3,0]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}} viewBox="0 0 220 160" className="relative h-full w-full drop-shadow-[0_16px_16px_rgba(78,49,27,.25)]">
   <defs>
    <linearGradient id="wood" x1="0" x2="1"><stop stopColor="#7e4328"/><stop offset=".48" stopColor="#a86235"/><stop offset="1" stopColor="#6c351f"/></linearGradient>
    <linearGradient id="gold" x1="0" x2="1"><stop stopColor="#f2cf78"/><stop offset=".5" stopColor="#b77b2f"/><stop offset="1" stopColor="#e9b958"/></linearGradient>
   </defs>
   <g transform={open?"translate(0 -7) rotate(-5 110 75)":undefined}>
    <path d="M35 70 C40 28 180 28 185 70 Z" fill="url(#wood)" stroke="#542818" strokeWidth="5"/>
    <path d="M42 65 C58 44 162 44 178 65" fill="none" stroke="url(#gold)" strokeWidth="10"/>
    <path d="M67 40 V70 M153 40 V70" stroke="url(#gold)" strokeWidth="8"/>
   </g>
   <rect x="30" y="68" width="160" height="72" rx="10" fill="url(#wood)" stroke="#542818" strokeWidth="5"/>
   <path d="M30 91 H190" stroke="#d79b48" strokeWidth="6"/>
   <path d="M58 69 V140 M162 69 V140" stroke="url(#gold)" strokeWidth="9"/>
   <rect x="96" y="88" width="28" height="34" rx="7" fill="url(#gold)" stroke="#704719" strokeWidth="3"/>
   <circle cx="110" cy="101" r="4" fill="#63401f"/><path d="M110 105 v8" stroke="#63401f" strokeWidth="3" strokeLinecap="round"/>
   <path d="M35 136 Q110 151 185 136" fill="#5e2f1c" opacity=".35"/>
   {open&&<motion.g initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}><rect x="78" y="46" width="65" height="42" rx="4" fill="#fff4d8" transform="rotate(-7 110 67)"/><path d="M88 58 H132 M88 66 H128 M88 74 H120" stroke="#c9a978" strokeWidth="2"/></motion.g>}
  </motion.svg>
 </div>
}

function DominoPiece({tile,draggable=false,compact=false,onDrop}:{tile:Domino;draggable?:boolean;compact?:boolean;onDrop?:(tile:Domino,x:number,y:number)=>void}){
 const bg=tile.tone==="light"?"from-[#fffef8] to-[#edf9f5]":tile.tone==="heavy"?"from-[#fffaf4] to-[#f7e6d8]":"from-white to-[#eef5f3]";
 return <motion.div drag={draggable} dragSnapToOrigin dragElastic={0.16} whileDrag={{scale:1.07,rotate:2,zIndex:80}} onDragEnd={(event,info)=>{
  const e=event as any;
  const clientX=typeof e?.clientX==="number"?e.clientX:info.point.x-window.scrollX;
  const clientY=typeof e?.clientY==="number"?e.clientY:info.point.y-window.scrollY;
  onDrop?.(tile,clientX,clientY);
 }}
  className={`relative flex ${compact?"h-[29px] w-[74px] rounded-[8px]":"h-[58px] w-[148px] rounded-[13px]"} shrink-0 cursor-grab touch-none select-none overflow-hidden border border-white/90 bg-gradient-to-br ${bg} shadow-[0_10px_20px_rgba(31,86,94,.18)] active:cursor-grabbing`}>
  <div className="flex w-1/2 items-center justify-center px-2 text-center text-[10px] font-black leading-tight text-[#285966]">{tile.left}</div>
  <div className="absolute bottom-2 top-2 left-1/2 w-px bg-[#7fa5a8]/35"/>
  <div className="flex w-1/2 items-center justify-center px-2 text-center text-[10px] font-black leading-tight text-[#285966]">{tile.right}</div>
  <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[#6c9aa0]/25"/><span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#6c9aa0]/25"/>
 </motion.div>
}

export default function HorizonExperience({onOpenSky}:{onOpenSky:()=>void}){
 const {i18n}=useTranslation();
 const lang=(i18n.resolvedLanguage||i18n.language||"pt").slice(0,2) as keyof typeof COPY;
 const c=COPY[lang]||COPY.pt;
 const monthCopy=MONTH_COPY[lang]||MONTH_COPY.pt;
 const boardRef=useRef<HTMLDivElement|null>(null);
 const [section,setSection]=useState<Section>("sky");
 const [capsule,setCapsule]=useState<Capsule|null>(()=>readJson(CAPSULE_KEY,null));
 const [draft,setDraft]=useState("");
 const [now,setNow]=useState(Date.now());
 const [guess,setGuess]=useState("");
 const [revealed,setRevealed]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [weeklyLog,setWeeklyLog]=useState<WeeklyReflection[]>(()=>readJson(WEEKLY_LOG_KEY,[]));
 const [monthTracker,setMonthTracker]=useState<MonthTracker|null>(()=>readJson(MONTH_TRACKER_KEY,null));
 const [monthSummary,setMonthSummary]=useState("");
 const [monthCompared,setMonthCompared]=useState(false);
 const [placed,setPlaced]=useState<PlacedDomino[]>(()=>readHorizonProgress()?.placed||readJson(DOMINO_KEY,[]));
 const [hand,setHand]=useState<Domino[]>(()=>{const saved=readHorizonProgress()?.hand;return saved?.length?saved:pickHandTiles(4)});
 const [bonuses,setBonuses]=useState(()=>readHorizonProgress()?.bonuses||readJson(BONUS_KEY,{extraChoices:0,rerolls:0,hints:0}));
 const [quest,setQuest]=useState<Quest>(()=>readHorizonProgress()?.quest||sample(QUESTS,1)[0]);
 const [questDone,setQuestDone]=useState(()=>readHorizonProgress()?.questDone||false);
 const [toast,setToast]=useState("");
 const [impulse,setImpulse]=useState<ImpulseQuestion|null>(null);
 const [impulseAnswer,setImpulseAnswer]=useState<number|null>(null);
 const [usedImpulseQuestions,setUsedImpulseQuestions]=useState<string[]>([]);
 const [pendingDrop,setPendingDrop]=useState<{tile:Domino;x:number;y:number;rotate:number;direction:Direction;obstacle:boolean}|null>(null);
 const [selectedPlaced,setSelectedPlaced]=useState<number|null>(null);

 const [unlockedIslands,setUnlockedIslands]=useState<number[]>(()=>readHorizonProgress()?.unlockedIslands||[0]);
 const [treasureOpen,setTreasureOpen]=useState(false);
 const [treasureAnswer,setTreasureAnswer]=useState(()=>readHorizonProgress()?.treasureAnswer||"");
 const [horizonIntroOpen,setHorizonIntroOpen]=useState(false);
 const [horizonResumeOpen,setHorizonResumeOpen]=useState(false);
 const [junction,setJunction]=useState<JunctionPair|null>(null);
 const [junctionExplanation,setJunctionExplanation]=useState("");
 const [junctions,setJunctions]=useState<Junction[]>(()=>readHorizonProgress()?.junctions||readJson(HORIZON_JUNCTIONS_KEY,[]));
 const [wordPromptOpen,setWordPromptOpen]=useState(false);
 const [neededWord,setNeededWord]=useState("");
 const [wordTile,setWordTile]=useState<Domino|null>(null);
 const [wordMoment,setWordMoment]=useState("");

 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{localStorage.setItem(WEEKLY_LOG_KEY,JSON.stringify(weeklyLog))},[weeklyLog]);
 useEffect(()=>{if(monthTracker)localStorage.setItem(MONTH_TRACKER_KEY,JSON.stringify(monthTracker))},[monthTracker]);
 useEffect(()=>{if(!capsule)return;const buried=new Date(capsule.buriedAt).getTime();const opens=new Date(capsule.opensAt).getTime();if(opens-buried>8*86400000){const migrated={...capsule,opensAt:new Date(buried+7*86400000).toISOString()};localStorage.setItem(CAPSULE_KEY,JSON.stringify(migrated));setCapsule(migrated)}},[]);
 useEffect(()=>{if(!capsule||monthTracker)return;const start=new Date(capsule.buriedAt);const tracker={startedAt:start.toISOString(),dueAt:new Date(start.getTime()+30*86400000).toISOString()};setMonthTracker(tracker)},[capsule,monthTracker]);
 useEffect(()=>{if(monthTracker?.comparedAt){setMonthCompared(true);setMonthSummary(monthTracker.summary||"")}},[]);
 useEffect(()=>{localStorage.setItem(DOMINO_KEY,JSON.stringify(placed))},[placed]);
 useEffect(()=>{localStorage.setItem(BONUS_KEY,JSON.stringify(bonuses))},[bonuses]);
 useEffect(()=>{localStorage.setItem(HORIZON_JUNCTIONS_KEY,JSON.stringify(junctions))},[junctions]);
 useEffect(()=>{localStorage.setItem(HORIZON_PROGRESS_KEY,JSON.stringify({placed,hand,bonuses,unlockedIslands,junctions,treasureAnswer,quest,questDone}))},[placed,hand,bonuses,unlockedIslands,junctions,treasureAnswer,quest,questDone]);
 useEffect(()=>{const onCommunity=()=>{setBonuses(readJson(BONUS_KEY,{extraChoices:0,rerolls:0,hints:0}));setToast(c.bonus);setTimeout(()=>setToast(""),2200)};window.addEventListener(COMMUNITY_EVENT,onCommunity);return()=>window.removeEventListener(COMMUNITY_EVENT,onCommunity)},[c.bonus]);

 const hasSavedJourney=placed.length>0||junctions.length>0||unlockedIslands.length>1||Boolean(treasureAnswer.trim());
 const remaining=capsule?new Date(capsule.opensAt).getTime()-now:0;
 const canOpen=Boolean(capsule&&remaining<=0);
 const monthRemaining=monthTracker?new Date(monthTracker.dueAt).getTime()-now:0;
 const monthDue=Boolean(monthTracker&&monthRemaining<=0);
 const monthReflections=useMemo(()=>monthTracker?weeklyLog.filter(item=>new Date(item.at).getTime()>=new Date(monthTracker.startedAt).getTime()&&new Date(item.at).getTime()<=new Date(monthTracker.dueAt).getTime()+86400000):[],[weeklyLog,monthTracker]);
 const connectionValue=(p:PlacedDomino|undefined)=>{
  if(!p)return "Stress";
  // Quando a peça está virada para cima, o valor que fica no topo é o
  // lado esquerdo original; virada para baixo, o valor no fundo é o
  // lado direito original. A ligação seguinte deve usar esse extremo visível.
  if(p.rotate===270)return p.tile.left;
  if(p.rotate===90)return p.tile.right;
  return p.tile.right;
};
 const lastRight=connectionValue(placed[placed.length-1]);
 const lastPlaced=placed[placed.length-1];

 const reverseWordDirection=useMemo(()=>{
  const nextSlot=placed.length;
  const segment=Math.floor(nextSlot/3);
  return segment%2===1;
 },[placed.length]);
 const availableWordTiles=useMemo(()=>{
  const wanted=neededWord.trim().toLocaleLowerCase();
  if(!wanted)return [];
  // Nos segmentos que avançam da direita para a esquerda (5→8 e 9→12),
  // a palavra pedida é a que está no lado esquerdo da peça.
  // Nos restantes, procuramos a palavra no lado direito.
  const side=reverseWordDirection?"left":"right";
  return DOMINOES.filter(d=>d[side].trim().toLocaleLowerCase()===wanted);
 },[neededWord,reverseWordDirection]);
 const neededWordSuggestions=useMemo(()=>{
  const recentIds=new Set(placed.slice(-12).map(p=>p.tile.id));
  const side=reverseWordDirection?"left":"right";
  const unique=DOMINOES.filter(d=>!recentIds.has(d.id)).reduce<Domino[]>((acc,d)=>acc.some(x=>x[side].toLocaleLowerCase()===d[side].toLocaleLowerCase())?acc:[...acc,d],[]);
  return sample(unique,8);
 },[placed,reverseWordDirection]);

 const bury=()=>{if(!draft.trim())return;const buriedAt=new Date();const opensAt=new Date(buriedAt.getTime()+7*86400000);const next={message:draft.trim(),buriedAt:buriedAt.toISOString(),opensAt:opensAt.toISOString(),cycle:(capsule?.cycle||0)+1};localStorage.setItem(CAPSULE_KEY,JSON.stringify(next));setCapsule(next);if(!monthTracker){setMonthTracker({startedAt:buriedAt.toISOString(),dueAt:new Date(buriedAt.getTime()+30*86400000).toISOString()})}setNow(Date.now());setDraft("");setGuess("");setRevealed(false)};
 const rebury=()=>{if(!capsule||!feedback.trim())return;const reflection={at:new Date().toISOString(),message:capsule.message,guess:guess.trim(),feedback:feedback.trim()};setWeeklyLog(prev=>[...prev,reflection]);const buriedAt=new Date();const opensAt=new Date(buriedAt.getTime()+7*86400000);const next={message:feedback.trim(),buriedAt:buriedAt.toISOString(),opensAt:opensAt.toISOString(),cycle:capsule.cycle+1,feedback:feedback.trim()};localStorage.setItem(CAPSULE_KEY,JSON.stringify(next));setCapsule(next);setNow(Date.now());setFeedback("");setGuess("");setRevealed(false)};
 const compareMonth=()=>{if(!monthTracker||!monthSummary.trim())return;setMonthCompared(true);setMonthTracker({...monthTracker,summary:monthSummary.trim(),comparedAt:new Date().toISOString()})};
 const closeMonth=()=>{const start=new Date();const next={startedAt:start.toISOString(),dueAt:new Date(start.getTime()+30*86400000).toISOString()};setMonthTracker(next);setMonthSummary("");setMonthCompared(false)};

 const rewardQuest=()=>{
  if(questDone)return;
  setBonuses((b:any)=>quest.reward==="extra-choice"?{...b,extraChoices:Math.min(2,b.extraChoices+1)}:quest.reward==="reroll"?{...b,rerolls:b.rerolls+1}:{...b,hints:b.hints+1});
  const next=sample(QUESTS.filter(q=>q.id!==quest.id),1)[0]||quest;
  setQuest(next);
  setQuestDone(false);
  setToast(c.bonus);setTimeout(()=>setToast(""),2200);
 };
 const reset=()=>{setBonuses({extraChoices:0,rerolls:0,hints:0});setHand(pickHandTiles(4));setPlaced([]);localStorage.removeItem(DOMINO_KEY);localStorage.removeItem(HORIZON_PROGRESS_KEY);setQuest(sample(QUESTS,1)[0]);setQuestDone(false);setUnlockedIslands([0]);setImpulse(null);setPendingDrop(null);setImpulseAnswer(null);setSelectedPlaced(null);setJunction(null);setJunctionExplanation("");setJunctions([]);localStorage.removeItem(HORIZON_JUNCTIONS_KEY);setTreasureOpen(false);setTreasureAnswer("");setWordPromptOpen(false);setNeededWord("");setWordTile(null);setWordMoment("")};
 const enterSection=(next:Section)=>{setSection(next);if(next==="sea"){setImpulse(null);setPendingDrop(null);setImpulseAnswer(null);setSelectedPlaced(null);setHorizonResumeOpen(true)}};
 const startNewJourney=()=>{reset();setHorizonResumeOpen(false);setHorizonIntroOpen(true)};
 const continueJourney=()=>{setHorizonResumeOpen(false)};
 const reroll=()=>{if(bonuses.rerolls<=0)return;setBonuses((b:any)=>({...b,rerolls:b.rerolls-1}));setQuestDone(v=>!v)};
 const islands=Array.from({length:12},(_,index)=>{
  const row=Math.floor(index/4);
  const column=index%4;
  const snakeColumn=row%2===0?column:3-column;
  return {x:[.10,.36,.64,.90][snakeColumn],y:[.16,.50,.84][row],...(index===11?{treasure:true}: {})};
 });
 const seaObstacles=[
  {x:.50,y:.16,type:"🌀",label:"Remoinho"},
  {x:.50,y:.50,type:"🐙",label:"Kraken"},
  {x:.25,y:.84,type:"🌀",label:"Remoinho"}
 ];
 const touchingObstacle=(x:number,y:number,boardWidth:number,boardHeight:number,rotate=0)=>{
  const w=rotate===90||rotate===270?29:74;
  const h=rotate===90||rotate===270?74:29;
  return seaObstacles.some(o=>{
   const cx=boardWidth*o.x,cy=boardHeight*o.y;
   return x+w>=cx-28&&x<=cx+28&&y+h>=cy-28&&y<=cy+28;
  });
 };
 const routeSlot=(slot:number,boardWidth:number,boardHeight:number)=>{
  const segment=Math.floor(slot/3);
  const within=slot%3;
  const from=islands[segment];
  const to=islands[segment+1];
  const t=(within+1)/4;
  const fromX=boardWidth*from.x;
  const fromY=boardHeight*from.y;
  const toX=boardWidth*to.x;
  const toY=boardHeight*to.y;
  const vertical=from.y!==to.y;
  const w=vertical?29:74;
  const h=vertical?74:29;
  return {
   x:Math.max(4,Math.min(boardWidth-w-4,fromX+(toX-fromX)*t-w/2)),
   y:Math.max(6,Math.min(boardHeight-h-6,fromY+(toY-fromY)*t-h/2)),
   rotate:vertical?90:0,
   direction:vertical?"down":"right" as Direction
  };
 };
 const requestWord=()=>{setNeededWord("");setWordTile(null);setWordMoment("");setWordPromptOpen(true)};
 const findNeededWord=()=>{
  if(!neededWord.trim())return;
  if(availableWordTiles.length===0){setToast(c.needWordNoMatch);setTimeout(()=>setToast(""),2200);return}
  // Nunca escolher sempre o mesmo domino: baralhamos os candidatos e
  // evitamos, quando possível, peças usadas recentemente.
  const recentIds=new Set(placed.slice(-12).map(p=>p.tile.id));
  const fresh=availableWordTiles.filter(tile=>!recentIds.has(tile.id));
  const pool=fresh.length?fresh:availableWordTiles;
  setWordTile(sample(pool,1)[0]);
 };
 const saveWordMoment=()=>{
  if(!wordTile||!wordMoment.trim()||!boardRef.current)return;
  const rect=boardRef.current.getBoundingClientRect();if(placed.length>=33)return;
  const slot=routeSlot(placed.length,rect.width,rect.height);const obstacle=touchingObstacle(slot.x,slot.y,rect.width,rect.height,slot.rotate);
  const pending={tile:wordTile,x:slot.x,y:slot.y,rotate:slot.rotate,direction:slot.direction,obstacle};
  if(obstacle){setWordTile(null);setWordMoment("");setWordPromptOpen(false);askQuestionForDrop(pending);return}
  placeTile(pending);finishPlacement(placed.length);setWordTile(null);setWordMoment("");setWordPromptOpen(false);setToast(c.needWordSaved);setTimeout(()=>setToast(""),2200)
 };
 const junctionForIsland=(islandIndex:number):JunctionPair|null=>{
  const pairs:JunctionPair[]=[
   {slot:1,left:lang==="pt"?"MEDO":lang==="es"?"MIEDO":lang==="fr"?"PEUR":"FEAR",right:lang==="pt"?"PESQUISAS":lang==="es"?"INVESTIGACIONES":lang==="fr"?"RECHERCHES":"RESEARCH"},
   {slot:5,left:lang==="pt"?"ANSIEDADE":lang==="es"?"ANSIEDAD":lang==="fr"?"ANXIÉTÉ":"ANXIETY",right:"TIQUES"},
   {slot:8,left:lang==="pt"?"CONTROLO":lang==="es"?"CONTROL":lang==="fr"?"CONTRÔLE":"CONTROL",right:lang==="pt"?"ALÍVIO":lang==="es"?"ALIVIO":lang==="fr"?"SOULAGEMENT":"RELIEF"}
  ];
  return pairs.find(p=>p.slot===islandIndex)||null;
 };
 const openJunction=(islandIndex:number)=>{const pair=junctionForIsland(islandIndex);if(pair){setJunction(pair);setJunctionExplanation("");}};
 const saveJunction=()=>{if(!junction||!junctionExplanation.trim())return;setJunctions(prev=>[...prev.filter(x=>x.slot!==junction.slot),{slot:junction.slot,left:junction.left,right:junction.right,explanation:junctionExplanation.trim()}]);setJunction(null);setJunctionExplanation("");setToast(c.junctionSaved);setTimeout(()=>setToast(""),1800)};
 const buildTreasureReflection=()=>{
  if(junctions.length<3)return c.treasureEmpty;
  const joined=[...junctions].sort((a,b)=>a.slot-b.slot),first=joined[0],second=joined[1],third=joined[2];
  if(lang==="pt")return `Nas três junções, escolheste aproximar “${first.left}” de “${first.right}”, “${second.left}” de “${second.right}” e “${third.left}” de “${third.right}”. Nas tuas explicações, a CONFIA encontra um fio possível: estás a construir relações entre aquilo que sentes, aquilo que fazes e aquilo que procuras compreender. O mais importante é que estas ligações foram tuas. Vê se, ao reler o caminho, reconheces alguma relação que mereça ser observada com mais atenção.`;
  if(lang==="es")return `En las tres conexiones, elegiste acercar “${first.left}” a “${first.right}”, “${second.left}” a “${second.right}” y “${third.left}” a “${third.right}”. En tus explicaciones, CONFIA encuentra un posible hilo: estás construyendo relaciones entre lo que sientes, lo que haces y lo que intentas comprender. Lo importante es que estas conexiones fueron tuyas. Al mirar de nuevo el camino, comprueba si reconoces alguna relación que merezca observarse con más atención.`;
  if(lang==="fr")return `Dans les trois connexions, tu as rapproché « ${first.left} » de « ${first.right} », « ${second.left} » de « ${second.right} » et « ${third.left} » de « ${third.right} ». Dans tes explications, CONFIA voit un fil possible : tu construis des liens entre ce que tu ressens, ce que tu fais et ce que tu cherches à comprendre. L’essentiel est que ces liens viennent de toi. En regardant le chemin, vois si tu reconnais une relation qui mérite d’être observée davantage.`;
  return `In the three connections, you brought “${first.left}” closer to “${first.right}”, “${second.left}” to “${second.right}”, and “${third.left}” to “${third.right}”. In your explanations, CONFIA finds a possible thread: you are building relationships between what you feel, what you do, and what you are trying to understand. What matters is that these connections came from you. As you look back at the path, see whether you recognise a relationship worth observing more closely.`;
 };
 const finishPlacement=(nextSlot:number)=>{
  if(nextSlot%3===2){
   const reachedIsland=Math.floor(nextSlot/3)+1;
   if(reachedIsland<islands.length)setUnlockedIslands(prev=>prev.includes(reachedIsland)?prev:[...prev,reachedIsland]);
   if([1,5,8].includes(reachedIsland))setTimeout(()=>openJunction(reachedIsland),260);
   if(reachedIsland===11)setTimeout(()=>setTreasureOpen(true),520);
  }
 };
 const nextImpulseQuestion=(excludeId?:string)=>{
  const available=IMPULSE_QUESTIONS.filter(q=>q.id!==excludeId&&!usedImpulseQuestions.includes(q.id));
  const pool=available.length?available:IMPULSE_QUESTIONS.filter(q=>q.id!==excludeId);
  return sample(pool.length?pool:IMPULSE_QUESTIONS,1)[0];
 };
 const askQuestionForDrop=(drop:{tile:Domino;x:number;y:number;rotate:number;direction:Direction;obstacle:boolean})=>{
  const first=nextImpulseQuestion();
  setPendingDrop(drop);setImpulse(first);setImpulseAnswer(null);setUsedImpulseQuestions(prev=>[...prev,first.id]);
 };
 const replenishHand=(usedTile:Domino)=>{
  setHand(current=>{
   if(!current.some(tile=>tile.id===usedTile.id))return current;
   const excludedIds=[...current.map(tile=>tile.id),...placed.slice(-24).map(p=>p.tile.id),usedTile.id];
   const candidates=DOMINOES.filter(tile=>{
    if(excludedIds.includes(tile.id))return false;
    if(tile.left.toLocaleLowerCase()===usedTile.right.toLocaleLowerCase())return false;
    if(tile.right.toLocaleLowerCase()===usedTile.left.toLocaleLowerCase())return false;
    if(current.some(existing=>tile.left.toLocaleLowerCase()===existing.right.toLocaleLowerCase()||tile.right.toLocaleLowerCase()===existing.left.toLocaleLowerCase()))return false;
    return true;
   });
   const replacement=sample(candidates.length?candidates:DOMINOES.filter(tile=>!excludedIds.includes(tile.id)),1)[0];
   return replacement?[...current.filter(tile=>tile.id!==usedTile.id),replacement]:current;
  });
 };
 const placeTile=(drop:{tile:Domino;x:number;y:number;rotate:number;direction:Direction;obstacle:boolean})=>{
  setPlaced(prev=>[...prev,{tile:drop.tile,x:drop.x,y:drop.y,rotate:drop.rotate,direction:drop.direction}]);
  replenishHand(drop.tile);
  if(bonuses.extraChoices>0)setBonuses((b:any)=>({...b,extraChoices:Math.max(0,b.extraChoices-1)}));
  setQuest(sample(QUESTS,1)[0]);setQuestDone(false);
 };
 const answerImpulse=(index:number)=>{
  if(!impulse)return;
  setImpulseAnswer(index);
  if(index===impulse.correct){
   if(pendingDrop){
    const nextSlot=placed.length;
    placeTile(pendingDrop);
    finishPlacement(nextSlot);
   }
   setTimeout(()=>{setImpulse(null);setImpulseAnswer(null);setPendingDrop(null);setUsedImpulseQuestions([])},850);
  } else {
   if(pendingDrop?.obstacle){
    setPlaced([]);
    setUnlockedIslands([0]);
    setPendingDrop(null);
    setImpulse(null);
    setImpulseAnswer(null);
    setUsedImpulseQuestions([]);
    setToast("O mar levou-te de volta à Ilha 1.");
    setTimeout(()=>setToast(""),2400);
    return;
   }
   // Nas perguntas normais, o erro pede outra reflexão sem perder o percurso.
   setTimeout(()=>{
    const next=nextImpulseQuestion(impulse.id);
    setImpulse(next);setImpulseAnswer(null);setUsedImpulseQuestions(prev=>[...prev,next.id]);
   },650);
  }
 };
 const dropDomino=(tile:Domino,clientX:number,clientY:number)=>{
  const board=boardRef.current;if(!board)return;
  const rect=board.getBoundingClientRect();
  const inside=clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom;
  if(!inside){setToast(c.choose);setTimeout(()=>setToast(""),1400);return}
  if(placed.length>=33){setToast("O teu horizonte está completo.");setTimeout(()=>setToast(""),1800);return}
  const slot=routeSlot(placed.length,rect.width,rect.height);
  const obstacle=touchingObstacle(slot.x,slot.y,rect.width,rect.height,slot.rotate);
  const pending={tile,x:slot.x,y:slot.y,rotate:slot.rotate,direction:slot.direction,obstacle};
  // O mapa decide automaticamente a posição e a direção da peça.
  // Remoinhos e Kraken são provas do percurso: se o utilizador errar, regressa à Ilha 1.
  if(obstacle){
   askQuestionForDrop(pending);
   return;
  }
  placeTile(pending);
  finishPlacement(placed.length);
 };

 return <div className="mx-auto w-full max-w-3xl pb-4">
  <div className="relative overflow-hidden rounded-[30px] border border-[#d9d2ca]/70 bg-[#fffaf6] shadow-[0_20px_55px_rgba(61,47,40,.11)]">
   <div className="relative min-h-[205px] overflow-hidden bg-[linear-gradient(180deg,#52669e_0%,#8794c0_48%,#f1b7a1_100%)] px-5 pb-16 pt-5 text-white">
    <div className="absolute inset-0 opacity-75" style={{backgroundImage:"radial-gradient(circle at 12% 20%,white 0 1px,transparent 1.8px),radial-gradient(circle at 42% 36%,white 0 1.3px,transparent 2px),radial-gradient(circle at 70% 15%,white 0 1px,transparent 1.7px),radial-gradient(circle at 88% 30%,white 0 1.2px,transparent 2px)"}}/>
    <div className="absolute right-8 top-7 h-10 w-10 rounded-full bg-[#fff2c8] shadow-[0_0_28px_rgba(255,241,195,.55)] before:absolute before:-left-2 before:-top-1 before:h-10 before:w-10 before:rounded-full before:bg-[#6071aa]"/>
    <motion.div animate={{y:[0,-3,0]}} transition={{duration:5,repeat:Infinity}} className="relative z-10 max-w-[82%]">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-white/70">✦ CONFIA</p>
      <h2 className="mt-2 text-[26px] font-black tracking-[-.02em]">{c.horizon}</h2>
      <p className="mt-1 text-[12px] font-semibold leading-relaxed text-white/82">{c.horizonSub}</p>
    </motion.div>
   </div>

   <div className="relative z-30 -mt-7 mx-3 grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/70 bg-white/80 p-1.5 shadow-[0_10px_26px_rgba(83,58,45,.10)] backdrop-blur-xl">
    {([["sky",c.sky,"✦"],["sand",c.sand,"⌁"],["sea",c.sea,"≈"]] as const).map(([id,label,icon])=><button key={id} onClick={()=>enterSection(id)} className={`rounded-[17px] px-2 py-2.5 text-[10px] font-black transition ${section===id?"bg-white text-[#8f503e] shadow-sm":"text-[#776863]"}`}><span className="mr-1.5">{icon}</span>{label}</button>)}
   </div>

   <AnimatePresence mode="wait">
    {section==="sky"&&<motion.section key="sky" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="px-5 pb-6 pt-7">
      <button onClick={onOpenSky} className="group relative w-full overflow-hidden rounded-[24px] border border-[#7f8bc4]/25 bg-[#11162e] p-5 text-left text-white shadow-[0_14px_30px_rgba(21,24,55,.18)]">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(137,153,228,.35),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(136,91,177,.28),transparent_42%)]"/>
       <div className="relative flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Sparkles size={20}/></div><div><p className="text-[15px] font-black">{c.sky}</p><p className="mt-1 text-[11px] font-medium text-white/65">{c.skySub}</p></div><ChevronRight className="ml-auto opacity-70" size={18}/></div>
      </button>
    </motion.section>}

    {section==="sand"&&<motion.section key="sand" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="relative overflow-hidden px-5 pb-7 pt-7">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fff9ef_0%,#f5d7ad_100%)]"/>
      <div className="absolute -bottom-12 -left-12 h-48 w-[125%] rotate-[-2deg] rounded-[50%] bg-[#e7bb82]/55"/>
      <div className="relative">
       <div><h3 className="text-[20px] font-black text-[#3d302b]">{c.capsule}</h3><p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#7b665d]">{c.sandSub}</p></div>
       <PirateChest open={revealed}/>
       {monthTracker&&<div className="mb-4 rounded-[22px] border border-[#d9c3a8]/70 bg-white/72 p-4 shadow-[0_10px_24px_rgba(102,72,50,.08)] backdrop-blur-sm">
        {!monthDue?<div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9a6549]">{monthCopy.monthWaiting}</p><p className="mt-1 text-[11px] font-semibold text-[#6e5a50]">{monthCopy.monthIn}</p></div><p className="text-[13px] font-black text-[#7e4f39]">{formatRemaining(monthRemaining)}</p></div>:
        !monthCompared?<div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9a6549]">{monthCopy.monthTitle}</p><p className="mt-2 text-[13px] font-black leading-relaxed text-[#49372f]">{monthCopy.monthPrompt}</p><textarea value={monthSummary} onChange={e=>setMonthSummary(e.target.value)} maxLength={900} placeholder={monthCopy.monthPlaceholder} className="mt-3 min-h-[115px] w-full resize-none rounded-[16px] border border-[#dcc5ad] bg-white/90 p-3 text-[12px] font-medium text-[#49372f] outline-none"/><button disabled={!monthSummary.trim()} onClick={compareMonth} className="mt-3 w-full rounded-[16px] bg-[#6f4938] py-3 text-[11px] font-black text-white disabled:opacity-40">{monthCopy.monthCompare}</button></div>:
        <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9a6549]">{monthCopy.monthYourSummary}</p><p className="mt-2 rounded-[16px] bg-[#fff8ed] p-3 text-[12px] font-bold leading-relaxed text-[#49372f]">{monthTracker.summary||monthSummary}</p><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-[#9a6549]">{monthCopy.monthWeekly}</p><div className="mt-2 grid gap-2">{monthReflections.length?monthReflections.map((item,index)=><div key={item.at+index} className="rounded-[14px] border border-[#ead8c4] bg-white/85 p-3"><p className="text-[9px] font-black text-[#a06a4f]">Semana {index+1}</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#5d4b42]">{item.feedback}</p></div>):<p className="rounded-[14px] bg-white/75 p-3 text-[11px] font-semibold text-[#7a675f]">Ainda não há feedbacks semanais registados neste ciclo.</p>}</div><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-[#9a6549]">{monthCopy.monthCombined}</p><p className="mt-2 rounded-[16px] bg-[#f8efe2] p-3 text-[11px] font-semibold leading-relaxed text-[#58483f]">{monthReflections.map(item=>item.feedback).join(" • ")||"—"}</p><button onClick={closeMonth} className="mt-3 w-full rounded-[16px] bg-[#8f503e] py-3 text-[11px] font-black text-white">{monthCopy.monthClose}</button></div>}
       </div>}
       {!capsule?<div className="-mt-3 rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_12px_30px_rgba(102,72,50,.08)] backdrop-blur-sm"><textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={700} placeholder={c.placeholder} className="min-h-[120px] w-full resize-none rounded-[18px] border border-[#e7d4bd] bg-white/80 p-3 text-[13px] font-medium text-[#493b35] outline-none placeholder:text-[#a7958c]"/><button onClick={bury} disabled={!draft.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#8f503e] px-4 py-3 text-[11px] font-black text-white shadow-[0_9px_20px_rgba(143,80,62,.22)] disabled:opacity-40"><LockKeyhole size={15}/>{c.bury}</button></div>:
       <div className="-mt-3">
        <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 text-center shadow-[0_12px_28px_rgba(102,72,50,.10)] backdrop-blur-md"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#a4654d]">{c.buried}</p><p className="mt-1.5 text-[22px] font-black text-[#4a352d]">{formatRemaining(remaining)}</p><p className="mt-1 text-[10px] font-bold text-[#8d776e]">Ciclo {capsule.cycle}</p></div>
        {canOpen&&!revealed&&<div className="mt-4 rounded-[22px] bg-white/70 p-4"><p className="text-[12px] font-black text-[#49372f]">{c.guess}</p><textarea value={guess} onChange={e=>setGuess(e.target.value)} maxLength={700} placeholder={c.guessPlaceholder} className="mt-3 min-h-[110px] w-full resize-none rounded-[16px] border border-[#dcc5ad] bg-white/90 p-3 text-[12px] font-medium text-[#49372f] outline-none placeholder:text-[#a18d82]"/><button disabled={!guess.trim()} onClick={()=>setRevealed(true)} className="mt-4 w-full rounded-[16px] bg-[#3d302b] py-3 text-[11px] font-black text-white disabled:opacity-40">{c.open}</button></div>}
        {revealed&&<div className="mt-4 rounded-[22px] border border-white/70 bg-white/85 p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#a4654d]">{c.reveal}</p><div className="mt-3 grid gap-3"><div className="rounded-[16px] border border-[#ead7c4] bg-[#fffdf9] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#9b765f]">{c.remembered}</p><p className="mt-1.5 whitespace-pre-wrap text-[12px] font-semibold leading-relaxed text-[#5b4840]">{guess}</p></div><div className="rounded-[16px] border border-[#d9c1a3] bg-[#fff7e9] p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#9a5b3f]">{c.actual}</p><p className="mt-1.5 whitespace-pre-wrap text-[13px] font-bold leading-relaxed text-[#443631]">{capsule.message}</p></div></div><p className="mt-4 text-[11px] font-black text-[#49372f]">{c.feedback}</p><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} className="mt-2 min-h-[90px] w-full rounded-[16px] border border-[#ead7c4] bg-white p-3 text-[12px] outline-none"/><button disabled={!feedback.trim()} onClick={rebury} className="mt-3 w-full rounded-[16px] bg-[#8f503e] py-3 text-[11px] font-black text-white disabled:opacity-40">{c.rebury}</button></div>}
       </div>}
      </div>
    </motion.section>}

    {section==="sea"&&<motion.section key="sea" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="relative overflow-hidden px-4 pb-7 pt-6">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#e7f7f4_0%,#b9e5e2_24%,#78c8ce_58%,#4eabb8_100%)]"/>
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.96),transparent_70%)]"/>
      <div className="relative">
       <div className="px-1"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/55 text-[#176878] shadow-sm"><Waves size={22}/></div><div><h3 className="text-[20px] font-black text-[#174f5b]">{c.sea}</h3><p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#39727b]">{c.seaSub}</p></div></div></div>
       <div ref={boardRef} className="relative mt-4 h-[430px] overflow-hidden rounded-[28px] border border-white/60 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.48),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.16),rgba(27,128,145,.18))] shadow-[inset_0_0_45px_rgba(255,255,255,.22)]">
        <motion.div animate={{x:[-16,16,-16]}} transition={{duration:8,repeat:Infinity,ease:"easeInOut"}} className="absolute -left-10 top-7 h-10 w-[120%] rounded-[50%] border-t border-white/40 opacity-70"/>
        <motion.div animate={{x:[14,-14,14]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} className="absolute -left-10 top-32 h-12 w-[120%] rounded-[50%] border-t border-white/30 opacity-70"/>
        {seaObstacles.map((o,i)=><motion.div key={o.type+i} animate={{y:[0,-3,0],rotate:o.type==="🌀"?[0,8,-8,0]:[0,-2,0]}} transition={{duration:o.type==="🌀"?2.8:4.2,repeat:Infinity}} className="absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/40 bg-[#0e6572]/25 text-center shadow-sm backdrop-blur-[1px]" style={{left:`${o.x*100}%`,top:`${o.y*100}%`}}><span className="text-[20px] leading-none">{o.type}</span><span className="mt-0.5 text-[5px] font-black uppercase tracking-[.08em] text-white/80">{o.label}</span></motion.div>)}
        {islands.map((island,index)=>{const unlocked=unlockedIslands.includes(index);const treasure=Boolean((island as any).treasure);return <div key={index} className={`absolute flex h-12 ${treasure?"w-20":"w-16"} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[45%] border text-center shadow-[0_7px_14px_rgba(38,103,116,.20)] ${treasure?"border-[#f2cf70] bg-[radial-gradient(ellipse_at_45%_35%,#fff1b4,#c99942)]":unlocked?"border-emerald-300 bg-[radial-gradient(ellipse_at_45%_35%,#d9f4df,#75c69a)]":"border-[#d7c18c] bg-[radial-gradient(ellipse_at_45%_35%,#e6d3a0,#b7a16d)]"}`} style={{left:`${island.x*100}%`,top:`${island.y*100}%`}}><span className={`text-[6px] font-black uppercase tracking-[.10em] ${treasure?"text-[#765018]":unlocked?"text-emerald-800":"text-[#6d5b3d]"}`}>{treasure?"🏆 Ilha Tesouro":unlocked?"✓ ":""}{!treasure&&`Impulso ${index+1}`}</span></div>})}
        <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-[9px] font-black text-[#286b76] backdrop-blur">{c.start}: {placed[0]?.tile.left}</div>
        {placed.map((p,i)=><motion.div key={p.tile.id+"-"+i} drag={false} onClick={()=>setSelectedPlaced(i)} onDragEnd={(_,info)=>{const w=74;const board=boardRef.current;if(!board)return;const rect=board.getBoundingClientRect();const prev=placed[i-1];const next=placed[i+1];let nx=Math.max(4,Math.min(rect.width-w-4,p.x+info.offset.x));const ny=Math.max(6,Math.min(rect.height-35,p.y+info.offset.y));if(prev){const requiredX=prev.x+w+4;if(Math.abs(nx-requiredX)>12){setToast("A peça tem de ficar ligada à lateral direita da anterior");setTimeout(()=>setToast(""),1800);return}nx=requiredX}if(next&&next.x<=nx+w+4){setToast("Não podes ultrapassar a peça seguinte");setTimeout(()=>setToast(""),1600);return}setPlaced(prevPlaced=>prevPlaced.map((q,j)=>j===i?{...q,x:nx,y:ny}:q));}} initial={{opacity:0,scale:.88}} animate={{opacity:1,scale:1,y:[0,i%2?2:-2,0]}} transition={{opacity:{duration:.2},scale:{duration:.2},y:{duration:4+i*.15,repeat:Infinity}}} className={`cursor-grab touch-none ${selectedPlaced===i?"ring-2 ring-[#f0b35b] ring-offset-1 rounded-xl":""}`} style={{position:"absolute",left:p.x,top:p.y,rotate:p.rotate}}><DominoPiece tile={p.tile} compact/></motion.div>)}
       </div>

       <div className="mt-4 rounded-[24px] border border-white/60 bg-white/58 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#337582]">{c.choose}</p><p className="mt-1 text-[10px] font-semibold text-[#4b7b82]">{c.dragTip}</p></div><button onClick={reset} className="rounded-full bg-white/80 p-2 text-[#37727d]" title={c.restart}><Star size={15}/></button></div>
        <div className="mt-3 grid grid-cols-2 gap-3 pb-3 pt-1">{hand.map(tile=><div key={tile.id} className="flex justify-center"><DominoPiece tile={tile} draggable onDrop={dropDomino}/></div>)}</div>
        <button onClick={requestWord} className="mx-auto flex items-center justify-center gap-2 rounded-full border border-[#2f7882]/30 bg-[#effaf7]/95 px-5 py-2.5 text-[10px] font-black text-[#286773] shadow-sm active:scale-[.98]">✦ <span>{c.needWord}</span></button>
        <p className="text-center text-[9px] font-bold text-[#477b84]">{bonuses.extraChoices>0?`+${bonuses.extraChoices} escolha(s) extra desbloqueada(s)`:""}</p>
       </div>

       <div className="mt-4 rounded-[24px] border border-white/60 bg-[#0e6572]/15 p-4 backdrop-blur-md"><div className="flex items-center gap-3"><span className="text-2xl">{quest.icon}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#286d79]">{c.quest}</p><p className="mt-1 text-[12px] font-black text-[#164d57]">{c[quest.label]}</p></div></div><button onClick={rewardQuest} disabled={questDone} className="mt-3 w-full rounded-[16px] border border-white/70 bg-white/75 py-2.5 text-[10px] font-black text-[#286773] disabled:opacity-50">{questDone?"✓ "+c.bonus:quest.reward==="extra-choice"?"+ 1 escolha":quest.reward==="reroll"?"↻ trocar opções":"✦ "+c.hint}</button></div>
      </div>
    </motion.section>}
   </AnimatePresence>
  </div>
<AnimatePresence>{horizonResumeOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[235] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:22,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-white/80 bg-[#fffdf7] p-6 shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#dff2ee] text-2xl">🌊</div>
    <p className="mt-4 text-center text-[9px] font-black uppercase tracking-[.2em] text-[#39737c]">{c.savedProgress}</p>
    <h3 className="mt-1 text-center text-[21px] font-black text-[#294f57]">{hasSavedJourney?c.resumeTitle:c.startJourney}</h3>
    <p className="mt-3 text-center text-[12px] font-semibold leading-relaxed text-[#587177]">{hasSavedJourney?c.resumeText:c.introText}</p>
    <div className="mt-5 grid gap-2">
     {hasSavedJourney&&<button onClick={continueJourney} className="w-full rounded-[17px] bg-[#286773] py-3.5 text-[11px] font-black text-white">{c.continueJourney}</button>}
     <button onClick={startNewJourney} className={`w-full rounded-[17px] py-3.5 text-[11px] font-black ${hasSavedJourney?"border border-[#286773]/25 bg-white text-[#286773]":"bg-[#286773] text-white"}`}>{c.startJourney}</button>
    </div>
   </motion.div>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{wordPromptOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[225] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:22,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-white/80 bg-[#fffdf7] p-6 shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#e6f5f1] text-2xl">✦</div>
    <h3 className="mt-4 text-center text-[21px] font-black text-[#294f57]">{wordTile?c.needWordMoment:c.needWordTitle}</h3>
    {!wordTile&&<><p className="mt-3 text-center text-[12px] font-semibold leading-relaxed text-[#587177]">{c.needWordPrompt}</p><input autoFocus value={neededWord} onChange={e=>setNeededWord(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")findNeededWord()}} placeholder={c.needWordPlaceholder} className="mt-5 w-full rounded-[17px] border border-[#d8e5e3] bg-white p-3.5 text-[13px] font-bold text-[#405a60] outline-none"/><div className="mt-3 flex flex-wrap justify-center gap-1.5">{neededWordSuggestions.map(tile=><button key={tile.left} type="button" onClick={()=>setNeededWord(tile.left)} className="rounded-full border border-[#b9d9d5] bg-[#f4fbf9] px-2.5 py-1.5 text-[9px] font-black text-[#286773]">{tile.left}</button>)}</div><button onClick={findNeededWord} className="mt-3 w-full rounded-[17px] bg-[#286773] py-3.5 text-[11px] font-black text-white">{c.needWordFind}</button></>}
    {wordTile&&<><div className="mt-4 flex justify-center"><button onClick={()=>setWordTile(null)} className="cursor-pointer"><DominoPiece tile={wordTile}/></button></div><p className="mt-5 text-[13px] font-black leading-relaxed text-[#304f56]">{c.needWordMoment}</p><textarea autoFocus value={wordMoment} onChange={e=>setWordMoment(e.target.value)} maxLength={700} placeholder={c.needWordMomentPlaceholder} className="mt-3 min-h-[135px] w-full resize-none rounded-[17px] border border-[#d8e5e3] bg-white p-3 text-[12px] font-medium text-[#405a60] outline-none"/><button disabled={!wordMoment.trim()} onClick={saveWordMoment} className="mt-3 w-full rounded-[17px] bg-[#286773] py-3.5 text-[11px] font-black text-white disabled:opacity-40">{c.needWordSave}</button></>}
    <button onClick={()=>{setWordPromptOpen(false);setWordTile(null);setWordMoment("")}} className="mt-2 w-full py-2 text-[10px] font-bold text-[#718185]">×</button>
   </motion.div>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{horizonIntroOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[230] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:22,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-white/80 bg-[#fffdf7] p-6 shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#dff2ee] text-3xl">🌊</div>
    <p className="mt-4 text-center text-[9px] font-black uppercase tracking-[.2em] text-[#39737c]">✦ CONFIA</p>
    <h3 className="mt-1 text-center text-[21px] font-black text-[#294f57]">{c.introTitle}</h3>
    <p className="mt-3 text-[12px] font-semibold leading-relaxed text-[#587177]">{c.introText}</p>
    <div className="mt-4 rounded-[18px] border border-[#d9e9e7] bg-[#f2faf8] p-4 text-center"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#36717a]">MEDO <span className="mx-1">＋</span> PESQUISAS</p><p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#567077]">{c.introExample}</p></div>
    <p className="mt-4 text-[11px] font-semibold leading-relaxed text-[#64777b]">{c.introExplain}</p>
    <button onClick={()=>{localStorage.setItem(HORIZON_INTRO_KEY,"1");setHorizonIntroOpen(false)}} className="mt-5 w-full rounded-[17px] bg-[#286773] py-3.5 text-[11px] font-black text-white">{c.introButton}</button>
   </motion.div>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{junction&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[220] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:22,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-white/80 bg-[#fffdf7] p-6 shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9b7950]">{c.junctionStep.replace("{step}",String(junctions.length+1))}</p><h3 className="mt-1 text-[21px] font-black text-[#294f57]">{c.junctionTitle}</h3></div><span className="text-3xl">🧩</span></div>
    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="rounded-[18px] bg-[#edf7f5] p-4 text-center text-[14px] font-black text-[#2d6872]">{junction.left}</div><span className="text-xl text-[#d19a4a]">＋</span><div className="rounded-[18px] bg-[#fff3df] p-4 text-center text-[14px] font-black text-[#8b6434]">{junction.right}</div></div>
    <p className="mt-5 text-[14px] font-black leading-relaxed text-[#304f56]">{c.junctionPrompt}</p>
    <p className="mt-2 text-[10px] font-semibold text-[#718185]">{c.junctionExplain}</p>
    <textarea autoFocus value={junctionExplanation} onChange={e=>setJunctionExplanation(e.target.value)} maxLength={700} placeholder={c.junctionPlaceholder} className="mt-4 min-h-[135px] w-full resize-none rounded-[17px] border border-[#d8e5e3] bg-white p-3 text-[12px] font-medium text-[#405a60] outline-none"/>
    <button disabled={!junctionExplanation.trim()} onClick={saveJunction} className="mt-3 w-full rounded-[17px] bg-[#286773] py-3.5 text-[11px] font-black text-white disabled:opacity-40">{c.junctionSave}</button>
   </motion.div>
  </motion.div>}</AnimatePresence>
    <AnimatePresence>{treasureOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[210] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:20,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-[#f4d78a] bg-[#fffaf0] p-6 text-center shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#e8c66b] bg-[#f8dda0] text-4xl shadow-inner">🎁</div>
    <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-[#9a7040]">{c.treasureLabel}</p>
    <h3 className="mt-1 text-[21px] font-black text-[#4c3829]">{c.treasureTitle}</h3>
    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#735f51]">{c.treasureSubtitle}</p>
    <div className="mt-5 rounded-[20px] border border-[#ead7b5] bg-white p-4 text-left">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#a06f3d]">{c.treasureThread}</p>
      <div className="mt-3 grid gap-2">{[...junctions].sort((a,b)=>a.slot-b.slot).map((j,i)=><div key={j.slot} className="rounded-[15px] bg-[#fff8ed] p-3"><p className="text-[9px] font-black text-[#9b765f]">0{i+1}</p><p className="mt-1 text-[11px] font-black text-[#4d4038]">{j.left} ＋ {j.right}</p><p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-[#66574f]">{j.explanation}</p></div>)}</div>
      <p className="mt-4 text-[12px] font-black leading-relaxed text-[#4d4038]">{buildTreasureReflection()}</p>
      <p className="mt-4 text-[11px] font-black text-[#49372f]">{c.treasureQuestion}</p>
      <textarea value={treasureAnswer} onChange={e=>setTreasureAnswer(e.target.value)} maxLength={500} placeholder={c.junctionPlaceholder} className="mt-3 min-h-[100px] w-full resize-none rounded-[16px] border border-[#e4d7c4] bg-[#fffdf9] p-3 text-[12px] font-medium text-[#4f4037] outline-none"/>
      <button disabled={!treasureAnswer.trim()} onClick={()=>{setTreasureOpen(false);setToast(c.treasureClose);setTimeout(()=>setToast(""),2400)}} className="mt-3 w-full rounded-[16px] bg-[#8f503e] py-3 text-[11px] font-black text-white disabled:opacity-40">{c.treasureClose}</button>
    </div>
   </motion.div>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{impulse&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#123f48]/55 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:18,scale:.97}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[28px] border border-white/80 bg-[#fffdf7] p-5 shadow-[0_25px_70px_rgba(12,54,63,.28)]">
    <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9d7a8] text-lg">🏝️</div><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9b7950]">Ilha do Impulso</p><p className="text-[11px] font-bold text-[#6f5d52]">Responde para continuares a viagem</p></div></div>
    <p className="mt-5 text-[15px] font-black leading-relaxed text-[#2f4f57]">{impulse.question}</p>
    <div className="mt-4 grid gap-2">{impulse.answers.map((answer,index)=>{const selected=impulseAnswer===index;const correct=selected&&index===impulse.correct;const wrong=selected&&index!==impulse.correct;return <button key={answer} onClick={()=>answerImpulse(index)} className={`rounded-[16px] border px-4 py-3 text-left text-[11px] font-bold transition ${correct?"border-emerald-400 bg-emerald-50 text-emerald-800":wrong?"border-red-300 bg-red-50 text-red-700":"border-[#d9e5e5] bg-white hover:bg-[#f3f9f8] text-[#355b63]"}`}>{String.fromCharCode(65+index)}. {answer}</button>})}</div>
    {impulseAnswer!==null&&impulseAnswer!==impulse.correct&&<div className="mt-4 rounded-[15px] bg-[#fff4e7] p-3 text-[10px] font-semibold leading-relaxed text-[#78583e]">{impulse.explanation}<br/><span className="font-black">Tenta novamente.</span></div>}
    {impulseAnswer===impulse.correct&&<div className="mt-4 rounded-[15px] bg-[#edf8f2] p-3 text-[10px] font-black text-emerald-800">✓ Resposta certa. A tua peça pode continuar o caminho.</div>}
   </motion.div>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{toast&&<motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-[#253f45] px-4 py-2 text-[11px] font-black text-white shadow-xl">{toast}</motion.div>}</AnimatePresence>
 </div>
}
