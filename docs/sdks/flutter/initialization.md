---
title: Flutter SDK initialization
sidebar_label: Initialization
description: Initialize the Relavoi Flutter SDK once at app startup, configure RelavoiConfig, and access the singleton instance.
---

# Flutter SDK initialization

The SDK is a process-wide singleton. Initialize it exactly once, before `runApp`, and await the call — `initialize` is `static` and asynchronous.

## Basic initialization

```dart
import 'package:flutter/material.dart';
import 'package:relavoi_flutter/relavoi_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Relavoi.initialize(
    apiKey: const String.fromEnvironment('RELAVOI_API_KEY'),
    apiSecret: const String.fromEnvironment('RELAVOI_API_SECRET'),
    tenantId: const String.fromEnvironment('RELAVOI_TENANT_ID'),
  );

  runApp(const MyApp());
}
```

`apiKey`, `apiSecret`, and `tenantId` are required. `config` is optional; omit it to use production defaults.

:::tip Keep secrets out of source
Pass secrets via `--dart-define` (as shown above with `String.fromEnvironment`) or a `--dart-define-from-file` JSON, sourced from your CI secret manager. Do not commit your API secret.
:::

## With a custom config

```dart
await Relavoi.initialize(
  apiKey: apiKey,
  apiSecret: apiSecret,
  tenantId: tenantId,
  config: const RelavoiConfig(
    enableLogging: true,
    // baseUrl defaults to production (https://api.relavoi.com/v1).
    // Override it only for staging/testing.
  ),
);
```

## RelavoiConfig options

`RelavoiConfig` has a `const` constructor with named parameters, each with a default:

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `baseUrl` | `String` | `https://api.relavoi.com/v1` | REST API host. Override for staging/testing |
| `wsUrl` | `String` | `wss://api.relavoi.com/ws` | Event-stream WebSocket URL |
| `connectTimeout` | `Duration` | `30s` | HTTP connect timeout |
| `receiveTimeout` | `Duration` | `30s` | HTTP receive timeout |
| `enableLogging` | `bool` | `false` | Verbose console output. Phone numbers always redacted |
| `presenceHeartbeatInterval` | `Duration` | `60s` | How often the [presence](./presence) module reports reachability |
| `autoReconnectWebSocket` | `bool` | `true` | Reconnect the [event stream](./events) automatically on transport failure |
| `maxWebSocketReconnectAttempts` | `int` | `10` | Cap on consecutive reconnect attempts before giving up |

`apiKey`, `apiSecret`, and `tenantId` are also fields on `RelavoiConfig`, but you supply them through `initialize()` rather than in the config object.

Example overriding the hosts for staging:

```dart
await Relavoi.initialize(
  apiKey: apiKey,
  apiSecret: apiSecret,
  tenantId: tenantId,
  config: const RelavoiConfig(
    baseUrl: 'https://staging.api.relavoi.com/v1',
    wsUrl: 'wss://staging.api.relavoi.com/ws',
    enableLogging: true,
  ),
);
```

## Accessing the SDK

After initialization, reach every subsystem through the singleton:

```dart
Relavoi.instance.sessions;
Relavoi.instance.verification;
Relavoi.instance.events;
Relavoi.instance.push;
Relavoi.instance.presence;
```

Check readiness with the static `Relavoi.isInitialized` flag:

```dart
if (Relavoi.isInitialized) {
  await Relavoi.instance.events.connect();
}
```

:::warning Initialize before any other call
`Relavoi.instance` asserts if accessed before `Relavoi.initialize(...)` completes. Await initialization in `main()` before touching `sessions`, `events`, `verification`, `push`, or `presence`.
:::

## Shutting down

To tear the SDK down — for example on sign-out in a multi-account host app — call the static `shutdown`:

```dart
Relavoi.shutdown();
```

This releases the singleton; you must call `Relavoi.initialize(...)` again before further use.

## Error handling

Every SDK call throws a subclass of `RelavoiException` on failure. Catch the base type, or match specific subclasses for granular handling:

```dart
try {
  await Relavoi.initialize(
    apiKey: apiKey,
    apiSecret: apiSecret,
    tenantId: tenantId,
  );
} on AuthenticationException catch (e) {
  debugPrint('Bad credentials: $e');
} on NetworkException catch (e) {
  debugPrint('Could not reach Relavoi: $e');
} on RelavoiException catch (e) {
  debugPrint('Init failed: $e');
}
```

The subclasses are `AuthenticationException`, `SessionException`, `NetworkException`, `ValidationException`, and `TierLimitException`.

Next: [Sessions](./sessions).
