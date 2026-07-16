---
title: Call verification banner
sidebar_label: Call verification
description: Use CXCallObserver to detect active calls without permission prompts, then show a verified or warning banner — Revolut-style.
---

# Call verification banner

iOS gives us a clean win here: `CXCallObserver` reports active calls without requiring any permission prompt. Verification is therefore frictionless on iOS — the user never sees a permission dialog.

## How it works

1. The SDK creates a `CXCallObserver` at init time
2. When a call becomes active, `Relavoi.shared.verification.isCallActive` flips to `true`
3. When your app comes to the foreground, call `Relavoi.shared.verification.verify(userPhone:)`
4. The SDK hashes the phone with the tenant salt server-side and hits `GET /v1/sessions/verify`
5. You receive a `VerificationResult` and render the appropriate banner

## Basic usage

```swift
import SwiftUI
import RelavoiSDK

struct HomeView: View {
  @State private var result: VerificationResult?
  let currentUserPhone: String

  var body: some View {
    VStack {
      if let result { BannerView(result: result) }
      Text("Home")
    }
    .task {
      if Relavoi.shared.verification.isCallActive {
        result = try? await Relavoi.shared.verification.verify(userPhone: currentUserPhone)
      }
    }
  }
}
```

`isCallActive` reflects the current `CXCallObserver` state synchronously, so you can gate the network call on it. There is no separate call-state callback API — check `isCallActive` when your view appears or when the app returns to the foreground.

## Banner UI

`VerificationResult` is a struct with a `verified` flag. Branch on it:

```swift
struct BannerView: View {
  let result: VerificationResult

  var body: some View {
    if result.verified {
      Label(result.context ?? "Verified call", systemImage: "checkmark.shield.fill")
        .padding()
        .background(Color.green.opacity(0.2))
        .foregroundStyle(.green)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    } else {
      Label("Warning: this call is not verified", systemImage: "exclamationmark.triangle.fill")
        .padding()
        .background(Color.red.opacity(0.2))
        .foregroundStyle(.red)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
  }
}
```

:::note context is not populated yet
`context` is reserved for a human-readable string like "Your Chowdeck rider is calling", but the backend does not populate it today — it is always `nil`. Always provide a fallback label as shown above.
:::

## VerificationResult struct

```swift
public struct VerificationResult: Decodable, Equatable {
  public let verified: Bool
  public let context: String?
  public let sessionId: String?
  public let expiresAt: Date?
}
```

When `verified == true`, `sessionId` identifies the matched session and `expiresAt` is when it stops being callable. When `verified == false`, these are typically `nil`.

## Why no permission?

`CXCallObserver` is part of CallKit and Apple intentionally exposes it without a permission prompt — Apple considers passive call-state observation by an app whose user is in an active call to be safe. This is why iOS gets the native, Revolut-style UX: no dialogs, just clean detection. (On Android the equivalent requires the `READ_PHONE_STATE` runtime permission.)

:::tip Pair with Live Activities
Combine verification with [Live Activities](./live-activities) to keep the verified banner pinned to the Lock Screen and Dynamic Island for the duration of the call. End users find it dramatically more reassuring.
:::
