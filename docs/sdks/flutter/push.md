---
title: Push notifications (FCM)
sidebar_label: Push notifications
description: Receive branded incoming-call notifications via Firebase Cloud Messaging by configuring Firebase and registering the device token.
---

# Push notifications (FCM)

The push module delivers branded incoming-call notifications through Firebase Cloud Messaging. It uses `firebase_messaging` under the hood, and the dependency is pulled in transitively by `relavoi_flutter`, so you do not add it yourself. You do, however, need a configured Firebase project.

## 1. Configure Firebase

Push requires a Firebase project with the mobile apps registered and the platform config files in place:

- **Android**: `android/app/google-services.json`, plus the Google Services Gradle plugin in your Android build.
- **iOS**: `ios/Runner/GoogleService-Info.plist`, plus APNs configured for your Apple app in the Firebase console.

The fastest way to generate these is the FlutterFire CLI (`flutterfire configure`). Follow the standard FlutterFire setup for your app; the Relavoi SDK does not change those steps.

:::note Initialize Firebase before registering
Call `Firebase.initializeApp()` during app startup (per the FlutterFire docs) before you register a token with Relavoi. The SDK fetches the FCM token from the already-initialized Firebase app.
:::

## 2. Register the device token

After the user signs in and you know their phone number, register the device so Relavoi can target incoming-call notifications to it. `registerToken` fetches the current FCM token internally and POSTs it to the backend, so you pass only the user's phone, in any of the accepted forms:

```dart
import 'package:relavoi_flutter/relavoi_flutter.dart';

Future<void> registerForPush(String userPhone) async {
  try {
    await Relavoi.instance.push.registerToken(userPhone);
  } on NetworkException catch (e) {
    debugPrint('Could not register push token: $e');
  } on RelavoiException catch (e) {
    debugPrint('Push registration failed: $e');
  }
}
```

Call this once per session, after sign-in. FCM rotates tokens over time; re-run `registerToken(userPhone)` on app launch to keep the backend current.

## 3. Handle incoming messages

The push module surfaces FCM messages as a stream of `RemoteMessage` (the `firebase_messaging` type). Listen to render your own notification UI or update in-app state:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:relavoi_flutter/relavoi_flutter.dart';

Relavoi.instance.push.onMessage.listen((RemoteMessage message) {
  final data = message.data;
  // e.g. show an incoming-call screen or a local notification from `data`.
  debugPrint('Relavoi push: ${data.keys}');
});
```

You retain full control over how the notification renders (channel, importance, icon, and any deep link), since you build the UI from the `RemoteMessage`.

## 4. Deactivate on logout

On sign-out, deactivate the current token so the user stops receiving notifications on that device:

```dart
await Relavoi.instance.push.deactivateToken();
```

## Android runtime permission

On Android 13 (API 33) and above, the OS requires the `POST_NOTIFICATIONS` runtime permission before any notification displays. Request it at a contextual moment, typically just before `registerToken`, using your notification-permission flow of choice (for example the `permission_handler` package or `firebase_messaging`'s `requestPermission`).

:::tip Test deliverability
During development, trigger a masked call against a live session and confirm the payload reaches your `onMessage` listener (log `message.data.keys`).
:::
