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

const CAPSULE_KEY="confia_horizon_capsule_v1";
const WEEKLY_LOG_KEY="confia_horizon_weekly_reflections_v1";
const MONTH_TRACKER_KEY="confia_horizon_month_tracker_v1";
const DOMINO_KEY="confia_horizon_domino_v2";
const BONUS_KEY="confia_horizon_bonuses_v1";
const COMMUNITY_EVENT="confia:community-post-created";

const COPY={
  pt:{horizon:"O teu horizonte",horizonSub:"Céu, areia e mar — três espaços para observar, guardar e transformar o que sentes.",sky:"Céu",sand:"Areia",sea:"Mar da serenidade",skySub:"O que sentes também pode ganhar forma.",sandSub:"Guarda uma carta no teu baú e reencontra-a mais tarde com novos olhos.",seaSub:"Liga emoções, pensamentos e ações. Pequenas escolhas podem mudar o rumo.",capsule:"A tua cápsula do tempo",bury:"Enterrar carta por 7 dias",placeholder:"Escreve algo que gostarias de reencontrar daqui a uma semana…",buried:"O teu baú abre em",open:"Abrir o baú",guess:"Antes de abrir, queres tentar adivinhar o que escreveste há 7 dias?",guessPlaceholder:"Escreve aqui o que pensas que deixaste na cápsula…",reveal:"Agora compara o que imaginavas com aquilo que realmente escreveste.",remembered:"O que imaginavas",actual:"O que escreveste",feedback:"O que dirias hoje ao teu eu daquela semana?",rebury:"Responder e voltar a enterrar por 7 dias",monthTitle:"O teu mês",monthPrompt:"Antes de veres os teus registos: como resumirias este último mês?",monthPlaceholder:"Escreve uma frase ou pequeno resumo do mês…",monthCompare:"Comparar com as minhas semanas",monthYourSummary:"O teu resumo do mês",monthWeekly:"O que foste dizendo semana a semana",monthCombined:"Somatório dos teus feedbacks",monthClose:"Fechar mês e começar novo ciclo",monthWaiting:"Perspetiva mensal",monthIn:"Revisão mensal em",quest:"Iniciativa opcional",choose:"Arrasta uma peça para a água",bonus:"Vantagem desbloqueada",restart:"Novo caminho",hint:"Dica",community:"Partilhar algo na Comunidade",water:"Beber um copo de água",pause:"Fazer 30 segundos de pausa",walk:"Caminhar 2 minutos",breathe:"Fazer 5 respirações lentas",stretch:"Alongar ombros e pescoço",window:"Olhar pela janela durante 30 segundos",invalid:"Essa peça ainda não liga ao caminho.",dragTip:"A palavra da esquerda deve ligar à palavra da direita da última peça.",start:"Começa por aqui"},
  en:{horizon:"Your horizon",horizonSub:"Sky, sand and sea — three spaces to observe, keep and transform what you feel.",sky:"Sky",sand:"Sand",sea:"Sea of serenity",skySub:"What you feel can also take shape.",sandSub:"Keep a letter in your chest and meet it again later with fresh eyes.",seaSub:"Connect emotions, thoughts and actions. Small choices can change the path.",capsule:"Your time capsule",bury:"Bury letter for 7 days",placeholder:"Write something you would like to meet again in a week…",buried:"Your chest opens in",open:"Open chest",guess:"Before opening, want to guess what you wrote 7 days ago?",guessPlaceholder:"Write what you think you left in the capsule…",reveal:"Now compare what you imagined with what you actually wrote.",remembered:"What you imagined",actual:"What you wrote",feedback:"What would you tell your past self from that week today?",rebury:"Reply and bury again for 7 days",monthTitle:"Your month",monthPrompt:"Before seeing your records: how would you sum up this past month?",monthPlaceholder:"Write a sentence or short summary of the month…",monthCompare:"Compare with my weeks",monthYourSummary:"Your monthly summary",monthWeekly:"What you said week by week",monthCombined:"Combined weekly feedback",monthClose:"Close month and start a new cycle",monthWaiting:"Monthly perspective",monthIn:"Monthly review in",quest:"Optional initiative",choose:"Drag a tile onto the water",bonus:"Advantage unlocked",restart:"New path",hint:"Hint",community:"Share something in Community",water:"Drink a glass of water",pause:"Take a 30-second pause",walk:"Walk for 2 minutes",breathe:"Take 5 slow breaths",stretch:"Stretch shoulders and neck",window:"Look out a window for 30 seconds",invalid:"That tile does not connect to the path yet.",dragTip:"The left word must connect to the right word of the last tile.",start:"Start here"},
  es:{horizon:"Tu horizonte",horizonSub:"Cielo, arena y mar — tres espacios para observar, guardar y transformar lo que sientes.",sky:"Cielo",sand:"Arena",sea:"Mar de serenidad",skySub:"Lo que sientes también puede tomar forma.",sandSub:"Guarda una carta en tu cofre y vuelve a encontrarla más tarde con otra mirada.",seaSub:"Conecta emociones, pensamientos y acciones. Pequeñas elecciones pueden cambiar el rumbo.",capsule:"Tu cápsula del tiempo",bury:"Enterrar carta 7 días",placeholder:"Escribe algo que quieras reencontrar dentro de una semana…",buried:"Tu cofre se abre en",open:"Abrir el cofre",guess:"Antes de abrir, ¿quieres adivinar qué escribiste hace 7 días?",guessPlaceholder:"Escribe lo que crees que dejaste en la cápsula…",reveal:"Ahora compara lo que imaginabas con lo que realmente escribiste.",remembered:"Lo que imaginabas",actual:"Lo que escribiste",feedback:"¿Qué le dirías hoy a tu yo de aquella semana?",rebury:"Responder y volver a enterrar 7 días",quest:"Iniciativa opcional",choose:"Arrastra una ficha al agua",bonus:"Ventaja desbloqueada",restart:"Nuevo camino",hint:"Pista",community:"Compartir algo en Comunidad",water:"Beber un vaso de agua",pause:"Hacer una pausa de 30 segundos",walk:"Caminar 2 minutos",breathe:"Hacer 5 respiraciones lentas",stretch:"Estirar hombros y cuello",window:"Mirar por la ventana 30 segundos",invalid:"Esa ficha todavía no conecta con el camino.",dragTip:"La palabra izquierda debe conectar con la derecha de la última ficha.",start:"Empieza aquí"},
  fr:{horizon:"Ton horizon",horizonSub:"Ciel, sable et mer — trois espaces pour observer, garder et transformer ce que tu ressens.",sky:"Ciel",sand:"Sable",sea:"Mer de sérénité",skySub:"Ce que tu ressens peut aussi prendre forme.",sandSub:"Garde une lettre dans ton coffre et retrouve-la plus tard avec un autre regard.",seaSub:"Relie émotions, pensées et actions. De petits choix peuvent changer le chemin.",capsule:"Ta capsule temporelle",bury:"Enterrer la lettre 7 jours",placeholder:"Écris quelque chose que tu aimerais retrouver dans une semaine…",buried:"Ton coffre s'ouvre dans",open:"Ouvrir le coffre",guess:"Avant d'ouvrir, veux-tu deviner ce que tu avais écrit il y a 7 jours ?",guessPlaceholder:"Écris ce que tu penses avoir laissé dans la capsule…",reveal:"Compare maintenant ce que tu imaginais avec ce que tu avais réellement écrit.",remembered:"Ce que tu imaginais",actual:"Ce que tu avais écrit",feedback:"Que dirais-tu aujourd'hui à ton toi de cette semaine-là ?",rebury:"Répondre et enterrer à nouveau 7 jours",quest:"Initiative facultative",choose:"Fais glisser une pièce sur l'eau",bonus:"Avantage débloqué",restart:"Nouveau chemin",hint:"Indice",community:"Partager dans la Communauté",water:"Boire un verre d'eau",pause:"Faire une pause de 30 secondes",walk:"Marcher 2 minutes",breathe:"Faire 5 respirations lentes",stretch:"Étirer les épaules et le cou",window:"Regarder dehors 30 secondes",invalid:"Cette pièce ne se relie pas encore au chemin.",dragTip:"Le mot de gauche doit rejoindre le mot de droite de la dernière pièce.",start:"Commence ici"}
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
{id:"double-stress",left:"Stress",right:"Stress",tone:"heavy",turn:true},
{id:"double-agitation",left:"Agitação",right:"Agitação",tone:"heavy",turn:true},
{id:"double-tension",left:"Tensão",right:"Tensão",tone:"heavy",turn:true},
{id:"double-worry",left:"Preocupação",right:"Preocupação",tone:"heavy",turn:true},
{id:"double-pause",left:"Pausa",right:"Pausa",tone:"light",turn:true},
{id:"double-calm",left:"Calma",right:"Calma",tone:"light",turn:true},
{id:"double-clarity",left:"Clareza",right:"Clareza",tone:"light",turn:true},
{id:"double-confidence",left:"Confiança",right:"Confiança",tone:"light",turn:true}
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
 const [placed,setPlaced]=useState<PlacedDomino[]>([]);
 const [bonuses,setBonuses]=useState(()=>readJson(BONUS_KEY,{extraChoices:0,rerolls:0,hints:0}));
 const [quest,setQuest]=useState<Quest>(()=>sample(QUESTS,1)[0]);
 const [questDone,setQuestDone]=useState(false);
 const [toast,setToast]=useState("");
 const [impulse,setImpulse]=useState<ImpulseQuestion|null>(null);
 const [impulseAnswer,setImpulseAnswer]=useState<number|null>(null);
 const [usedImpulseQuestions,setUsedImpulseQuestions]=useState<string[]>([]);
 const [pendingDrop,setPendingDrop]=useState<{tile:Domino;x:number;y:number;rotate:number;direction:Direction}|null>(null);
 const [routeDirection,setRouteDirection]=useState<Direction>("right");
 const [selectedPlaced,setSelectedPlaced]=useState<number|null>(null);
 const [unlockedIslands,setUnlockedIslands]=useState<number[]>([]);
 const [treasureOpen,setTreasureOpen]=useState(false);
 const [treasureAnswer,setTreasureAnswer]=useState("");

 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{localStorage.setItem(WEEKLY_LOG_KEY,JSON.stringify(weeklyLog))},[weeklyLog]);
 useEffect(()=>{if(monthTracker)localStorage.setItem(MONTH_TRACKER_KEY,JSON.stringify(monthTracker))},[monthTracker]);
 useEffect(()=>{if(!capsule)return;const buried=new Date(capsule.buriedAt).getTime();const opens=new Date(capsule.opensAt).getTime();if(opens-buried>8*86400000){const migrated={...capsule,opensAt:new Date(buried+7*86400000).toISOString()};localStorage.setItem(CAPSULE_KEY,JSON.stringify(migrated));setCapsule(migrated)}},[]);
 useEffect(()=>{if(!capsule||monthTracker)return;const start=new Date(capsule.buriedAt);const tracker={startedAt:start.toISOString(),dueAt:new Date(start.getTime()+30*86400000).toISOString()};setMonthTracker(tracker)},[capsule,monthTracker]);
 useEffect(()=>{if(monthTracker?.comparedAt){setMonthCompared(true);setMonthSummary(monthTracker.summary||"")}},[]);
 useEffect(()=>{localStorage.setItem(DOMINO_KEY,JSON.stringify(placed))},[placed]);
 useEffect(()=>{localStorage.setItem(BONUS_KEY,JSON.stringify(bonuses))},[bonuses]);
 useEffect(()=>{const onCommunity=()=>{setBonuses(readJson(BONUS_KEY,{extraChoices:0,rerolls:0,hints:0}));setToast(c.bonus);setTimeout(()=>setToast(""),2200)};window.addEventListener(COMMUNITY_EVENT,onCommunity);return()=>window.removeEventListener(COMMUNITY_EVENT,onCommunity)},[c.bonus]);

 const remaining=capsule?new Date(capsule.opensAt).getTime()-now:0;
 const canOpen=Boolean(capsule&&remaining<=0);
 const monthRemaining=monthTracker?new Date(monthTracker.dueAt).getTime()-now:0;
 const monthDue=Boolean(monthTracker&&monthRemaining<=0);
 const monthReflections=useMemo(()=>monthTracker?weeklyLog.filter(item=>new Date(item.at).getTime()>=new Date(monthTracker.startedAt).getTime()&&new Date(item.at).getTime()<=new Date(monthTracker.dueAt).getTime()+86400000):[],[weeklyLog,monthTracker]);
 const lastRight=placed[placed.length-1]?.tile.right||"Stress";
 const tileStep=routeDirection==="up"||routeDirection==="down"?34:78;
 const lastPlaced=placed[placed.length-1];
 const candidateCount=Math.min(5,2+(bonuses.extraChoices||0));
 const options=useMemo(()=>{
  let pool=DOMINOES.filter(d=>d.left===lastRight&&!placed.slice(-6).some(p=>p.tile.id===d.id));
  if(pool.length<candidateCount) pool=[...pool,...DOMINOES.filter(d=>d.left!==lastRight&&!placed.slice(-4).some(p=>p.tile.id===d.id))];
  return sample(pool,candidateCount);
 },[lastRight,placed,candidateCount,questDone]);

 const bury=()=>{if(!draft.trim())return;const buriedAt=new Date();const opensAt=new Date(buriedAt.getTime()+7*86400000);const next={message:draft.trim(),buriedAt:buriedAt.toISOString(),opensAt:opensAt.toISOString(),cycle:(capsule?.cycle||0)+1};localStorage.setItem(CAPSULE_KEY,JSON.stringify(next));setCapsule(next);if(!monthTracker){setMonthTracker({startedAt:buriedAt.toISOString(),dueAt:new Date(buriedAt.getTime()+30*86400000).toISOString()})}setNow(Date.now());setDraft("");setGuess("");setRevealed(false)};
 const rebury=()=>{if(!capsule||!feedback.trim())return;const reflection={at:new Date().toISOString(),message:capsule.message,guess:guess.trim(),feedback:feedback.trim()};setWeeklyLog(prev=>[...prev,reflection]);const buriedAt=new Date();const opensAt=new Date(buriedAt.getTime()+7*86400000);const next={message:feedback.trim(),buriedAt:buriedAt.toISOString(),opensAt:opensAt.toISOString(),cycle:capsule.cycle+1,feedback:feedback.trim()};localStorage.setItem(CAPSULE_KEY,JSON.stringify(next));setCapsule(next);setNow(Date.now());setFeedback("");setGuess("");setRevealed(false)};
 const compareMonth=()=>{if(!monthTracker||!monthSummary.trim())return;setMonthCompared(true);setMonthTracker({...monthTracker,summary:monthSummary.trim(),comparedAt:new Date().toISOString()})};
 const closeMonth=()=>{const start=new Date();const next={startedAt:start.toISOString(),dueAt:new Date(start.getTime()+30*86400000).toISOString()};setMonthTracker(next);setMonthSummary("");setMonthCompared(false)};

 const rewardQuest=()=>{if(questDone)return;setQuestDone(true);setBonuses((b:any)=>quest.reward==="extra-choice"?{...b,extraChoices:b.extraChoices+1}:quest.reward==="reroll"?{...b,rerolls:b.rerolls+1}:{...b,hints:b.hints+1});setToast(c.bonus);setTimeout(()=>setToast(""),2200)};
 const reset=()=>{setPlaced([]);localStorage.removeItem(DOMINO_KEY);setQuest(sample(QUESTS,1)[0]);setQuestDone(false);setUnlockedIslands([]);setImpulse(null);setPendingDrop(null);setTreasureOpen(false);setTreasureAnswer("")};
 const enterSection=(next:Section)=>{if(next==="sea"){setPlaced([]);localStorage.removeItem(DOMINO_KEY);setQuest(sample(QUESTS,1)[0]);setQuestDone(false);setImpulse(null);setPendingDrop(null);setImpulseAnswer(null);setUnlockedIslands([]);setSelectedPlaced(null);setTreasureOpen(false);setTreasureAnswer("")}setSection(next)};
 const reroll=()=>{if(bonuses.rerolls<=0)return;setBonuses((b:any)=>({...b,rerolls:b.rerolls-1}));setQuestDone(v=>!v)};
 const islands=[{x:.14,y:.12},{x:.36,y:.20},{x:.62,y:.11},{x:.86,y:.24},{x:.28,y:.40},{x:.58,y:.34},{x:.82,y:.50},{x:.18,y:.63},{x:.48,y:.67},{x:.76,y:.78},{x:.92,y:.88,treasure:true}];
 const seaObstacles=[
  {x:.25,y:.28,type:"🌀",label:"Remoinho"},
  {x:.50,y:.24,type:"🏴‍☠️",label:"Piratas"},
  {x:.72,y:.40,type:"🐙",label:"Kraken"},
  {x:.38,y:.52,type:"🌀",label:"Remoinho"},
  {x:.66,y:.66,type:"🏴‍☠️",label:"Piratas"}
 ];
 const touchingObstacle=(x:number,y:number,boardWidth:number,boardHeight:number)=>{
  const w=74,h=29;
  return seaObstacles.some(o=>{
   const cx=boardWidth*o.x,cy=boardHeight*o.y;
   return x+w>=cx-25&&x<=cx+25&&y+h>=cy-25&&y<=cy+25;
  });
 };
 const touchingIsland=(x:number,y:number,boardWidth:number,boardHeight:number)=>{
  // A ilha desbloqueia quando a lateral direita da peça chega à sua área.
  // Usamos colisão/proximidade real em vez de uma janela estreita baseada
  // apenas no valor de x, para funcionar de forma consistente em todas as ilhas.
  const w=74,h=29;
  const tolerance=12;
  const pieceLeft=x;
  const pieceRight=x+w;
  const pieceTop=y;
  const pieceBottom=y+h;
  return islands.findIndex((island,index)=>{
   if(unlockedIslands.includes(index)) return false;
   const islandCenterX=boardWidth*island.x;
   const islandCenterY=boardHeight*island.y;
   const islandLeft=islandCenterX-32;
   const islandRight=islandCenterX+32;
   const islandTop=islandCenterY-24;
   const islandBottom=islandCenterY+24;
   const horizontalReach=pieceRight>=islandLeft-tolerance && pieceLeft<=islandRight+tolerance;
   const verticalOverlap=pieceBottom>=islandTop-tolerance && pieceTop<=islandBottom+tolerance;
   return horizontalReach && verticalOverlap;
  });
 };
 const nextImpulseQuestion=(excludeId?:string)=>{
  const available=IMPULSE_QUESTIONS.filter(q=>q.id!==excludeId&&!usedImpulseQuestions.includes(q.id));
  const pool=available.length?available:IMPULSE_QUESTIONS.filter(q=>q.id!==excludeId);
  return sample(pool.length?pool:IMPULSE_QUESTIONS,1)[0];
 };
 const unlockIsland=(index:number,drop:{tile:Domino;x:number;y:number;rotate:number;direction:Direction})=>{
  const first=nextImpulseQuestion();
  setPendingDrop(drop);setImpulse(first);setImpulseAnswer(null);setUsedImpulseQuestions(prev=>[...prev,first.id]);setUnlockedIslands(prev=>prev.includes(index)?prev:[...prev,index]);
 };
 const placeTile=(drop:{tile:Domino;x:number;y:number;rotate:number;direction:Direction})=>{
  setPlaced(prev=>[...prev,{tile:drop.tile,x:drop.x,y:drop.y,rotate:drop.rotate,direction:drop.direction}]);
  if(bonuses.extraChoices>0)setBonuses((b:any)=>({...b,extraChoices:Math.max(0,b.extraChoices-1)}));
  setQuest(sample(QUESTS,1)[0]);setQuestDone(false);
 };
 const answerImpulse=(index:number)=>{
  if(!impulse)return;
  setImpulseAnswer(index);
  if(index===impulse.correct){
   if(pendingDrop)placeTile(pendingDrop);
   setTimeout(()=>{setImpulse(null);setImpulseAnswer(null);setPendingDrop(null);setUsedImpulseQuestions([])},850);
  } else {
   // Cada erro gera imediatamente uma nova pergunta. A viagem só avança quando acertar.
   setTimeout(()=>{
    const next=nextImpulseQuestion(impulse.id);
    setImpulse(next);setImpulseAnswer(null);setUsedImpulseQuestions(prev=>[...prev,next.id]);
   },650);
  }
 };
 const dropDomino=(tile:Domino,clientX:number,clientY:number)=>{
  const board=boardRef.current;if(!board)return;const rect=board.getBoundingClientRect();
  const inside=clientX>=rect.left&&clientX<=rect.right&&clientY>=rect.top&&clientY<=rect.bottom;
  if(!inside){setToast(c.choose);setTimeout(()=>setToast(""),1400);return}
  if(placed.length>0&&tile.left!==lastRight){setToast(c.invalid);setTimeout(()=>setToast(""),1800);return}
  const w=74,h=29;
  const anchor=lastPlaced?{x:lastPlaced.x,y:lastPlaced.y}:{x:12,y:Math.round(rect.height*.16)};
  let x=anchor.x+w+4,y=anchor.y,rotate=0;
  // Uma peça nova entra sempre imediatamente à direita da anterior.
  // A direção escolhida controla apenas a orientação; a posição pode depois ser ajustada por arrasto.
  if(routeDirection==="down")rotate=90;
  if(routeDirection==="up")rotate=270;
  if(x>rect.width-w-4){setToast("Não há espaço suficiente à direita da peça anterior");setTimeout(()=>setToast(""),1800);return}
  x=Math.max(4,Math.min(rect.width-w-4,x)); y=Math.max(6,Math.min(rect.height-h-6,y));
  const pending={tile,x,y,rotate,direction:routeDirection};
  if(touchingObstacle(x,y,rect.width,rect.height)){setToast("Há um perigo no mar. Muda o rumo e encontra outra passagem.");setTimeout(()=>setToast(""),2200);return;}
  const islandIndex=touchingIsland(x,y,rect.width,rect.height);
  if(islandIndex>=0){
   if(islands[islandIndex].treasure){setTreasureOpen(true);return;}
   unlockIsland(islandIndex,pending);return;
  }
  placeTile(pending);
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
        <div className="absolute right-3 top-3 z-20 rounded-[18px] border border-white/70 bg-white/65 p-1.5 shadow-sm backdrop-blur"><p className="px-1 pb-1 text-center text-[7px] font-black uppercase tracking-[.12em] text-[#39727b]">Rota</p><div className="grid grid-cols-3 gap-1"><span/><button onClick={()=>{setRouteDirection("up"); if(selectedPlaced!==null) setPlaced(prev=>prev.map((p,i)=>i===selectedPlaced?{...p,rotate:270,direction:"up"}:p))}} className={`h-7 w-7 rounded-lg font-black ${routeDirection==="up"?"bg-[#286f7b] text-white":"bg-white/80 text-[#286f7b]"}`}>↑</button><span/><button onClick={()=>{setRouteDirection("left"); if(selectedPlaced!==null) setPlaced(prev=>prev.map((p,i)=>i===selectedPlaced?{...p,rotate:0,direction:"left"}:p))}} className={`h-7 w-7 rounded-lg font-black ${routeDirection==="left"?"bg-[#286f7b] text-white":"bg-white/80 text-[#286f7b]"}`}>←</button><button onClick={()=>{setRouteDirection("down"); if(selectedPlaced!==null) setPlaced(prev=>prev.map((p,i)=>i===selectedPlaced?{...p,rotate:90,direction:"down"}:p))}} className={`h-7 w-7 rounded-lg font-black ${routeDirection==="down"?"bg-[#286f7b] text-white":"bg-white/80 text-[#286f7b]"}`}>↓</button><button onClick={()=>{setRouteDirection("right"); if(selectedPlaced!==null) setPlaced(prev=>prev.map((p,i)=>i===selectedPlaced?{...p,rotate:0,direction:"right"}:p))}} className={`h-7 w-7 rounded-lg font-black ${routeDirection==="right"?"bg-[#286f7b] text-white":"bg-white/80 text-[#286f7b]"}`}>→</button></div></div>
        <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-[9px] font-black text-[#286b76] backdrop-blur">{c.start}: {placed[0]?.tile.left}</div>
        {placed.map((p,i)=><motion.div key={p.tile.id+"-"+i} drag dragElastic={0.12} whileDrag={{scale:1.05,zIndex:90}} onClick={()=>setSelectedPlaced(i)} onDragEnd={(_,info)=>{const w=74;const board=boardRef.current;if(!board)return;const rect=board.getBoundingClientRect();const nx=Math.max(4,Math.min(rect.width-w-4,p.x+info.offset.x));const ny=Math.max(6,Math.min(rect.height-35,p.y+info.offset.y));const prev=placed[i-1];if(prev&&nx<=prev.x+w+4){setToast("A peça tem de ficar à direita da anterior");setTimeout(()=>setToast(""),1600);return}const next=placed[i+1];if(next&&next.x<=nx+w+4){setToast("Não podes ultrapassar a peça seguinte");setTimeout(()=>setToast(""),1600);return}setPlaced(prevPlaced=>prevPlaced.map((q,j)=>j===i?{...q,x:nx,y:ny}:q));const islandIndex=touchingIsland(nx,ny,rect.width,rect.height);if(islandIndex>=0){setUnlockedIslands(prevUnlocked=>prevUnlocked.includes(islandIndex)?prevUnlocked:[...prevUnlocked,islandIndex]);setPendingDrop(null);setImpulse(sample(IMPULSE_QUESTIONS,1)[0]);setImpulseAnswer(null);}}} initial={{opacity:0,scale:.88}} animate={{opacity:1,scale:1,y:[0,i%2?2:-2,0]}} transition={{opacity:{duration:.2},scale:{duration:.2},y:{duration:4+i*.15,repeat:Infinity}}} className={`cursor-grab touch-none ${selectedPlaced===i?"ring-2 ring-[#f0b35b] ring-offset-1 rounded-xl":""}`} style={{position:"absolute",left:p.x,top:p.y,rotate:p.rotate}}><DominoPiece tile={p.tile} compact/></motion.div>)}
       </div>

       <div className="mt-4 rounded-[24px] border border-white/60 bg-white/58 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#337582]">{c.choose}</p><p className="mt-1 text-[10px] font-semibold text-[#4b7b82]">{c.dragTip}</p></div><div className="flex gap-2"><button onClick={reroll} disabled={bonuses.rerolls<=0} className="rounded-full bg-white/80 p-2 text-[#37727d] disabled:opacity-30"><RotateCcw size={15}/></button><button onClick={reset} className="rounded-full bg-white/80 p-2 text-[#37727d]" title={c.restart}><Star size={15}/></button></div></div>
        <div className="mt-3 grid grid-cols-2 gap-3 pb-3 pt-1">{options.map(tile=><div key={tile.id} className="flex justify-center"><DominoPiece tile={tile} draggable onDrop={dropDomino}/></div>)}</div>
        <p className="text-center text-[9px] font-bold text-[#477b84]">{bonuses.extraChoices>0?`+${bonuses.extraChoices} escolha(s) extra desbloqueada(s)`:""}</p>
       </div>

       <div className="mt-4 rounded-[24px] border border-white/60 bg-[#0e6572]/15 p-4 backdrop-blur-md"><div className="flex items-center gap-3"><span className="text-2xl">{quest.icon}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#286d79]">{c.quest}</p><p className="mt-1 text-[12px] font-black text-[#164d57]">{c[quest.label]}</p></div></div><button onClick={rewardQuest} disabled={questDone} className="mt-3 w-full rounded-[16px] border border-white/70 bg-white/75 py-2.5 text-[10px] font-black text-[#286773] disabled:opacity-50">{questDone?"✓ "+c.bonus:quest.reward==="extra-choice"?"+ 1 escolha":quest.reward==="reroll"?"↻ trocar opções":"✦ "+c.hint}</button></div>
      </div>
    </motion.section>}
   </AnimatePresence>
  </div>
  <AnimatePresence>{treasureOpen&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[210] flex items-center justify-center bg-[#123f48]/65 p-5 backdrop-blur-sm">
   <motion.div initial={{opacity:0,y:20,scale:.96}} animate={{opacity:1,y:0,scale:1}} className="w-full max-w-md rounded-[30px] border border-[#f4d78a] bg-[#fffaf0] p-6 text-center shadow-[0_30px_80px_rgba(12,54,63,.34)]">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#e8c66b] bg-[#f8dda0] text-4xl shadow-inner">🎁</div>
    <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-[#9a7040]">Ilha Tesouro</p>
    <h3 className="mt-1 text-[21px] font-black text-[#4c3829]">Encontraste o baú.</h3>
    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#735f51]">Dentro dele está a primeira interação da tua viagem na CONFIA.</p>
    <div className="mt-5 rounded-[20px] border border-[#ead7b5] bg-white p-4 text-left">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#a06f3d]">A primeira pergunta</p>
      <p className="mt-2 text-[15px] font-black leading-relaxed text-[#354f56]">O que te trouxe até aqui?</p>
      <textarea value={treasureAnswer} onChange={e=>setTreasureAnswer(e.target.value)} maxLength={500} placeholder="Escreve livremente…" className="mt-3 min-h-[100px] w-full resize-none rounded-[16px] border border-[#e4d7c4] bg-[#fffdf9] p-3 text-[12px] font-medium text-[#4f4037] outline-none"/>
      <button disabled={!treasureAnswer.trim()} onClick={()=>{setTreasureOpen(false);setToast("A tua primeira interação ficou guardada no teu caminho.");setTimeout(()=>setToast(""),2400)}} className="mt-3 w-full rounded-[16px] bg-[#8f503e] py-3 text-[11px] font-black text-white disabled:opacity-40">Guardar e continuar</button>
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
