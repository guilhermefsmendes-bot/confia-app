# Migração de bloqueios da Comunidade

As regras de mensagens de grupos passam a consultar um documento canónico por par de utilizadores em blockPairs/{pairId}. Os documentos históricos em blocks/{blockerId}_{blockedUserId} são migrados para blockPairs. Os novos clientes escrevem documentos de compatibilidade com IDs prefixados pelo comprimento dos UIDs, evitando colisões causadas por underscores.

## Antes de publicar as novas regras

1. Fazer backup/exportação do Firestore.
2. Executar primeiro sem argumentos para uma simulação de leitura (dry-run) e rever a contagem.
3. Confirmar que a versão de functions/scripts/migrateLegacyBlockPairs.cjs foi revista.
4. Executar a migração com uma identidade administrativa autorizada, a partir de functions/:
   node scripts/migrateLegacyBlockPairs.cjs --apply
5. Confirmar que o número de documentos em blockPairs corresponde ao número de pares distintos existentes em blocks.
6. Só depois publicar as regras e a versão cliente que cria os dois registos de bloqueio.

A migração é não destrutiva: não elimina nem altera documentos legados. Agrupa bloqueios recíprocos no mesmo documento e preserva os IDs dos utilizadores que iniciaram o bloqueio em blockedBy.

## Compatibilidade

- A app continua a escrever documentos de compatibilidade na coleção blocks, agora com IDs prefixados pelo comprimento dos UIDs. Os documentos históricos continuam consultáveis por campos.
- O documento canónico permite à regra verificar até sete outros participantes sem exceder o limite de leituras de documentos das regras Firestore.
- O bloqueio é aplicado simetricamente à leitura e ao envio de mensagens do grupo.
- Os membros não envolvidos no par bloqueado continuam a poder ler e enviar mensagens.
- O segundo participante pode bloquear de volta sem substituir a decisão original.

## Estado desta execução

A migração foi criada com dry-run por omissão. Só escreve dados quando recebe o argumento --apply. Não foi executada em produção. As novas regras não foram publicadas. É necessário executar a migração antes do deploy para que bloqueios históricos sejam respeitados em grupos.
