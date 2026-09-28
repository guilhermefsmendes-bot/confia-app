# CONFIA — Deixa ir e guias de notificações

Implementado no Cloud Shell em 28/09/2026. Builds web e Android aprovados. Não foi publicada uma versão na Google Play nem feita qualquer alteração de faturação ou deploy Firebase.

## Experiência de respiração

O ponto de integração é `AbracoTimer`, a sessão existente de cinco minutos. O final passa a abrir **Deixa ir**, carregado por `React.lazy` apenas quando a sessão termina. Mantêm-se o questionário inicial, mensagens adaptativas, som opcional e Rabisco. A antiga reflexão foi substituída pela nova, evitando guardar duas respostas. O contador foi protegido contra valores negativos e o encerramento deixou de atribuir/mostrar os antigos 30 XP, para manter este ritual sem gamificação.

Fluxo: fim da sessão → convite e consentimento → areia por sopro ou toque → pequena pausa → “Como estás agora?” → Mais calmo / Igual / Ainda agitado → agradecimento. É possível sair, mudar para toque ou avançar para a reflexão sem forçar um sopro prolongado ou revelar tudo. Um botão “Libertar um pouco” permite usar teclado e leitor de ecrã.

Oito mensagens traduzidas variam a experiência; paisagens SVG simples mostram montanha, colinas, horizonte e luz. A experiência não usa uma classificação emocional do sopro.

## Gráficos e performance

Canvas 2D com gradiente de areia, sulcos vetoriais e 120 pequenos pontos estáticos de textura. Não existe simulação de grãos nem sistema de partículas. Uma máscara radial com transparência revela progressivamente o SVG/texto por baixo. A distância percorrida pelo dedo ou a energia acumulada do sinal aumenta a revelação, sem limpeza binária.

O sinal irregular altera ligeiramente os sulcos; após 1,5 segundos sem energia nova, regressam à forma serena. As transições do Canvas são curtas, de 180 ms, com requestAnimationFrame apenas enquanto há alteração. A densidade de renderização está limitada a 1,5; não há WebGL, blur pesado, vídeo, ficheiros de imagem novos ou bibliotecas adicionais. `prefers-reduced-motion` remove a interpolação e a entrada animada.

O áudio é amostrado aproximadamente a 30 Hz; as atualizações React ficam limitadas a cerca de 10 Hz, com interpolação visual entre atualizações. A Home, Comunidade e Hábitos não processam áudio nem renderizam o jardim. A passagem para segundo plano cancela o áudio, os temporizadores do ritual e a animação; ao regressar, fica disponível o toque e é necessária uma ação explícita para voltar ao microfone.

Não foi medido FPS em telemóveis físicos de baixo desempenho. O objetivo de 60 FPS para as pequenas transições não é uma garantia por dispositivo.

## Microfone e privacidade

A explicação contextual surge antes do botão Permitir. Só esse gesto chama Web Audio/getUserMedia. No Android, a ponte WebView existente do Capacitor trata o pedido nativo de captura de áudio; foram acrescentadas as permissões RECORD_AUDIO e MODIFY_AUDIO_SETTINGS ao manifesto. O microfone é uma característica opcional da instalação, permitindo o modo por toque em equipamentos sem microfone.

A análise usa amostras temporárias do domínio do tempo (512), RMS, filtro passa-alto simples, cerca de 700 ms de calibração do ruído ambiente, threshold dinâmico, suavização, histerese e uma duração mínima. São calculados apenas intensidade, duração, estabilidade e energia temporária. Não há Speech Recognition, transcrição, MediaRecorder, FFT de classificação, gravação ou envio do sinal.

Ao sair, mudar para toque, terminar ou passar para background: parar tracks, desligar nós, fechar AudioContext, remover listeners do stream, cancelar RAF e timers. Se a permissão terminar depois de o utilizador sair, o stream que chega atrasado é imediatamente parado. Se o microfone falhar ou for recusado, aparece uma mensagem humana e o modo por toque fica disponível.

A amplitude não distingue perfeitamente fala, vento e sopro. A filtragem e a duração mínima reduzem falsos positivos, mas ruído contínuo forte ainda pode revelar areia. Não foi acrescentado um classificador pesado nem qualquer inferência clínica.

## Reflexão e integração com os dados existentes

A resposta final é adicionada uma única vez ao armazenamento existente `confia_personal_events_v1`, através de `appendPersonalEvents`, emitindo o evento de atualização já usado pela aplicação. Usa o tipo existente `intervention`, valor nulo e metadados: `exercise: five_minutes`, `durationSeconds: 300`, `method: microphone|touch`, `response: calmer|same|agitated`. O envelope existente acrescenta ID, data/hora, data local e versão do schema.

Não são guardadas métricas de sopro, waveform, áudio, diagnóstico ou pontuação de ansiedade. Não foram criadas coleções Firestore, consultas periódicas ou novas regras. A eliminação geral de dados existente remove estes registos locais.

Após pelo menos três reflexões, o próprio ritual resume as últimas dez sessões: “Nas últimas X vezes…, registaste sentir-te mais calmo em Y ocasiões.” Descreve respostas do utilizador, sem atribuir causalidade. Os eventos ficam disponíveis ao modelo pessoal existente; não foi reescrito o motor de padrões nem acrescentada uma nova inferência automática ao Meu mapa.

Os quatro eventos `zen_experience_started`, `zen_experience_completed`, `zen_experience_touch_mode` e `zen_experience_microphone_mode` usam apenas o mecanismo local de analytics já existente, com nome e data. Não incluem resposta emocional, dados do sopro ou conteúdo pessoal e não foi instalado outro SDK de analytics.

## Guias “i” das notificações

Existem botões de informação com área de toque de 48 px e label traduzida para Respostas da Comunidade, Lembrete diário e Progresso dos Hábitos. Abrem um dialog/bottom sheet com foco modal, explicação, estado e passos humanos. A opção futura de Hábitos continua claramente identificada como indisponível, sem prometer avisos ativos.

A ponte `ConfiaDevice.info()` devolve agora permissão global, estado concedida/recusada/ainda não pedida e estado das categorias Comunidade/Lembrete. Uma categoria bloqueada é detetada mesmo que a app tenha permissão global. O estado desconhecido tem fallback explícito. As preferências internas continuam separadas: ON na CONFIA com bloqueio Android mostra o aviso e “Corrigir nas definições”.

A primeira ativação continua a mostrar contexto antes do pedido nativo. O Android guarda se o pedido já foi feito, evitando repetir prompts após recusa. Reabrir o “i” nunca pede permissão nem abre definições automaticamente. O guia reflete o sistema ao montar, receber foco, mudar a visibilidade ou receber `appStateChange` ativo, sem polling.

Abrir definições reutiliza `ConfiaDevice.openNoticeSettings()`: `ACTION_APP_NOTIFICATION_SETTINGS` no Android 8+, com package da CONFIA; fallback `ACTION_APPLICATION_DETAILS_SETTINGS` em versões anteriores ou quando a primeira atividade não está disponível. Só é chamado pelo toque explícito no botão. Falhas de abertura são devolvidas à interface sem crash deliberado.

No browser, o guia indica que estas opções são geridas na aplicação Android instalada; não apresenta passos Android nem botões para definições nativas.

O estado “permitidas” confirma permissões do telemóvel, não o estado de publicação do backend. O push da Comunidade continua dependente da ativação Blaze e do deploy da função/regras documentados em `NOTIFICACOES_WIDGET_IMPLEMENTACAO.md`. Estes passos anteriores não foram executados nesta tarefa.

## Tamanho antes/depois

Medição da soma dos assets JavaScript/CSS produzidos pelo Vite, usando gzip por ficheiro:

| Medida | Antes | Depois | Diferença |
| --- | ---: | ---: | ---: |
| JS + CSS compilados | 2 718 977 B | 2 748 872 B | +29 895 B |
| Soma comprimida gzip | 738 581 B | 748 925 B | +10 344 B |

O chunk `ZenReleaseExperience` tem 11 956 B compilados e 4 489 B gzip. Não é pedido pela Home; só é importado no final da respiração. As traduções e alterações de integração acrescentam algum tamanho ao arranque: o principal chunk JS passou de aproximadamente 338,22 para 342,68 kB gzip. Não se afirma impacto inicial zero.

Novas dependências npm: **zero**. Novos vídeos, áudios ou bitmaps: **zero**. Mantêm-se os avisos já existentes de chunk principal grande e import misto de `weeklyTrophies`; não são erros de compilação.

## Traduções

Namespaces `zen` e `noticeHelp` em `src/locales/pt.json`, `en.json`, `es.json`, `fr.json`. Incluem convite, consentimento, alternativas, erro, mensagens reveladas, reflexão, resumo observacional, informação acessível dos botões, estados Android, instruções, privacidade e abertura das definições. Os componentes não contêm texto de interface hardcoded.

## Verificações realizadas

- `npm run lint`: TypeScript sem erros; este é o comando de lint/typecheck já definido pelo projeto.
- `npm run build`: aprovado; build final em aproximadamente 3,2 segundos.
- `npx cap sync android`: aprovado.
- `assembleDebug testDebugUnitTest`: aprovado; APK contém o `dist/index.html` do último build web.
- 8 testes novos unitários: sinal leve/prolongado, ruído/estabilidade, libertação de stream/contexto/listeners/RAF, resposta tardia à permissão, recusa, persistência/deduplicação e estados Android/categorias.
- Regressões: 43 testes pessoais/reativos, 32 de Hábitos e 8 de envio das Functions aprovados. Os testes Android existentes do widget continuam aprovados.
- Playwright móvel: percurso real da respiração com temporizador acelerado apenas no teste; toque parcial e total, reflexão única, sem XP, reinício, recusa do microfone e reduced motion.
- Playwright do componente: Zen nos quatro idiomas, sem chaves cruas nem overflow horizontal; ponte nativa simulada para background, reentrada, saída durante permissão pendente e zero RAF pendente após saída.
- Guia com ponte simulada: nunca pedido, recusado, concedido, categoria bloqueada, preferência interna desligada/ligada, pedido apenas após contexto, abertura das definições só por toque e estado atualizado ao regressar.
- Browser: guias nos quatro idiomas em desktop e móvel, sem instruções Android indevidas.
- Desktop: percurso completo de revelação/reflexão e recusa com fallback validados.
- Capturas móveis de areia parcial e guia de notificações inspecionadas visualmente.

Os testes de browser usam sinais e ponte controlados. Não substituem a medição física do sopro nem a navegação real nas definições Android. Não há telemóvel ligado a este Cloud Shell; não se afirma que entrega FCM, reboot, launcher/widget ou permissões de fabricantes tenham sido testados fisicamente nesta tarefa.

Comandos reproduzíveis no projeto:

```bash
npm run lint
npm run test:zen
npm test
npm run test:habits
npm --prefix functions run test
npm run build
npx cap sync android
npm run test:zen:e2e
```

A configuração de testes Zen inicia/reutiliza o preview 4174 e o Vite 3000. Os casos com ponte simulada usam uma página intercetada apenas pelo Playwright; não foi criada uma rota de teste na aplicação distribuída. A matriz completa do comando inclui outras combinações desktop dos fixtures; as combinações efetivamente verificadas estão discriminadas acima.

No Cloud Shell, SDK/caches estão em `/tmp`; a compilação usada foi:

```bash
cd /home/guilherme_f_s_mendes/android
export ANDROID_HOME=/tmp/confia-android-sdk
export GRADLE_USER_HOME=/tmp/confia-gradle
./gradlew --no-daemon --max-workers=2 \
  --project-cache-dir /tmp/confia-gradle-project-cache \
  --init-script /tmp/confia-build-dir.gradle \
  assembleDebug testDebugUnitTest
```

APK de teste: `/home/guilherme_f_s_mendes/android/app/build/outputs/apk/debug/app-debug.apk`. Não foi aumentado o versionCode nem preparada uma publicação Play Store nesta tarefa.

## Validação física ainda necessária

Instalar o APK num Android e terminar uma sessão. Verificar a primeira permissão, recusa, sopro leve/prolongado/irregular em ambiente silencioso e ruidoso, toque, saída rápida e bloqueio do ecrã. Confirmar que o indicador do microfone desaparece ao sair. Testar a categoria Comunidade bloqueada, abrir definições e regressar; repetir no Lembrete diário. Confirmar notificações e widget existentes após a atualização. Avaliar suavidade, legibilidade e bateria num dispositivo de menor desempenho. Não são necessários novos passos de Firebase para o ritual ou os guias.

## Ficheiros criados

- `playwright.zen.config.ts`
- `src/components/NotificationGuide.tsx`
- `src/components/ZenRelease/ZenReleaseExperience.tsx`
- `src/components/ZenRelease/ZenRevealContent.tsx`
- `src/components/ZenRelease/ZenSandCanvas.tsx`
- `src/data/zen/blowSignal.ts`
- `src/data/zen/breathAudio.ts`
- `src/data/zen/reflection.ts`
- `src/data/zen/zen.test.ts`
- `src/notifications/permission.test.ts`
- `src/notifications/permission.ts`
- `src/notifications/useNoticePermission.ts`
- `tests/e2e/zen-device.spec.ts`
- `tests/e2e/zen.spec.ts`
- `docs/DEIXA_IR_NOTIFICACOES_IMPLEMENTACAO.md`.

## Ficheiros alterados

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/confiaolhaparadentro/ConfiaDevicePlugin.java`
- `package.json`
- `src/components/AbracoTimer.tsx`
- `src/components/NotificationSettings.tsx`
- `src/data/personal/personalAnalytics.ts`
- `src/notifications/native.ts`
- `tests/e2e/notifications.spec.ts`
- `src/locales/pt.json`, `src/locales/en.json`, `src/locales/es.json`, `src/locales/fr.json`.
- Assets Android gerados pelo Capacitor sync.
