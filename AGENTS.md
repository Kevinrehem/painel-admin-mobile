# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architecture Guidelines
- **Push Notifications:** We are using **Firebase Cloud Messaging (FCM)** via `@react-native-firebase/messaging` natively. Do NOT use `expo-notifications` or the Expo Push API.

## Index of Specifications
- [Backend Integration Spec (Push Notifications)](file:///d:/Projects/TemplateLandpage-Mobile/backend-integration-spec.md)
  - Visual Architecture: [res/fcm-architecture.mermaid](file:///d:/Projects/TemplateLandpage-Mobile/res/fcm-architecture.mermaid)
