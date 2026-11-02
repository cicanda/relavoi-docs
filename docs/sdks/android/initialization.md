---
title: Android SDK initialization
sidebar_label: Initialization
description: Initialize the Relavoi Kotlin SDK once in your Application class, with a token provider so no secret ships inside the app.
---

# Android SDK initialization

The SDK is a process-wide singleton. Initialize it exactly once in `Application.onCreate()`.

## Basic initialization

:::warning Do not compile a live secret into the app
`BuildConfig` constants land in `classes.dex` as string literals, so anything
put there can be read out of the APK with `unzip` and `strings`. From 0.3.0 the
SDK takes a token provider instead: your backend holds the secret and mints a
short-lived token for one user. See [SDK tokens](../../guides/sdk-tokens).

The `apiKey` and `apiSecret` form still works and is deprecated. Use it with a
**sandbox** key while developing.
:::


```kotlin
import android.app.Application
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.RelavoiConfig

class MyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    Relavoi.initialize(
      context = this,
      tenantId = BuildConfig.RELAVOI_TENANT_ID,
      // Asks YOUR backend, which holds the API secret and calls
      // POST /v1/auth/sdk-token. Nothing secret is compiled into this app.
      tokenProvider = { myBackend.relavoiToken() },
      config = RelavoiConfig(
        enableLogging = BuildConfig.DEBUG
        // baseUrl defaults to production (https://api.relavoi.com/v1).
        // Override it only for staging/testing.
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
RELAVOI_API_KEY=rk_live_YOUR_API_KEY_HERE
RELAVOI_API_SECRET=rs_YOUR_API_SECRET_HERE
RELAVOI_TENANT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

For production builds, source the same values from your CI secret manager.

## RelavoiConfig flags

`RelavoiConfig` is a data class with exactly these fields:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `baseUrl` | String | `"https://api.relavoi.com/v1"` | REST API host. Override for staging/testing |
| `webSocketUrl` | String? | `null` | Override the event-stream WebSocket URL. When `null`, it is derived from `baseUrl` (scheme swapped to `ws`/`wss`, `/ws` appended) |
| `enableLogging` | Boolean | `false` | Verbose Logcat output. Phone numbers always redacted |
| `offlineQueueMaxSize` | Int | `100` | Max actions buffered in the offline queue before the oldest are dropped. **The queue is manual, see below** |

:::caution The offline queue is yours to drive
`OfflineQueue` is not wired into `ApiClient`. A request that fails because the
device has no network throws `RelavoiException.Network`, and nothing is queued
for you.

That is worth knowing before you design around it, because the name and this
option both suggest otherwise. To use it, catch `RelavoiException.Network`,
`enqueue` the action yourself, and `dequeue` when connectivity returns.
`offlineQueueMaxSize` caps what the queue holds once you are using it.

Automatic retry needs idempotency keys on the API first, so that a replayed
session creation cannot produce a second session and a second number. Until
that exists, a queue that replayed on its own would be a worse bug than the
failed request it was trying to paper over.
:::

## Token storage

The SDK persists the JWT in **Android Keystore-backed EncryptedSharedPreferences**. You do not need to manage tokens yourself; refresh is transparent.

:::warning Initialize before any other call
Accessing any subsystem (`Relavoi.sessions`, `Relavoi.events`, `Relavoi.verification`, `Relavoi.push`, `Relavoi.presence`) before `Relavoi.initialize(...)` throws `RelavoiException.NotInitialized`. Use `Relavoi.isInitialized()` to check first if you are unsure.
:::

Next: [Creating sessions](./sessions).
