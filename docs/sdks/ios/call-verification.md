---
title: Call verification banner
sidebar_label: Call verification
description: Use CXCallObserver to detect active calls without permission prompts, then show a verified or warning banner — Revolut-style.
---

# Call verification banner

iOS gives us a clean win here: `CXCallObserver` reports active calls without requiring any permission prompt. Verification is therefore frictionless on iOS — the user never sees a permission dialog.

## How it works

1. The SDK creates a `CXCallObserver` at init time
2. When an incoming or connected call appears, the SDK flags it
3. When your app comes to the foreground, call `Relavoi.shared.verification.verify(userPhone:)`
4. The SDK hashes the phone with the tenant salt and hits `GET /v1/sessions/verify`
5. You receive a `VerificationResult` and render the appropriate banner

## Basic usage

```swift
import SwiftUI
import Relavoi

struct HomeView: View {
  @State private var banner: VerificationResult?

  var body: some View {
    VStack {
      if let banner { BannerView(result: banner) }
      Text("Home")
    }
    .task {
      if Relavoi.shared.verification.isCallActive {
        banner = try? await Relavoi.shared.verification.verify(userPhone: currentUser.phone)
      }
    }
  }
}
```

## Observe call-state transitions

For long-lived screens, subscribe to the observer:

```swift
let token = Relavoi.shared.verification.observeCallState { isActive in
  Task { @MainActor in
    if isActive {
      banner = try? await Relavoi.shared.verification.verify(userPhone: currentUser.phone)
    } else {
      banner = nil
    }
  }
}

// Detach later
Relavoi.shared.verification.removeObserver(token)
```

## Banner UI

A SwiftUI banner sketch:

```swift
struct BannerView: View {
  let result: VerificationResult

  var body: some View {
    switch result {
    case .verified(let session, let context):
      Label(context ?? "Verified call from \(session.tenantBrand)", systemImage: "checkmark.shield.fill")
        .padding()
        .background(Color.green.opacity(0.2))
        .foregroundStyle(.green)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    case .unverified(let brand):
      Label("Warning: this call is not from \(brand)", systemImage: "exclamationmark.triangle.fill")
        .padding()
        .background(Color.red.opacity(0.2))
        .foregroundStyle(.red)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
  }
}
```

## VerificationResult enum

```swift
public enum VerificationResult {
  case verified(session: VerifiedSession, context: String?)
  case unverified(tenantBrand: String)
}

public struct VerifiedSession {
  public let id: String
  public let proxyNumber: String
  public let tenantBrand: String
  public let metadata: [String: String]
}
```

## Why no permission?

`CXCallObserver` is part of CallKit and Apple intentionally exposes it without a permission prompt — Apple considers passive call-state observation by an app whose user is in an active call to be safe. This is why iOS gets the native, Revolut-style UX: no dialogs, just clean detection.

:::tip Pair with Live Activities
Combine verification with [Live Activities](./live-activities) to keep the verified banner pinned to the Lock Screen and Dynamic Island for the duration of the call. End users find it dramatically more reassuring.
:::
