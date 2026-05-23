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

Sync Gradle. The SDK pulls in `kotlinx-coroutines-core`, `okhttp` 4.x, and `kotlinx-serialization-json` transitively.

## Manifest permissions

The SDK declares these permissions automatically via manifest merger:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

:::warning Runtime permission still required
Declaring `READ_PHONE_STATE` in the manifest is necessary but not sufficient. On API 23+ your host app must request it at runtime — see [Permissions](./permissions). Same for `POST_NOTIFICATIONS` on API 33+ and `SYSTEM_ALERT_WINDOW` (for branded incoming-call overlays).
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
    Log.d("Relavoi", "SDK version: ${Relavoi.VERSION}")
  }
}
```

You should see `SDK version: 0.1.0` in Logcat. Continue with [Initialization](./initialization).
