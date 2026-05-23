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
import Relavoi

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
import Relavoi

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
  static let relavoiApiKey    = "sk_live_YOUR_API_KEY_HERE"
  static let relavoiApiSecret = "f3a9c7b1d8e4f5a6b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5"
  static let relavoiTenantId  = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## Keychain Sharing

The SDK persists the short-lived JWT in the iOS Keychain. By default it writes to the access group `<TEAM_ID>.com.relavoi.sdk`. If you share authentication state across multiple apps in your team, override:

```swift
Relavoi.initialize(
  apiKey: ...,
  apiSecret: ...,
  tenantId: ...,
  config: RelavoiConfig(
    keychainAccessGroup: "TEAMID.com.example.shared"
  )
)
```

Enable **Keychain Sharing** capability on your target and add the matching access group.

## RelavoiConfig flags

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `enableLogging` | Bool | `false` | Verbose `os_log` output. Phone numbers always redacted |
| `baseURL` | URL? | `nil` | Override the API host. Use for staging |
| `requestTimeout` | TimeInterval | `30` | URLSession timeout |
| `keychainAccessGroup` | String? | `nil` | Custom Keychain access group |
| `userAgentSuffix` | String? | `nil` | Append to default `Relavoi-iOS/0.1.0` |

:::warning Initialize first
Touching `Relavoi.shared.sessions` before `Relavoi.initialize(...)` traps with a precondition failure. Initialize in `App.init` or `application(_:didFinishLaunchingWithOptions:)`.
:::

Next: [Sessions](./sessions).
