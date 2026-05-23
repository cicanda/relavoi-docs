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
        .product(name: "Relavoi", package: "relavoi-ios-sdk"),
      ]
    ),
  ]
)
```

## Import

```swift
import Relavoi
```

That is the entire surface — no transitive imports required.

## Capabilities checklist

Open your target's **Signing & Capabilities** tab and confirm:

- **Push Notifications** capability is enabled (required if you use push)
- **Background Modes** -> "Remote notifications" and "Voice over IP" (optional, for high-priority push)
- **Keychain Sharing** is enabled — the SDK persists the JWT in Keychain (see [Initialization](./initialization))

## Info.plist entries

The SDK uses no permission-protected APIs by default. CXCallObserver does **not** require a permission prompt. If you opt into Live Activities, add:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

## Verify

```swift
import Relavoi
print("Relavoi SDK version: \(Relavoi.version)")
```

You should see `Relavoi SDK version: 0.1.0` in the Xcode console. Continue with [Initialization](./initialization).
