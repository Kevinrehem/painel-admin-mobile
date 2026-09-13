import { AppRegistry } from 'react-native';
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
