import { AppRegistry } from 'react-native';
// IMPORTA O SERVIÇO DE NOTIFICAÇÕES ANTES DE TUDO!
// Isso garante que o setBackgroundMessageHandler registre a tarefa
// headless antes que qualquer componente de UI do React Native seja avaliado,
// prevenindo crashes no 'killed state' em alguns aparelhos Android.
import './src/services/notifications';

import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// O handler de mensagens do Firebase (setBackgroundMessageHandler) já
// está sendo registrado no arquivo src/services/notifications.ts,
// que é inicializado quando o App é importado acima.

// Registra o handler de background do Notifee para evitar crashes 
// e tratar interações quando o app está fechado (quit state).
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[Notifee Background] Usuário interagiu com a notificação', detail.notification);
  }
});

AppRegistry.registerComponent(appName, () => App);
