---
title: Presence reporting
sidebar_label: Presence
description: Report device reachability and app foreground state to Relavoi automatically by starting the presence module.
---

# Presence reporting

The presence module reports device reachability to Relavoi so the backend knows whether a user is online, backgrounded, or offline. That state feeds routing and push decisions, for example whether to lean on a push notification because the app is not in the foreground.

Presence is pure Dart. Once started, it wires itself to the app lifecycle and reports transitions automatically; you do not send heartbeats by hand.

## Starting presence

Call `start` with the signed-in user's phone. The local `0803...` form, `234...` and full `+234...` are all accepted. It begins reporting online, background, and offline transitions as the app moves through its lifecycle:

```dart
import 'package:relavoi_flutter/relavoi_flutter.dart';

void beginPresence(String userPhone) {
  Relavoi.instance.presence.start(userPhone);
}
```

`start` is synchronous and returns `void`. A good place to call it is right after sign-in, once you know the user's phone number.

## Automatic lifecycle reporting

After `start`, the module observes the app lifecycle and maps state to presence:

- App foregrounded → **online**
- App backgrounded → **background**
- App terminated / unreachable → **offline**

It also emits periodic heartbeats while online. The cadence is controlled by `presenceHeartbeatInterval` on [`RelavoiConfig`](./initialization), which defaults to 60 seconds. You do not manage the timer or the lifecycle observer yourself.

## Stopping presence

On sign-out, stop reporting:

```dart
Relavoi.instance.presence.stop();
```

This detaches the lifecycle observer and halts heartbeats. Pair it with the sign-out steps for the other modules (`push.deactivateToken()` and [`events.disconnect()`](./events)) so the device goes fully quiet.

## Typical wiring

```dart
Future<void> onSignedIn(String userPhone) async {
  Relavoi.instance.presence.start(userPhone);
  await Relavoi.instance.push.registerToken(userPhone);
  await Relavoi.instance.events.connect();
}

Future<void> onSignedOut() async {
  Relavoi.instance.presence.stop();
  await Relavoi.instance.push.deactivateToken();
  Relavoi.instance.events.disconnect();
}
```

:::tip Start once
Call `start` a single time per signed-in session. Calling it again with a different phone is how you switch users; there is no need to restart it on every foreground, as the module already tracks lifecycle transitions on its own.
:::
