---
title: Real-time events
sidebar_label: Events
description: Subscribe to the WebSocket event stream with async/await, identify listeners by string keys, and rely on exponential reconnection.
---

# Real-time events

The iOS SDK exposes the same WebSocket event stream as Android. The Swift API uses `async/await` for connection management and string-keyed listener registration for handler removal.

## Connecting

```swift
import RelavoiSDK

@main
struct MyApp: App {
  init() {
    Relavoi.initialize(
      apiKey: Secrets.relavoiApiKey,
      apiSecret: Secrets.relavoiApiSecret,
      tenantId: Secrets.relavoiTenantId
    )
    Task {
      await Relavoi.shared.events.connect()
    }
  }
  var body: some Scene { WindowGroup { ContentView() } }
}
```

`connect()` is idempotent — calling it again on an active connection is a no-op. The WebSocket URL is derived from your `baseURL` (or set explicitly via `RelavoiConfig.webSocketURL`).

## Registering a handler

Each listener registers under a string key (the first, unlabeled argument). Re-registering with the same key replaces the previous handler — handy for SwiftUI views that re-render.

```swift
Relavoi.shared.events.addListener("home-view") { event in
  switch event {
  case let .sessionCreated(sessionId, proxyNumber, ts):
    print("Created \(sessionId) on \(proxyNumber) at \(ts)")
  case let .sessionActivated(sessionId, _):
    print("Activated \(sessionId)")
  case let .sessionExpired(sessionId, _):
    print("Expired \(sessionId)")
  case let .callIncoming(sessionId, callerNumber, _):
    print("Incoming on session \(sessionId) from \(callerNumber)")
  case let .callAnswered(sessionId, _):
    print("Answered \(sessionId)")
  case let .callEnded(sessionId, durationSeconds, _):
    print("Session \(sessionId) ended after \(durationSeconds)s")
  case let .smsReceived(sessionId, _):
    print("SMS in on \(sessionId)")
  case let .unknown(type, payload):
    print("Unhandled event \(type): \(payload)")
  }
}
```

Remove a listener when the view goes away (id is also unlabeled):

```swift
Relavoi.shared.events.removeListener("home-view")
```

## RelavoiEvent shape

`RelavoiEvent` is an enum with associated values — there are no separate payload structs. Every case carries a `ts: Date` timestamp:

```swift
public enum RelavoiEvent: Equatable {
  case sessionCreated(sessionId: String, proxyNumber: String, ts: Date)
  case sessionActivated(sessionId: String, ts: Date)
  case sessionExpired(sessionId: String, ts: Date)
  case callIncoming(sessionId: String, callerNumber: String, ts: Date)
  case callAnswered(sessionId: String, ts: Date)
  case callEnded(sessionId: String, durationSeconds: Int, ts: Date)
  case smsReceived(sessionId: String, ts: Date)
  case unknown(type: String, payload: JSONValue)
}
```

Unrecognized server event types decode into `.unknown(type:payload:)` rather than being dropped, so you can log or inspect them without a crash. `JSONValue` is the SDK's small `Codable` bridge for arbitrary JSON (`.string`, `.int`, `.double`, `.bool`, `.null`, `.array`, `.object`).

## Checking connection state

`isConnected` is an `async` property:

```swift
Task {
  let live = await Relavoi.shared.events.isConnected
  print(live ? "Live" : "Offline")
}
```

## Auto-reconnect

The stream reconnects automatically with exponential backoff after a drop. Call `connect()` again at any time to force a reconnect.

## Disconnecting

```swift
await Relavoi.shared.events.disconnect()
```

Call this on user logout to tear down the connection and stop reconnect attempts.

:::tip Foreground gating
If you only need events while the app is visible, observe `ScenePhase` and `connect()` / `disconnect()` on `.active` / `.background`. This avoids unnecessary battery drain.
:::
