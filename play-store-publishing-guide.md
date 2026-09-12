# Guia Passo a Passo: Publicando na Google Play Store

Este guia foi criado para te ajudar a publicar seu primeiro aplicativo (Bare React Native ou React Native CLI) na Google Play Store.

## 1. Preparando o App para Lançamento (Release)

Antes de enviar para a loja, você precisa gerar um pacote otimizado e assinado, chamado de **Android App Bundle (.aab)**.

### 1.1 Gerando a Chave de Assinatura (Keystore)
Você precisa de uma chave criptográfica para provar que você é o dono do app. Abra o terminal na pasta `android/app` do seu projeto e rode:

**No Windows:**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*(Guarde muito bem a senha que você colocar aqui, você vai precisar dela para sempre!)*

Isso vai gerar um arquivo `my-upload-key.keystore`. Mova ele para a pasta `android/app/`.

### 1.2 Configurando as Variáveis no Gradle
Abra o arquivo `android/gradle.properties` e adicione no final:
```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=senha_que_voce_criou
MYAPP_UPLOAD_KEY_PASSWORD=senha_que_voce_criou
```

### 1.3 Configurando o build.gradle
Abra `android/app/build.gradle` e configure a assinatura no bloco `android { ... }`:

```gradle
android {
    ...
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## 2. Gerando o Arquivo .AAB (App Bundle)

O Google Play agora exige arquivos `.aab` em vez de `.apk`.
No terminal, volte para a pasta raiz do projeto e rode:

```bash
cd android
./gradlew bundleRelease
```
*(No Windows, você pode rodar apenas `gradlew bundleRelease`)*

Isso vai demorar alguns minutos. Ao finalizar, o arquivo estará em:
`android/app/build/outputs/bundle/release/app-release.aab`. Esse é o arquivo de ouro que você vai subir!

## 3. Google Play Console: Criando o App

1. Acesse o [Google Play Console](https://play.google.com/console/) e faça login.
2. Clique em **"Criar app"** (no canto superior direito).
3. Preencha os dados básicos:
   - Nome do app (ex: Landpager Admin)
   - Idioma padrão (Português - Brasil)
   - É um app ou jogo? (App)
   - É gratuito ou pago? (Gratuito, se o download for gratuito)
4. Aceite as declarações do programa para desenvolvedores e clique em **Criar app**.

## 4. Configurando a Ficha da Loja e Políticas

No painel esquerdo, role até achar a seção **"Conteúdo do app"** (ou "Tarefas de configuração do app" no painel principal). Você precisa preencher todas as bolinhas pendentes:

1. **Política de Privacidade:** Cole o link da política de privacidade do seu site.
2. **Acesso a apps:** Se o seu app exige login (e ele exige), você **deve** fornecer credenciais (um usuário e senha de teste) para os revisores do Google conseguirem logar e testar sua WebView.
3. **Classificação de conteúdo:** Responda ao questionário longo sobre o que o app tem (geralmente vai dar classificação Livre).
4. **Público-alvo:** Selecione a idade (ex: 18+).
5. **Formulário de segurança de dados (Data Safety):** Declare o que você coleta. Como você coleta login, e-mail, etc. Você precisa dizer se os dados são criptografados (HTTPS) e para que servem.

## 5. Página Detalhes do App (Store Listing)

Vá em **Crescimento > Presença na loja > Página principal da loja**.
Aqui você vai fazer o marketing:
- **Descrições:** Breve e Completa.
- **Ícone:** 512x512 pixels (PNG).
- **Gráfico de Recursos (Feature Graphic):** 1024x500 pixels.
- **Capturas de Tela (Screenshots):** Suba pelo menos 2 a 3 prints do app rodando no celular.

## 6. Subindo e Lançando o App (Produção)

1. No menu esquerdo, vá em **Testes > Produção**. (Ou você pode fazer Teste Fechado antes, mas se quiser ir direto para produção, vá aqui).
2. Clique no botão azul **"Criar nova versão"**.
3. Em "Integridade do app", o Google vai sugerir o **Play App Signing**. Clique em "Aceitar" ou "Continuar".
4. Faça o **upload** do arquivo `app-release.aab` que você gerou lá no Passo 2.
5. Em "Nome da versão", coloque `1.0.0` e nas "Notas de versão" escreva o que há de novo (ex: "Lançamento oficial do app").
6. Clique em **Salvar**, depois **Avaliar versão** e, se não houver erros vermelhos impeditivos (avisos amarelos não impedem o lançamento), clique em **Iniciar lançamento para produção**.

## 7. O que acontece agora?

O seu app vai para o status de **"Em análise"**. Como é a sua primeira publicação, o Google pode levar de **3 a 7 dias úteis** para revisar o seu aplicativo. 

**Atenção:** Como seu app é uma WebView disfarçada de App nativo, os revisores do Google podem ser bem rigorosos. Certifique-se de que o app ofereça algo a mais (como Push Notifications ou integração com câmera), senão ele pode ser rejeitado por "Falta de funcionalidade nativa / Webview Spam". (Como você vai integrar Notificações via Firebase, isso já ajuda!).

Fique de olho no seu e-mail, se eles rejeitarem, vão te dizer exatamente o que você precisa consertar na webview para mandar de novo!
