---
title: Push notifications (APNs)
sidebar_label: Push notifications
description: Register your APNs device token with Relavoi and let the SDK handle hex conversion, tenant branding, and stale-token cleanup.
---

# Push notifications (APNs)

The iOS SDK delivers branded incoming-call notifications via APNs. You hand us the raw `Data` device token; we handle hex encoding, server registration, payload templating, and stale-token deactivation.

## 1. Register for remote notifications

Standard APNs registration at app launch (or after the user signs in):

```swift
import UIKit
import UserNotifications

class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
      guard granted else { return }
      Task { @MainActor in application.registerForRemoteNotifications() }
    }
    return true
  }
}
```

## 2. Forward the device token to Relavoi

When APNs returns the token in `didRegisterForRemoteNotificationsWithDeviceToken`, pass the raw `Data` directly to the SDK. **Do not** convert to hex yourself — the SDK does it (and ensures consistent uppercase / no-spaces formatting):

```swift
import Relavoi

func application(
  _ application: UIApplication,
  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
  Task {
    do {
      try await Relavoi.shared.push.registerToken(
        userPhone: currentUser.phone,
        deviceToken: deviceToken
      )
    } catch {
      print("Failed to register push token: \(error)")
    }
  }
}

func application(
  _ application: UIApplication,
  didFailToRegisterForRemoteNotificationsWithError error: Error
) {
  print("APNs registration failed: \(error)")
}
```

## 3. Handle stale tokens

If APNs reports the token as unregistered, the Relavoi backend deactivates it automatically and returns no more pushes for it. On the next successful `registerToken` call after a fresh APNs registration, the SDK reactivates.

You can explicitly deactivate (e.g. on logout):

```swift
try await Relavoi.shared.push.deactivateToken()
```

## 4. Notification payload shape

Relavoi pushes are standard APNs alerts with `aps.alert.title`, `aps.alert.body`, and a `relavoi` data dictionary containing `sessionId`, `callId`, and `eventType`. You can inspect them in `userNotificationCenter(_:didReceive:)` if you want to deep-link into your app:

```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    if let sessionId = response.notification.request.content.userInfo["sessionId"] as? String {
      router.openSession(sessionId)
    }
    completionHandler()
  }
}
```

## 5. Background modes

For higher-priority delivery during in-progress calls, enable **Background Modes -> Remote notifications** in your target capabilities. The Relavoi backend automatically uses `apns-priority: 10` and `apns-push-type: alert` for call notifications.

:::tip Test deliverability
Use `POST /v1/webhooks/test` with a `call.incoming` payload to send a real push to your device while developing. Combined with TestFlight, it provides an end-to-end check without scripting APNs.
:::
