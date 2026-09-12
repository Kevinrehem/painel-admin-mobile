# Mobile App Wrapper Specification

## 1. Context

This document outlines the requirements and technical design for the **Landpager Admin Mobile Wrapper**, a React Native (Expo) application. The goal is to provide a native container for an existing responsive Next.js admin panel while adding native capabilities, specifically push notifications and camera/file uploads.

This application acts as a dynamic "Viewer" where the user inputs their instance's `baseURL`. The app then loads the Next.js panel within a WebView and establishes a two-way communication channel to register Push Notification tokens.

## 2. Hard Requirements

1. **Framework:** React Native using Expo (Managed Workflow).
2. **Dynamic URL:** The app must start on a setup screen asking for the `baseURL`. It must validate the URL and load it in a `WebView`.
3. **Persistence:** The entered `baseURL` must be saved using `@react-native-async-storage/async-storage` so it auto-loads on subsequent opens.
4. **Push Notifications:** Must use `expo-notifications`. Upon startup, the app must request notification permissions, obtain the `ExpoPushToken`, and inject it into the WebView.
5. **Camera/Gallery:** Must declare permissions in `app.json` (`CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`) so the WebView's `<input type="file" accept="image/*" capture>` tags trigger the native camera/gallery seamlessly.

## 3. Containers & Components

### 3.1 Expo App (Native Container)
- **Setup Screen (`/screens/SetupScreen.tsx`):**
  - Text input for `baseURL`.
  - Save button.
  - Basic URL validation (must start with `http://` or `https://`).
- **WebView Screen (`/screens/WebViewScreen.tsx`):**
  - Renders `react-native-webview`.
  - Injects JS to attach the Expo Push Token to the `window` object or sends it via `postMessage`.
  - Listens to `onMessage` events from the WebView (e.g., if the web app wants to trigger a native action or clear the `baseURL` to switch instances).

### 3.2 Next.js Admin Panel (Web Context - Separate Repository)
- **Settings API (`/api/settings`):** Must be updated to accept and save an array of `expoPushTokens`.
- **Frontend Integration:** Must listen for the `PUSH_TOKEN` message from the React Native app. Once received and if the user is authenticated as an admin, it sends a `PUT` request to `/api/settings` to register the token.
- **Webhook Endpoint:** The Mercado Pago webhook must be updated to dispatch a POST request to `https://exp.host/--/api/v2/push/send` using the saved tokens when a payment is approved.

## 4. Communication Protocol (App ↔ Web)

### App to Web (Token Injection)
When the WebView loads, the app executes the following injected JavaScript:
```javascript
window.isNativeApp = true;
window.dispatchEvent(new CustomEvent('ExpoPushTokenReceived', { detail: 'ExpoPushToken[xxxx-xxxx]' }));
```

### Web to App (Logout / Switch Instance)
If the admin clicks "Sair" (Logout) in the web app, they might want to change the `baseURL`.
The web app sends a message:
```javascript
if (window.ReactNativeWebView) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLEAR_BASE_URL' }));
}
```
The React Native app receives this, clears `AsyncStorage`, and navigates back to the Setup Screen.

## 5. Infrastructure & Build

- **Build System:** EAS (Expo Application Services).
- **Commands:**
  - Local Dev: `npx expo start`
  - Build Android APK: `eas build -p android --profile preview`
- **Configuration:** All native permissions must be strictly defined in the `app.json` `expo.android.permissions` array.

## 6. Execution Phases

1. **Phase 1: Project Scaffolding:** Initialize Expo project and install dependencies (`expo-notifications`, `react-native-webview`, `@react-native-async-storage/async-storage`).
2. **Phase 2: Navigation & Setup:** Implement the Setup Screen and AsyncStorage logic.
3. **Phase 3: WebView Integration:** Implement the WebView Screen and test loading a generic URL.
4. **Phase 4: Push Notifications:** Implement `expo-notifications` permission requests and token generation. Set up the `postMessage` injection.
5. **Phase 5: Build & Testing:** Generate the APK via EAS and verify camera/file uploads inside the WebView.
