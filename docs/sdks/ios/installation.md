---
title: iOS SDK installation
sidebar_label: Installation
description: Add the Relavoi iOS SDK via Swift Package Manager. iOS 15+, Swift 5.9+, zero external dependencies.
---

# iOS SDK installation

The Relavoi iOS SDK is distributed as a Swift package with no external dependencies. It uses URLSession, CryptoKit, and CallKit — all first-party Apple frameworks.

## Requirements

- **Platforms**: iOS 15.0+
- **Swift**: 5.9+
- **Xcode**: 15.0+
- **Live Activities** (optional): iOS 16.1+ (see [Live Activities](./live-activities))

## Add via Swift Package Manager

In Xcode: **File -> Add Package Dependencies**, then paste:

```text
https://github.com/relavoi/relavoi-ios-sdk
```

Select the latest version (use **Up to Next Major** from `0.1.0`).

Or, if you maintain a `Package.swift`:

```swift
let package = Package(
  name: "MyApp",
  platforms: [.iOS(.v15)],
  dependencies: [
    .package(url: "https://github.com/relavoi/relavoi-ios-sdk", from: "0.1.0"),
  ],
  targets: [
    .target(
      name: "MyApp",
      dependencies: [
        .product(name: "RelavoiSDK", package: "relavoi-ios-sdk"),
      ]
    ),
  ]
)
```

## Import

```swift
import RelavoiSDK
```

That is the entire surface — no transitive imports required. The SPM product and module are both named `RelavoiSDK`.

## Capabilities checklist

Open your target's **Signing & Capabilities** tab and confirm:

- **Push Notifications** capability is enabled (required if you use push)
- **Background Modes** -> "Remote notifications" (optional, for high-priority push)

The SDK persists its short-lived JWT in the device-local Keychain automatically. No **Keychain Sharing** capability is required (see [Initialization](./initialization)).

## Info.plist entries

The SDK uses no permission-protected APIs by default. CXCallObserver does **not** require a permission prompt. If you opt into Live Activities, add:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

## Verify

Confirm the module resolves by constructing a default config — this compiles only when the package is linked correctly:

```swift
import RelavoiSDK

let config = RelavoiConfig()
print("Relavoi base URL: \(config.baseURL)")
```

You should see `Relavoi base URL: https://api.relavoi.com/v1` in the Xcode console. Continue with [Initialization](./initialization).
