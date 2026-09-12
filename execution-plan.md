# Execution Plan: Mobile App Wrapper

This plan provides a step-by-step guide for implementing the React Native (Expo) mobile wrapper. It is designed to be executed by an AI agent acting in a Builder role.

## Phase 1: Project Initialization

1. **Initialize Expo App:**
   - Run `npx create-expo-app@latest . -t blank-typescript` in the root directory.
2. **Install Dependencies:**
   - Run `npx expo install react-native-webview expo-notifications expo-device @react-native-async-storage/async-storage`.
3. **Configure `app.json`:**
   - Set the `bundleIdentifier` (iOS) and `package` (Android) (e.g., `com.landpager.admin`).
   - Add necessary permissions under `expo.android.permissions`: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `RECEIVE_BOOT_COMPLETED`.
   - Configure the `plugins` array to include `expo-notifications`.

## Phase 2: Navigation & State Setup

1. **Create Storage Utility:**
   - Create `src/utils/storage.ts` to encapsulate `AsyncStorage` calls for saving and retrieving the `baseURL`.
2. **Setup Screens Structure:**
   - Although `expo-router` is default in newer Expo versions, a simple conditional rendering in `App.tsx` is sufficient since it's only two states: "Setup" and "WebView".
   - If `baseURL` exists in storage -> Render `WebViewScreen`.
   - If `baseURL` does NOT exist -> Render `SetupScreen`.

## Phase 3: Setup Screen Implementation

1. **Implement `src/screens/SetupScreen.tsx`:**
   - Create a clean, centered UI.
   - Include a `TextInput` for the URL (e.g., `https://catalog.landpager.com`).
   - Include a Submit button.
   - **Validation:** Check if the string starts with `http://` or `https://`. If not, prepend `https://`.
   - On submit, save to `AsyncStorage` and update the root state to render the WebView.

## Phase 4: Push Notifications Setup

1. **Implement `src/utils/notifications.ts`:**
   - Export an async function `registerForPushNotificationsAsync()`.
   - Follow the official Expo documentation to check for `Device.isDevice`.
   - Request `Notifications.requestPermissionsAsync()`.
   - Get the token using `Notifications.getExpoPushTokenAsync()`.
   - Return the string token.

## Phase 5: WebView Screen Implementation

1. **Implement `src/screens/WebViewScreen.tsx`:**
   - Fetch the Expo Push Token on component mount.
   - Render the `<WebView>` component with `source={{ uri: baseURL }}`.
   - **Inject JS:** Use the `injectedJavaScript` prop to pass the token down to the Web context when it finishes loading.
     ```javascript
     const INJECTED_JAVASCRIPT = `
       window.isNativeApp = true;
       window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
       true;
     `;
     ```
   - **Communicate Token:** When the WebView loads, or via the `onMessage` handler (if the WebView signals it is ready), send the token using the `WebView` ref:
     ```javascript
     webViewRef.current?.injectJavaScript(`
       window.dispatchEvent(new CustomEvent('ExpoPushTokenReceived', { detail: '${pushToken}' }));
       true;
     `);
     ```
   - **Listen to WebView Messages:** Handle `onMessage`. If the WebView sends `{ type: 'CLEAR_BASE_URL' }`, clear `AsyncStorage` and return the user to the Setup Screen.

## Phase 6: Next.js Backend Adaptations (To be executed in the Web Repository)

> **Note for the Agent:** This phase belongs to the Web Repository (`TemplateLandpage`).

1. **Update API & Types:**
   - Add `expoPushTokens: string[]` to `SiteSettings` in `src/types/index.ts`.
   - Create `src/app/api/settings/push-token/route.ts` (POST) to add a token to the array if it doesn't already exist.
2. **Update Frontend Admin Panel:**
   - In a global `useEffect` (e.g., inside an `AdminLayout`), listen for the custom event:
     ```javascript
     window.addEventListener('ExpoPushTokenReceived', (e) => {
       const token = e.detail;
       // Call POST /api/settings/push-token with the token
     });
     ```
   - Add a "Sair do App" button (conditionally rendered if `window.isNativeApp` is true) that calls `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLEAR_BASE_URL' }))`.
3. **Update Mercado Pago Webhook:**
   - In `src/app/api/mercadopago/webhook/route.ts`, after a successful payment processing, retrieve `settings.expoPushTokens`.
   - Send a POST request to `https://exp.host/--/api/v2/push/send` with an array of messages:
     ```json
     [{
       "to": "ExponentPushToken[...]",
       "sound": "default",
       "title": "Nova Venda!",
       "body": "Uma venda de R$ 99,00 foi aprovada."
     }]
     ```

## Phase 7: Final Testing & Compilation

1. **Test on Device:**
   - Run `npx expo start` and test using the Expo Go app to ensure the WebView loads and camera works (note: Push Notifications require a dev build or EAS build, they don't work reliably in Expo Go).
2. **Build APK:**
   - Install EAS CLI: `npm install -g eas-cli`.
   - Run `eas build -p android --profile preview` to generate the `.apk` file for testing.
