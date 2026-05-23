---
title: Call recording and NDPR consent
sidebar_label: Call recording
description: Enable call recording with built-in or custom consent prompts, satisfy NDPR requirements, and understand retention defaults.
---

# Call recording and NDPR consent

Recording masked calls is supported, but the Nigeria Data Protection Regulation (NDPR) requires informed consent from both parties before audio is captured. Relavoi enforces this at the API layer so you cannot accidentally ship a non-compliant flow.

## NDPR primer

The NDPR (2019, with the NDPA 2023 building on top) treats voice recordings as personal data. The relevant obligations for masked calls:

1. **Notice before processing**. Both parties must be told the call is being recorded before audio capture begins.
2. **Purpose limitation**. The notice must state why (quality, safety, dispute resolution).
3. **Lawful basis**. Consent or legitimate interest; consent is the cleanest path for B2B intermediated calls.
4. **Retention minimization**. Audio retained no longer than needed.

Relavoi's built-in consent prompt + 90-day default retention covers items 1, 2, and 4. Item 3 (lawful basis) is captured in your tenant agreement.

## Three consent modes

Set `recordingConsentMode` on the tenant (or `consentPrompt` per session) to one of:

| Mode | What plays | When to use |
|------|-----------|-------------|
| `DEFAULT` | Built-in TTS: "This call may be recorded for quality and safety purposes." | You want zero ops overhead and a neutral message. |
| `CUSTOM` | Your own audio file (hosted at `recordingConsentAudioUrl`) | You need brand voice, multilingual greetings, or extra wording. |
| `NONE` | Nothing — and `recordingEnabled` MUST be `false` | You are not recording. The API rejects sessions that try to mix `NONE` with recording enabled. |

The default English text is exactly:

> "This call may be recorded for quality and safety purposes."

It plays at the start of the very first call leg of a session, before audio bridges. Subsequent calls within the same session do **not** replay the prompt — the consent is recorded once per session.

## Enabling recording on a session

```bash
curl -X POST https://api.relavoi.com/v1/sessions \
  -H "Authorization: Bearer $RELAVOI_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "agentPhone": "+2348012345678",
    "customerPhone": "+2348087654321",
    "directionMode": "BIDIRECTIONAL",
    "recordingEnabled": true,
    "consentPrompt": "DEFAULT"
  }'
```

If you submit `recordingEnabled: true` with `consentPrompt: "NONE"`, the API responds:

```json
{
  "type": "https://api.relavoi.com/errors/validation",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "consentPrompt cannot be NONE when recordingEnabled is true"
}
```

This invariant is non-negotiable.

## Storage and retention

- Audio is encrypted at rest with AES-256-GCM, tenant-scoped DEK, KMS-wrapped KEK.
- Default retention: **90 days** from `endedAt`. Configurable down to 30 days or up to 365 days per tenant agreement.
- After retention, audio files are hard-deleted; only the `call_records` row remains with `recordingUrl = null`.

## Accessing recordings

Recordings appear on the call record:

```bash
curl https://api.relavoi.com/v1/sessions/sess_a1b2c3d4/calls \
  -H "Authorization: Bearer $RELAVOI_JWT"
```

Look for `recordingUrl` on each call. URLs are signed and expire after 15 minutes; refresh by re-fetching the call.

:::warning Disabling recording mid-session
You cannot toggle `recordingEnabled` after a session is created. To change recording behavior, end the current session and create a new one.
:::
