# Validação Manual e Geração de Build (Android App Bundle)

Siga os passos abaixo para gerar a keystore de produção, configurar as senhas, e gerar o pacote de lançamento do aplicativo para a Google Play Store.

## Passo 1: Gerar a Keystore de Produção

Abra o terminal, navegue até a pasta `android/app` do projeto e execute o comando abaixo para gerar a chave de upload:

```bash
cd android/app
& "C:\Program Files\Java\jdk-22\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

> [!WARNING]
> Será solicitada uma senha. **Crie uma senha forte e guarde-a com segurança!** Você precisará dela para gerar novas versões do aplicativo.

## Passo 2: Atualizar as Senhas no Projeto

Abra o arquivo [gradle.properties](file:///d:/Projects/TemplateLandpage-Mobile/android/gradle.properties) e substitua o valor `coloque_sua_senha_aqui` pela senha que você acabou de criar no comando anterior nas duas últimas variáveis:

```properties
MYAPP_UPLOAD_STORE_PASSWORD=sua_nova_senha
MYAPP_UPLOAD_KEY_PASSWORD=sua_nova_senha
```

## Passo 3: Gerar o App Bundle (.aab)

No terminal, volte para a pasta `android` do projeto e execute a build de *release*:

```bash
cd ..
.\gradlew bundleRelease
```

> [!NOTE]
> Este processo pode levar alguns minutos. Aguarde até a finalização com a mensagem de `BUILD SUCCESSFUL`.

## Passo 4: Enviar para a Play Store

Após a compilação, recolha o arquivo gerado no caminho abaixo e faça o upload no Google Play Console:

**Caminho do arquivo:** `android/app/build/outputs/bundle/release/app-release.aab`

Consulte a seção 6 do guia [play-store-publishing-guide.md](file:///d:/Projects/TemplateLandpage-Mobile/play-store-publishing-guide.md) para os próximos passos no console da loja.
