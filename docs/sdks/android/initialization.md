---
title: Android SDK initialization
sidebar_label: Initialization
description: Initialize the Relavoi Kotlin SDK once in your Application class, configure logging, and inject secrets via BuildConfig.
---

# Android SDK initialization

The SDK is a process-wide singleton. Initialize it exactly once in `Application.onCreate()`.

## Basic initialization

```kotlin
import android.app.Application
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.RelavoiConfig

class MyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    Relavoi.initialize(
      context = this,
      apiKey = BuildConfig.RELAVOI_API_KEY,
      apiSecret = BuildConfig.RELAVOI_API_SECRET,
      tenantId = BuildConfig.RELAVOI_TENANT_ID,
      config = RelavoiConfig(
        enableLogging = BuildConfig.DEBUG,
        baseUrl = null  // null means use production https://api.relavoi.com
      )
    )
  }
}
```

Register the Application class in `AndroidManifest.xml`:

```xml
<application
  android:name=".MyApp"
  ...>
</application>
```

## Inject secrets via BuildConfig

Do not commit your API secret to source. Read it from `local.properties` and surface it through Gradle:

```kotlin
// app/build.gradle.kts
import java.util.Properties

val localProps = Properties().apply {
  rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}

android {
  defaultConfig {
    buildConfigField("String", "RELAVOI_API_KEY", "\"${localProps.getProperty("RELAVOI_API_KEY", "")}\"")
    buildConfigField("String", "RELAVOI_API_SECRET", "\"${localProps.getProperty("RELAVOI_API_SECRET", "")}\"")
    buildConfigField("String", "RELAVOI_TENANT_ID", "\"${localProps.getProperty("RELAVOI_TENANT_ID", "")}\"")
  }
  buildFeatures { buildConfig = true }
}
```

Then in `local.properties` (gitignored):

```properties
RELAVOI_API_KEY=sk_live_YOUR_API_KEY_HERE
RELAVOI_API_SECRET=f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5
RELAVOI_TENANT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

For production builds, source the same values from your CI secret manager.

## RelavoiConfig flags

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `enableLogging` | Boolean | `false` | Verbose Logcat output. Phone numbers always redacted |
| `baseUrl` | String? | `null` | Override the API host. Use for staging |
| `connectTimeoutMs` | Long | `10_000` | OkHttp connect timeout |
| `readTimeoutMs` | Long | `30_000` | OkHttp read timeout |
| `userAgent` | String? | `null` | Append to default `Relavoi-Android/0.1.0` |

## Token storage

The SDK persists the JWT in **Android Keystore-backed EncryptedSharedPreferences**. You do not need to manage tokens yourself; refresh is transparent.

:::warning Initialize before any other call
Calling `Relavoi.sessions.create(...)` before `Relavoi.initialize(...)` throws `IllegalStateException`. The SDK ships with a debug assertion if logging is enabled.
:::

Next: [Creating sessions](./sessions).
