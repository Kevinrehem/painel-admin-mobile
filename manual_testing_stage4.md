# Manual Testing Script - Stage 4: Advanced Notifications & UI Revamp

## Prerequisites
- Certifique-se de que o aplicativo foi recompilado após as alterações recentes (especialmente para que o som customizado e o Notifee sejam embutidos no Android).
- Rode os comandos de build nativo, se necessário:
  ```bash
  npm run android
  ```
  *(Se você usar release build no dispositivo físico, siga as regras de build do projeto `cd android && ./gradlew assembleRelease`)*.

## Teste 1: Notificações Heads-Up com Som (Max Priority)
1. **Com o app em Background:**
   - Minimize o aplicativo.
   - Envie uma notificação de teste (via Firebase Console ou script de teste) direcionada ao FCM Token do seu dispositivo.
   - **Resultado Esperado**: A notificação deve aparecer no topo da tela (Heads-Up) e você deve ouvir o som customizado (coin/tada), mesmo fora do aplicativo.

2. **Com o app em Foreground (Aberto):**
   - Mantenha o aplicativo aberto na tela inicial.
   - Envie outra notificação de teste.
   - **Resultado Esperado**: O `notifee` deve exibir a notificação nativamente descendo no topo da tela (heads-up) tocando o som, sem interromper o fluxo com um `Alert` padrão.

## Teste 2: UI Revamp - Tab Bar Flutuante
1. **Navegação pelas abas:**
   - Abra o aplicativo.
   - Observe a barra de navegação inferior (Bottom Tab Bar).
   - **Resultado Esperado**: 
     - A barra não deve estar encostada nas laterais nem na borda inferior da tela.
     - Deve possuir cantos arredondados, margens laterais/inferiores e uma leve sombra (efeito flutuante).
     - O conteúdo (por exemplo, as telas Home, Configurações) deve ser visível "por trás" ou ao redor das margens da barra, criando uma estética premium.

## Teste 3: Validações de Qualidade
Execute os comandos abaixo na raiz do projeto e certifique-se de que todos finalizam com sucesso:
- `npm run test`
- `npm run lint`

*O projeto não possui scripts de `build:worker` ou `wrangler` no `package.json`, pois trata-se de um app React Native. A validação principal aqui é o build nativo (`npm run android`).*
