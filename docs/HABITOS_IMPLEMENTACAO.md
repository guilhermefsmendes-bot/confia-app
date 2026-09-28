# CONFIA — reformulação Hábitos
Data: 2026-09-28. Base: origin/main, a2e8c20, Android versionCode 51.

## Implementação
- Impulso passou a Hábitos na navegação. O Espaço Efémero deixou de ter entradas na interface.
- Desafios múltiplos e personalizados, objetivo individual e seleção única do desafio principal.
- Confirmação de hoje/ontem, relógio local isolado, tolerância para o dia anterior, cores por etapa e troféu aos 30 dias com continuidade posterior.
- Recomeços com motivo, sem eliminar histórico, melhor sequência ou total de dias cumpridos.
- Histórico em páginas de 30 dias, com estados cumprido/não cumprido/sem registo.
- Alimentação com campos opcionais, quantidades explícitas, resumo do dia e revisão semanal a partir de 3 dias.
- Exercício com tipo, duração livre, intensidade opcional, várias sessões e confirmação explícita de zero minutos.
- Revisões semanais referem-se à semana de calendário local, de segunda-feira a domingo. Comparações de alimentação usam a média dos dias registados e requerem 3 dias em cada semana.
- Apoio imediato antigo continua acessível, com os mesmos dados, episódios e integrações.
- O check-in inicial foi limitado ao separador principal, evitando que apareça por cima de Hábitos.

## Ficheiros criados
- src/components/Habits/: HabitDashboard, HabitChallengeCard, DailyClock, HabitSetup, HabitHistory, NutritionDashboard, ExerciseDashboard, HabitInsights e shared.
- src/data/habits/: types, calendar, statistics, actions, store, sync, events e sources.
- src/data/personal/lifestylePatterns.ts.
- src/data/habits/__tests__/: habits.test.ts, storage.test.ts e habits.rules.test.ts.
- tests/e2e/habits.spec.ts.

## Ficheiros existentes alterados
- App.tsx, PersonalMap.tsx e layout/MainNavigation.tsx.
- personalEvent.ts, personalInsights.ts, personalAnalytics.ts, companionEngine.ts e reactiveEngine.ts.
- Os quatro ficheiros de tradução pt/en/es/fr.json.
- firestore.rules, storage/deleteUserData.ts e package.json.
- O teste hugAdaptiveMessages.test.ts passou de Vitest (dependência ausente) para node:test, preservando as suas asserções.

## Dados e privacidade
Coleção privada: users/{uid}/habitRecords/{recordId}.
Tipos: habit, settings, habitLog, restart, summary, nutrition e exercise.
Cada documento inclui id, userId, kind, date (data local), updatedAt, timezone e data.
settings guarda o desafio principal. summary preserva totais, melhor sequência e limites da sequência atual sem exigir a leitura de todo o histórico.
O relógio não faz gravações. A primeira leitura obtém definições/resumos e os últimos 30 dias em páginas; o histórico anterior é carregado a pedido.
A persistência local usa confia_habits_v1:{uid}; antes da autenticação usa guest. Os registos dessa sessão inicial são associados à primeira identidade quando a autenticação termina.
Cada gravação é guardada localmente antes de atualizar a interface; a fila pendente sobrevive ao encerramento. Alterações do mesmo documento usam a revisão mais recente.
A fila sincroniza no registo, na reconexão e no regresso à app. Não existem listeners Firestore por cartão.
As regras validam proprietário e esquema. A eliminação de conta remove também os documentos privados, em lotes, e suspende a sincronização durante a operação.
Os eventos analytics adicionados são apenas nomes funcionais no mecanismo local existente; não incluem o conteúdo dos hábitos.
Conflitos no mesmo registo entre dispositivos seguem a regra de última revisão; não existe colaboração simultânea em tempo real.

## Integração de padrões
Novos eventos pessoais: nutrition, exercise e habit_challenge, com source habits.
buildPersonalInsights passa a incluir associações dos novos registos, apresentadas em Hábitos e no Meu Mapa.
Comparações: café >= 2 versus < 2, movimento >= 20 minutos versus < 20, fruta >= 1 versus zero, e desafios cumpridos versus explicitamente não cumpridos.
Estas divisões são critérios de comparação dos registos, não recomendações de saúde.
Só se usam dias com ambas as medições explícitas; a ausência de registo não é convertida em zero.
Mínimo: 5 dias distintos em cada grupo, numa janela de 30 dias, e diferença de pelo menos 0,8 pontos na média diária do estado.
Sinais iniciais são identificados como tal; a indicação de associação repetida exige pelo menos 10 dias em cada grupo.
A análise usa avaliações de estado na mesma escala e deduplica revisões por dia/momento. Não mistura escalas antigas de check-in.
Não se inferem sono, agitação ou energia a partir de dados inexistentes.
A estrutura sources.ts está preparada para fontes verificadas; não foram introduzidas recomendações clínicas nem referências inventadas.

## Compatibilidade e idiomas
Identificadores internos impulse/impulso foram preservados onde alimentam motores e armazenamento antigos.
Não foram apagados dados existentes nem reinterpretadas classificações antigas de hábitos como dias cumpridos.
As strings da nova área têm correspondência e interpolação auditadas em português, inglês, espanhol e francês.
Os textos apresentados que referiam a antiga ferramenta Impulso passaram a referir o apoio imediato.

## Validação
- TypeScript: aprovado.
- Build Vite: aprovado.
- Testes unitários novos: 22 aprovados.
- Regressão existente: 43 aprovados.
- Testes do Abraço adaptados: 2 aprovados.
- Segurança Firestore: 4 aprovados em emulador demo-confia-habits.
- Navegador: 11 percursos aprovados em desktop/mobile (incluindo semana preenchida, padrões e troféu); os 2 percursos centrais mobile foram repetidos após os ajustes finais.
- Testados persistência offline/sem autenticação, mudança de conta, falta de espaço local, calendário/DST, tolerância do dia anterior, recomeços, vários hábitos, semanas com/sem registos, amostras insuficientes e traduções.
- Capacitor: npx cap sync android concluído.
- Pré-visualização: porta 3000, HTTP 200.
- Permanecem avisos de build já presentes na base: bundle principal acima de 500 kB e import estático/dinâmico de weeklyTrophies.

## Pendências de publicação
As novas regras Firestore estão implementadas e testadas, mas NÃO foram publicadas em produção. A sincronização online da nova coleção depende dessa publicação; os registos locais funcionam entretanto.
Comando de publicação, apenas quando autorizado: firebase deploy --only firestore:rules --project confia-b952e.
Não foi gerado APK/AAB, alterado versionCode, publicado na Play Store ou enviado código para o GitHub.
A sincronização Capacitor não substitui uma validação final num dispositivo Android físico antes de uma futura publicação.

## Evolução visual — relógio circular (28/09/2026)
- O desafio passou a um círculo responsivo e centrado desde o estado vazio, com a introdução curta no topo.
- DIA e número separados visualmente, com maior destaque no número; nome/ícone do hábito e sequência dentro do mostrador.
- Contador e anel diário isolados em DailyClock. Recalculam pela hora real ao retomar a app, em pageshow/focus e na mudança de visibilidade. O intervalo é suspenso quando o documento fica oculto.
- O anel usa o início e fim do dia local, incluindo dias de 23/25 horas na mudança de horário; reinicia à meia-noite sem conceder um dia à sequência.
- Cores interpoladas entre laranja, dourado e verdes. Taça discreta a partir do dia 30, com continuidade posterior.
- Registar e ações secundárias abaixo do círculo. Ações, dados e histórico reutilizam a implementação anterior.
- Animações curtas e desativadas com prefers-reduced-motion; descrição acessível do dia e tempo restante sem anúncios a cada segundo.
- Alterados: HabitChallengeCard.tsx, DailyClock.tsx, HabitDashboard.tsx e traduções pt/en/es/fr.
- Criados: challengeClock.css, clockTime.ts e tests/e2e/habit-clock.spec.ts. O seletor de histórico no teste existente foi atualizado.
- TypeScript e build aprovados. Validados 320 px, DIA 105, texto ampliado, teclado, meia-noite e retoma após salto de hora. Instrumentação React confirmou que os ticks não renderizam novamente HabitDashboard/HabitChallengeCard nem alteram localStorage.
