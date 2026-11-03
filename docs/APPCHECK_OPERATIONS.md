# Firebase App Check — configuração e validação operacional

Estado verificado em 2 de novembro de 2026.

## Estado atual confirmado no repositório

- A aplicação inicializa Firebase App Check de forma assíncrona em `src/main.tsx`.
- O cliente Web usa `ReCaptchaEnterpriseProvider`.
- A inicialização depende de `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY`.
- O ficheiro `.env.example` contém a variável vazia.
- A inicialização não bloqueia a renderização da aplicação, o que evita indisponibilidade quando App Check não está configurado.
- Não foi encontrada configuração nativa Play Integrity no projeto Android/Capacitor.
- Não foi possível confirmar no projeto Firebase o estado de App Check por serviço, os tokens recebidos ou o enforcement.
- Não foi ativado enforcement nem feito deploy.

## Passos obrigatórios para Web

1. Registar a aplicação Web no Firebase App Check com reCAPTCHA Enterprise.
2. Configurar domínios autorizados no fornecedor e no Firebase.
3. Guardar a site key em `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` no ambiente de build protegido. A site key é pública por natureza; a chave secreta do fornecedor nunca deve ser colocada no bundle.
4. Fazer build de teste e confirmar nos logs do cliente que App Check inicializa sem erros.
5. Obter um token App Check de teste e confirmar no Firebase Console que os pedidos legítimos são reconhecidos.
6. Observar métricas de pedidos válidos, inválidos e não verificados durante um período de utilização real.
7. Só depois de validar os clientes legítimos, ativar enforcement gradualmente por serviço e com plano de reversão.

## Android / Capacitor

A implementação atual usa o SDK JavaScript com reCAPTCHA Enterprise e não comprova a integridade nativa do APK. Antes de declarar App Check ativo no Android:
- Escolher e integrar um bridge/plugin nativo compatível com Firebase App Check e Play Integrity.
- Validar tokens em dispositivo físico e builds de teste assinados.
- Confirmar atualização/renovação dos tokens e comportamento offline.
- Confirmar compatibilidade com a versão de Capacitor e Firebase instalada.
- Manter enforcement desativado até a validação completa.

## Critério de aceitação

App Check só pode ser marcado como concluído quando existirem evidências do token válido em Web e Android (se ambos forem distribuídos), métricas de tráfego legítimo e confirmação de enforcement planeado/ativado por serviço. A existência do código de inicialização não é prova suficiente.
