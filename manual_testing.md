# Roteiro de Testes Manuais - Landpager Admin Mobile

Este documento contém o roteiro para testar a integração, UI/UX e segurança do aplicativo React Native CLI puro.

## 1. Setup e Compilação

1.  Certifique-se de ter o ambiente React Native configurado para Android (Android Studio, SDKs, variáveis de ambiente).
2.  Na raiz do projeto, instale os pods do iOS (caso possua Mac): `npx pod-install ios`
3.  Inicie o Metro Bundler: `npm start`
4.  Em outro terminal, compile e rode no emulador Android ou dispositivo conectado: `npm run android`
5.  *(Apenas iOS/Mac)*: `npm run ios`

> [!TIP]
> **Como instalar via USB no seu celular físico (Android):**
> 1. No seu celular, vá em **Configurações > Sobre o telefone**.
> 2. Toque 7 vezes em **"Número da Versão"** (ou Build Number) até aparecer a mensagem "Você agora é um desenvolvedor".
> 3. Volte e vá em **Configurações > Sistema > Opções do Desenvolvedor**.
> 4. Ative a opção **"Depuração USB"** (USB Debugging).
> 5. Conecte o celular ao computador via cabo USB. Se aparecer um aviso na tela do celular perguntando se confia no computador, clique em **Permitir/OK**.
> 6. Agora, basta rodar `npm run android` no terminal do seu computador (com o projeto aberto) e o React Native irá compilar e instalar o app direto no seu celular.

## 2. Teste de UI/UX e Segurança na Tela de Login

### Cenário 2.1: Bloqueio SSRF (Domínio Inválido)
- Abra o aplicativo e na tela de login informe o domínio `google.com` ou `hacker.net`.
- Preencha qualquer senha.
- Clique em "Acessar Painel".
- **Comportamento Esperado:** Um alerta de erro deve aparecer indicando que a URL não pertence a um domínio permitido (`.landpager.com`), bloqueando a chamada à API.

### Cenário 2.2: Senha Incorreta
- Informe um domínio válido, como `demo.landpager.com`.
- Informe uma senha **incorreta**.
- Clique em "Acessar Painel".
- **Comportamento Esperado:** O Activity Indicator deve girar enquanto faz a requisição. Um alerta de erro deve aparecer indicando "Falha ao realizar login" ou "Incorrect password".

### Cenário 2.3: Login de Sucesso e UX Premium
- Informe um domínio válido.
- Informe a senha **correta**.
- Clique em "Acessar Painel".
- **Comportamento Esperado:** O Activity Indicator roda, o login na API retorna sucesso, salva o cookie e as credenciais (KeyChain), e redireciona o usuário para o WebView na rota `/admin`.

## 3. Teste do WebView e Injeção de Cookie

- Após o sucesso no Cenário 2.3, o aplicativo abrirá o `WebViewScreen`.
- **Comportamento Esperado:** O WebView deve renderizar a página administrativa, reconhecendo o cookie injetado de forma nativa e burlando o redirecionamento para o login web padrão. O loading indicator (Activity Indicator) só deve sumir quando a página carregar completamente.

## 4. Teste de Reabertura (Persistência com KeyChain)

- Feche o aplicativo forçadamente no emulador ou dispositivo.
- Abra o aplicativo novamente.
- **Comportamento Esperado:** A tela inicial do aplicativo deve verificar as credenciais salvas via `react-native-keychain`. Ao encontrar a URL salva, o aplicativo deve pular a tela de login e cair diretamente no `WebViewScreen` conectado à rota `/admin`.

## 5. Teste de Push Notifications (Firebase)

*(Necessário configurar o Firebase Console e gerar o google-services.json no diretório `android/app`)*
- Ao carregar o WebView, se a página web chamar via `postMessage({type: 'REQUEST_FCM_TOKEN'})`, o aplicativo deve devolver o Token FCM com sucesso via JavaScript Injection.
- Envie uma notificação teste via Firebase Console.
- **Comportamento Esperado:** Se o app estiver aberto, um Alerta nativo do React Native deve pipocar na tela com o Título e Body. Se estiver fechado ou em background, a notificação push tradicional do sistema operacional (Android/iOS) deve aparecer.
