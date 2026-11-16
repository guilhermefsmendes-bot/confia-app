# CONFIA — Medição de desempenho em dispositivos reais

**Data:** 16 de novembro de 2026
**Branch:** `fix/mobile-performance-deep-audit`

## Instrumentação acrescentada

A instrumentação é opt-in em produção e automática em desenvolvimento. Não envia métricas para Firebase, não recolhe texto, conteúdo pessoal, identificadores de utilizador ou dados de saúde; apresenta apenas tempos e contagens agregadas na consola local.

Ativar em browser/preview acrescentando `?confiaPerf=1` ao endereço.

### Métricas registadas

| Área | Métrica | O que mede |
|---|---|---|
| Arranque | `startup-to-shell-paint` | Tempo até à primeira estrutura leve da Confia ficar pintada |
| Arranque | `startup-module-to-app-ready` | Tempo desde a execução do módulo de entrada até à aplicação estar renderizada |
| Navegação | `tab-navigation-to-two-frames` | Tempo entre o pedido de mudança e dois frames após o separador ser atualizado |
| Espelho na Água | `mirror-open-to-two-frames` | Tempo desde expandir o Espelho até dois frames após a renderização |
| Firebase | `firebase-habit-sync` | Duração total de cada ciclo de sincronização de hábitos |
| Firebase | `firebase-habit-refresh` | Duração da reconciliação/leitura remota |
| Firebase | `firebase-habit-write-batch` | Duração de cada lote de escrita |
| Firebase | `firebase-habit-refresh-documents` | Número de documentos lidos na reconciliação |
| Firebase | `firebase-habit-write-documents` | Número de registos enviados em cada lote |

O diagnóstico periódico acrescenta FCP, LCP, resposta inicial do documento, DOM interativo, carregamento, tamanho transferido, número/duração/tamanho agregado dos recursos Firebase, tarefas longas, FPS médio e memória JS quando o browser disponibiliza essa informação.

## Como recolher uma sessão real

1. Gerar uma build de teste e abrir a versão num Android físico, preferencialmente um telemóvel de gama baixa/média.
2. Abrir o endereço com `?confiaPerf=1` e ligar a consola remota do Chrome através de `chrome://inspect/#devices` (ou usar a consola do browser no próprio dispositivo).
3. Fechar e voltar a abrir a aplicação para uma sessão de arranque; guardar as linhas `[CONFIA PERF]` e `[CONFIA performance diagnostics]`.
4. Navegar uma vez por cada separador principal e guardar os tempos.
5. Expandir o Espelho na Água e guardar `mirror-open-to-two-frames`.
6. Para Firebase, usar apenas uma conta de teste/autorizada: sincronizar um registo de teste, aguardar o estado sincronizado e guardar os tempos de leitura/escrita. Repetir com ligação instável e após recuperar a ligação.
7. Repetir a sequência pelo menos três vezes no mesmo dispositivo e comparar mediana e pior resultado; fazer também uma sessão sem cache apenas num ambiente de teste.

## Limitações desta execução

- O workspace remoto estava online, mas não tinha executável Node.js no PATH nem binário Node encontrado no sistema; por isso não foi possível executar TypeScript, testes ou build nesta ronda.
- Não havia dispositivo Android ligado por ADB nem browser Chromium instalado; não foi possível recolher medições reais do telefone a partir deste ambiente.
- Nenhuma alteração foi publicada, enviada para Git, integrada em `main`/`release` ou aplicada a dados/serviços de produção.

## Próxima decisão técnica

Não subdividir o chunk Firestore nem alterar a estratégia de sincronização com base apenas no tamanho estático. Primeiro recolher tempos de rede reais, número de pedidos, duração de leitura/escrita e impacto na interação no Android de gama baixa. Depois otimizar o caminho que efetivamente dominar a latência.
