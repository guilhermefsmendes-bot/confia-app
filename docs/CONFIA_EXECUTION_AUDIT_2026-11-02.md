# CONFIA — Relatório de execução e auditoria inicial
Data: 2 de novembro de 2026
Branch inspecionada: feature/habit-impact-engine
Commit inspecionado: 09a360b

## 1. Integridade do repositório
- O repositório já tinha 173 entradas com alterações locais (modificadas, eliminadas ou não rastreadas) no momento da auditoria.
- Existem alterações extensas em App.tsx, Firestore rules, Cloud Functions, armazenamento, Comunidade, traduções e funcionalidades pessoais.
- Não foi executado reset, clean, checkout, stage, commit, push ou deploy.
- `git diff --check` passou.
- O ambiente tinha aproximadamente 87 MB livres num volume de 4,8 GB.
- O comando `node` e o comando `npm` não estão disponíveis no PATH, apesar de existir uma pasta node_modules.

## 2. P0 — Segurança e confiança

### 2.1 Moderação
Estado encontrado:
- Existe `ModeratorDashboard.tsx`, protegido por custom claim `moderator: true`.
- Existem operações de denúncia e bloqueio no serviço da Comunidade e em CommunityChat.
- As regras Firestore restringem a leitura de denúncias e a sua atualização a moderadores autorizados.
- A documentação operacional reconhece que não há cobertura humana permanente nem escalamento automático.

Bloqueios:
- Não foi possível confirmar a existência de uma escala de moderação, responsáveis designados, contactos de escalamento ou cobertura real.
- O painel consulta até 100 denúncias recentes e até 100 pendentes; o procedimento para fila superior a esse limite precisa de ser operacionalmente definido.
- O fluxo de bloqueio em grupos não está completamente protegido pelas regras: as regras de mensagens em `experienceMatchCircles/{circleId}/messages` verificam a participação, mas não verificam `blockedBetween`. A operação `blockCircleParticipant` grava o bloqueio, mas em grupos com três ou mais participantes não remove o utilizador bloqueado nem impede, por regra de servidor, todas as interações dentro do grupo.
- Os testes atuais cobrem bloqueios em chats privados, mas não demonstram a proteção equivalente em círculos/grupos.

Risco: ALTO — o bloqueio em grupos não tem garantia integral no servidor.

### 2.2 Firebase App Check
Estado encontrado:
- Existe `src/firebaseAppCheck.ts` com `ReCaptchaEnterpriseProvider` e renovação automática.
- A inicialização é opcional e depende de `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY`.
- O único ficheiro de ambiente presente é `.env.example`, com a chave vazia; não foi encontrada uma configuração local ativa.
- A inicialização é lançada em paralelo com o carregamento da aplicação, não sendo aguardada explicitamente antes do arranque da app.

Bloqueios:
- Não foi possível confirmar configuração de produção, tokens válidos ou enforcement na Firebase Console.
- A estratégia de provider deve ser validada separadamente para Web e Android/Capacitor; não assumir que o provider reCAPTCHA Web cobre a aplicação Android nativa.

Risco: ALTO até validação de produção. Não ativar enforcement sem medir tráfego legítimo e validar o provider de cada plataforma.

### 2.3 Eliminação de dados
Estado encontrado:
- Existe a callable `deleteAccountData` em `functions/src/index.ts`.
- O cliente chama `deleteAccountData` na região `europe-west1` e só limpa o armazenamento local depois do sucesso remoto.
- A callable elimina várias coleções, mensagens, conversas, pedidos, perfis e a identidade Firebase Auth.

Bloqueio de publicação:
- A consulta às Cloud Functions do projeto devolveu apenas `communityReplyCreated` como função ativa.
- Portanto, não foi encontrada uma função publicada chamada `deleteAccountData`.
- A eliminação pela app não pode ser considerada operacional em produção até a callable ser publicada e testada ponta a ponta.
- O processo inclui dados mantidos como registos de segurança e bloqueios criados por terceiros; esta retenção deve continuar explicada na política e ser validada juridicamente.

Risco: CRÍTICO — código local existente, mas callable de eliminação não encontrada entre as funções publicadas.

### 2.4 Retenção de denúncias / Cloud Scheduler
Estado encontrado:
- Existe a função `moderationRetentionCleanup` no código, destinada a remover denúncias finalizadas após 180 dias e preservar denúncias pendentes ou com legal hold.
- A API Cloud Scheduler está desativada no projeto.
- A consulta de jobs não pôde ser concluída porque a API está desativada.

Bloqueio:
- A tarefa agendada não está comprovada como operacional. A ativação da API, criação do job e publicação da função exigem autorização operacional e validação.

Risco: ALTO — retenção documentada e codificada, mas não confirmada em execução.

### 2.5 Política de privacidade
Estado encontrado:
- Existem páginas HTML para PT, EN, ES e FR.
- Todas contêm um marcador explícito para inserir e validar o contacto oficial antes da publicação.
- A política descreve a idade mínima de 18 anos e as categorias de dados tratadas.

Bloqueio:
- Não publicar nem declarar a política concluída enquanto o contacto oficial monitorizado não for fornecido e enquanto a política não for comparada com a configuração real dos serviços e a declaração Google Play.

Risco: CRÍTICO para publicação — contacto em falta e publicação externa não comprovada.

### 2.6 SOS
Estado encontrado:
- As traduções principais incluem mensagens que dizem que o SOS é individual, não contacta terceiros e não envia pedidos de ajuda.
- A Comunidade/apoio entre pares tem avisos separados de serviço de emergência.

Estado: PARCIALMENTE VALIDADO — falta uma revisão funcional de todos os ecrãs, idiomas e fluxos Android/Web.

## 3. P1/P2 — Produto e experiência
- O repositório já contém módulos adicionais, incluindo PersonalGrowthHub, PersonalExperimentsPanel, PersonalManual, NeuroscienceLearning e serviços de eventos pessoais.
- PersonalMap.tsx e outras áreas apresentam alterações locais relevantes.
- Antes de criar experiências duplicadas, é necessário mapear os componentes já existentes e verificar a integração real no percurso do utilizador.
- Não foram feitas alterações de navegação nesta execução porque os critérios de segurança P0 ainda não estão satisfeitos.

## 4. Validação técnica
- `git diff --check`: PASSOU.
- Build, TypeScript, lint e testes unitários: NÃO EXECUTADOS — Node.js/npm indisponíveis no PATH.
- Testes Firestore Emulator: NÃO EXECUTADOS.
- Testes Android/dispositivo: NÃO EXECUTADOS.
- App Check em produção: NÃO VERIFICADO.
- Eliminação de conta em produção: NÃO VERIFICADA.
- Escala de moderação humana: NÃO VERIFICADA.

## 5. Decisões/ações necessárias antes de fechar P0
1. Designar responsável(is) pela moderação, horários reais de cobertura e contacto de escalamento.
2. Fornecer o endereço oficial de contacto para as quatro políticas de privacidade.
3. Validar o provider App Check para Web e Android, configurar a chave no ambiente de produção e verificar métricas/enforcement na Firebase Console.
4. Autorizar a ativação da API Cloud Scheduler, se aplicável, e a publicação das funções `deleteAccountData` e `moderationRetentionCleanup`.
5. Corrigir as regras e os testes de bloqueio em grupos/círculos antes de considerar a Comunidade protegida.
6. Recuperar um ambiente Node.js/npm funcional e espaço em disco suficiente para executar a bateria de testes.

## 6. Estado da execução
A auditoria inicial P0 foi realizada e os bloqueios foram documentados. Não foram alteradas regras de segurança, não foram instaladas dependências e não foram publicados serviços, porque não havia ambiente de testes funcional e algumas ações exigem configuração/decisão operacional. As fases P1 a P6 ficam suspensas até os bloqueios P0 críticos serem resolvidos e validados.

## 7. Continuação da execução — bloqueios em grupos e início de P1

Data da continuação: 2 de novembro de 2026.

### 7.1 Bloqueio em grupos — implementação local
Foi implementado um modelo de bloqueio canónico por par de utilizadores:
- Novo serviço cliente: src/data/community/blocking.ts.
- Novo documento Firestore determinístico por par em blockPairs.
- Os registos legados em blocks continuam a ser escritos para manter a compatibilidade com os fluxos privados e as listas atuais.
- As regras Firestore verificam os pares bloqueados ao entrar num grupo, ler mensagens e enviar mensagens.
- Ao bloquear alguém num grupo, o utilizador bloqueado é removido do grupo; o autor do bloqueio e os restantes participantes podem continuar.
- As regras só autorizam a remoção de outro participante quando existe o documento canónico de bloqueio entre o autor e a pessoa removida.
- O utilizador removido não pode voltar a entrar num grupo onde esteja presente a pessoa que o bloqueou.
- A criação do documento canónico é limitada ao próprio utilizador; a outra parte pode registar bloqueio recíproco sem alterar a identidade do primeiro autor.
- Os documentos canónicos não podem ser eliminados pelo cliente.
- As leituras de documentos de bloqueio inexistentes estão limitadas a IDs que incluem o UID autenticado, reduzindo a possibilidade de sondagem de relações entre terceiros.

### 7.2 Migração de bloqueios existentes
- Criado functions/scripts/migrateLegacyBlockPairs.cjs.
- O script faz dry-run por omissão e só escreve com --apply.
- Criado docs/BLOCK_PAIR_MIGRATION.md com sequência de backup, simulação, migração e verificação.
- A migração NÃO foi executada em produção.
- A publicação das regras depende da migração dos bloqueios legados para evitar que relações antigas deixem de ser aplicadas nos grupos.

### 7.3 Testes acrescentados
Em src/data/community/__tests__/firestore.rules.test.ts foram acrescentados testes para:
- Remoção de um participante bloqueado.
- Continuidade de leitura e envio pelo autor do bloqueio e por membros não envolvidos.
- Impedimento de leitura, envio e reentrada pelo utilizador removido.
- Rejeição da remoção de participantes sem um bloqueio correspondente.
- Rejeição de criação de pares de bloqueio forjados.
- Bloqueio recíproco sem sobrescrever o primeiro autor.
- Verificação do orçamento de leituras com grupos de oito membros.
- Restrição de sondagem de documentos de bloqueio.

Estes testes foram escritos, mas NÃO foram executados: Node.js/npm continuam indisponíveis e o disco permanece com cerca de 87 MB livres. Não considerar as regras validadas até os testes Firestore Emulator passarem.

### 7.4 P1 — reorganização do Mapa Pessoal
- A apresentação foi reorganizada para mostrar primeiro observações e descobertas pessoais, depois sugestões, experiências pessoais e Manual Pessoal.
- O módulo de Neurociência foi deslocado para depois dos conteúdos personalizados.
- Foi acrescentada uma linha narrativa com as cinco etapas “Registar · Compreender · Descobrir · Experimentar · Evoluir”, traduzida em PT/EN/ES/FR.
- Não foram removidas funcionalidades.
- Linha do Tempo Emocional ainda não foi criada nesta etapa; fica para a fase P2, depois de validar a base de segurança.

### 7.5 Estado atualizado
- Bloqueio em grupos: IMPLEMENTAÇÃO LOCAL — TESTES PENDENTES.
- Migração de bloqueios legados: CRIADA — EXECUÇÃO PENDENTE.
- Publicação de regras Firestore: NÃO EXECUTADA.
- P1, ordem do Mapa Pessoal e narrativa: IMPLEMENTADA LOCALMENTE.
- Build, TypeScript, lint e testes: NÃO EXECUTADOS por ausência de Node.js/npm.
- Nenhum commit, push ou deploy foi realizado.


## 8. Continuação — P0: privacidade, bloqueios recíprocos e SOS

Data: 2 de novembro de 2026.

### 8.1 Bloqueio em todas as superfícies — correções adicionais
- As regras de leitura de chats privados verificam agora o bloqueio entre os dois participantes.
- A leitura das mensagens privadas também verifica o bloqueio; o envio já tinha esta proteção.
- A verificação consulta tanto os documentos legados blocks como os documentos canónicos blockPairs.
- A listagem de chats mantém as condições anteriores para não quebrar consultas Firestore que não podem filtrar dinamicamente por relações de bloqueio; a leitura direta do chat e das mensagens é que é negada após bloqueio.
- As listas de bloqueio do feed e da correspondência passaram a considerar os dois sentidos: utilizadores bloqueados pelo próprio utilizador e utilizadores que bloquearam o próprio utilizador.
- Removido o limite fixo de 100 bloqueios nas subscrições relevantes.
- O feed e as sugestões de correspondência falham de forma fechada quando não conseguem carregar as duas direções da lista de bloqueios.
- Foram acrescentadas asserções para consultas de bloqueios recebidos e para impedir leitura de chats privados existentes depois de bloqueio.
- Os fluxos de denúncia e bloqueio estão presentes nas publicações, conversas privadas, conversas de apoio entre pares e grupos. A operação e cobertura humana continuam sujeitas às limitações descritas em docs/moderation-operations.md.

### 8.2 Eliminação de dados — lacuna corrigida localmente
A callable deleteAccountData já removia publicações, reações, mensagens, chats, grupos, pedidos de correspondência, pedidos de escuta, perfis e dados de utilizador. Foi corrigida uma lacuna introduzida pelo novo modelo de bloqueio:
- Remove agora os documentos legados blocks em que o UID é autor ou destinatário.
- Remove a decisão de bloqueio criada pelo utilizador dos documentos canónicos blockPairs; se a outra pessoa também o bloqueou, preserva essa preferência de segurança e mantém apenas o seu UID em blockedBy.
- As operações continuam em páginas limitadas e podem ser repetidas enquanto a identidade Firebase ainda existir.
- As denúncias apresentadas pelo próprio utilizador são eliminadas. Denúncias sobre o utilizador podem permanecer durante a pendência e até 180 dias após decisão, conforme a informação já apresentada na aplicação.
- A eliminação não foi executada numa conta real; não fazer teste destrutivo em produção.

### 8.3 SOS — comunicação reforçada
- Confirmado que PT/EN/ES/FR já contêm mensagens que explicam que o SOS é individual, não contacta terceiros e não é um serviço de emergência.
- A descrição inicial foi ajustada para não sugerir uma intervenção feita em conjunto com outra pessoa.
- A nota de segurança passou a aparecer também no ecrã final do exercício, além de durante o percurso.
- A funcionalidade Desabafar permanece separada.

### 8.4 App Check — diagnóstico e documentação
- Confirmado que o cliente Web usa reCAPTCHA Enterprise e depende de VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY.
- A variável está vazia em .env.example e não foi encontrada configuração de ambiente no repositório.
- Não foi encontrada integração nativa Play Integrity no projeto Capacitor Android.
- Criado docs/APPCHECK_OPERATIONS.md com os passos de configuração, validação de tokens, monitorização e enforcement gradual.
- App Check continua não confirmado/por configurar. Enforcement não foi ativado.

### 8.5 Operação de moderação
- Atualizado docs/moderation-operations.md.
- O documento deixa explícito que não foi possível confirmar responsáveis nomeados, horários, SLA ou cobertura permanente.
- Define prioridades de triagem P0/P1/P2, requisitos de nomeação de responsáveis, escalamento, contenção se não existir cobertura e retenção.
- Não foi inventado qualquer horário nem prometida moderação 24/7.

### 8.6 Validação desta continuação
- JSON dos quatro idiomas: parsing efetuado.
- Chaves de clarificação SOS nos quatro idiomas: presentes.
- Estrutura delimitadora de firestore.rules: contagens de chavetas/parênteses equilibradas.
- git diff --check: passou.
- Testes Firestore, TypeScript, lint e build: não executados. Não existe node, npm, npx, Bun ou Deno no ambiente e há apenas cerca de 87 MB livres.
- As regras não estão validadas pelo Firestore Emulator e não devem ser publicadas ainda.
- Nenhum commit, push, deploy, migração de dados ou alteração em produção foi realizado.

### 8.7 Estado P0 revisto
- Bloqueio e denúncia no cliente: implementados localmente; testes por executar.
- Bloqueio recíproco em leitura/envio: implementado nas regras e serviços; testes por executar.
- Eliminação de relações de bloqueio: corrigida localmente; teste integrado por executar.
- Eliminação integral em produção: não validada.
- App Check Web: código presente, configuração ausente/não comprovada.
- App Check Android: integração Play Integrity pendente.
- Moderação humana: cobertura não assegurada; decisão operacional do responsável do produto necessária.
- SOS: texto clarificado em quatro idiomas.
- P1 Mapa Pessoal: ordem e narrativa implementadas na continuação anterior.
- P2: não iniciado nesta continuação; aguarda fecho e validação de P0.


### 8.8 Moderação — ciclo de vida explícito das denúncias
- O painel de moderação passou a apresentar quatro estados compreensíveis: Recebida, Em análise, Resolvida e Rejeitada.
- Os valores antigos pending/reviewed/actioned/dismissed foram preservados para compatibilidade; pending é apresentado como Recebida, in_review é o novo estado de análise, actioned como Resolvida e dismissed como Rejeitada.
- A fila inclui denúncias recebidas e em análise.
- A limpeza automática não elimina denúncias em análise; só considera estados finais e respeita legalHold.
- O índice composto existente reports(status, createdAt) suporta a consulta da fila.
- Foram acrescentadas asserções de regras para transição para in_review e depois actioned. Execução ainda pendente por falta de Node.js.

### 8.9 Abertura automática de conversas não lidas
- A seleção automática de conversas não lidas consulta agora os bloqueios nos dois sentidos antes de apresentar ou abrir uma conversa.
- A lista de bloqueios tem de estar carregada com sucesso; enquanto isso não acontece, a abertura automática falha de forma fechada.
- A filtragem foi isolada num helper puro e foram acrescentados testes para bloqueios efetuados, recebidos e indisponibilidade da lista.
- A consulta considera até 30 conversas não lidas recentes, em vez de deixar uma única conversa bloqueada suprimir o badge.



## Fase P2 — Mapa Vivo de Mim (primeira entrega integrada, 02-11-2026)

### Concluído nesta etapa
- Foi acrescentado PersonalMapOverview.tsx ao Mapa Pessoal existente; não foi criado um novo menu nem uma nova área paralela.
- O retrato utiliza o histórico unificado readPersonalEvents, o motor existente buildPersonalInsights + applyInsightLifecycle e o armazenamento de experiências readExperiments.
- O painel apresenta contagem de registos, dias com registos, observações identificadas e experiências ativas.
- Os estados apresentados são explicitamente limitados:
  - **Dados insuficientes**: estado inicial, sem inferência.
  - **Primeiros sinais**: pelo menos 4 registos distribuídos por 3 dias.
  - **Padrão emergente**: o motor de insights existente devolveu um padrão possível/emergente.
  - **Padrão consistente**: o motor existente devolveu estado consistente e confiança alta.
  - **Padrão em mudança**: o ciclo de vida dos insights identificou estado changed/weakened ou uma alteração de estado assinalada como returning.
- O painel explica os critérios e declara que não são diagnósticos nem relações causais.
- Foi acrescentada uma linha temporal dos 6 registos mais recentes, com filtros por 7/30 dias ou histórico completo e por emoção/autorregulação, hábitos, objetivos, experiências e estilo de vida.
- Cada registo permite consultar a origem funcional. A linha temporal não expõe notas privadas nem metadata sensível.
- O painel atualiza-se quando os eventos pessoais ou as experiências existentes são alterados.
- Foram acrescentadas traduções para PT/EN/ES/FR.
- Foram criados testes unitários para os estados de evidência e contagem das experiências já existentes.
- A ordem atual mantém as descobertas e sugestões personalizadas antes do Laboratório Pessoal, Manual Pessoal e lições genéricas de neurociência.

### Funcionalidades existentes reutilizadas — não duplicadas
- **Laboratório Pessoal**: PersonalExperimentsPanel + personalExperiments.ts; mantém criação, check-ins, conclusão e resumo com limiar mínimo de evidência.
- **Manual Pessoal / A Minha História**: PersonalManual; mantém nota local, observações úteis, experiências concluídas e exportação mensal. Foi acrescentado um resumo narrativo semanal/mensal com contagens reais de registos, dias, observações e experiências ativas no período.
- **Ciência aplicada à minha vida**: NeuroscienceLearning; mantém seis lições, reflexões e progresso.
- **Descobertas pessoais**: personalInsights, personalPatterns, personalInsightLifecycle e feedback existente.
- **Histórico**: personalEventStorage e migrações existentes; não foi criado um segundo armazenamento de eventos.

### Complemento P2 — restantes integrações implementadas nesta etapa
- **Árvore da Evolução**: o componente GrowthTree existente foi evoluído e integrado no Retrato de Mim. Os seis ramos (autoconsciência, hábitos, relações, descanso, autorregulação e objetivos) são calculados a partir de eventos pessoais válidos, observações com confiança suficiente e experiências concluídas com evidência mínima. Registar repetidamente, por si só, não desbloqueia autoconsciência, hábitos ou descanso; estes exigem observações sustentadas ou experiências concluídas. Não usa dias consecutivos, pontos, XP ou frequência de abertura. Critérios centralizados em personalGrowthTree.ts e cobertos por testes.
- **Espelho no Lago**: acrescentado PersonalLakeReflection à experiência existente HabitDailyExperience. Reutiliza buildPersonalInsights sobre os mesmos eventos pessoais, mostra apenas observações com confiança moderada/alta e apresenta registos de suporte com data/origem. Ao selecionar uma origem, o Espelho abre o respetivo dia. Não cria outro motor nem outro armazenamento.
- **O Meu Lugar Seguro**: integrado no ecrã inicial do ImpulsoSOS. A pessoa pode guardar os percursos existentes (acalmar, organizar pensamentos, recuperar controlo, procurar apoio), iniciá-los diretamente no mesmo fluxo SOS e escrever uma frase/lembrete privado. Percursos e frase ficam no dispositivo, com validação e tratamento de falhas de armazenamento. Não foi criado um segundo SOS e o texto identifica os percursos como autorregulação individual.
- **Companheiro com consentimento**: acrescentado controlo explícito, por perfil local, desligado por defeito. Só com autorização o Companion recolhe contexto histórico para sugestões. Sem autorização, o motor contextual devolve null antes de ler histórico, a memória relacional da Home não é recolhida, o avatar não recebe mensagem/humor histórico e uma decisão previamente em cache é limpa. A desativação não apaga registos da Confia; esta limitação é explicada na interface. A preferência fica em localStorage e não é enviada para Firebase.
- **Revisão Android/ecrãs pequenos**: revisão estática de JSX/Tailwind concluída. Novos controlos usam áreas mínimas de toque de 44 px, grelhas passam de 2 para 3 colunas em ecrãs maiores, listas usam flex-wrap, e a árvore mantém SVG responsivo. Não foi possível fazer inspeção visual real em Android/browser: não há dispositivo Android de teste, Node/npm ou servidor local disponível neste ambiente.

### Validação e limitações desta continuação
- Testes adicionados para critérios da Árvore da Evolução, incluindo experiência concluída com evidência mínima e exclusão de registos malformados.
- Teste adicionado para confirmar que o Companion não gera decisões quando o consentimento está desligado.
- Parsing JSON estrito e consistência das novas chaves PT/EN/ES/FR: validados por Python.
- Verificações estáticas confirmaram integração do GrowthTree, Espelho, Lugar Seguro e gate de consentimento; `git diff --check` passou.
- Testes Node, TypeScript, lint, build e inspeção visual real: pendentes, porque Node/npm/Bun/Deno não estão disponíveis e o disco mantém apenas cerca de 86 MB livres.
- Sem commit, push, deploy ou alteração de produção.

### Validação e limitações
- Parsing JSON estrito dos 20 ficheiros de idioma (sem chaves duplicadas): validado por Python.
- Igualdade estrutural de 77 chaves do Mapa Vivo, 22 chaves da Carta para o Eu Futuro e 6 chaves do resumo semanal/mensal nos quatro idiomas: validada.
- Cobertura estática das chaves de tradução dos dois novos componentes e dos tipos/origens dos eventos: validada.
- git diff --check: passou sem erros.
- Testes unitários adicionados, mas **não executados**: Node.js e npm não estão disponíveis neste ambiente.
- Build, TypeScript, lint, testes de integração e validação visual: pendentes pelo mesmo bloqueio.
- Sem commit, push ou deploy.


### Complemento P2 — Carta para o Meu Eu Futuro
- Confirmada a existência de chaves de tradução antigas, mas sem componente funcional correspondente no código.
- Criado FutureSelfLetter.tsx e integrado no Mapa Pessoal, sem criar uma nova entrada de navegação.
- Permite escrever, escolher a data de releitura, guardar, editar, eliminar e marcar como relida.
- As cartas são guardadas apenas no localStorage do dispositivo; não são enviadas para Firebase nem geram notificações.
- A lista é limitada às 100 cartas mais recentes e o acesso ao armazenamento está protegido por tratamento de exceções.
- A edição de cartas antigas permite manter datas anteriores; uma carta editada volta a ficar por reler quando o conteúdo/data muda.
- Traduções PT/EN/ES/FR acrescentadas.
- Validação funcional automatizada e build continuam pendentes por falta do runtime Node.js.
