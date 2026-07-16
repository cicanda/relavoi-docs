---
title: iOS SDK initialization
sidebar_label: Initialization
description: Initialize the Relavoi Swift SDK in App.init or AppDelegate, configure Keychain sharing, and use Info.plist for non-secret config.
---

# iOS SDK initialization

The SDK is a process-wide singleton accessed via `Relavoi.shared`. Initialize it once during app launch.

## SwiftUI app

```swift
import SwiftUI
import RelavoiSDK

@main
struct MyApp: App {
  init() {
    Relavoi.initialize(
      apiKey: Secrets.relavoiApiKey,
      apiSecret: Secrets.relavoiApiSecret,
      tenantId: Secrets.relavoiTenantId
    )
  }

  var body: some Scene {
    WindowGroup { ContentView() }
  }
}
```

## UIKit AppDelegate

```swift
import UIKit
import RelavoiSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    Relavoi.initialize(
      apiKey: Secrets.relavoiApiKey,
      apiSecret: Secrets.relavoiApiSecret,
      tenantId: Secrets.relavoiTenantId,
      config: RelavoiConfig(enableLogging: true)
    )
    return true
  }
}
```

## Where to store secrets

Do not commit secrets to source. Two common patterns:

1. **Xcconfig file** committed-but-gitignored, exposed via `Info.plist` placeholders, surfaced through a generated `Secrets.swift` struct.
2. **CI-injected** via a script that writes `Secrets.swift` during the build phase.

Sample `Secrets.swift` (generated):

```swift
enum Secrets {
  static let relavoiApiKey    = "rk_live_YOUR_API_KEY_HERE"
  static let relavoiApiSecret = "rs_YOUR_API_SECRET_HERE"
  static let relavoiTenantId  = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## Keychain storage

The SDK persists the short-lived JWT in the iOS Keychain as a device-local generic-password item (service `com.relavoi.sdk.auth`, accessible after first unlock, this-device-only). The tenant ID is used as the account, so multiple tenants can coexist in one host app. This is fully automatic — no configuration and no **Keychain Sharing** capability are required.

## RelavoiConfig fields

`RelavoiConfig` exposes exactly four stored fields (all with defaults):

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `baseURL` | `URL` | `https://api.relavoi.com/v1` | REST base URL. Override for staging |
| `webSocketURL` | `URL?` | `nil` | Explicit WebSocket URL. When `nil`, it is derived from `baseURL` (scheme swapped to `ws`/`wss`, path set to `/ws`) |
| `enableLogging` | `Bool` | `false` | Verbose `os_log` output. Phone numbers always redacted |
| `offlineQueueMaxSize` | `Int` | `100` | Maximum offline-queue length; oldest entries drop when exceeded |

Example overriding the base URL for staging:

```swift
Relavoi.initialize(
  apiKey: Secrets.relavoiApiKey,
  apiSecret: Secrets.relavoiApiSecret,
  tenantId: Secrets.relavoiTenantId,
  config: RelavoiConfig(
    baseURL: URL(string: "https://staging.api.relavoi.com/v1")!,
    enableLogging: true
  )
)
```

:::warning Initialize first
Touching `Relavoi.shared.sessions` before `Relavoi.initialize(...)` traps with a precondition failure. Initialize in `App.init` or `application(_:didFinishLaunchingWithOptions:)`.
:::

Next: [Sessions](./sessions).
