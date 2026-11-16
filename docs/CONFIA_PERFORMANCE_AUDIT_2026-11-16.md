# CONFIA — Segunda auditoria de desempenho e velocidade

**Data:** 16 de novembro de 2026
**Base técnica:** branch `fix/mobile-performance-deep-audit`, commit `e30f6dc` (4 de novembro de 2026), com alterações locais já existentes preservadas.

## Objetivo

Rever o arranque, navegação, renderização, trabalho em segundo plano, armazenamento local, sincronização Firebase, motores pessoais e preparação Android. As alterações foram limitadas a melhorias de desempenho com baixo risco funcional.

## Melhorias aplicadas nesta execução

1. **Trabalho em segundo plano:** `scheduleBackgroundWork` passou a distinguir corretamente os identificadores de `requestIdleCallback` dos temporizadores. A limpeza cancela cada tipo com a API correspondente, evita limpar temporizadores já executados e funciona em ambientes sem `window`.
2. **Feed da Comunidade:** a serialização JSON do feed passou para o callback adiado. Antes, apenas a escrita era adiada; o `JSON.stringify` continuava a bloquear o ciclo de interação.
3. **Navegação:** removido o segundo agendamento redundante de pré-carregamento no clique. A alteração de separador é tratada pelo efeito de estado, que já marca a visita e inicia o pré-carregamento.
4. **Diagnóstico de desempenho:** a amostragem contínua por `requestAnimationFrame` é agora suspensa quando a página fica oculta e retomada quando regressa; os observadores são libertados em `pagehide`.
5. **Mapa Pessoal:** resumo, aprendizagem mensal, filtragem e ordenação do histórico passaram a usar memoização. Alterar apenas o período, categoria ou expansão da lista já não recalcula os resumos completos.
6. **Relógio/calendário de hábitos:** o intervalo de atualização de minuto é suspenso quando a aplicação fica em segundo plano e retomado ao regressar.
7. **Regressão:** acrescentados dois testes unitários para execução em idle e cancelamento correto de callbacks.

## Otimizações anteriores verificadas e preservadas

- Arranque visual leve enquanto a aplicação e o idioma são carregados.
- Traduções por idioma e namespaces de funcionalidades carregados sob procura.
- Separação de ecrãs pesados e pré-carregamento dos primeiros conteúdos dos separadores.
- Inicialização Firebase e serviços não críticos adiados.
- Cache de memória do Companheiro e índices partilhados para estatísticas de hábitos.
- Limite temporal de atualização remota dos hábitos para reduzir leituras repetidas, mantendo o envio de alterações locais pendentes.
- Pausa de atualizações do relógio quando oculto ou fora do ecrã.
- Redução de animações contínuas quando a experiência não está ativa ou o utilizador prefere movimento reduzido.

## Medições da compilação

A compilação analisou **2.330 módulos** e terminou com sucesso em **6,49 segundos** nesta execução.

| Bundle | Tamanho | Gzip |
|---|---:|---:|
| App | 177,34 KB | 48,56 KB |
| React | 189,52 KB | 59,59 KB |
| Motion | 120,80 KB | 39,18 KB |
| Horizon Experience | 171,09 KB | 47,00 KB |
| Firebase Firestore | 559,08 KB | 164,53 KB |
| Tradução PT | 236,41 KB | 73,65 KB |
| CSS principal | 276,63 KB | 39,79 KB |

**Ponto ainda a acompanhar:** o chunk partilhado do Firestore excede 500 KB descomprimidos e gera um aviso do bundler. É uma dependência usada por sincronização e funcionalidades em tempo real. Está separado dos restantes chunks; não foi feita uma substituição arriscada por Firestore Lite nem uma divisão artificial sem medir o impacto real no primeiro carregamento. Falta medir em browser a altura exata em que esse chunk é pedido em cada percurso.

## Validação executada

- `npm run lint` — **PASSOU** (TypeScript sem erros).
- `npm test` — **PASSOU: 163 testes, 0 falhas**.
- Testes específicos do agendador — **2 passaram, 0 falhas** (também incluídos na suite).
- `npm run build` — **PASSOU**, com o aviso de tamanho do chunk Firestore acima identificado.
- E2E Playwright — **não executado com sucesso**: o Chromium necessário não estava instalado e a transferência do browser (186,8 MB) expirou por timeout de rede. Não é uma falha funcional dos testes; continua por validar em browser.
- Android físico/emulador — **não validado nesta execução**. A configuração nativa foi inspecionada; não foram alterados versão, assinatura, permissões ou configuração de lançamento.

## Integridade e limites da execução

- Foram preservadas as alterações locais que já existiam no workspace.
- Não foram executados `git reset`, `git clean`, commits, pushes, merges, deploys ou publicação na Google Play.
- Não foram removidas funcionalidades nem alteradas regras Firestore, dados dos utilizadores ou serviços de produção.
- As melhorias estão no workspace local e permanecem por integrar/publicar.

## Próxima prioridade técnica

1. Obter métricas reais de cold start, primeira interação, mudança de separador e abertura do Espelho na Água em Android físico de gama média/baixa.
2. Confirmar no painel de rede quando o chunk Firestore é descarregado e se o pré-carregamento compete com a primeira interação.
3. Executar a suite E2E em Chromium e Android, incluindo regressão de navegação, sincronização offline/online, feed e persistência após fechar/reabrir.
4. Só então decidir se o chunk Firestore deve ser subdividido ou se o ganho real justifica a complexidade adicional.

## Segunda ronda — mecanismos redundantes e peso evitável

### Alterações aplicadas

- **Pré-carregamento especulativo removido:** a versão anterior iniciava, pouco depois do arranque, downloads paralelos dos três separadores principais, mesmo que o utilizador não os abrisse. Agora os módulos são preparados apenas quando existe intenção real (hover com rato, foco por teclado ou toque) ou quando a navegação os pede. O carregamento lazy continua a assegurar o funcionamento na primeira abertura.
- **Pré-carregamento duplicado eliminado:** a navegação já era antecipada pelo componente de navegação; o handler de clique também marcava o separador e iniciava os mesmos imports. A marcação de visita passa a ser responsabilidade única do hook de navegação e o prefetch fica no sinal de intenção.
- **Camadas gráficas persistentes reduzidas:** removido `will-change: transform` permanente dos ícones da navegação. O browser pode promover a camada apenas quando necessário, evitando reservar recursos gráficos sem animação ativa.
- **CSS morto removido:** keyframe `wave` sem referências, estilos do elemento `fire` não usado nos quatro separadores atuais, override móvel de `will-change` que deixou de ter efeito e transição de imagem com duração zero.
- **Timers tipados como browser:** removida a dependência de `NodeJS.Timeout` nos cronómetros do Abraço e SOS; os handles passam a usar `ReturnType<typeof window.setInterval>` e o cleanup do SOS só limpa um timer realmente criado.
- **Subscrições de bloqueios Firebase partilhadas:** o feed, o badge de mensagens, a área de matching e o chat abriam pares independentes de listeners para os mesmos dois sentidos de bloqueio. Agora existe um listener global com referência partilhada e libertação quando deixa de haver subscritores. O feed reutiliza-o em vez de criar mais dois listeners próprios. No cenário com feed, badge e chat ativos, reduz de até oito listeners de bloqueio para dois. Durante a verificação mantém-se o comportamento fail-closed: não apresenta publicações até os dois sentidos dos bloqueios estarem carregados.

### Mecanismos auditados e mantidos intencionalmente

- Separadores 1 e 2 continuam montados depois da primeira visita para preservar o estado; o conteúdo fica oculto e os componentes recebem o estado de inatividade. Comunidade continua a desmontar ao sair para libertar a subscrição Firestore.
- O pré-carregamento de Horizon permanece ligado à intenção explícita de abrir Explorar; não é descarregado no arranque.
- O timer do Abraço só mantém os intervalos de sessão enquanto a própria experiência está ativa; ao sair do separador o áudio e o cronómetro são interrompidos.
- O Firebase mantém leituras limitadas ao período recente e histórico antigo sob pedido; não foi removida sincronização nem subscrição necessária.

### Validação e limite

`git diff --check` passou. A build, TypeScript e testes continuam pendentes porque este ambiente remoto não disponibiliza Node.js. As alterações permanecem locais na branch de trabalho; não foram publicadas.


## Terceira ronda — custo da experiência inicial e análises do Espelho

### Alterações aplicadas

- **Memória do Companheiro sem invalidações inúteis:** removi `weeklyGoal` da lista de dependências da recolha de memória relacional. A recolha lê humor, histórico de objetivos, Impulso e check-ins; não lê o objetivo semanal. Alterar esse objetivo deixava, portanto, agendada uma nova leitura e reconstrução de memória sem alterar os dados que a alimentam.
- **Derivação visual do Companheiro mais estável:** removi dependências de `homeNowMemory` que não eram usadas no cálculo (`ratings`, `objectives`, `weeklyGoal` e XP). A memória só é agora recalculada quando muda o separador/ecrã, o snapshot de memória ou o consentimento contextual.
- **Espelho na Água — pesquisa nutricional limitada ao dia:** a agregação diária já recebia os registos do dia, mas voltava a chamar `nutritionTotals` com o histórico completo. Passa a usar apenas esse subconjunto diário, evitando voltar a percorrer todo o histórico em cada dia do calendário/relatório.
- **Formatadores reutilizados:** os formatadores de número e data do Espelho são criados uma vez por idioma, em vez de serem reconstruídos em cada renderização.
- **Subárvores analíticas isoladas:** memoizei os painéis de Impacto dos Hábitos, Revisão do Estilo de Vida, Insights, Reflexão do Lago e o quadro LifestyleMirror. Alterações locais do Espelho (por exemplo, expandir, escolher data, mudar separador ou guardar a avaliação) deixam de voltar a renderizar estes painéis quando os respetivos dados de entrada não mudaram. A callback de seleção de data passou a ter identidade estável para permitir esta otimização.
- **Dependência redundante removida nos Insights:** a lista de insights depende dos eventos pessoais; a data de hoje não participa no cálculo e deixou de invalidar a análise sem necessidade.

### Funcionalidades preservadas

Companheiro, voz e decisão contextual, Espelho na Água, Impacto dos Hábitos, calendário, relatório, evolução, LifestyleMirror, Mapa Pessoal, SOS, registos e histórico mantêm-se. Não removi experiências nem alterei as regras de interpretação dos dados.

### Validação

- `git diff --check` passou após as alterações.
- A inspeção confirmou que a agregação nutricional recebe o subconjunto do dia e que as dependências da memória do Companheiro correspondem aos dados efetivamente lidos.
- A validação TypeScript, testes e build continuam por executar: o ambiente remoto não disponibiliza executáveis Node/npm, apesar de existir a pasta `node_modules`.
- Alterações apenas locais na branch de trabalho. Sem commit, push, merge, deploy ou publicação.
- **Criatura SVG do Companheiro em chunk próprio:** o ficheiro visual `ConfiaCreature.tsx` (cerca de 56 KB de código-fonte) deixou de ser importado estaticamente pelo `Avatar`. É carregado através de `React.lazy` dentro de `Suspense`, com um placeholder leve do mesmo espaço visual. O cartão, a voz, os controlos e a interação do Companheiro continuam no primeiro ecrã; apenas o desenho detalhado passa a ser descarregado/interpretado separadamente, sem bloquear a montagem inicial da aplicação.


## Quarta ronda — separação gradual da lógica do App

### Responsabilidades extraídas sem alterar o fluxo

- **`useCompanionHomeMemory`:** passou a gerir o ciclo de vida da memória contextual do Companheiro, incluindo o evento de alteração do consentimento, atualização em idle, cancelamento e projeção visual da memória. Continua a chamar exclusivamente `collectReactiveRecentMemory`; não introduz armazenamento paralelo, novo motor ou decisão própria.
- **`useHomeReactiveEngine`:** passou a gerir o estado e o agendamento do resultado do Reactive Engine da página inicial. Mantém o mesmo import dinâmico, a mesma janela de espera (1800 ms / timeout 3200 ms), as mesmas condições de ativação e as mesmas dependências de atualização. Continua a existir um único resultado reativo partilhado.
- **`homePresentation`:** extraiu dois seletores puros da apresentação — observação contextual e ação «Para ti agora». Apenas convertem o resultado já produzido pelo motor em chaves e tipos de cartão; não voltam a analisar registos nem escolhem uma intenção nova.
- **Testes de regressão:** criado `homePresentation.test.ts` para verificar o mapeamento de observações, ausência de cartões sem evidência, ação de regulação e ocultação fora do ecrã inicial.

### Impacto estrutural

- `App.tsx` passou de 2.921 linhas / 97.525 bytes para 2.578 linhas / 87.514 bytes nesta comparação local: menos 343 linhas e cerca de 10 KB de lógica diretamente concentrada no componente principal.
- A composição visual e os handlers das restantes experiências continuam em `App.tsx`; esta é uma extração incremental, não uma reescrita global.
- Esta separação melhora isolamento, legibilidade e capacidade de testar. Por si só não garante redução do tempo de arranque nem do bundle, porque os módulos são importados estaticamente pelo App. Não reivindicamos ganho de FPS ou velocidade sem medições.

### Garantias preservadas

- O Companheiro continua a receber a mesma memória e o mesmo resultado do Reactive Engine.
- O consentimento de contexto pessoal continua a ser verificado antes de ler memória contextual.
- A memória continua a atualizar em background e a cancelar trabalho quando o ecrã deixa de estar ativo.
- A ação «Para ti agora» continua a ser determinada pelo mesmo intent do Reactive Engine; os seletores extraídos não criam regras emocionais novas.
- Nenhuma experiência, rota, registo, histórico ou funcionalidade foi removida.

### Validação e limites

- `git diff --check` passou.
- Foram adicionados testes de regressão, mas não foi possível executá-los, nem executar TypeScript/build, porque Node.js/npm não estão disponíveis no ambiente remoto.
- A validação em Android físico permanece pendente.
- Alterações locais apenas na branch `fix/mobile-performance-deep-audit`; sem commit, push, merge, deploy ou publicação.


## Quinta ronda — extração dos contextos diário e “Para ti agora”

- Extraída a construção de `dailyContext` para `src/data/reactive/homeContext.ts`, preservando a prioridade de estados, os mesmos campos de saída e a hierarquia de evidência.
- Extraída a construção de `homeNowContext` para o mesmo módulo, mantendo as regras de compatibilidade entre a ação já selecionada pelo Reactive Engine e a memória contextual.
- `worldMood` permanece no App como tradução visual do nível diário já calculado; não foi criado qualquer novo estado, efeito, armazenamento ou motor.
- O App passa os mesmos valores factuais e os mesmos resultados previamente calculados às funções puras.
- Criados testes de regressão para primeiro contacto, regresso após ausência, primeira abertura diária, níveis de aprendizagem, prioridade de continuidade transversal/check-in, impulso e progresso, bem como pares incompatíveis.
- A extração é estrutural e testável; não é apresentada como melhoria medida de velocidade. Os handlers de navegação do Companheiro ficam para a ronda seguinte, após validação desta separação.
- Validação estática a executar nesta sessão; a execução de TypeScript/testes/build depende da disponibilidade de Node/npm no ambiente remoto.


## Sexta ronda — extração dos handlers de navegação do Companheiro

- Extraída a navegação de ações do Companheiro para `src/hooks/useCompanionNavigation.ts`.
- Mantidos os destinos de separador e ecrã, a ordem dos setters, o incremento de `habitEntry.key`, a abertura/fecho do apoio de hábitos, os scrolls agendados em `requestAnimationFrame` e o evento de progresso antes da mudança de contexto.
- A lógica de navegação de “Para ti agora” também ficou no mesmo módulo, incluindo `changeTab(2)` para objetivos e os scrolls do registo/apoio.
- O App fornece apenas os setters e o callback de evento; o hook não calcula memória, intenção ou resultados reativos.
- Criados testes focados em ordem de operações, destinos, histórico de hábitos, evento de progresso e navegação de objetivos/registo.
- A função `handleHomeNowAction` já não tinha consumidores no App antes desta extração; a implementação foi preservada no hook, sem introduzir um novo ponto de chamada ou alterar a experiência atual.
- A validação de TypeScript, testes e build permanece pendente enquanto o ambiente remoto não disponibilizar Node/npm.


## Sétima ronda — revisão dos restantes handlers de navegação no App

- Revistos os pontos de navegação ainda concentrados em `App.tsx`: destinos do `MorningSheet`, navegação principal, abertura do Inner Canvas, entrada no modo Impulso a partir do Stop Mode e navegação proveniente de notificações/deep links.
- Extraídos para `src/hooks/useAppNavigation.ts` os handlers simples e partilhados da navegação principal, `MorningSheet`, Inner Canvas e Stop Mode. O App mantém a composição e passa os callbacks aos componentes.
- Preservada a ordem original das operações: reset do apoio de hábitos/ecrã/conversa pendente antes da seleção do separador; pares tab/ecrã de cada destino do `MorningSheet`; e, no Stop Mode, fechar o modo, abrir apoio, selecionar separador, definir ecrã e só depois agendar o scroll.
- Os fluxos de notificações e deep links ficaram no `App.tsx`: contêm validação de participantes, autenticação, leituras Firestore, cancelamento assíncrono e abertura de conversas. Não foram movidos nem simplificados nesta ronda para evitar alterar a ordem ou o comportamento assíncrono.
- Criados testes de regressão para a ordem da navegação principal, os cinco destinos do `MorningSheet`, a entrada no Stop Mode e a abertura do Inner Canvas.
- Esta é uma separação estrutural/testável; não é apresentada como melhoria medida de velocidade. Não foram removidos destinos, estados, eventos ou funcionalidades.
- `git diff --check` e a inspeção estática ficam registados após a edição. TypeScript, testes e build dependem da disponibilidade de Node/npm no ambiente remoto.
