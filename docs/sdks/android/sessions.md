---
title: Sessions on Android
sidebar_label: Sessions
description: Create, fetch, list, end, and dial sessions from the Android SDK using Kotlin coroutines.
---

# Sessions on Android

All session calls are `suspend` functions. Call them from a coroutine scope — typically `viewModelScope` or a lifecycle-aware scope.

## Create a session

```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.model.DirectionMode
import com.relavoi.sdk.model.SessionRequest
import kotlinx.coroutines.launch

class OrderViewModel : ViewModel() {
  fun startMaskingSession(agent: String, customer: String, orderId: String) {
    viewModelScope.launch {
      runCatching {
        Relavoi.sessions.create(
          SessionRequest(
            agentPhone = agent,
            customerPhone = customer,
            directionMode = DirectionMode.BIDIRECTIONAL,
            gracePeriodMinutes = 15,
            maxDurationMinutes = 120,
            recordingEnabled = false,
            metadata = mapOf("orderId" to orderId),
          )
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

## Fetch one

```kotlin
val session = Relavoi.sessions.get("sess_a1b2c3d4")
```

Throws `RelavoiException` (extends `IOException`) on transport or API errors. The exception carries the RFC 7807 fields:

```kotlin
try {
  Relavoi.sessions.get(sessionId)
} catch (e: RelavoiException) {
  if (e.type == "https://api.relavoi.com/errors/not-found") {
    // session gone, refresh UI
  }
}
```

## List

```kotlin
val page = Relavoi.sessions.list(
  state = listOf(SessionState.ACTIVE, SessionState.GRACE_PERIOD),
  limit = 50,
)

page.data.forEach { Log.d("Relavoi", "Active session ${it.id}") }
page.nextCursor?.let { cursor ->
  val nextPage = Relavoi.sessions.list(after = cursor, limit = 50)
}
```

## End a session

```kotlin
Relavoi.sessions.end("sess_a1b2c3d4")
```

The session transitions to `GRACE_PERIOD`. Watch the [events stream](./events) for `session.expired` to know when it terminates.

## Initiate a call from the agent's device

`initiateCall` opens the OS dialer with the proxy number pre-filled. It does not place the call automatically — Android does not allow that without `CALL_PHONE` permission, which the SDK deliberately does not require.

```kotlin
import android.content.Context

class CallButtonHandler(private val ctx: Context) {
  fun callCustomer(sessionId: String) {
    viewModelScope.launch {
      Relavoi.sessions.initiateCall(sessionId = sessionId, context = ctx)
    }
  }
}
```

Under the hood this fires an `Intent.ACTION_DIAL` with `tel:+2348000000001`. The user taps the green button to dial — meeting Google's policy for dialer integrations.

## Full lifecycle example

```kotlin
viewModelScope.launch {
  val session = Relavoi.sessions.create(
    SessionRequest(
      agentPhone = "+2348012345678",
      customerPhone = "+2348087654321",
      metadata = mapOf("orderId" to "ORD-9281"),
    )
  )

  // UI shows session.proxyNumber to the agent
  _proxyNumber.value = session.proxyNumber

  // ... agent makes one or more calls ...

  // Order delivered
  Relavoi.sessions.end(session.id)
}
```

Continue with [Call verification](./call-verification) to surface the branded banner when an incoming call lands.
