---
title: Sessions on Android
sidebar_label: Sessions
description: Create, fetch, list, end, and dial sessions from the Android SDK using Kotlin coroutines.
---

# Sessions on Android

All session calls are `suspend` functions. Call them from a coroutine scope — typically `viewModelScope` or a lifecycle-aware scope.

## Create a session

`create` takes named parameters directly — there is no request wrapper class. Only `agentPhone` and `customerPhone` are required; everything else has a default.

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
          recordingEnabled = false,
          consentPrompt = ConsentPrompt.NONE,
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

```kotlin
suspend fun create(
    agentPhone: String,
    customerPhone: String,
    metadata: Map<String, String>? = null,
    gracePeriodMinutes: Int = 15,
    directionMode: DirectionMode = DirectionMode.BIDIRECTIONAL,
    recordingEnabled: Boolean = false,
    consentPrompt: ConsentPrompt = ConsentPrompt.NONE,
): Session
```

If `recordingEnabled` is `true`, `consentPrompt` must not be `ConsentPrompt.NONE` — the server rejects that combination (NDPR consent requirement). `maxDurationMinutes` is set server-side and returned on the `Session`; it is not a create parameter.

## Fetch one

```kotlin
val session = Relavoi.sessions.get("sess_a1b2c3d4")
```

All session calls throw a subclass of `RelavoiException` (a `sealed class : Exception`) on failure. Pattern-match on the subclasses for granular handling — there is no `type` property:

```kotlin
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
    is RelavoiException.NotInitialized -> error("call Relavoi.initialize first")
  }
}
```

## List

`list` takes a single optional `state` filter and returns a `SessionListResponse` with `data` and a `pagination` cursor.

```kotlin
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

```kotlin
Relavoi.sessions.end("sess_a1b2c3d4")
```

The session transitions to `GRACE_PERIOD`. Watch the [events stream](./events) for `session.expired` to know when it terminates.

## Initiate a call from the agent's device

`initiateCall` opens the OS dialer with the proxy number pre-filled. It does not place the call automatically — Android does not allow that without `CALL_PHONE` permission, which the SDK deliberately does not require.

`initiateCall` is a plain (non-`suspend`) function, so call it directly on the UI thread. The session must already be in the local cache (created or fetched) so its proxy number is known.

```kotlin
import android.content.Context

class CallButtonHandler(private val ctx: Context) {
  fun callCustomer(sessionId: String) {
    Relavoi.sessions.initiateCall(sessionId = sessionId, context = ctx)
  }
}
```

Under the hood this fires an `Intent.ACTION_DIAL` with `tel:+2348000000001`. The user taps the green button to dial — meeting Google's policy for dialer integrations.

## Full lifecycle example

```kotlin
viewModelScope.launch {
  val session = Relavoi.sessions.create(
    agentPhone = "+2348012345678",
    customerPhone = "+2348087654321",
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
