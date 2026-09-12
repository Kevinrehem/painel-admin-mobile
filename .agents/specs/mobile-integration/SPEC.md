---
name: Mobile Integration (Push Notifications)
description: Specification for integrating the Next.js backend with the React Native mobile wrapper to support FCM push notifications.
---

# Mobile Integration Specification

This specification outlines the integration requirements for the Next.js main repository to support Push Notifications for the React Native Mobile Wrapper. The mobile wrapper utilizes `@react-native-firebase/messaging` to generate Firebase Cloud Messaging (FCM) tokens. The main repository must expose endpoints to register these tokens, store them persistently, and utilize the Firebase Admin SDK to dispatch notifications.

## Index of Resources

The detailed implementation steps and mappings are fragmented into the `res/` directory to optimize context loading and follow the progressive referencing architecture:

- [Implementation Phases](./res/01-implementation-phases.md): Step-by-step guide on how to integrate the database, initialize Firebase Admin, and dispatch notifications.
- [Endpoints Mapping](./res/02-endpoints-mapping.md): Simplified mapping of the required API endpoints and payloads.
- [Architecture Diagram](./res/fcm-architecture.mermaid): Sequence diagram illustrating the full token registration and webhook notification flow.
