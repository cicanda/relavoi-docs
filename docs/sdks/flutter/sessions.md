---
title: Sessions on Flutter
sidebar_label: Sessions
description: Create, fetch, list, and end masking sessions from the Flutter SDK with async/await, then open the dialer with initiateCall.
---

# Sessions on Flutter

All session APIs are `Future`-returning and are reached through `Relavoi.instance.sessions`. Errors throw a subclass of `RelavoiException` — typically `SessionException`, `ValidationException`, or `TierLimitException`.

## Create a session

`create` takes named parameters. Only `agentPhone` and `customerPhone` are required; everything else has a default.

:::info Supported numbers
Relavoi connects **Nigerian mobile numbers** today: `+234` followed by 10
digits starting 7, 8 or 9. You can pass `+2348012345678`, `2348012345678`,
`08012345678` or `8012345678` and the backend normalises it, so there is no
need to reformat what a user typed.

Anything else comes back as `422` with type `number-not-supported`, and the
message never contains the number that was sent. Both people in a session must
have numbers from the same country.
:::


```dart
import 'package:relavoi_flutter/relavoi_flutter.dart';

Future<void> startMaskingSession(
  String agent,
  String customer,
  String orderId,
) async {
  try {
    final session = await Relavoi.instance.sessions.create(
      agentPhone: agent,
      customerPhone: customer,
      metadata: {'orderId': orderId},
      gracePeriodMinutes: 15,
      directionMode: DirectionMode.bidirectional,
      recordingEnabled: false,
    );
    debugPrint('Proxy ready: ${session.proxyNumber}');
  } on ValidationException catch (e) {
    debugPrint('Invalid input: $e');
  } on TierLimitException catch (e) {
    debugPrint('Concurrent session limit reached: $e');
  } on RelavoiException catch (e) {
    debugPrint('Failed to create session: $e');
  }
}
```

The full signature is:

```dart
Future<Session> create({
  required String agentPhone,
  required String customerPhone,
  Map<String, dynamic>? metadata,
  int gracePeriodMinutes = 15,
  DirectionMode directionMode = DirectionMode.bidirectional,
  bool recordingEnabled = false,
});
```

Because the two phone numbers are the only required arguments, this is equally valid:

```dart
final session = await Relavoi.instance.sessions.create(
  agentPhone: agent,
  customerPhone: customer,
);
```

:::note maxDurationMinutes is server-controlled
The hard call-duration cap is enforced by the backend and surfaced on the returned `Session` as `maxDurationMinutes`. It is not a creation parameter. Likewise, if recording is enabled the server requires a consent prompt — that combination is validated server-side.
:::

## Fetch one

```dart
final session = await Relavoi.instance.sessions.get('sess_a1b2c3d4');
```

## List with pagination

`list` accepts an optional `state` filter and returns a `SessionListResponse`. Advance the cursor with `after`, which is `null` on the last page.

```dart
String? cursor;
final collected = <Session>[];

do {
  final page = await Relavoi.instance.sessions.list(
    state: SessionState.active,
    limit: 100,
    after: cursor,
  );
  collected.addAll(page.data);
  cursor = page.after;
} while (cursor != null);
```

`SessionListResponse` is shaped:

```dart
class SessionListResponse {
  final List<Session> data;
  final int count;
  final String? after;
}
```

Omit `state` (or pass `null`) to list sessions in every state.

## End a session

```dart
await Relavoi.instance.sessions.end('sess_a1b2c3d4');
```

The session transitions to `SessionState.gracePeriod`. Watch the [events stream](./events) for `session.expired` to know when it terminates.

## Initiate a call from the agent's device

`initiateCall` opens the OS dialer with the proxy number pre-filled, via `url_launcher` and a `tel:` URI. It does not place the call automatically — the agent taps the dial button, meeting both platforms' policies for dialer integrations.

Pass the proxy number (not the session id):

```dart
Future<void> callCustomer(Session session) async {
  await Relavoi.instance.sessions.initiateCall(session.proxyNumber);
}
```

## The Session model

`Session` carries these fields:

```dart
class Session {
  final String id;
  final String tenantId;
  final String proxyNumber;
  final SessionState state;          // pending / active / gracePeriod / expired / failed
  final DirectionMode directionMode; // bidirectional / aToB / bToA
  final Map<String, dynamic>? metadata;
  final int gracePeriodMinutes;
  final int maxDurationMinutes;
  final bool recordingEnabled;
  final String consentPrompt;
  final DateTime expiresAt;
  final DateTime createdAt;
  final DateTime? activatedAt;
  final DateTime? endedAt;
  final DateTime? expiredAt;
  final int callCount;
  final DateTime? lastCallAt;
}
```

`SessionState` is one of `pending`, `active`, `gracePeriod`, `expired`, or `failed`. `DirectionMode` is one of `bidirectional`, `aToB`, or `bToA`.

## Full lifecycle example

```dart
final session = await Relavoi.instance.sessions.create(
  agentPhone: '+2348012345678',
  customerPhone: '+2348087654321',
  metadata: {'orderId': 'ORD-9281'},
);

// UI shows session.proxyNumber to the agent
proxyNumber.value = session.proxyNumber;

// Agent taps "Call customer"
await Relavoi.instance.sessions.initiateCall(session.proxyNumber);

// ... calls happen ...

// On delivery
await Relavoi.instance.sessions.end(session.id);
```

Continue with [Verification](./verification) to surface the branded banner when an incoming call lands.
