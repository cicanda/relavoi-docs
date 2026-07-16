---
title: Push notifications (FCM)
sidebar_label: Push notifications
description: Receive branded incoming-call notifications via Firebase Cloud Messaging by subclassing RelavoiFirebaseService and registering tokens.
---

# Push notifications (FCM)

The SDK routes FCM token refresh and delivers Relavoi push payloads to a hook you implement. You provide the FCM token and render the notification in the hook; the SDK handles token registration and the FCM plumbing.

## 1. Subclass RelavoiFirebaseService

`RelavoiFirebaseService` extends `FirebaseMessagingService`. It auto-registers refreshed tokens (see step 2) and hands Relavoi payloads to the overridable `onRelavoiNotification(message: RemoteMessage)` hook. Create your own subclass and register it in the manifest.

```kotlin
package com.example.app.push

import com.google.firebase.messaging.RemoteMessage
import com.relavoi.sdk.push.RelavoiFirebaseService

class MyPushService : RelavoiFirebaseService() {
  // Called for every message the base service receives. Render your own
  // notification / update UI here. The default implementation only logs.
  override fun onRelavoiNotification(message: RemoteMessage) {
    val data = message.data
    // e.g. build and post a NotificationCompat notification from `data`
  }
}
```

In `AndroidManifest.xml`:

```xml
<service
  android:name=".push.MyPushService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>
```

If you override `onMessageReceived`, call `super.onMessageReceived(message)` so the base service can dispatch to `onRelavoiNotification`.

## 2. Register the FCM token

After Firebase hands you a token, pass it to `Relavoi.push.registerToken` along with the user's phone:

```kotlin
import com.google.firebase.messaging.FirebaseMessaging
import com.relavoi.sdk.Relavoi

class LoginFlow : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
      lifecycleScope.launch {
        Relavoi.push.registerToken(
          userPhone = currentUser.phone,
          fcmToken = token,
        )
      }
    }
  }
}
```

To have `RelavoiFirebaseService.onNewToken` auto-register rotated tokens, tell the SDK which user this device belongs to after sign-in:

```kotlin
import com.relavoi.sdk.push.RelavoiFirebaseService

// After sign-in — stored in encrypted prefs so onNewToken can register silently.
RelavoiFirebaseService.setUserForPushUpdates(context, currentUser.phone)

// On logout:
RelavoiFirebaseService.clearUserForPushUpdates(context)
```

`registerToken` also de-dupes: passing the same `(userPhone, fcmToken)` pair twice skips the network round-trip.

## 3. Deactivating a token

On logout, deactivate the current token. `deactivateToken` requires the token to remove:

```kotlin
viewModelScope.launch {
  Relavoi.push.deactivateToken(fcmToken = token)
}
```

## 4. Rendering the notification

The SDK does not build or post the system notification for you — its default `onRelavoiNotification` only logs. Render the notification yourself inside your `onRelavoiNotification` override (step 1), including creating any notification channel on API 26+. This gives you full control over channel, importance, icon, and deep link.

## 5. POST_NOTIFICATIONS runtime permission

On API 33+ you must request `POST_NOTIFICATIONS` at runtime before any notification will display. Suggested timing: just before you call `registerToken`, so the user sees the prompt in a contextual moment.

```kotlin
private val notifPermLauncher = registerForActivityResult(
  ActivityResultContracts.RequestPermission()
) { granted ->
  if (granted) {
    // proceed with registerToken
  }
}

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
  notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
}
```

:::tip Test deliverability
During development, trigger a masked call against a live session and confirm the FCM payload reaches your `onRelavoiNotification` override (log `message.data.keys`).
:::
