# Stage 4: Advanced Notifications & Notification Center

## 1. Context
Enhancing the notification system to ensure critical alerts are immediately visible to the user and providing an in-app hub to manage and interact with notifications. Notifications must be high-priority (heads-up notifications) and the app must feature a dedicated tab to view notification details, rendering dynamic forms or information based on a flexible payload structure.

## 2. Containers
- **FCM Configuration:** Updating Android notification channels to use `IMPORTANCE_HIGH` or `IMPORTANCE_MAX` to trigger heads-up (banner) notifications without user interaction (pull-down).
- **Notification Tab (UI):** A new screen/tab within the React Native app dedicated to listing received notifications.
- **Dynamic Content Renderer:** A component that parses the custom `data` payload of the FCM message and dynamically renders fields, forms, or purchase details directly within the Notification Tab.

## 3. Data Models (Dynamic Notification Payload)
The FCM message `data` payload must be flexible. Example structure:
```json
{
  "type": "PURCHASE_ALERT",
  "title": "New Purchase!",
  "message": "A purchase of $99.00 was made.",
  "dynamicFields": "[{\"label\": \"Client\", \"value\": \"John Doe\"}, {\"label\": \"Item\", \"value\": \"Premium Plan\"}]"
}
```
*Note: `dynamicFields` is stringified JSON since FCM `data` values must be strings.*

## 4. Infrastructure
- **Android Channels:** Requires native configuration or `@react-native-firebase/messaging` channel management to ensure the channel priority allows heads-up displays.
- **Status:** PENDING.
