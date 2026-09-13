# Stage 2: Push Notifications Base

## 1. Context
Integration of basic push notification capabilities using Firebase Cloud Messaging (FCM). This stage enables the mobile app to receive token, request user permissions, and sync the device token with the Next.js backend for targeted push campaigns (e.g., webhook triggers from Mercado Pago).

## 2. Containers
- **FCM Service:** Implementation of `@react-native-firebase/messaging` for token generation and message handling.
- **Backend Sync Worker:** Native API calls (`syncFCMTokenToBackend`) to securely transmit the device FCM token to the backend, utilizing extracted auth tokens to bypass CookieManager race conditions.
- **Message Handlers:** Basic foreground `Alert` handling and background message logging.

## 3. Data Models (API Payload)
```json
{
  "token": "string",
  "deviceType": "android | ios"
}
```

## 4. Infrastructure
- Firebase App and Messaging modules linked.
- Dependency on external `backend-integration-spec.md` for backend Next.js implementation details.
- **Status:** COMPLETED.
