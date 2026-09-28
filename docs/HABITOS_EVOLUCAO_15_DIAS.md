# CONFIA — Hábitos: alimentação detalhada, bem-estar e planos

Implementação de 28 de setembro de 2026 no projeto existente em `/home/guilherme_f_s_mendes`.

## Funcionalidades

- Relógio com paisagem vetorial de montanha, caminho e luz que evolui ao longo de 30 dias. Conteúdo legível, estado inicial circular, sequência, taça e temporizador preservados. A montanha não pertence à árvore que atualiza a cada segundo.
- Alimenta-me com categorias, seletor de tipos, quantidades rápidas e exatas, vários alimentos da mesma categoria, edição e remoção individual. Café com período/hora, tamanho e intensidade opcionais; fruta com quantidades e plurais; legumes por porções; refrigerantes/sumos por produto; água e energéticos com volume aproximado.
- Propriedades úteis derivadas de IDs estáveis. Para refrigerantes e energéticos, cafeína/açúcar são indicados pelo utilizador a partir do rótulo; valores desconhecidos permanecem desconhecidos. Não são calculadas doses de cafeína, calorias ou classificações da alimentação.
- Exercício mantém atividades e durações existentes e acrescenta período opcional. A avaliação do dia permanece acessível após guardar, incluindo quando o registo é de ontem.
- Avaliação diária descritiva: comportamentos registados, um ponto a observar e uma ideia pequena para amanhã. Avaliação semanal de sete dias, médias apenas dos registos disponíveis, minutos, dias ativos e atividades frequentes.
- Planos de 15 dias: convite opcional, uma experiência de cada vez, configuração modular, ação diária, confirmação ou “Hoje não aconteceu”, adaptação mais leve, pausa, retoma, abandono com confirmação, histórico e comparação final.

## Integração com os dados existentes

Mantida a coleção privada `users/{uid}/habitRecords`, sem criar uma segunda base de dados. Mantidos autenticação, armazenamento local por utilizador, fila de sincronização, estratégia de atualização por registo, exclusão de conta e restante motor da aplicação.

Novos tipos de registo:

| Tipo | Conteúdo |
| --- | --- |
| `foodItem` | categoria, subtipo, quantidade, unidade, volume/horário/detalhes opcionais e marcador de remoção |
| `wellbeingPlan` | modelo, estado, datas, dias de pausa, adaptação e amostras de comparação |
| `planCheck` | plano, dia e resposta explícita |
| `planPreference` | adiamento de um convite |

Os totais `nutrition` continuam compatíveis com os registos anteriores. Ao acrescentar o primeiro alimento detalhado de uma categoria, o total anterior transforma-se num item de tipo não indicado: não é apagado nem confundido com um alimento específico. As outras categorias e os dias anteriores permanecem intactos. Edições e remoções preservam o resto dos alimentos; a remoção usa um marcador sincronizável para evitar reaparecimentos. Item e total são gravados juntos no armazenamento local antes de confirmar à interface.

A água detalhada conserva o volume indicado. Para compatibilidade, os totais resumidos usam equivalentes de copos de 250 ml; isto é uma unidade técnica de apresentação, não uma recomendação de ingestão. Registos antigos em copos não passam a ter volumes medidos.

## Padrões e limites da evidência

- Reutilizado `buildPersonalInsights`, com eventos pessoais de alimentação, movimento, desafio e experiência. Não foi criado um serviço de IA ou motor de diagnóstico separado.
- Os novos detalhes alimentam um sinal explícito de cafeína tardia. A análise usa apenas horários realmente indicados; sem horário não se assume manhã. O período tarde/noite ou uma hora a partir das 16:00 é uma convenção descritiva, não um limiar clínico.
- Padrões individuais exigem pelo menos cinco dias medidos em cada grupo, dentro de 30 dias, e diferença mínima já usada pelo motor. Com dez dias por grupo podem ganhar mais consistência. Ausência de registo nunca equivale a zero.
- Comparações emocionais usam o humor na escala existente, com uma observação por momento/dia e média diária. Não se inventam medições de ansiedade, agitação, energia ou sono, nem se misturam escalas incompatíveis.
- Referências gerais acessíveis em “Porque isto pode importar” e “Ver fonte”; afirmações gerais e coincidências individuais estão separadas.

Referências verificadas em 28/09/2026:

- EFSA: https://www.efsa.europa.eu/en/topics/topic/caffeine
- OMS — atividade física: https://www.who.int/news-room/fact-sheets/detail/physical-activity
- OMS — alimentação: https://www.who.int/news-room/fact-sheets/detail/healthy-diet

## Planos

Modelos configuráveis para cafeína, hidratação, fruta/legumes, bebidas energéticas, movimento, caminhadas, regularidade, horários e observação da rotina. O sistema não infere sedentarismo a partir da ausência de exercício.

Convites: pelo menos cinco dias registados nos 14 dias anteriores; para cafeína/energéticos/horários, pelo menos três dias com presença do comportamento. Estes são critérios de disponibilidade de dados, não diagnósticos nem limites de saúde.

O dia do plano resulta do calendário local, não da quantidade de cliques. Pausar prolonga a data final; os registos anteriores ficam guardados. Dois “Hoje não aconteceu” nas três respostas mais recentes tornam a proposta mais leve, tal como o ajuste manual. Não confirmar um dia não o transforma numa falha.

A amostra anterior é guardada ao aceitar o plano. No fim, a comparação é guardada e usa apenas os dados disponíveis, com pelo menos cinco dias por período; a comparação de humor exige dez dias em cada período. O texto explica as amostras, que eventuais pausas estão incluídas no período observado e que não se demonstra causalidade. No regresso após um intervalo longo, não são inventados os dados que não estejam carregados. Histórico antigo é carregado por páginas, mediante ação do utilizador.

## Privacidade e performance

- Nenhum conteúdo alimentar, hábito sensível ou resposta emocional é enviado para Firebase Analytics. Os eventos funcionais locais não recebem parâmetros sensíveis.
- Consulta habitual limitada aos últimos 30 dias, com paginação de 150 documentos; histórico adicional por páginas de 100. Definições e planos são recuperados separadamente para não perder um plano em pausa.
- Componentes de alimentação e exercício continuam carregados a pedido. Avaliações são memorizadas por dados/data; o relógio mantém o próprio estado, pausa o intervalo em segundo plano e recalcula a hora real no regresso.
- Sem imagens externas, chamadas de análise remota ou gravações por segundo.
- Botões acessíveis, diálogo nativo com foco/Escape, quatro idiomas e respeito por redução de movimento.

## Validação

- `npm run lint`: TypeScript aprovado, sem erros.
- `npm run build`: aprovado, código de saída 0. Mantêm-se os avisos anteriores de chunks superiores a 500 kB e importação estática/dinâmica de `weeklyTrophies.ts`; não bloqueiam a compilação.
- `npm run test:habits`: 32 testes aprovados, incluindo múltiplos alimentos, horários, quantidades, volume, migração de totais anteriores, falha de armazenamento, avaliações, limiares e ciclo completo dos planos.
- `npm test`: 43 testes existentes dos motores pessoais/reativos e utilitários aprovados.
- `npm run test:habits:rules`: cinco cenários aprovados no emulador Firestore; proprietário, isolamento de outros utilizadores, acesso anónimo, formatos, quantidades, horários, planos, remoções e atualizações antigas.
- Playwright móvel: oito novos cenários aprovados, além dos dez cenários anteriores de hábitos/relógio. No final foram repetidos e aprovados três cenários específicos: registo alimentar completo offline, meia-noite e isolamento de renderizações/gravações do contador.
- Playwright computador: oito novos cenários aprovados.
- Traduções PT/EN/ES/FR: paridade de chaves e variáveis aprovada; superfícies de alimentação/planos verificadas nas quatro línguas.
- Inspeção visual das capturas de montanha, DIA 105, alimentação e plano; ecrãs a partir de 320 px sem scroll horizontal. Android validado através de viewport móvel e sincronização Capacitor; não houve teste num dispositivo Android físico.
- `npx cap sync android`: aprovado.
- `git diff --check`: aprovado.
- Pré-visualização `http://127.0.0.1:3000`: HTTP 200.

As duas falhas encontradas na primeira ronda de browser foram corrigidas: rótulo acessível do seletor de unidades e seleção ambígua do dia atual versus histórico no próprio teste. As rondas seguintes passaram.

## Publicação

Alterações disponíveis no Cloud Shell e na porta 3000. Não houve push para GitHub nem publicação na Play Store. As regras Firestore foram publicadas em produção no projeto confia-b952e, após autorização do utilizador em 28/09/2026. O Firebase confirmou compilação, publicação e Deploy complete, com código de saída 0. A sincronização dos novos tipos de registo está autorizada pelas regras. A sincronização efetiva de um dispositivo depende da sua sessão e ligação à rede.

## Ficheiros criados nesta fase

- `src/components/Habits/FoodEditor.tsx`
- `src/components/Habits/LifestyleReview.tsx`
- `src/components/Habits/MountainLandscape.tsx`
- `src/components/Habits/WellbeingPlans.tsx`
- `src/components/Habits/nutrition.css`
- `src/data/habits/__tests__/wellbeing.test.ts`
- `src/data/habits/catalog.ts`
- `src/data/habits/nutrition.ts`
- `src/data/habits/planActions.ts`
- `src/data/habits/plans.ts`
- `src/data/personal/lifestyleReview.ts`
- `tests/e2e/wellbeing.spec.ts`
- `docs/HABITOS_EVOLUCAO_15_DIAS.md`

## Ficheiros alterados nesta fase

- `firestore.rules`
- `package.json`
- `src/components/Habits/ExerciseDashboard.tsx`
- `src/components/Habits/HabitChallengeCard.tsx`
- `src/components/Habits/HabitDashboard.tsx`
- `src/components/Habits/NutritionDashboard.tsx`
- `src/components/Habits/challengeClock.css`
- `src/data/habits/__tests__/habits.rules.test.ts`
- `src/data/habits/actions.ts`
- `src/data/habits/events.ts`
- `src/data/habits/sources.ts`
- `src/data/habits/statistics.ts`
- `src/data/habits/sync.ts`
- `src/data/habits/types.ts`
- `src/data/personal/lifestylePatterns.ts`
- `src/data/personal/personalAnalytics.ts`
- `src/locales/en.json`
- `src/locales/es.json`
- `src/locales/fr.json`
- `src/locales/pt.json`
- `tests/e2e/habits.spec.ts`

## Publicação das regras — 28/09/2026

Comando: `firebase deploy --only firestore:rules --project confia-b952e --non-interactive`.

Resultado: compilação e publicação concluídas, código 0. SHA-256 de `firestore.rules`: `de2a4dacdb3e9d12a346ce37eff53bde01a8abe5609372a2b2564b9f603a2bf0`.
