---
title: Sessions on iOS
sidebar_label: Sessions
description: Create, fetch, list, and end masking sessions from the Swift SDK using async/await and typed RelavoiError handling.
---

# Sessions on iOS

All session APIs are `async throws` and return Swift structs. Errors throw `RelavoiError`, an enum covering initialization, auth, transport, validation, rate-limit, and API-status cases.

## Create a session

`create` has sensible defaults, so you only need to pass the two phone numbers. `metadata` is `[String: String]?`.

```swift
import RelavoiSDK

func startMaskingSession(agent: String, customer: String, orderId: String) async {
  do {
    let session = try await Relavoi.shared.sessions.create(
      agentPhone: agent,
      customerPhone: customer,
      metadata: ["orderId": orderId],
      gracePeriodMinutes: 15,
      directionMode: .bidirectional,
      recordingEnabled: false,
      consentPrompt: .none
    )
    print("Proxy ready: \(session.proxyNumber)")
  } catch let error as RelavoiError {
    handle(error)
  } catch {
    print("Unexpected: \(error)")
  }
}
```

The full parameter list is `create(agentPhone:customerPhone:metadata:gracePeriodMinutes:directionMode:recordingEnabled:consentPrompt:)`. Every parameter except the two phone numbers has a default (`metadata: nil`, `gracePeriodMinutes: 15`, `directionMode: .bidirectional`, `recordingEnabled: false`, `consentPrompt: .none`), so this is equally valid:

```swift
let session = try await Relavoi.shared.sessions.create(
  agentPhone: agent,
  customerPhone: customer
)
```

:::note maxDurationMinutes is server-controlled
The hard call-duration cap is enforced by the backend and surfaced on the returned `Session` as `maxDurationMinutes`. It is not a creation parameter.
:::

## Error handling

`RelavoiError` is an enum. Switch over its cases:

```swift
func handle(_ error: RelavoiError) {
  switch error {
  case .notInitialized:
    showAlert("SDK not initialized. Call Relavoi.initialize(...) first.")
  case .unauthorized(let detail):
    showAlert("Auth failed: \(detail)")
  case .validation(let detail):
    showAlert("Bad request: \(detail)")
  case .rateLimited(let retryAfterSeconds):
    let secs = retryAfterSeconds.map { Int($0) } ?? 30
    showAlert("Slow down — try again in \(secs) seconds")
  case .api(let statusCode, let body):
    showAlert("Server error \(statusCode): \(body ?? "")")
  case .network(let underlying):
    showAlert("Network error: \(underlying.localizedDescription)")
  case .unexpected(let message):
    showAlert("Unexpected: \(message)")
  }
}
```

The full case list:

```swift
public enum RelavoiError: Error {
  case notInitialized
  case unauthorized(detail: String)
  case network(Error)
  case api(statusCode: Int, body: String?)
  case validation(detail: String)
  case rateLimited(retryAfterSeconds: TimeInterval?)
  case unexpected(String)
}
```

`RelavoiError` conforms to `LocalizedError`, so `error.localizedDescription` gives a readable message for any case.

## Fetch one

`get` takes the id as its first, unlabeled argument:

```swift
let session = try await Relavoi.shared.sessions.get("sess_a1b2c3d4")
```

## List with pagination

`list` accepts a single optional `state` filter and returns a `SessionListResponse`. Advance the cursor with `pagination.after`, which is `nil` on the last page.

```swift
var cursor: String? = nil
var collected: [Session] = []

repeat {
  let page = try await Relavoi.shared.sessions.list(
    state: .active,
    limit: 100,
    after: cursor
  )
  collected.append(contentsOf: page.data)
  cursor = page.pagination.after
} while cursor != nil
```

`SessionListResponse` is shaped:

```swift
public struct SessionListResponse: Decodable {
  public let data: [Session]
  public let pagination: PaginationInfo
}

public struct PaginationInfo: Decodable {
  public let count: Int
  public let after: String?
}
```

Pass `state: nil` (or omit it) to list sessions in every state.

## End a session

`end` also takes the id unlabeled and returns the updated `Session` (typically in `.gracePeriod`):

```swift
let result = try await Relavoi.shared.sessions.end("sess_a1b2c3d4")
print(result.state)  // .gracePeriod
```

## Triggering a call from the agent device

iOS does not allow programmatic outbound calls (and the App Store rejects apps that try). The SDK gives you a helper that opens the system dialer with the proxy pre-filled. It is annotated `@MainActor`, so call it from a main-actor context:

```swift
import RelavoiSDK

@MainActor
func callCustomer(sessionId: String) async {
  do {
    try await Relavoi.shared.sessions.initiateCall(sessionId: sessionId)
  } catch {
    print("Could not open dialer: \(error)")
  }
}
```

This is a thin wrapper over `UIApplication.shared.open` with a `tel://` URL for the session's proxy number, plus a server-side notification to the customer that the call is incoming.

## The Session model

```swift
public struct Session: Codable, Identifiable, Equatable {
  public let id: String
  public let tenantId: String
  public let proxyNumber: String
  public let state: SessionState
  public let directionMode: DirectionMode
  public let metadata: [String: JSONValue]?
  public let gracePeriodMinutes: Int
  public let maxDurationMinutes: Int
  public let recordingEnabled: Bool
  public let consentPrompt: ConsentPrompt
  public let expiresAt: Date
  public let createdAt: Date
  public let activatedAt: Date?
  public let endedAt: Date?
  public let expiredAt: Date?
  public let callCount: Int?
  public let lastCallAt: Date?
}
```

Note that on the returned `Session`, `metadata` is `[String: JSONValue]?` — the backend allows nested/typed JSON values, even though the `create` call accepts only `[String: String]`. `SessionState` is one of `.pending`, `.active`, `.gracePeriod`, `.expired`, `.failed`.

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
_ = try await Relavoi.shared.sessions.end(session.id)
```

Continue with [Call verification](./call-verification).
