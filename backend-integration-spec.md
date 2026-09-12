# Backend Integration Specification: Push Notifications

## 1. Context
This specification outlines the integration requirements for the Next.js main repository to support unlimited Push Notifications for the React Native Mobile Wrapper. The mobile wrapper utilizes `@react-native-firebase/messaging` to generate Firebase Cloud Messaging (FCM) tokens. The main repository must expose endpoints to register these tokens, store them persistently, and utilize the Firebase Admin SDK to dispatch notifications (e.g., upon receiving Mercado Pago webhooks).

## 2. Containers (Next.js Application)

### 2.1 Firebase Admin Initialization
The Next.js backend must initialize the Firebase Admin SDK to interact with the FCM HTTP v1 API.
- **Library:** `firebase-admin`
- **Configuration:** Requires a Service Account JSON file (via Environment Variables).

### 2.2 API Endpoints

#### `POST /api/settings/push-token`
- **Purpose:** Registers a new FCM token from the mobile app.
- **Payload:**
  ```json
  {
    "token": "fcm_token_string_here",
    "deviceType": "android" | "ios"
  }
  ```
- **Behavior:** Validates the payload and appends the token to the user's or site's `fcm_tokens` array in the database. Must avoid duplicating tokens.

#### `POST /api/mercadopago/webhook`
- **Purpose:** Receives payment status updates from Mercado Pago.
- **Behavior:** 
  1. Validates the webhook signature.
  2. Updates the payment status in the database.
  3. Retrieves the associated `fcm_tokens` for the site owner.
  4. Dispatches a multicast Push Notification via Firebase Admin SDK.

## 3. Data Models (PostgreSQL)

The database schema must be updated to store an array of FCM tokens. Depending on the architecture (e.g., Prisma), it can be stored as an array of strings or a separate relational table.

**Example (Prisma Schema Update):**
```prisma
model SiteSettings {
  id          String   @id @default(cuid())
  // Existing fields...
  
  // New field to store FCM tokens
  fcmTokens   String[] @default([]) 
  
  updatedAt   DateTime @updatedAt
}
```

## 4. Infrastructure & Integration Rules

1. **Firebase FCM over Expo Push:** The agent MUST NOT use the Expo Push API (`exp.host`). The mobile wrapper is a Bare React Native app using native Firebase SDKs. The backend must strictly use `admin.messaging().sendMulticast(...)` from the `firebase-admin` Node.js library.
2. **Token Rotation & Cleanup:** Firebase tokens can expire. The backend should handle `messaging/registration-token-not-registered` errors from the Firebase Admin SDK by purging invalid tokens from the database.
3. **Payload Structure:** 
   Push notifications must follow the standard FCM payload structure to ensure the background handler (`setBackgroundMessageHandler`) in React Native receives the `notification` object correctly.
   
   ```javascript
   const message = {
     notification: {
       title: 'Nova Venda!',
       body: 'Uma venda de R$ 99,00 foi aprovada.',
     },
     tokens: siteSettings.fcmTokens,
   };
   ```

## 5. Architectural Diagram
See the visual architecture mapping in [res/fcm-architecture.mermaid](./res/fcm-architecture.mermaid).
