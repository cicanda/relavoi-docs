---
title: Real-time events
sidebar_label: Events
description: Subscribe to a WebSocket stream of session and call events with automatic reconnection from the Flutter SDK.
---

# Real-time events

The Flutter SDK exposes a persistent WebSocket to Relavoi's event stream through `Relavoi.instance.events`. All session and call events for your tenant land here within ~100 ms of the underlying telephony event. This is pure Dart, with no platform channel involved.

## Connecting

Register listeners, then call `connect()`:

```dart
import 'package:relavoi_flutter/relavoi_flutter.dart';

Future<void> startEventStream() async {
  final events = Relavoi.instance.events;

  events.on(EventType.callIncoming, (event) {
    debugPrint('Incoming call on session ${event.payload['sessionId']}');
  });

  events.on(EventType.callAnswered, (event) => _updateUi(event));
  events.on(EventType.callEnded, (event) => _triggerPostCall(event));

  await events.connect();
}
```

`connect()` returns a `Future`; `disconnect()` is synchronous. Both are safe to call more than once.

## Event types

`EventType` enumerates the streamed events. Each maps to a wire string:

| `EventType` | Wire string |
|-------------|-------------|
| `sessionCreated` | `session.created` |
| `sessionExpired` | `session.expired` |
| `callIncoming` | `call.incoming` |
| `callAnswered` | `call.answered` |
| `callEnded` | `call.ended` |
| `callFailed` | `call.failed` |
| `unknown` | (forward-compat fallback for unrecognized types) |

## RelavoiEvent

Every listener receives a `RelavoiEvent`:

```dart
class RelavoiEvent {
  final EventType type;              // parsed enum
  final String rawType;              // original wire string, e.g. "call.ended"
  final Map<String, dynamic> payload;
  final DateTime timestamp;
}
```

Read fields such as `sessionId` off the untyped `payload` map. `rawType` preserves the original string even when `type` resolves to `EventType.unknown`.

## Listening to a single type

`on` binds a callback to one `EventType`:

```dart
Relavoi.instance.events.on(EventType.sessionExpired, (event) {
  debugPrint('Session ${event.payload['sessionId']} expired');
});
```

## Listening to everything

`onAny` fires for every event regardless of type, which is handy for logging or a central dispatcher:

```dart
Relavoi.instance.events.onAny((event) {
  debugPrint('[${event.timestamp}] ${event.rawType}: ${event.payload}');
});
```

## Auto-reconnect

The SDK reconnects automatically with backoff on transport failures, governed by the `autoReconnectWebSocket` and `maxWebSocketReconnectAttempts` fields of [`RelavoiConfig`](./initialization). Check the current state synchronously with `isConnected`:

```dart
if (!Relavoi.instance.events.isConnected) {
  await Relavoi.instance.events.connect();
}
```

## Removing listeners

`removeAllListeners` clears every registered callback in one call:

```dart
Relavoi.instance.events.removeAllListeners();
```

## Disconnecting

```dart
Relavoi.instance.events.disconnect();
```

Call this on user logout. Combined with `removeAllListeners`, it fully detaches the stream.

:::tip Foreground-only listening
If your app does not need events while backgrounded, gate `connect()` / `disconnect()` on the app lifecycle (`WidgetsBindingObserver.didChangeAppLifecycleState`). This saves battery on long sessions.
:::
