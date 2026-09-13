# Manual Testing Guide: Push Notifications

This guide outlines the steps to manually verify the modular integration for Firebase Cloud Messaging in the Landpager Admin app **using a Release APK**.

## Prerequisites
- A physical Android device or an emulator with Google Play Services installed.
- Dispositivo conectado via USB com depuração USB (USB Debugging) ativada.
- A valid `google-services.json` configured in the project.

## Step 1: Generate Release APK
Due to dev environment instabilities, we test using the Release APK.
1. Navigate to the android directory and build the APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Step 2: Install the APK
1. Install the generated APK to your connected device:
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

## Step 3: Verify Token Generation & App Startup
1. Open the app on your device.
2. Monitor the device logs for the FCM token. Since we are not using the Metro bundler, use `adb logcat`:
   ```bash
   adb logcat | findstr "FCM"
   ```
3. Look for the log output: `FCM Token: <your_device_token>`.
4. If you are on Android 13+ (API 33+), ensure the app prompts you for notification permissions.

## Step 4: Test Foreground Notification
1. Keep the app open in the foreground.
2. Send a test message using the Firebase Console, ou execute o seguinte comando PowerShell (lembre-se de substituir `<PROJECT_ID>`, `<YOUR_BEARER_TOKEN>` e `<FCM_TOKEN>`):

   ```powershell
   $body = @{
       message = @{
           token = "<FCM_TOKEN>"
           notification = @{
               title = "Teste de Notificação"
               body = "Esta é uma notificação de teste em foreground!"
           }
       }
   } | ConvertTo-Json -Depth 3

   Invoke-WebRequest -Uri "https://fcm.googleapis.com/v1/projects/<PROJECT_ID>/messages:send" `
       -Method POST `
       -Headers @{
           "Authorization" = "Bearer <YOUR_BEARER_TOKEN>"
           "Content-Type"  = "application/json"
       } `
       -Body $body
   ```
   *(Nota: O `<YOUR_BEARER_TOKEN>` precisa ser um token OAuth 2.0 válido gerado a partir da Service Account do Firebase, que expira em 1 hora).*

3. Verify that an alert dialog pops up with the notification title and body.

## Step 5: Test Background Notification
1. Send the app to the background.
2. Send another test message from the Firebase Console or PowerShell script.
3. Verify that a system notification appears in the device's notification tray.
4. Check the logs confirming the background handler was invoked:
   ```bash
   adb logcat | findstr "handled"
   ```
   *Look for: `Message handled in the background!`*

## Step 6: Test Token Refresh (Optional)
- In the Firebase Console or via adb commands, clear the app storage (which clears the instance ID and forces a token refresh).
- Verify that `adb logcat | findstr "atualizado"` logs the new token.
