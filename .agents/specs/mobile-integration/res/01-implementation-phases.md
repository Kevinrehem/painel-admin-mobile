# Implementation Phases

## Phase 1: Database Schema Update (PostgreSQL)
The database must be updated to store an array of FCM tokens for each user or site.
- **Action:** Add `fcmTokens: string[]` (or equivalent relational table) to the relevant model (e.g., `SiteSettings` or `User`).
- **Goal:** Allow the backend to store multiple device tokens for a single owner so notifications can be sent to all their active devices.

## Phase 2: Firebase Admin Initialization
The Next.js backend must initialize the Firebase Admin SDK to interact with the FCM HTTP v1 API.
- **Action:** Install the `firebase-admin` Node.js package.
- **Action:** Create a singleton utility (e.g., `src/lib/firebase-admin.ts`) to initialize the app using a Service Account JSON provided via environment variables.

## Phase 3: Token Registration
Create an endpoint to receive and store tokens sent from the Mobile WebView.
- **Action:** Implement the `POST /api/settings/push-token` route.
- **Action:** Ensure the route validates the payload and appends the token to the `fcmTokens` array in the database. Ensure no duplicate tokens are stored.

## Phase 4: Webhook Integration & Push Dispatch
Integrate the Push Notification dispatch into existing webhooks (e.g., Mercado Pago).
- **Action:** Update the Mercado Pago webhook route (`POST /api/mercadopago/webhook`).
- **Action:** Upon successful payment processing, retrieve the `fcmTokens` for the associated site owner from the database.
- **Action:** Use `admin.messaging().sendMulticast({ notification, tokens })` to push the notification to the devices.
- **Action (Cleanup):** Catch `messaging/registration-token-not-registered` errors from the Firebase response and purge those invalid tokens from the database to maintain hygiene.
