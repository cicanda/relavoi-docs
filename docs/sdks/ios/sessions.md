---
title: Sessions on iOS
sidebar_label: Sessions
description: Create, fetch, list, and end masking sessions from the Swift SDK using async/await and typed RelavoiError handling.
---

# Sessions on iOS

All session APIs are `async throws` and return Swift structs. Errors throw `RelavoiError` which mirrors the RFC 7807 fields from the API.

## Create a session

```swift
import Relavoi

func startMaskingSession(agent: String, customer: String, orderId: String) async {
  do {
    let session = try await Relavoi.shared.sessions.create(
      agentPhone: agent,
      customerPhone: customer,
      directionMode: .bidirectional,
      gracePeriodMinutes: 15,
      maxDurationMinutes: 120,
      recordingEnabled: false,
      metadata: ["orderId": orderId]
    )
    print("Proxy ready: \(session.proxyNumber)")
  } catch let error as RelavoiError {
    handle(error)
  } catch {
    print("Unexpected: \(error)")
  }
}
```

## Error handling

```swift
func handle(_ error: RelavoiError) {
  switch error.type {
  case "https://api.relavoi.com/errors/pool-exhausted":
    showAlert("All proxy numbers in use. Retry in a moment.")
  case "https://api.relavoi.com/errors/rate-limit":
    showAlert("Slow down — try again in \(error.retryAfter ?? 30) seconds")
  case "https://api.relavoi.com/errors/validation":
    showAlert("Bad request: \(error.detail ?? "")")
  default:
    showAlert("Unknown error")
  }
}
```

`RelavoiError` exposes:

```swift
public struct RelavoiError: Error {
  public let type: String          // RFC 7807 type URL
  public let title: String
  public let status: Int
  public let detail: String?
  public let instance: String?     // correlation id
  public let retryAfter: Int?      // populated on 429
}
```

## Fetch one

```swift
let session = try await Relavoi.shared.sessions.get(id: "sess_a1b2c3d4")
```

## List with pagination

```swift
var cursor: String? = nil
var collected: [Session] = []

repeat {
  let page = try await Relavoi.shared.sessions.list(
    state: [.active, .gracePeriod],
    limit: 100,
    after: cursor
  )
  collected.append(contentsOf: page.data)
  cursor = page.nextCursor
} while cursor != nil
```

## End a session

```swift
let result = try await Relavoi.shared.sessions.end(id: "sess_a1b2c3d4")
print(result.state)  // .gracePeriod
```

## Triggering a call from the agent device

iOS does not allow programmatic outbound calls (and the App Store rejects apps that try). The SDK gives you a helper that opens the system dialer with the proxy pre-filled:

```swift
import UIKit

func callCustomer(sessionId: String) async {
  do {
    try await Relavoi.shared.sessions.initiateCall(sessionId: sessionId)
  } catch {
    print("Could not open dialer: \(error)")
  }
}
```

This is a thin wrapper over `UIApplication.shared.open(URL(string: "tel://+2348000000001")!)` plus a server-side notification to the customer that the call is incoming.

## Full lifecycle

```swift
let session = try await Relavoi.shared.sessions.create(
  agentPhone: "+2348012345678",
  customerPhone: "+2348087654321",
  metadata: ["orderId": "ORD-9281"]
)

// UI shows session.proxyNumber to the agent
proxyNumberLabel.text = session.proxyNumber

// ... calls happen ...

// On delivery
_ = try await Relavoi.shared.sessions.end(id: session.id)
```

Continue with [Call verification](./call-verification).
