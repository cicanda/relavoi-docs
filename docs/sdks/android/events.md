---
title: Real-time events
sidebar_label: Events
description: Subscribe to a WebSocket stream of session and call events with automatic exponential reconnection.
---

# Real-time events

The Android SDK exposes a persistent WebSocket to Relavoi's event stream. All session and call events for your tenant land here within ~100 ms of the underlying telephony event.

## Connecting

Add at least one listener, then call `connect()`. `addListener` takes an `EventListener` (a `fun interface`, so a lambda works) and returns `Unit`.

```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.events.EventListener
import com.relavoi.sdk.events.RelavoiEvent

class App : Application() {
  private val listener = EventListener { event ->
    when (event) {
      is RelavoiEvent.SessionCreated   -> handleSessionCreated(event)
      is RelavoiEvent.SessionActivated -> handleSessionActivated(event)
      is RelavoiEvent.SessionExpired   -> handleSessionExpired(event)
      is RelavoiEvent.CallIncoming     -> handleCallIncoming(event)
      is RelavoiEvent.CallAnswered     -> handleCallAnswered(event)
      is RelavoiEvent.CallEnded        -> handleCallEnded(event)
      is RelavoiEvent.SmsReceived      -> handleSmsReceived(event)
      is RelavoiEvent.Unknown          -> handleUnknown(event)
    }
  }

  override fun onCreate() {
    super.onCreate()
    Relavoi.initialize(...)

    Relavoi.events.addListener(listener)
    Relavoi.events.connect()
  }
}
```

`connect()` and `disconnect()` are both idempotent. Listeners are invoked on the WebSocket dispatcher thread — keep them fast and post to the main thread for UI work. If no listeners remain, the stream auto-disconnects.

## Event payloads

`RelavoiEvent` is a sealed class. The only common member is the nullable `sessionId`; each subclass carries a `ts` (ISO-8601 string) plus its own typed fields. There is no `eventId`, `tenantId`, or `occurredAt`.

```kotlin
// Representative subclasses (see the SDK source for the full set):
data class CallIncoming(
  override val sessionId: String,
  val callerNumber: String,
  val ts: String,
) : RelavoiEvent()

data class CallEnded(
  override val sessionId: String,
  val durationSeconds: Int,
  val ts: String,
) : RelavoiEvent()
```

The full hierarchy is `SessionCreated`, `SessionActivated`, `SessionExpired`, `CallIncoming`, `CallAnswered`, `CallEnded`, `SmsReceived`, and `Unknown` (a forward-compat fallback carrying `type` and `rawPayload`).

## Auto-reconnect

The SDK reconnects automatically with exponential backoff on transport failures. There is no connection-state stream to observe; use `isConnected()` for a synchronous snapshot:

```kotlin
if (!Relavoi.events.isConnected()) {
  Relavoi.events.connect()
}
```

## Removing listeners

Keep a reference to the listener you added and pass it to `removeListener`:

```kotlin
val listener = EventListener { event -> /* ... */ }
Relavoi.events.addListener(listener)

// Later
Relavoi.events.removeListener(listener)
```

If your listener is tied to a UI component, remove it in `onDestroy()` to avoid leaks. When the last listener is removed, the stream auto-disconnects.

## Disconnecting

```kotlin
Relavoi.events.disconnect()
```

Call this on user logout. The SDK also tears down the connection automatically when the process is killed.

:::tip Foreground-only listening
If your app does not need events when backgrounded, gate `connect()` on `ProcessLifecycleOwner.get().lifecycle` state. This saves battery on long sessions.
:::
