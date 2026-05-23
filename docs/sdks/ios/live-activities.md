---
title: Live Activities
sidebar_label: Live Activities
description: Pin a verified Relavoi call to the Lock Screen and Dynamic Island using LiveActivityManager and the prebuilt activity views.
---

# Live Activities

iOS 16.1+ Live Activities let you show the verified-call banner on the Lock Screen and Dynamic Island for the duration of the call. The SDK ships with `LiveActivityManager` plus three view helpers you embed in your host app's Widget bundle.

## Requirements

- iOS 16.1 or newer (the SDK degrades gracefully on older versions — calls just won't pin)
- `NSSupportsLiveActivities = true` in Info.plist (see [Installation](./installation))
- A Widget Extension target in your project

## 1. Start an activity when a verified call connects

```swift
import Relavoi

Relavoi.shared.events.addListener(id: "live-activity") { event in
  switch event {
  case .callAnswered(let payload):
    Task {
      try? await Relavoi.shared.liveActivities.start(
        sessionId: payload.sessionId,
        callId: payload.callId,
        contactName: "Chowdeck rider",
        startedAt: Date()
      )
    }
  case .callEnded:
    Task {
      await Relavoi.shared.liveActivities.endAll(dismissalPolicy: .immediate)
    }
  default:
    break
  }
}
```

`LiveActivityManager` requests the Activity, updates it every 5 seconds with elapsed time, and dismisses it when the call ends.

## 2. Wire the activity views into your Widget bundle

Create a Widget Extension target in Xcode if you do not have one, and register the Relavoi activity:

```swift
import WidgetKit
import SwiftUI
import ActivityKit
import Relavoi

@main
struct MyWidgets: WidgetBundle {
  var body: some Widget {
    ActivityConfiguration(for: RelavoiCallAttributes.self) { ctx in
      // Lock Screen / banner UI
      RelavoiCallActivityView(context: ctx)
    } dynamicIsland: { ctx in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          RelavoiCallCompactView.expandedLeading(ctx)
        }
        DynamicIslandExpandedRegion(.trailing) {
          RelavoiCallCompactView.expandedTrailing(ctx)
        }
        DynamicIslandExpandedRegion(.bottom) {
          RelavoiCallCompactView.expandedBottom(ctx)
        }
      } compactLeading: {
        RelavoiCallCompactView.compactLeading(ctx)
      } compactTrailing: {
        RelavoiCallCompactView.compactTrailing(ctx)
      } minimal: {
        RelavoiCallCompactView.minimal(ctx)
      }
    }
  }
}
```

That is the entire integration. `RelavoiCallActivityView` and `RelavoiCallCompactView` are public SwiftUI views shipped with the SDK that render the verified-call branding (logo, contact name, elapsed timer, verified badge).

## 3. The attributes type

`RelavoiCallAttributes` is the `ActivityAttributes` conforming type the SDK uses. It contains:

```swift
public struct RelavoiCallAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public let elapsedSeconds: Int
    public let isOnHold: Bool
  }

  public let sessionId: String
  public let callId: String
  public let contactName: String
  public let tenantBrand: String
  public let startedAt: Date
}
```

You typically do not construct this yourself — `LiveActivityManager.start` does it for you. If you have custom needs (e.g. extra metadata in the activity), you can opt into the lower-level `Activity.request(attributes:contentState:)` API directly.

## 4. Manual updates

If you want to push extra updates (e.g. on hold/resume), call:

```swift
try await Relavoi.shared.liveActivities.update(
  sessionId: payload.sessionId,
  isOnHold: true
)
```

The SDK debounces updates to once per 5 seconds so you do not exceed Apple's ActivityKit rate limits.

## 5. End on call termination

The SDK auto-ends activities on `callEnded` and `callFailed` events. If you want to end manually:

```swift
await Relavoi.shared.liveActivities.end(
  sessionId: sessionId,
  dismissalPolicy: .after(.now + 5)  // disappear 5s after the call ends
)
```

Available policies: `.immediate`, `.default`, `.after(Date)`.

:::tip Brand fidelity
Live Activities are highly visible. Customise the colours and logo through `RelavoiConfig.liveActivityTheme` at init time — your brand colour will be picked up by the activity views automatically.
:::

That completes the iOS SDK. Pair this with [Call verification](./call-verification) for a Revolut-grade trust UX.
