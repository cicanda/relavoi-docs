---
title: Real-time events
sidebar_label: Events
description: Subscribe to a WebSocket stream of session and call events with automatic exponential reconnection.
---

# Real-time events

The Android SDK exposes a persistent WebSocket to Relavoi's event stream. All session and call events for your tenant land here within ~100 ms of the underlying telephony event.

## Connecting

```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.events.RelavoiEvent

class App : Application() {
  override fun onCreate() {
    super.onCreate()
    Relavoi.initialize(...)

    Relavoi.events.connect()
    Relavoi.events.addListener { event ->
      when (event) {
        is RelavoiEvent.SessionCreated   -> handleSessionCreated(event)
        is RelavoiEvent.SessionActivated -> handleSessionActivated(event)
        is RelavoiEvent.SessionExpired   -> handleSessionExpired(event)
        is RelavoiEvent.CallIncoming     -> handleCallIncoming(event)
        is RelavoiEvent.CallAnswered     -> handleCallAnswered(event)
        is RelavoiEvent.CallEnded        -> handleCallEnded(event)
        is RelavoiEvent.CallFailed       -> handleCallFailed(event)
        is RelavoiEvent.SmsReceived      -> handleSmsReceived(event)
        is RelavoiEvent.SmsSent          -> handleSmsSent(event)
      }
    }
  }
}
```

`connect()` is idempotent — calling it multiple times is harmless.

## Event payloads

Every `RelavoiEvent` carries `eventId`, `sessionId`, `tenantId`, and `occurredAt`. Specific subclasses add typed fields:

```kotlin
data class CallAnswered(
  override val eventId: String,
  override val sessionId: String,
  override val tenantId: String,
  override val occurredAt: Instant,
  val callId: String,
  val direction: CallDirection,
  val durationSeconds: Int? = null,
) : RelavoiEvent()
```

## Auto-reconnect

The SDK reconnects automatically with exponential backoff and jitter:

| Attempt | Delay before retry |
|---------|--------------------|
| 1 | 1 s |
| 2 | 2 s |
| 3 | 4 s |
| 4 | 8 s |
| 5 | 16 s |
| 6+ | 30 s (cap) |

It stops retrying after 60 minutes of continuous failure and surfaces a `ConnectionState.Failed`. You can re-trigger with `Relavoi.events.connect()`.

Observe connection state:

```kotlin
Relavoi.events.observeConnectionState().onEach { state ->
  when (state) {
    ConnectionState.Connecting   -> showSpinner()
    ConnectionState.Connected    -> hideSpinner()
    ConnectionState.Disconnected -> showOfflineBadge()
    is ConnectionState.Failed    -> showRetryButton()
  }
}.launchIn(applicationScope)
```

## Removing listeners

`addListener` returns a `ListenerRegistration`:

```kotlin
val reg = Relavoi.events.addListener { event -> ... }

// Later
reg.remove()
```

If your listener is tied to a UI component, remove it in `onDestroy()` to avoid leaks.

## Disconnecting

```kotlin
Relavoi.events.disconnect()
```

Call this on user logout. The SDK also tears down the connection automatically when the process is killed.

:::tip Foreground-only listening
If your app does not need events when backgrounded, gate `connect()` on `ProcessLifecycleOwner.get().lifecycle` state. This saves battery on long sessions.
:::
