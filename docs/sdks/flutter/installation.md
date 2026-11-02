---
title: Flutter SDK installation
sidebar_label: Installation
description: Add the Relavoi Flutter plugin to your pubspec, set the platform minimums, and declare the Android permissions the SDK needs.
---

# Flutter SDK installation

The Relavoi Flutter SDK ships as `relavoi_flutter`, a hybrid plugin: it is pure Dart for HTTP, WebSocket, and device-token registration, and drops to platform channels only for native call detection (iOS/Android) and the Android overlay permission. One dependency covers both platforms.

## Requirements

- **Flutter**: 3.10 or newer
- **Dart**: 3.0 or newer
- **Android**: `minSdk` 24 (Android 7.0 Nougat)
- **iOS**: 15.0 or newer

## Add the dependency

The SDK is not on pub.dev yet, so depend on the repository at a release tag. In
your app's `pubspec.yaml`:

```yaml
dependencies:
  relavoi_flutter:
    git:
      url: https://github.com/cicanda/relavoi-flutter-sdk.git
      ref: v0.3.1
```

Then fetch it:

```bash
flutter pub get
```

Pin the tag, not `main`. A git dependency on a branch moves under you: `pub get`
resolves it to whatever the branch points at that day, so two machines can
build different code from the same `pubspec.yaml`, and `pubspec.lock` is the
only record of which. A tag is immutable.

:::note Why not pub.dev
Publishing is held until the first integration customer, so the version you
would depend on would be one nobody has used yet. The tag above is the same
code, resolved the same way, and the move to pub.dev will not change the
import or the API.
:::

`firebase_messaging` is pulled in transitively, so you do not add it yourself. It is only used to obtain a device token; nothing sends a notification to that token yet, so no Firebase project setup is needed to use the SDK. See [Not built yet](../../introduction#not-built-yet).

## Android configuration

Confirm your `android/app/build.gradle` sets the minimum SDK to 24 or higher:

```groovy
android {
  defaultConfig {
    minSdkVersion 24
  }
}
```

Declare the required permissions in `android/app/src/main/AndroidManifest.xml`, inside the `<manifest>` element:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

`INTERNET` covers all REST and WebSocket traffic. `READ_PHONE_STATE` backs native call detection for the [verification banner](./verification).

:::warning Runtime permission still required
Declaring `READ_PHONE_STATE` in the manifest is necessary but not sufficient. On API 23+ your app must also request it at runtime. The SDK exposes `Relavoi.instance.verification.hasPhoneStatePermission()` to check the grant. See [Verification](./verification).
:::

## iOS configuration

No extra permissions are needed. Native call detection on iOS uses `CXCallObserver`, which requires no user prompt and no `Info.plist` entry. Set the platform floor in `ios/Podfile`:

```ruby
platform :ios, '15.0'
```

Then install pods:

```bash
cd ios && pod install
```

## Verify the install

Drop a quick check into `main()` before `runApp`:

```dart
import 'package:relavoi_flutter/relavoi_flutter.dart';

void main() {
  // Before initialize() this is false; it flips to true once you call
  // Relavoi.initialize(...).
  debugPrint('Relavoi initialized? ${Relavoi.isInitialized}');
  runApp(const MyApp());
}
```

If the import resolves and this prints without an error, the plugin is wired up. Continue with [Initialization](./initialization).
