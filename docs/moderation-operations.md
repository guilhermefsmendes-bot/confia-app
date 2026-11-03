# Operação de moderação da Comunidade Confia

## Acesso ao painel

O painel aparece em **Definições** apenas para uma sessão autenticada cujo Firebase ID token contenha `moderator: true`. A app usa autenticação anónima; por isso, a autorização deve ser atribuída ao UID Firebase da sessão de cada responsável, e não por uma opção visível na app.

Para obter o UID, consultar Firebase Authentication > Users e identificar a sessão/dispositivo do responsável. Não partilhar credenciais de serviço com o cliente.

## Atribuir ou remover autorização

Executar apenas por um operador com privilégios IAM adequados no projeto `confia-b952e`:

```bash
gcloud auth application-default login
gcloud config set project confia-b952e
cd functions
node scripts/set-moderator-claim.cjs FIREBASE_UID grant
# Para retirar:
node scripts/set-moderator-claim.cjs FIREBASE_UID revoke
```

Depois da alteração, o responsável deve terminar e reiniciar a sessão ou renovar o token de autenticação. O painel volta a verificar o claim no carregamento.

## Tratamento de cada denúncia

1. Abrir Definições > Moderação da Comunidade.
2. Rever motivo, identificadores do conteúdo, denunciante e pessoa denunciada.
3. Consultar o conteúdo original e contexto antes de decidir; o painel não copia o conteúdo denunciado.
4. Registar notas internas objetivas e proporcionais, sem incluir dados sensíveis desnecessários.
5. A denúncia começa no estado **Recebida**. Quando um moderador inicia a revisão, muda para **Em análise**. No fim, escolher **Resolvida** ou **Rejeitada**. A decisão, UID do moderador e data ficam registados.
6. Para resolver, executar a medida aplicável através dos mecanismos administrativos existentes e documentar a ação nas notas. Não existe automatismo que suspenda contas ou apague conteúdos apenas por receber uma denúncia.

## Estados e retenção

- pending é apresentado como **Recebida**.
- in_review é apresentado como **Em análise** e não é eliminado pela limpeza automática.
- actioned é apresentado como **Resolvida**.
- dismissed é apresentado como **Rejeitada**.
- reviewed é um estado legado, apresentado como **Analisada (registo anterior)**, para preservar denúncias antigas.
- A retenção automática aplica-se apenas a estados finais e mantém o prazo de 180 dias após reviewedAt; estados pendentes ou em análise não são eliminados.

## Limites atuais e segurança

- A fila apresenta até 100 denúncias mais recentes; denúncias antigas podem exigir consulta administrativa direta ao Firestore.
- Não existe notificação automática por email/push aos moderadores.
- Não existe escalonamento automático de ameaças, risco de autoagressão ou perigo iminente. Estas situações exigem revisão humana prioritária e aplicação do protocolo de segurança apropriado.
- A autorização `moderator` é um custom claim emitido exclusivamente por Admin SDK. Nunca permitir que o cliente o atribua a si próprio.
- As regras Firestore permitem aos moderadores consultar denúncias e atualizar apenas estado, data, UID do revisor e notas; não podem alterar o relato original.


## Cobertura humana, horários e escalamento — situação real

**Situação verificada em 2 de novembro de 2026:** não foi possível confirmar uma equipa de moderação formalmente nomeada, turnos, horário de cobertura, SLA ou disponibilidade permanente. Por isso, a Confia não deve comunicar que existe moderação humana em tempo real ou 24/7. A presença do painel e do registo de denúncias não significa que uma denúncia esteja a ser acompanhada continuamente.

Antes de manter a Comunidade aberta em produção, o responsável pelo produto deve:
1. Nomear por escrito pelo menos um responsável principal e um substituto, com contas Firebase individuais.
2. Definir e publicar o horário real de revisão, fuso horário, dias sem cobertura e prazo indicativo de primeira resposta.
3. Confirmar que os responsáveis conseguem aceder ao painel, rever conteúdo e aplicar as medidas previstas.
4. Criar um canal interno de escalamento e um registo de incidentes, sem expor dados emocionais a pessoas que não necessitem deles.
5. Rever periodicamente acessos e retirar o claim \`moderator\` quando alguém deixa de exercer a função.

Até estes pontos estarem confirmados, a cobertura deve ser considerada **não assegurada**. Não inventar nomes, turnos, tempos de resposta ou garantias.

## Prioridades de triagem

- **P0 — perigo imediato, ameaça credível, exploração, ameaça de violência ou referência a autoagressão:** preservar apenas a evidência necessária, escalar imediatamente ao responsável humano disponível e aplicar o protocolo legal e de segurança definido para a jurisdição. A aplicação não é um serviço de emergência; indicar ao utilizador que deve contactar os serviços de emergência locais quando existir perigo imediato.
- **P1 — assédio, perseguição, exposição de dados pessoais, contacto persistente após bloqueio ou conteúdo sexual/exploratório:** revisão prioritária no próximo período de cobertura; bloquear contacto e restringir conteúdo quando tecnicamente e operacionalmente autorizado.
- **P2 — spam, publicidade, conteúdo fora do tema ou comportamento disruptivo sem ameaça imediata:** revisão normal.

Estas prioridades são uma proposta operacional. Não representam um SLA atualmente assegurado.

## Contenção se não houver capacidade de moderação

Se não houver responsável disponível ou cobertura suficiente:
- Não promover a Comunidade como espaço de apoio imediato.
- Não prometer resposta a denúncias em tempo real.
- Avaliar a suspensão temporária de novas publicações, novos pedidos de correspondência e novas conversas de grupo até existir cobertura.
- Preservar os mecanismos de denúncia e bloqueio enquanto se prepara a contenção.
- Não remover conteúdo ou suspender contas automaticamente apenas com base numa denúncia sem revisão e processo definido.

## Evidência, retenção e comunicação

- Registar apenas identificadores, motivo, estado, datas, decisão e notas proporcionais.
- Não copiar conversas completas para notas internas.
- O painel permite consultar até 30 mensagens de contexto por denúncia de conversa.
- Denúncias finalizadas são conservadas por 180 dias após \`reviewedAt\`, salvo \`legalHold\`; denúncias pendentes não são eliminadas pelo processo automático.
- O responsável deve comunicar a decisão ao denunciante apenas se existir um canal de contacto fiável e uma política aprovada. A aplicação atual não demonstra notificação automática de resultado.
- O processo atual não oferece suspensão automática de contas nem escalamento automático para serviços externos.
