---
title: Push notifications (FCM)
sidebar_label: Push notifications
description: Receive branded incoming-call notifications via Firebase Cloud Messaging by subclassing RelavoiFirebaseService and registering tokens.
---

# Push notifications (FCM)

The SDK delivers branded incoming-call notifications via FCM. You provide the FCM token; we handle the rest — template, image, sound, deep link.

## 1. Subclass RelavoiFirebaseService

`RelavoiFirebaseService` extends `FirebaseMessagingService` and forwards token refresh and message receipt to the SDK. Create your own subclass and register it in the manifest.

```kotlin
package com.example.app.push

import com.relavoi.sdk.push.RelavoiFirebaseService

class MyPushService : RelavoiFirebaseService() {
  // Hook your own non-Relavoi push handling here if you have other senders.
  override fun onCustomMessage(payload: Map<String, String>) {
    // Optional: handle messages that are not from Relavoi
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

The SDK detects Relavoi-originated messages by inspecting `data["relavoi"] == "1"` and renders the notification according to your tenant's branding config.

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

Re-call `registerToken` whenever the user logs in to a new account or the FCM token rotates (`onNewToken` in your service, automatically forwarded by `RelavoiFirebaseService`).

## 3. Auto-deactivation of bad tokens

If FCM responds with `INVALID_REGISTRATION` or `NOT_REGISTERED`, the SDK marks the token inactive on the server and stops sending to it. You do not need to explicitly delete tokens — uninstalled apps are pruned automatically. If you want to be explicit (e.g. on logout):

```kotlin
viewModelScope.launch {
  Relavoi.push.deactivateToken()
}
```

## 4. Notification channels

On API 26+ the SDK creates a high-importance channel named `relavoi_calls` for incoming-call notifications. You can rename or restyle it via `RelavoiConfig.pushChannelName` at init time.

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
Use `POST /v1/webhooks/test` with a `call.incoming` payload to trigger a real push to your device while developing.
:::
