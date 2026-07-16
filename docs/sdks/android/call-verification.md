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

`VerificationResult` is a plain data class — not a sealed hierarchy. Read the `verified` boolean and use the `bannerText` helper for a ready-to-display label.

```kotlin
import com.relavoi.sdk.Relavoi
import com.relavoi.sdk.session.VerificationResult

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
    if (result.verified) {
      banner.setBackgroundColor(Color.GREEN)
      // bannerText falls back to "Verified call" when no context string is present.
      banner.text = result.bannerText ?: "Verified call"
    } else {
      banner.setBackgroundColor(Color.RED)
      banner.text = "Warning: this call is not verified"
    }
  }
}
```

The fields available on `VerificationResult` are `verified: Boolean`, `context: String?`, `sessionId: String?`, `proxyNumber: String?`, and `expiresAt: String?`, plus the derived `bannerText: String?`.

:::note About `context`
The backend does not currently populate the `context` string, so `bannerText` returns the generic `"Verified call"` for verified results today. Do not hard-code a brand name from the result.
:::

## Re-checking on resume

`CallVerificationManager` does not expose a call-state observer. Poll `isCallActive()` at natural UI moments — typically `onResume()` — and call `verify()` when a call is in progress, as shown above. The SDK installs its own `TelephonyManager` call-state observer internally at `initialize()` time to keep `isCallActive()` current.

## Permission notes

`READ_PHONE_STATE` is required for the SDK to detect call state. See [Permissions](./permissions) for the runtime-request snippet. If permission is denied:

- `Relavoi.verification.isCallActive()` can never become `true`, so verification never auto-fires
- Use `Relavoi.verification.hasPhoneStatePermission(context)` to check the grant and prompt the user

```kotlin
if (!Relavoi.verification.hasPhoneStatePermission(requireContext())) {
  // Route the user through the runtime permission request.
}
```

:::tip UX guidance
Show the green banner only after `verify()` returns `Verified` — never assume the call is legitimate just because one is in progress. The red banner has even more value than the green one: customers learn to trust the warning.
:::
