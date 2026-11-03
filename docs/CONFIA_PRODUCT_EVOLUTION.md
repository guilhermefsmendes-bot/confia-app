# Confia — Evolução de Produto e Auditoria Menu a Menu

Estado: trabalho em curso
Branch de trabalho: `feature/habit-impact-engine`
Princípio de segurança: preservar o código, as funcionalidades, os dados, as regras Firebase, as chaves Android e todas as alterações locais existentes.

## Ambição de produto

A Confia deve tornar-se um sistema pessoal de evolução emocional: uma experiência diária útil, discreta, elegante e baseada em evidência individual. A retenção deve resultar de valor percebido, autonomia e continuidade — nunca de culpa, pressão, streaks punitivas ou dependência.

## Princípio central de produto

**Observar → compreender → escolher → experimentar → rever → aprender.**

1. A pessoa regista emoções, necessidades, hábitos, sono, alimentação, movimento e acontecimentos relevantes.
2. A Confia reúne os dados autorizados e identifica sinais com transparência sobre a quantidade e qualidade da evidência.
3. A pessoa recebe uma observação ou hipótese compreensível, podendo confirmá-la, rejeitá-la ou ignorá-la.
4. A Confia sugere uma ação pequena, voluntária e adequada ao contexto.
5. A pessoa regista o resultado da ação, incluindo quando não ajudou.
6. A aprendizagem melhora a próxima recomendação sem transformar correlação em causalidade nem fazer diagnósticos.

## Regras inegociáveis

- Idade mínima: 18 anos, com confirmação explícita.
- Não exigir criação de conta para a experiência pessoal básica.
- Preservar todas as funcionalidades existentes e as alterações locais não submetidas.
- SOS é individual e destina-se a autorregulação; não contacta terceiros.
- Desabafar e os espaços comunitários são superfícies de comunicação distintas do SOS.
- Denunciar, bloquear, privacidade, consentimento e segurança são requisitos de produto, não extras.
- O utilizador controla o contexto pessoal usado pelo Companheiro e pode desligá-lo.
- Não inventar histórico, evidência, progresso ou padrões.
- Não enviar conteúdo emocional para métricas de produto.
- Acessibilidade, funcionamento em ecrãs pequenos, estados offline, recuperação e tradução são critérios de aceitação.
- Nenhum deploy, publicação, push, mudança de branch, reset ou remoção destrutiva sem autorização expressa.

## Arquitetura de experiência proposta

### Navegação principal existente
1. Início — Companheiro, ritual diário, registos, hábitos, apoio e SOS.
2. Abraço — experiências de autorregulação, respiração, horizonte e céu.
3. Objetivos — intenções, ações e metas semanais.
4. Comunidade — partilha, conversas e apoio entre pessoas.

### Áreas transversais
- Meu Percurso / Mapa Pessoal: evolução, padrões, experiências e reflexão.
- Definições e privacidade: consentimentos, idioma, notificações, políticas e eliminação de dados.
- Loja e inventário: personalização lúdica, sem pay-to-progress nem incentivos que distorçam o bem-estar.

## Contrato de sinergias

| Origem | Transformação | Destino |
|---|---|---|
| Check-in emocional | contexto do dia e necessidade declarada | Companheiro, Abraço e sugestão opcional |
| Sono, alimentação e movimento | observações longitudinais prudentes | Espelho no Lago e Mapa Pessoal |
| Hábitos | registos e consistência sem punição | impacto observado e reflexão |
| Objetivos | intenção e conclusão real | progresso e Companheiro |
| SOS / Impulso / STOP | registo voluntário do que ajudou | aprendizagem privada e segura |
| Experiências | intenção, prática e resposta | recomendações futuras |
| Comunidade | apoio social escolhido | continuidade, sem expor dados privados |

Cada sinergia deve ter: fonte identificável, consentimento adequado, evidência mínima, linguagem prudente, explicação do porquê, opção de rejeitar e forma de medir se foi útil.

## Critérios de qualidade por ecrã

1. Uma finalidade principal, clara nos primeiros segundos.
2. Hierarquia visual e editorial consistente.
3. Uma ação principal; ações secundárias discretas.
4. Estados carregamento, vazio, erro, offline, sucesso e recuperação.
5. Teclado, leitor de ecrã, foco visível, contraste e áreas tácteis adequadas.
6. Layout validado a 320 px, telemóvel moderno, tablet e desktop.
7. Sem repetição de informação, cartões concorrentes ou navegação sem saída.
8. Dados reais e linguagem proporcional à evidência.
9. Performance medida: carregamento, interação, renderizações, memória e FPS quando aplicável.
10. Traduções completas em PT, EN, ES e FR, sem textos de fallback esquecidos.

## Auditoria por menu

### 1. Início — em revisão
**Componentes identificados:** ConfiaCompanionHome, CompanionVoice, ProgressiveStartGuide, MorningSheet / DailyCheckIn, registo diário de manhã/tarde, HabitDashboard, apoio humano, SOS/TriageModal.

**Pontos fortes**
- Companheiro contextual com memória e controlo explícito de consentimento.
- Check-in curto que capta estado e necessidade.
- Hábitos com registo, história, nutrição, movimento, sono e Espelho no Lago.
- Apoio humano separado do SOS individual.
- Carregamento diferido do painel de hábitos.

**Problemas / riscos observados**
- O ecrã Início agrega muitas funções; precisa de hierarquia progressiva para não parecer um painel interminável.
- Existem dois modelos de registo diário (check-in emocional e classificação manhã/tarde); a relação entre eles deve ser explicada e os dados não devem parecer duplicados.
- O guia de entrada calcula os dias de registo apenas ao montar; deve atualizar quando um novo registo é guardado na mesma sessão.
- O Companheiro, o registo, o Espelho no Lago e os hábitos precisam de partilhar uma narrativa de causa/observação/ação/resultado sem duplicar recomendações.
- O acesso ao apoio humano e ao SOS deve ser inequívoco: um procura apoio de outra pessoa; o outro é autorregulação individual.

**Direção**
- Manter o Companheiro como presença principal e não como chatbot genérico.
- Mostrar primeiro a ação mais relevante para hoje, adaptada ao estado e à intenção do utilizador.
- Registo curto como porta de entrada; aprofundamento sempre opcional.
- Hábitos e Espelho no Lago devem transformar registos em aprendizagem prática, não em mais formulários.
- Apoio e SOS visíveis, distintos e com linguagem transparente.
- O utilizador deve conseguir terminar uma sessão útil em menos de dois minutos, mas aprofundar quando quiser.

**Primeira correção técnica**
- Atualizar o guia progressivo quando chegam eventos de check-in, eventos pessoais ou alterações de armazenamento, sem exigir reiniciar a aplicação.

### 2. Abraço — por rever
Experiências, respiração, horizonte, temporizador de abraço e céu/constelações. Rever coerência entre a necessidade do check-in, a recomendação e a experiência escolhida; medir eficácia percebida sem alegações clínicas.

### 3. Objetivos — por rever
Rever ligação entre objetivos, micro-hábitos, calendário, metas semanais, obstáculos e recuperação após falhas. Evitar XP como razão principal para agir.

### 4. Comunidade — por rever
Rever feed, grupos, conversas, Desabafar, matching, denúncias, bloqueios, moderação, regras Firestore, consentimento e proteção contra abuso. Separar claramente comunidade e apoio humano.

### 5. Meu Percurso / Mapa Pessoal — por rever
Rever timeline, Espelho no Lago, padrões, evidência, confiança, experiências, progresso e possibilidade de corrigir interpretações.

### 6. Definições, privacidade e segurança — por rever
Rever idioma, notificações, consentimentos, políticas, dados locais/remotos, eliminação integral, App Check, regras e acesso de moderadores.

### 7. Loja, inventário e progressão — por rever
Rever cosmética e recompensas para garantir que reforçam expressão e continuidade sem criar pressão, compras abusivas ou penalização por pausas.

## Plano de execução

- Fase A — inventário e auditoria funcional de cada menu.
- Fase B — correções P0 de segurança, privacidade, dados e navegação.
- Fase C — experiência e hierarquia visual de cada menu.
- Fase D — motor de sinergias e ciclo de aprendizagem.
- Fase E — acessibilidade, traduções, performance e resiliência.
- Fase F — testes unitários, regras Firestore, E2E desktop/mobile e build Android.
- Fase G — métricas de ativação, retenção saudável, valor percebido e preparação para investidores.

## Definição de terminado

A Confia só é considerada pronta quando cada menu tem auditoria concluída, percurso funcional coerente, estados e traduções completos, sinergias verificadas, segurança e privacidade validadas, acessibilidade aprovada, performance medida, testes automatizados verdes e build Android reproduzível. A publicação fica sempre sujeita a autorização explícita do proprietário.

## Registo de execução — 3 de novembro de 2026

### Início — primeira ronda de otimização aplicada
- O guia progressivo passa a atualizar os dias de registo quando ocorre um check-in, uma classificação diária, uma atualização da linha temporal, mudança de armazenamento ou regresso à aplicação. Leituras assíncronas antigas não podem substituir resultados mais recentes.
- A classificação diária emite um evento local explícito para atualizar o guia imediatamente, sem esperar pela sincronização secundária.
- O check-in inicial deixou de avançar automaticamente ao fim de quatro segundos. A pessoa lê a resposta da Confia e escolhe quando continuar; o teste E2E foi atualizado para este comportamento.
- A navegação principal deixou de capturar uma função de pré-carregamento obsoleta no callback de navegação.
- Removidas do shell referências a um resumo de progresso não utilizado e a estado local sem utilização; o componente de origem foi preservado.
- Os ficheiros de sessão do Gemini que estavam rastreados no Git foram restaurados a partir do índice após a limpeza de caches. Não ficam eliminações acidentais nesses cinco ficheiros.

**Validação desta ronda:** TypeScript/lint aprovado; build web aprovado; 157 testes unitários aprovados; inventário Playwright confirma 92 cenários. A execução real E2E continua pendente porque o download do Chromium excedeu o tempo limite. O build continua a assinalar um chunk Firestore de aproximadamente 559 KB.

### Abraço — primeira ronda de auditoria
- O separador combina atualmente o Horizonte (cápsula temporal, reflexões semanais/mensais, percurso de palavras e ilhas) com o Abraço de cinco minutos (ritmo respiratório, som opcional, desenho e experiência Zen).
- O Horizonte contém localização PT/EN/ES/FR própria, estado persistente e vários ciclos; deve ser preservado, mas a entrada e a progressão precisam de uma hierarquia mais simples.
- O Abraço de cinco minutos contém seleção de estado, necessidade e tom, mensagens adaptativas, cronómetro e conclusão Zen. A experiência deve priorizar a escolha livre e permitir sair sem perder segurança nem criar pressão.
- A cobertura E2E atual testa sobretudo a entrada no separador e a experiência Zen; falta cobertura funcional direta do Horizonte, cápsula, percurso de palavras e ciclo completo dos cinco minutos.
- Direção proposta: organizar este separador por intenção — **preciso de regular-me agora** e **quero explorar/refletir** — mantendo a identidade visual e todos os percursos guardados. A ordem final será decidida após mapear os estados e entradas de ambos os componentes.

### Objetivos — primeira ronda de auditoria
- A biblioteca contém muitas ações pequenas e úteis, e a seleção atual escolhe cinco tarefas de forma determinística por data. O resultado não considera a necessidade declarada no check-in, o contexto pessoal, as tarefas recentemente apresentadas ou as dificuldades repetidas.
- A primeira tarefa recebe um percurso com três níveis (mínimo, normal e extra), captura de obstáculos e um motivo pessoal. Esta é uma boa base de adesão saudável.
- A montanha ocupa pelo menos quase toda a altura disponível antes de a pessoa chegar à ação principal. A experiência é visualmente forte, mas a prioridade diária fica demasiado abaixo da dobra em muitos telemóveis.
- A primeira entrada obriga a escolher uma representação masculina ou feminina do alpinista. A personalização visual não deve bloquear o acesso nem exigir uma escolha binária.
- Direção: uma ação principal contextual e realizável, alternativas pequenas opcionais, recuperação sem culpa e uma progressão visual compacta que não esconda a ação.

### Comunidade — primeira ronda de auditoria
- O feed, os círculos, o matching, o chat privado, as conversas de grupo e o apoio entre pares são superfícies diferentes que precisam de rótulos, expectativas e segurança coerentes.
- A submissão do feed tinha um defeito de fiabilidade: o handler da aplicação absorvia erros de publicação, enquanto o formulário limpava o texto e mostrava sucesso sem confirmação real. Corrigido: o erro propaga-se, o formulário só limpa após sucesso e conserva o rascunho quando falha.
- As etiquetas de sentimento eram apresentadas em português mesmo quando a aplicação estava em inglês, espanhol ou francês. Corrigido: o feed apresenta a tradução do idioma ativo.
- A submissão agora tem estado de envio, botão desativado durante a operação, mensagem de erro acessível e anúncio de sucesso com role status.
- As regras Firestore já contêm validações extensas para posts, reações, bloqueios, matching, círculos, pedidos de escuta, chats e denúncias. A execução do emulador Firestore continua bloqueada pelo download do JAR; não considerar a auditoria de regras concluída até executar os testes.
- Ponto de revisão de segurança: verificar restrição de campos permitidos (hasOnly) em perfis, posts, chats e mensagens; garantir que o bloqueio não é apenas um filtro visual; rever acesso de moderadores a mensagens privadas e documentar o fundamento e os controlos.
