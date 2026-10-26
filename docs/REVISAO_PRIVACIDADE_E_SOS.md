# Revisão da Política de Privacidade e do apoio SOS — Confia

**Estado:** revisão de trabalho; não publicada.
**Data:** 26 de outubro de 2026.

## 1. Constatações verificadas no código local

- A aplicação apresenta uma confirmação de idade mínima de 18 anos. É uma autodeclaração: não é verificação documental de idade.
- A funcionalidade de escuta permite enviar um pedido com um tema e uma nota opcional até 300 caracteres.
- Os pedidos de escuta expiram ao fim de 10 minutos se não forem correspondidos.
- Os membros que ativam a disponibilidade escolhem os temas em que aceitam ouvir. A disponibilidade mantém-se ativa depois de aceitar um pedido e pode permitir várias conversas simultâneas.
- A funcionalidade é apoio entre membros; não é serviço clínico, aconselhamento profissional nem serviço de emergência.
- Existem funções para denunciar publicações/membros e bloquear utilizadores na comunidade. Isso não significa, por si só, que exista uma equipa de moderação com resposta garantida ou um prazo de análise.
- O código de eliminação da conta tenta remover registos de comunidade, denúncias e bloqueios criados pelo utilizador, perfil de escuta, pedidos de escuta e conversas/mensagens associadas. A validação automatizada desta alteração continua pendente.

## 2. Texto recomendado para a política

### Idade mínima
> A Confia destina-se exclusivamente a pessoas com 18 anos ou mais. Antes de utilizar a aplicação, o utilizador tem de confirmar que tem pelo menos 18 anos. Esta confirmação é uma autodeclaração e não constitui verificação documental da idade. Pessoas com menos de 18 anos não estão autorizadas a utilizar a aplicação.

### Funcionalidade de escuta entre membros (SOS)
> A funcionalidade de escuta permite solicitar uma conversa de apoio a outro membro da comunidade que tenha indicado disponibilidade para ouvir sobre o tema selecionado. O pedido pode incluir uma nota opcional, limitada a 300 caracteres, e expira ao fim de 10 minutos se não for correspondido. A existência de um pedido não garante que alguém esteja disponível ou responda. Se outro membro aceitar, é criada uma conversa privada entre os participantes.
>
> Esta funcionalidade disponibiliza apoio informal entre membros e não constitui assistência psicológica ou médica, aconselhamento profissional, serviço de crise ou serviço de emergência. Não deve ser utilizada como única forma de obter ajuda numa situação urgente. Em perigo imediato em Portugal, ligue 112; noutros países, contacte os serviços de emergência locais.
>
> Recomenda-se que os utilizadores não incluam palavras-passe, moradas, contactos, dados de identificação ou outras informações pessoais desnecessárias nas notas e mensagens. A disponibilidade para ouvir pode continuar ativa depois de aceitar um pedido e pode permitir receber/acompanhar mais do que uma conversa.

### Dados tratados nesta funcionalidade
> Para disponibilizar a funcionalidade, a Confia trata os identificadores técnicos dos participantes, os temas selecionados, a nota opcional, o estado do pedido, datas/horas de criação e expiração, a associação entre pedido e conversa e as mensagens enviadas na conversa. Estes dados são utilizados para encaminhar pedidos, permitir a conversa, aplicar controlos de acesso e gerir a eliminação dos dados. Os temas e as mensagens podem revelar informação relacionada com o bem-estar ou a saúde do utilizador; por isso, devem ser tratados com especial cuidado.

### Comunidade, denúncias e bloqueios
> Os utilizadores podem denunciar conteúdos ou participantes e bloquear outros membros, quando essas opções estão disponíveis na aplicação. As denúncias são registadas para suportar a funcionalidade de denúncia. A política deve explicar quem analisa as denúncias, como contactar o responsável, o que pode acontecer após uma denúncia e se existe ou não um prazo de resposta — apenas depois de esse processo estar efetivamente definido e implementado.

### Eliminação
> O utilizador pode iniciar a eliminação dos dados através da funcionalidade disponibilizada na aplicação. A política deve identificar quais os dados eliminados, quais podem permanecer temporariamente em cópias de segurança ou registos técnicos e quaisquer exceções legais aplicáveis. A implementação técnica deve ser testada antes de prometer eliminação imediata ou integral de todos os dados.

## 3. Dados e afirmações a confirmar antes de publicar

- **URL pública da política:** não foi encontrada uma cópia da política nem um URL no repositório local. Não publicar uma ligação inventada; confirmar o URL atualmente indicado na Google Play Console.
- **Responsável pelo tratamento e contacto:** confirmar nome/identificação do responsável e um endereço de contacto válido para pedidos RGPD.
- **Firebase/Google:** confirmar, na configuração e nas declarações de privacidade, todos os serviços efetivamente usados, categorias de dados, localizações, prazos de conservação e transferências internacionais aplicáveis.
- **Analytics, notificações e crash reporting:** verificar os SDKs e serviços realmente ativos antes de afirmar que não há recolha ou partilha.
- **Moderação:** confirmar se existe monitorização humana, quem recebe as denúncias, o processo de resposta e como se bloqueia/restringe um membro. Não afirmar que há moderação permanente se não existir.
- **Países disponíveis:** confirmar se a aplicação está acessível globalmente ou limitada por distribuição/região. Não inferir a disponibilidade geográfica apenas pelo idioma.
- **Idade:** alinhar esta política, o ecrã de confirmação, a classificação etária e as declarações da Play Console com a decisão de acesso exclusivo a maiores de 18 anos.
- **Retenção:** definir prazos reais para pedidos expirados, mensagens, denúncias e backups. A expiração funcional ao fim de 10 minutos não significa, por si só, que o registo seja apagado da base de dados.
- **Revisão jurídica:** validar o texto final à luz do RGPD e das regras aplicáveis antes de o publicar.

## 4. Estado da implementação técnica

As alterações de eliminação de dados e as regras Firestore estão apenas no ambiente local/branch de trabalho. A validação executada em 26/10/2026 passou em lint, build de produção e 137 testes unitários (67 gerais, 32 hábitos, 8 Zen/notificações e 30 companion). Os testes específicos de regras Firestore com o emulador não foram executados, pelo que as alterações das regras ainda não estão validadas. **Não publicar as regras nem lançar a versão da aplicação até os testes de regras e a validação funcional do SOS passarem.**
