---
title: Call verification banner
sidebar_label: Call verification
description: Show a green branded banner when the user receives a verified Relavoi call and a red warning when an unverified call mimics it.
---

# Call verification banner

Call verification is the Revolut-style anti-impersonation flow. When your app is in the foreground and an active call is in progress, the SDK queries Relavoi to confirm the call is a legitimate masked call for this user. You then display a banner accordingly.

## How it works

1. The SDK registers a `TelephonyManager` listener on init
2. When the OS reports an off-hook state, the SDK records a flag
3. When the user opens your app while the flag is active, call `Relavoi.verification.verify(userPhone)`
4. The SDK hashes the phone with the tenant salt and hits `GET /v1/sessions/verify`
5. You receive a `VerificationResult` indicating verified or not, with optional context text

## Basic usage

```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.model.VerificationResult

class HomeFragment : Fragment() {
  override fun onResume() {
    super.onResume()
    if (Relavoi.verification.isCallActive()) {
      viewLifecycleOwner.lifecycleScope.launch {
        val result = Relavoi.verification.verify(userPhone = "+2348087654321")
        showBanner(result)
      }
    }
  }

  private fun showBanner(result: VerificationResult) {
    when (result) {
      is VerificationResult.Verified -> {
        banner.setBackgroundColor(Color.GREEN)
        banner.text = result.context ?: "Verified call from ${result.tenantBrand}"
      }
      is VerificationResult.Unverified -> {
        banner.setBackgroundColor(Color.RED)
        banner.text = "Warning: this call is not from ${result.tenantBrand}"
      }
    }
  }
}
```

## Polling pattern (observer-driven)

For long-running screens, register an observer that fires whenever the call state flips:

```kotlin
val observer = Relavoi.verification.observeCallState { isActive ->
  if (isActive) {
    lifecycleScope.launch {
      val result = Relavoi.verification.verify(userPhone)
      showBanner(result)
    }
  } else {
    hideBanner()
  }
}

// Detach when the screen goes away
override fun onDestroyView() {
  observer.close()
  super.onDestroyView()
}
```

The observer wraps `TelephonyManager.listen(PhoneStateListener.LISTEN_CALL_STATE)` (or `TelephonyCallback` on API 31+) so you do not have to manage the listener lifecycle yourself.

## Permission notes

`READ_PHONE_STATE` is required for the SDK to detect call state. See [Permissions](./permissions) for the runtime-request snippet. If permission is denied:

- `Relavoi.verification.isCallActive()` returns `false`
- `Relavoi.verification.verify(...)` still works but `isCallActive()` cannot gate it
- A `Relavoi.verification.lastPermissionDenied` flag is exposed so you can prompt the user

:::tip UX guidance
Show the green banner only after `verify()` returns `Verified` — never assume the call is legitimate just because one is in progress. The red banner has even more value than the green one: customers learn to trust the warning.
:::
