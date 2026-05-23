---
title: Real-time events
sidebar_label: Events
description: Subscribe to the WebSocket event stream with async/await, identify listeners by string keys, and rely on exponential reconnection.
---

# Real-time events

The iOS SDK exposes the same WebSocket event stream as Android. The Swift API uses `async/await` for connection management and string-keyed listener registration for handler removal.

## Connecting

```swift
import Relavoi

@main
struct MyApp: App {
  init() {
    Relavoi.initialize(...)
    Task {
      await Relavoi.shared.events.connect()
    }
  }
  var body: some Scene { WindowGroup { ContentView() } }
}
```

`connect()` is idempotent. Calling it again on an active connection is a no-op.

## Registering a handler

Each listener registers under a string key. Re-registering with the same key replaces the previous handler — handy for SwiftUI views that re-render.

```swift
Relavoi.shared.events.addListener(id: "home-view") { event in
  switch event {
  case .sessionCreated(let payload):
    print("Created \(payload.sessionId)")
  case .sessionActivated(let payload):
    print("Activated \(payload.sessionId)")
  case .sessionExpired(let payload):
    print("Expired \(payload.sessionId)")
  case .callIncoming(let payload):
    print("Incoming on \(payload.proxyNumber)")
  case .callAnswered(let payload):
    print("Answered \(payload.callId)")
  case .callEnded(let payload):
    print("Ended after \(payload.durationSeconds)s")
  case .callFailed(let payload):
    print("Failed: \(payload.reason)")
  case .smsReceived(let payload):
    print("SMS in: \(payload.body)")
  case .smsSent(let payload):
    print("SMS out delivered: \(payload.status)")
  }
}
```

Remove a listener when the view goes away:

```swift
Relavoi.shared.events.removeListener(id: "home-view")
```

## RelavoiEvent shape

```swift
public enum RelavoiEvent {
  case sessionCreated(SessionEventPayload)
  case sessionActivated(SessionEventPayload)
  case sessionExpired(SessionEventPayload)
  case callIncoming(CallEventPayload)
  case callAnswered(CallEventPayload)
  case callEnded(CallEventPayload)
  case callFailed(CallFailedPayload)
  case smsReceived(SmsEventPayload)
  case smsSent(SmsEventPayload)
}
```

Each payload includes `eventId`, `sessionId`, `tenantId`, and `occurredAt`.

## Connection state stream

```swift
Task {
  for await state in Relavoi.shared.events.connectionStateStream {
    switch state {
    case .connecting:   print("Connecting...")
    case .connected:    print("Live")
    case .disconnected: print("Offline")
    case .failed(let e): print("Failed: \(e)")
    }
  }
}
```

## Auto-reconnect

Same exponential backoff schedule as Android: 1s, 2s, 4s, 8s, 16s, then 30s cap. After 60 minutes of continuous failure the stream surfaces `.failed`. Call `connect()` again to retry.

## Disconnecting

```swift
await Relavoi.shared.events.disconnect()
```

Call this on user logout. The SDK also tears down the connection automatically when the app is suspended for more than 5 minutes.

:::tip Foreground gating
If you only need events while the app is visible, observe `ScenePhase` and `connect()` / `disconnect()` on `.active` / `.background`. This avoids unnecessary battery drain.
:::
