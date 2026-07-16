---
title: Android SDK installation
sidebar_label: Installation
description: Add the Relavoi Android SDK from Maven Central, set the minimum SDK, and declare the required Android permissions.
---

# Android SDK installation

The Relavoi Android SDK ships as a single Kotlin artifact from Maven Central.

## Requirements

- **Minimum SDK**: 24 (Android 7.0 Nougat)
- **Compile SDK**: 34 or newer
- **Kotlin**: 1.9+
- **Gradle**: 8.0+
- **Java**: 17 (toolchain)

## Gradle setup

In your project-level `settings.gradle.kts`, confirm Maven Central is in your repositories:

```kotlin
dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}
```

Add the dependency in your app module's `build.gradle.kts`:

```kotlin
dependencies {
  implementation("com.relavoi:sdk:0.1.0")
}

android {
  compileSdk = 34
  defaultConfig {
    minSdk = 24
    targetSdk = 34
  }
}
```

Sync Gradle. The SDK pulls in `kotlinx-coroutines-android`, `okhttp` 4.x, and `kotlinx-serialization-json` transitively.

## Manifest permissions

The SDK declares these permissions automatically via manifest merger:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

If you use push notifications, add `POST_NOTIFICATIONS` to your own app's manifest — the SDK does not declare it for you:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

:::warning Runtime permission still required
Declaring `READ_PHONE_STATE` in the manifest is necessary but not sufficient. On API 23+ your host app must request it at runtime — see [Permissions](./permissions). Same for `POST_NOTIFICATIONS` on API 33+ and `SYSTEM_ALERT_WINDOW` (for the floating verification bubble).
:::

## ProGuard / R8

The SDK ships with consumer ProGuard rules; no extra configuration is needed for typical builds. If you use aggressive shrinking and see `NoSuchMethodError` at runtime, add:

```proguard
-keep class com.relavoi.sdk.** { *; }
-keepclassmembers class com.relavoi.sdk.** { *; }
```

## Verify the install

In a quick smoke `Activity`:

```kotlin
import com.relavoi.sdk.Relavoi

class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Before initialize() this is false; it flips to true once you call
    // Relavoi.initialize(...) in your Application class.
    Log.d("Relavoi", "Relavoi initialized? ${Relavoi.isInitialized()}")
  }
}
```

If the class resolves and this logs without a `ClassNotFoundException`, the artifact is wired up. Continue with [Initialization](./initialization).
