---
title: Android SDK installation
sidebar_label: Installation
description: Add the Relavoi Android SDK from JitPack, set the minimum SDK, and declare the required Android permissions.
---

# Android SDK installation

The Relavoi Android SDK ships as a single Kotlin artifact, built from the public
repository by JitPack at a release tag.

## Requirements

- **Minimum SDK**: 24 (Android 7.0 Nougat)
- **Compile SDK**: 34 or newer
- **Kotlin**: 1.9+
- **Gradle**: 8.0+
- **Java**: 17 (toolchain)

## Gradle setup

Add JitPack to your project-level `settings.gradle.kts`, alongside the two
repositories an Android project already has:

```kotlin manifest
dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
    maven("https://jitpack.io")
  }
}
```

`google()` is required here, not optional. The SDK's POM imports
`firebase-bom` and depends on `firebase-messaging-ktx`, and Google's repository
is the only one that serves them, so without it the dependency fails to
resolve rather than failing later.

Add the dependency in your app module's `build.gradle.kts`:

```kotlin manifest
dependencies {
  implementation("com.github.cicanda:relavoi-android-sdk:v0.3.1")
}

android {
  compileSdk = 34
  defaultConfig {
    minSdk = 24
    targetSdk = 34
  }
}
```

The version is the git tag, `v` and all: that is how JitPack names what it
builds. Pin a tag rather than using `main-SNAPSHOT`, which moves under you.

Sync Gradle. The SDK brings in `kotlin-stdlib`, `kotlinx-coroutines-android`,
`kotlinx-serialization-json`, `okhttp` 4.12, `androidx.core:core-ktx`,
`androidx.lifecycle` (`process` and `runtime-ktx`),
`androidx.security:security-crypto` and `firebase-messaging-ktx` transitively.

:::note Why JitPack
Maven Central publishing is held until the first integration customer, so the
coordinates above are the supported way to install today. JitPack builds the
public repository on demand at a tag, which means the first build of a new tag
can take a few minutes; later resolutions are served from its cache. Moving to
Maven Central will change the coordinates and nothing else: the package names,
the imports and the API stay as they are.
:::

## Manifest permissions

The SDK declares these permissions automatically via manifest merger:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

If your own app posts notifications, add `POST_NOTIFICATIONS` to its manifest, since the SDK does not declare it for you:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

:::warning Runtime permission still required
Declaring `READ_PHONE_STATE` in the manifest is necessary but not sufficient. On API 23+ your host app must request it at runtime. See [Permissions](./permissions). Same for `POST_NOTIFICATIONS` on API 33+ and `SYSTEM_ALERT_WINDOW` (for the floating verification bubble).
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
