# Manual Testing and Validation Script

## Objective
Validate the basic functionality of the Landpager Mobile App wrapper.

## Prerequisites
1. Node.js installed.
2. Expo CLI installed.
3. Expo Go app installed on your physical mobile device.
4. (Optional) EAS CLI installed if you want to build the APK.

## Success Criteria Evaluation
> Note: The commands `npm run test`, `npm run lint`, `npm run build:worker`, and `wrangler` are typically used for Next.js and Cloudflare projects. Since this is an Expo (React Native) project, these scripts do not exist by default. For this wrapper, we focus on manual testing as specified in Phase 7 of the Execution Plan.

## Step 1: Run the Project
1. Open the terminal and navigate to the project directory: `d:\Projects\TemplateLandpage-Mobile`.
2. Run `npm install` just to ensure everything is synced.
3. Run `npm run start` or `npx expo start`.
4. A QR code will appear in the terminal.

## Step 2: Test on Device (Expo Go)
1. Open the **Expo Go** app on your physical device.
2. Scan the QR code.
3. **Verify:** You should see the Setup Screen with a centered card asking for a URL.
4. **Action:** Enter a URL (e.g., `catalog.landpager.com` or an invalid string like `foo`) and click "Connect".
5. **Verify:** It should validate (prepend `https://` if needed) and switch to the WebView screen.
6. **Verify:** The WebView should load the specified URL.

## Step 3: Test Push Notifications (Requires APK / Dev Build)
*Note: Push notifications do not work reliably in the standard Expo Go app. You must build the app to test this fully.*
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure the project: `eas build:configure`
4. Build the Android APK: `eas build -p android --profile preview`
5. Download and install the generated APK on your device.
6. Open the app and observe the terminal logs to ensure `Expo Push Token` is fetched successfully.
7. Verify that Next.js backend receives the token (once the backend logic is implemented in the Web Repository).

## Step 4: Test "Clear Base URL"
1. In your Next.js application, add a button that executes: 
   `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLEAR_BASE_URL' }))`
2. **Verify:** Clicking this button inside the WebView on the app should return you to the Setup Screen.
