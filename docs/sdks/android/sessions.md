---
title: Sessions on Android
sidebar_label: Sessions
description: Create, fetch, list, end, and dial sessions from the Android SDK using Kotlin coroutines.
---

# Sessions on Android

All session calls are `suspend` functions. Call them from a coroutine scope, typically `viewModelScope` or a lifecycle-aware scope.

## Create a session

`create` takes named parameters directly. There is no request wrapper class. Only `agentPhone` and `customerPhone` are required; everything else has a default.

:::info[Supported numbers]
Relavoi connects **Nigerian mobile numbers** today: `+234` followed by 10
digits starting 7, 8 or 9. You can pass `+2349000000001`, `2349000000001`,
`09000000001` or `9000000001` and the backend normalises it, so there is no
need to reformat what a user typed.

Anything else comes back as `422` with type `number-not-supported`, and the
message never contains the number that was sent. Both people in a session must
have numbers from the same country.
:::


```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.session.DirectionMode
import com.relavoi.sdk.session.ConsentPrompt
import kotlinx.coroutines.launch

class OrderViewModel : ViewModel() {
  fun startMaskingSession(agent: String, customer: String, orderId: String) {
    viewModelScope.launch {
      runCatching {
        Relavoi.sessions.create(
          agentPhone = agent,
          customerPhone = customer,
          metadata = mapOf("orderId" to orderId),
          gracePeriodMinutes = 15,
          directionMode = DirectionMode.BIDIRECTIONAL,
        )
      }.onSuccess { session ->
        Log.d("Relavoi", "Proxy ready: ${session.proxyNumber}")
      }.onFailure { e ->
        Log.e("Relavoi", "Failed to create session", e)
      }
    }
  }
}
```

The full signature is:

```kotlin reference
suspend fun create(
    agentPhone: String,
    customerPhone: String,
    metadata: Map<String, String>? = null,
    gracePeriodMinutes: Int = 15,
    directionMode: DirectionMode = DirectionMode.BIDIRECTIONAL,
): Session
```

`maxDurationMinutes` is set server-side and returned on the `Session`; it is not a create parameter.

:::note[recordingEnabled and consentPrompt]
Neither is a `create` parameter. Recording is not available, so they would
configure nothing: the API refuses `recordingEnabled: true` with a
`feature-not-available` problem. Passing either one does not compile.
Both fields are still **returned** on `Session`, because the API still returns
them. See [Not built yet](../../introduction#not-built-yet).
:::


## Fetch one

```kotlin fragment
val session = Relavoi.sessions.get("sess_a1b2c3d4")
```

All session calls throw a subclass of `RelavoiException` (a `sealed class : Exception`) on failure. Pattern-match on the subclasses for granular handling, as there is no `type` property:

```kotlin fragment
import com.relavoi.sdk.RelavoiException

try {
  Relavoi.sessions.get(sessionId)
} catch (e: RelavoiException) {
  when (e) {
    is RelavoiException.ApiError    -> Log.e("Relavoi", "HTTP ${e.statusCode}: ${e.body}")
    is RelavoiException.Unauthorized -> promptReauth()
    is RelavoiException.RateLimited  -> retryAfter(e.retryAfterSec)
    is RelavoiException.Network      -> showOffline()
    is RelavoiException.Validation   -> Log.e("Relavoi", e.message ?: "invalid input")
    is RelavoiException.NumberNotSupported -> showUnsupportedNumber(e.message)
    is RelavoiException.CrossBorderNotSupported -> showSameCountryOnly(e.message)
    // Every number this workspace may hold is already in a session with one of
    // these two people. Do not retry on a timer: it clears when a session ends
    // or when more numbers are approved.
    is RelavoiException.NumberQuotaReached -> showAtNumberLimit(e.message)
    is RelavoiException.NotInitialized -> error("call Relavoi.initialize first")
  }
}
```

## List

`list` takes a single optional `state` filter and returns a `SessionListResponse` with `data` and a `pagination` cursor.

```kotlin fragment
import com.relavoi.sdk.session.SessionState

val page = Relavoi.sessions.list(
  state = SessionState.ACTIVE,
  limit = 50,
)

page.data.forEach { Log.d("Relavoi", "Active session ${it.id}") }
page.pagination.after?.let { cursor ->
  val nextPage = Relavoi.sessions.list(state = SessionState.ACTIVE, after = cursor, limit = 50)
}
```

## End a session

```kotlin fragment
Relavoi.sessions.end("sess_a1b2c3d4")
```

The session transitions to `GRACE_PERIOD`. Watch the [events stream](./events) for `session.expired` to know when it terminates.

## Initiate a call from the agent's device

`initiateCall` opens the OS dialer with the proxy number pre-filled. It does not place the call automatically, because Android does not allow that without `CALL_PHONE` permission, which the SDK deliberately does not require.

`initiateCall` is a plain (non-`suspend`) function, so call it directly on the UI thread. The session must already be in the local cache (created or fetched) so its proxy number is known.

```kotlin
import android.content.Context

class CallButtonHandler(private val ctx: Context) {
  fun callCustomer(sessionId: String) {
    Relavoi.sessions.initiateCall(sessionId = sessionId, context = ctx)
  }
}
```

Under the hood this fires an `Intent.ACTION_DIAL` with `tel:+2349000000100`. The user taps the green button to dial, which meets Google's policy for dialer integrations.

## Full lifecycle example

```kotlin fragment
viewModelScope.launch {
  val session = Relavoi.sessions.create(
    agentPhone = "+2349000000001",
    customerPhone = "+2349000000002",
    metadata = mapOf("orderId" to "ORD-9281"),
  )

  // UI shows session.proxyNumber to the agent
  _proxyNumber.value = session.proxyNumber

  // ... agent makes one or more calls ...

  // Order delivered
  Relavoi.sessions.end(session.id)
}
```

Continue with [Call verification](./call-verification) to surface the branded banner when an incoming call lands.
