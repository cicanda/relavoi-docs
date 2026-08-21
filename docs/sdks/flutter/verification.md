---
title: Call verification banner
sidebar_label: Verification
description: Show a green branded banner when the user receives a verified Relavoi call and a red warning when an unverified call mimics it.
---

# Call verification banner

Call verification is the Revolut-style anti-impersonation flow. When your app is in the foreground and a call is in progress, the SDK confirms with Relavoi that the call is a legitimate masked call for this user. You then display a banner accordingly.

Native call detection is the one place the Flutter SDK drops to a platform channel: `CXCallObserver` on iOS and `TelephonyManager` on Android. Everything else in this flow is pure Dart.

## How it works

1. On init, the SDK installs a native call-state observer over a platform channel
2. When the OS reports an active call, `isCallActive()` returns `true`
3. When the user opens your app while a call is active, call `verify(userPhone)`
4. The SDK hashes the phone with the tenant salt and hits `GET /v1/sessions/verify`
5. You receive a `VerificationResult` indicating verified or not, with optional context text

## Basic usage

Poll `isCallActive()` at a natural UI moment — typically when your screen resumes — and call `verify()` when a call is in progress. Phone numbers passed here must be E.164 (for example `+2348087654321`).

```dart
import 'package:flutter/material.dart';
import 'package:relavoi_flutter/relavoi_flutter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  VerificationResult? _result;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _maybeVerify();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _maybeVerify();
  }

  Future<void> _maybeVerify() async {
    if (await Relavoi.instance.verification.isCallActive()) {
      final result =
          await Relavoi.instance.verification.verify('+2348087654321');
      setState(() => _result = result);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = _result;
    if (r == null) return const SizedBox.shrink();
    return Container(
      color: r.verified ? Colors.green : Colors.red,
      padding: const EdgeInsets.all(12),
      child: Text(
        r.verified
            ? (r.context ?? 'Verified call')
            : 'Warning: this call is not verified',
        style: const TextStyle(color: Colors.white),
      ),
    );
  }
}
```

## VerificationResult

`verify` returns a plain data object:

```dart
class VerificationResult {
  final bool verified;
  final String? context;      // e.g. "Your Chowdeck rider is calling"
  final String? sessionId;
  final String? proxyNumber;
}
```

Read `verified` first. Use `context` for the banner label when present, falling back to a generic string otherwise.

:::note About `context`
The backend does not always populate the `context` string, so fall back to a generic `"Verified call"` for verified results. Do not hard-code a brand name from the result.
:::

## Checking call state directly

`isCallActive()` returns the current native call state as a `Future<bool>`:

```dart
if (await Relavoi.instance.verification.isCallActive()) {
  // A call is in progress — a good moment to verify.
}
```

## Permission notes

On Android, `READ_PHONE_STATE` is required for the SDK to detect call state (declared in the manifest — see [Installation](./installation) — and requested at runtime). The verification module exposes platform-aware permission helpers:

```dart
// Android returns the real grant; iOS always returns true (no permission needed).
final hasPhoneState =
    await Relavoi.instance.verification.hasPhoneStatePermission();

if (!hasPhoneState) {
  // Route the user through the runtime permission request on Android.
}
```

If `READ_PHONE_STATE` is denied on Android, `isCallActive()` can never become `true`, so verification never auto-fires.

### Overlay permission (Android)

For an optional floating banner that draws over other apps, the SDK provides overlay-permission helpers. Both are Android-only:

```dart
// Android returns the real grant; iOS always returns false.
final hasOverlay = await Relavoi.instance.verification.hasOverlayPermission();

if (!hasOverlay) {
  // Opens the system overlay settings screen on Android; no-op on iOS.
  await Relavoi.instance.verification.requestOverlayPermission();
}
```

:::tip UX guidance
Show the green banner only after `verify()` returns `verified: true` — never assume the call is legitimate just because one is in progress. The red banner has even more value than the green one: customers learn to trust the warning.
:::
