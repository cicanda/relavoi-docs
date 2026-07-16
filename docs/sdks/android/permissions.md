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

Optional. Lets the SDK show its floating verification bubble (`FloatingBubbleService`) as a system overlay even when your app is not the active screen — useful if the user has the native dialer open during the call.

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

If overlay permission is denied, the floating bubble cannot be shown — render your own in-app banner inside your Activity instead (see [Call verification](./call-verification)).

## Checking permission status

The SDK exposes a helper for the phone-state grant; check the other two with the standard Android APIs:

```kotlin
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.provider.Settings

val hasPhoneState = Relavoi.verification.hasPhoneStatePermission(this)

val hasNotifications = ContextCompat.checkSelfPermission(
  this, Manifest.permission.POST_NOTIFICATIONS
) == PackageManager.PERMISSION_GRANTED

val hasOverlay = Settings.canDrawOverlays(this)
```

Useful for a settings screen that shows the user which features are currently degraded.

:::warning Do not ask all at once
A wall of permission prompts at launch tanks grant rates. Ask each permission contextually — when the feature it unlocks is about to be used.
:::
