# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architecture Guidelines
- **Push Notifications:** We are using **Firebase Cloud Messaging (FCM)** via `@react-native-firebase/messaging` natively. Do NOT use `expo-notifications` or the Expo Push API.

## Index of Specifications
- [Backend Integration Spec (Push Notifications)](file:///d:/Projects/TemplateLandpage-Mobile/backend-integration-spec.md)
  - Visual Architecture: [res/fcm-architecture.mermaid](file:///d:/Projects/TemplateLandpage-Mobile/res/fcm-architecture.mermaid)
- [Stage 1: Foundation and Auth](file:///d:/Projects/TemplateLandpage-Mobile/specs/stage-1-foundation.md)
- [Stage 2: Push Notifications Base](file:///d:/Projects/TemplateLandpage-Mobile/specs/stage-2-push-notifications-base.md)
- [Stage 3: UI Fixes & UX](file:///d:/Projects/TemplateLandpage-Mobile/specs/stage-3-ui-fixes.md)
- [Stage 4: Advanced Notifications](file:///d:/Projects/TemplateLandpage-Mobile/specs/stage-4-advanced-notifications.md)

## Testing Guidelines
- **Device Testing:** O ambiente de desenvolvimento via Metro (`npm start`) apresenta instabilidades neste projeto. Toda vez que um teste de validação em dispositivo físico for necessário, instrua o usuário ou documente processos para gerar o APK de release via `cd android && ./gradlew assembleRelease` e instalar via `adb install` ou transferência manual, ao invés de tentar usar a build de debug.
