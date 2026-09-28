# CONFIA — notificações e widget Android

Implementação preparada no Cloud Shell em 28/09/2026. Não foi publicada na Google Play, não foi ativada faturação e a função de push e as novas regras de notificações não foram publicadas em produção.

## Funcionalidade

**Comunidade:** a aplicação existente usa conversas privadas associadas a publicações, não uma coleção autónoma de comentários. `communityReplyCreated` reage à criação real de `chats/{chatId}/messages/{messageId}` e avisa o outro participante. Não envia ao autor da mensagem, a utilizadores bloqueados ou sem consentimento. Grupos de experiências não geram este push.

O servidor envia apenas identificadores de navegação e de entrega. O Android compõe o texto genérico no idioma local, sem nomes, texto da conversa, hábitos, humor ou informação emocional na notificação. O conteúdo é privado no ecrã bloqueado. As regras existentes continuam a controlar o acesso à conversa ao abrir a notificação.

**Lembrete diário:** desligado inicialmente, pede consentimento contextual e depois a permissão Android. Hora configurável; três frases suaves alternadas. Agendamento local com AlarmManager, sem Firestore ou serviço contínuo. Concluir o check-in cancela o aviso daquele dia. Reinício, alteração de hora/fuso e atualização da aplicação reagendam os alarmes. Um alarme atrasado de ontem não é apresentado hoje. A abertura leva diretamente ao check-in.

Os alarmes são inexatos: poupança de bateria, Doze e restrições do fabricante podem atrasar a entrega. Não é pedida permissão de alarme exato. Depois de uma paragem forçada pelo utilizador, é necessário reabrir a aplicação para retomar o comportamento Android normal.

**Widget:** AppWidgetProvider/RemoteViews nativo, paisagem de montanha, anel diário, DIA X, hábito principal e cores de evolução. A versão pequena mostra dia e hábito; tocar abre Hábitos (ou configuração quando vazio). A versão média acrescenta sequência, tempo restante e Registar; título e hora de atualização aparecem quando há altura suficiente. Usa dados locais em SharedPreferences, funciona sem rede e não consulta Firestore. Atualiza com alterações dos dados, eventos do sistema, agendamento de meia-noite e atualização periódica Android de 30 minutos. Não há contador de segundos nem animação contínua. O tempo apresentado é uma fotografia da última atualização; os alarmes do widget podem atrasar durante suspensão.

O widget reutiliza a sequência calculada pela aplicação e a mesma tolerância de calendário. Nunca atribui um dia cumprido pela passagem da meia-noite. Recomeçar ou mudar o hábito atualiza a fotografia, sem apagar o histórico. O widget STOP anterior foi preservado.

## Preferências, tokens e privacidade

- Preferências locais por utilizador: `confia_notices_v1:{uid}`; lembrete e hora são específicos do dispositivo.
- Preferências de conta: `users/{uid}/preferences/notifications`, com `community`, `milestones` e `updatedAt` do servidor. A opção de marcos fica reservada e não envia avisos.
- Dispositivo: `users/{uid}/devices/{installationUUID}`, com `fcmToken`, `platform: android`, `notificationsEnabled`, `language` e `updatedAt` do servidor.
- ID estável por instalação; permite vários dispositivos por conta. Tokens inválidos são removidos sem apagar um token entretanto renovado. Tokens sem atualização há 30 dias são ignorados.
- `onNewToken` guarda a renovação nativa e avisa a ponte quando esta está ativa. Se a aplicação estiver fechada, a associação no Firestore é atualizada na próxima abertura; não existe autenticação Firebase nativa paralela para escrever o token em background.
- Sair da conta desativa imediatamente a entrega nativa, limpa o widget e tenta remover o registo remoto sem bloquear a saída indefinidamente offline. A verificação do destinatário nativo rejeita mensagens atrasadas da conta anterior. A eliminação de dados inclui dispositivos e preferências.
- O cliente só pode ler/escrever os próprios tokens e preferências, com validação de campos e timestamp. `notificationDeliveries` é exclusivamente servidor. Não foram adicionados eventos de analytics com dados pessoais.

## Prevenção de duplicados

A função reclama atomicamente uma chave SHA-256 por conversa/mensagem/destinatário/dispositivo antes de contactar FCM. Reentregas do evento não voltam a tentar esse envio. Há também proteção local Android e identificador estável da notificação.

Isto garante **no máximo uma tentativa de envio por evento/dispositivo**, não entrega garantida: uma falha ambígua ou interrupção entre a reclamação e o envio pode perder o alerta. FCM e Firestore não oferecem uma transação conjunta de entrega exatamente uma vez. Foi privilegiada a prevenção de duplicados.

Registos de entrega têm `expiresAt` após 30 dias; o campo não elimina documentos sozinho. A política TTL opcional deve ser ativada administrativamente para evitar crescimento indefinido.

## Ponte e rotas

`ConfiaDevice` é um plugin Capacitor local. Métodos: informação do dispositivo, permissão, token, configuração, fotografia do widget, consumo da abertura inicial, definições Android e pedido para adicionar widget. Eventos: token renovado e nova ligação. Firebase web existente é reutilizado; a configuração Firebase Android é própria da plataforma.

- `confia://community?chatId=…&postId=…&messageId=…`: valida participação e publicação, abre conversa e posiciona a resposta, mesmo fora das últimas 100 mensagens.
- `confia://checkin`: check-in diário.
- `confia://habits`: Hábitos.
- `confia://habits/log`: registo do hábito, ou configuração se ainda não existir.
- `confia://habits/setup`: escolher hábito.
- `confia://stop`: compatibilidade com STOP.

Entradas frias e aplicação já aberta usam a mesma navegação. IDs são validados; conteúdo inexistente/inacessível mostra uma mensagem traduzida.

## Configuração Firebase e passos manuais

Projeto: `confia-b952e`. Android: `com.confiaolhaparadentro`. O `google-services.json` foi obtido para a aplicação Android já registada e está no Cloud Shell em `android/app/google-services.json`. Não foi criada chave de conta de serviço; a função utiliza as credenciais administradas pelo Firebase.

A verificação de faturação devolveu `False`. **É necessário ativar Blaze para publicar Cloud Functions.** No Firebase Console, abrir o projeto CONFIA → opção Atualizar plano/Upgrade → Blaze → associar uma conta de faturação. Rever os custos e configurar alertas de orçamento; alertas não limitam automaticamente a despesa. Este passo não foi executado.

Depois de ativar Blaze e aprovar a publicação, a partir de `/home/guilherme_f_s_mendes`:

```bash
export PATH=/usr/local/nvm/versions/node/v24.21.0/bin:$PATH
npm --prefix functions ci
npm --prefix functions run lint
npm --prefix functions run test
firebase deploy --only firestore:rules --project confia-b952e
firebase deploy --only functions:notifications --project confia-b952e
```

O codebase `notifications` contém apenas `communityReplyCreated`, região `europe-west1`, Node 22, limite de 3 instâncias. O deploy Firebase pode pedir ativação das APIs necessárias e criação dos agentes de serviço; resolver eventuais permissões do projeto antes de tentar novamente. Confirmar que Firebase Cloud Messaging API (HTTP v1) está ativa nas definições Cloud Messaging. Publicar estas regras antes de distribuir o novo APK: a gestão de tokens/preferências e a eliminação de dados precisam delas.

Opcionalmente, em Google Cloud Console → Firestore → TTL, criar política para o grupo `notificationDeliveries`, campo `expiresAt`, revendo os custos de eliminação. As regras de Hábitos anteriormente publicadas não são substituídas por instruções antigas; o ficheiro atual inclui essas regras e as novas regras de notificações.

Referência oficial sobre Blaze: https://firebase.google.com/docs/functions/get-started
Referência sobre limites de atualização do widget: https://developer.android.com/develop/ui/views/appwidgets/advanced

## Verificações

- TypeScript web: `npm run lint`, sem erros.
- Build web: `npm run build`, aprovado; Capacitor sync aprovado.
- Functions: lint/typecheck/build aprovados; 8 testes de destinatário, bloqueios, consentimento, múltiplos dispositivos, tokens inválidos, expiração e prevenção de duplicados.
- Rotas e preferências: 3 testes aprovados.
- Regressão Hábitos: 32 testes aprovados, incluindo sequência, histórico, calendário e persistência.
- Regressão pessoal/reativa: 43 testes aprovados.
- Firestore Emulator: 6 testes aprovados, incluindo isolamento de tokens, schemas, preferências e recusa de escrita na coleção de entregas.
- Playwright: 8 testes aprovados, desktop e Pixel 5, nos quatro idiomas. Preferências desligadas e indisponíveis no browser, texto traduzido e ausência de scroll horizontal. Captura móvel das definições inspecionada visualmente.
- Android `assembleDebug` e `testDebugUnitTest`: aprovados. Dois testes novos verificam sequência e meia-noite, incluindo dias de 23 e 25 horas em Lisboa. Mantido o teste de exemplo existente.
- Não há dispositivo Android ligado nem emulador com aceleração disponível neste Cloud Shell. Não foi verificada entrega FCM real, prompt de permissão, agendamento após reboot, renderização do widget no launcher ou toque com a aplicação fechada.

Para compilar neste Cloud Shell (SDK e caches temporários, evitando encher o disco de home):

```bash
export PATH=/usr/local/nvm/versions/node/v24.21.0/bin:$PATH
npm run lint
npm run build
npx cap sync android
cd android
export ANDROID_HOME=/tmp/confia-android-sdk
export GRADLE_USER_HOME=/tmp/confia-gradle
./gradlew --no-daemon --max-workers=2 \
  --project-cache-dir /tmp/confia-gradle-project-cache \
  --init-script /tmp/confia-build-dir.gradle \
  assembleDebug testDebugUnitTest
```

APK de teste no Cloud Shell: `/home/guilherme_f_s_mendes/android/app/build/outputs/apk/debug/app-debug.apk`. Não é uma publicação Play Store nem uma versão release assinada para distribuição. O SDK e os caches em `/tmp` podem precisar de reinstalação quando a sessão for substituída; noutra máquina usar o SDK Android local e `./gradlew assembleDebug testDebugUnitTest`.

## Validação ainda necessária num Android

Após deploy e instalação, com duas contas/dispositivos: ativar apenas com consentimento; B responde e A recebe aviso genérico; tocar abre a resposta certa; confirmar ausência de autoaviso, duplicados, aviso quando bloqueado/desligado e mistura de contas após logout. Repetir em foreground/background e abertura fria, com permissões recusadas e token renovado.

Lembrete: escolher uma hora próxima, concluir check-in antes da hora e confirmar ausência; testar dia seguinte, offline, reboot, fuso e suspensão, permitindo atraso de alarmes inexatos. Widget: adicionar/redimensionar, estado vazio, criar/confirmar/recomeçar/mudar hábito, offline/app fechada, meia-noite, contraste e escalas de letra. Confirmar toque em Hábitos/Registar e persistência do histórico.

## Ficheiros criados

- `android/app/src/main/java/com/confiaolhaparadentro/ConfiaDevicePlugin.java`
- `android/app/src/main/java/com/confiaolhaparadentro/ConfiaMessagingService.java`
- `android/app/src/main/java/com/confiaolhaparadentro/DeviceReceiver.java`
- `android/app/src/main/java/com/confiaolhaparadentro/DeviceState.java`
- `android/app/src/main/java/com/confiaolhaparadentro/HabitWidgetProvider.java`
- `android/app/src/main/java/com/confiaolhaparadentro/NoticeScheduler.java`
- `android/app/src/main/java/com/confiaolhaparadentro/WidgetMath.java`
- `android/app/src/main/res/drawable/ic_notice.xml`
- `android/app/src/main/res/drawable/widget_action.xml`
- `android/app/src/main/res/layout/widget_habit.xml`
- `android/app/src/main/res/values-en/notifications.xml`
- `android/app/src/main/res/values-es/notifications.xml`
- `android/app/src/main/res/values-fr/notifications.xml`
- `android/app/src/main/res/values/notifications.xml`
- `android/app/src/main/res/xml/habit_widget_info.xml`
- `android/app/src/test/java/com/confiaolhaparadentro/WidgetMathTest.java`
- `functions/.gitignore`
- `functions/package.json`
- `functions/src/delivery.ts`
- `functions/src/index.ts`
- `functions/test/delivery.test.cjs`
- `functions/tsconfig.json`
- `src/components/NotificationSettings.tsx`
- `src/notifications/model.test.ts`
- `src/notifications/model.ts`
- `src/notifications/native.ts`
- `src/notifications/service.ts`
- `tests/e2e/notifications.spec.ts`
- `functions/package-lock.json` (gerado no Cloud Shell).
- `docs/NOTIFICACOES_WIDGET_IMPLEMENTACAO.md`.

## Ficheiros alterados

- `.gitignore`
- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/confiaolhaparadentro/MainActivity.java`
- `firebase.json`
- `firestore.rules`
- `src/App.tsx`
- `src/components/CommunityChat.tsx`
- `src/components/Habits/HabitDashboard.tsx`
- `src/data/habits/__tests__/habits.rules.test.ts`
- `src/storage/dailyCheckInStorage.ts`
- `src/storage/deleteUserData.ts`
- `src/locales/pt.json`, `en.json`, `es.json`, `fr.json`: namespace notifications.
- Ficheiros gerados de assets/configuração Android atualizados pelo Capacitor sync.
