---
title: Runtime permissions
sidebar_label: Permissions
description: Request READ_PHONE_STATE, POST_NOTIFICATIONS, and SYSTEM_ALERT_WINDOW at runtime so the Android SDK can detect calls and surface banners.
---

# Runtime permissions

Manifest declarations get you compile-time visibility. Android still requires explicit runtime grants for the permissions Relavoi depends on. Here is what to ask for and when.

## READ_PHONE_STATE (API 23+)

Required for call-state detection (`Relavoi.verification.isCallActive()` and the call observer).

```kotlin
private val phonePermLauncher = registerForActivityResult(
  ActivityResultContracts.RequestPermission()
) { granted ->
  if (!granted) {
    // Fallback: verify() still works but won't auto-fire on call detection
  }
}

private fun ensurePhonePermission() {
  if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE)
      != PackageManager.PERMISSION_GRANTED) {
    phonePermLauncher.launch(Manifest.permission.READ_PHONE_STATE)
  }
}
```

Suggested moment to ask: the first time the user enters a screen that displays the call-verification banner — not at app launch.

## POST_NOTIFICATIONS (API 33+)

Required to display incoming-call push notifications.

```kotlin
private val notifPermLauncher = registerForActivityResult(
  ActivityResultContracts.RequestPermission()
) { /* user decision */ }

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
  notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
}
```

Suggested moment: immediately before calling `Relavoi.push.registerToken(...)`.

## SYSTEM_ALERT_WINDOW (overlay)

Optional. Lets the SDK paint the verification banner as a system overlay even when your app is not the active screen — useful if the user has the native dialer open during the call.

This permission cannot be requested through the standard runtime flow. Send the user to system settings:

```kotlin
import android.content.Intent
import android.net.Uri
import android.provider.Settings

private fun requestOverlayPermission() {
  if (!Settings.canDrawOverlays(this)) {
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:$packageName")
    )
    overlayPermLauncher.launch(intent)
  }
}

private val overlayPermLauncher = registerForActivityResult(
  ActivityResultContracts.StartActivityForResult()
) { /* result.resultCode does not reflect grant; re-check Settings.canDrawOverlays */ }
```

If overlay permission is denied, the SDK falls back to displaying the banner inside your own Activity hierarchy.

## Permission status snapshot

You can inspect the SDK's view of permissions at any time:

```kotlin
val status = Relavoi.permissions.snapshot()
// status.readPhoneState : Boolean
// status.postNotifications : Boolean
// status.systemAlertWindow : Boolean
```

Useful for a settings screen that shows the user which features are currently degraded.

:::warning Do not ask all at once
A wall of permission prompts at launch tanks grant rates. Ask each permission contextually — when the feature it unlocks is about to be used.
:::
