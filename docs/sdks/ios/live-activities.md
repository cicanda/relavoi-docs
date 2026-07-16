---
title: Live Activities
sidebar_label: Live Activities
description: Pin a verified Relavoi call to the Lock Screen and Dynamic Island using LiveActivityManager and the prebuilt activity views.
---

# Live Activities

iOS 16.1+ Live Activities let you show the verified-call banner on the Lock Screen and Dynamic Island for the duration of the call. The SDK ships `LiveActivityManager` plus two view helpers you embed in your host app's Widget bundle.

## Requirements

- iOS 16.1 or newer for the Live Activity itself (`LiveActivityManager`, `RelavoiCallActivityView`)
- iOS 17.0 or newer for the Dynamic Island helpers (`RelavoiCallCompactView`)
- `NSSupportsLiveActivities = true` in Info.plist (see [Installation](./installation))
- A Widget Extension target in your project

`LiveActivityManager` and the attributes/views are annotated `@available(iOS 16.1, *)`, so gate your usage with an availability check on older deployment targets.

## 1. Start an activity when a verified call connects

`LiveActivityManager` is a standalone class you own — it is **not** exposed on `Relavoi.shared`. Create one instance and hold it for the lifetime of the call:

```swift
import RelavoiSDK

@available(iOS 16.1, *)
final class CallActivityController {
  private let liveActivity = LiveActivityManager()

  func attach() {
    Relavoi.shared.events.addListener("live-activity") { [weak self] event in
      guard let self else { return }
      switch event {
      case let .callAnswered(sessionId, _):
        Task {
          try? await self.liveActivity.start(
            sessionId: sessionId,
            proxyNumber: "+2348000000001",
            otherPartyLabel: "Chowdeck rider",
            verified: true
          )
        }
      case .callEnded:
        Task { await self.liveActivity.end() }
      default:
        break
      }
    }
  }
}
```

`start(sessionId:proxyNumber:otherPartyLabel:verified:)` requests the Activity. It silently no-ops if the user has disabled Live Activities.

## 2. Wire the activity views into your Widget bundle

Create a Widget Extension target in Xcode if you do not have one. The extension needs its own imports — `ActivityKit`, `SwiftUI`, and `WidgetKit` — plus `RelavoiSDK` for the prebuilt views:

```swift
import ActivityKit
import SwiftUI
import WidgetKit
import RelavoiSDK

@available(iOS 17.0, *)
@main
struct MyWidgets: WidgetBundle {
  var body: some Widget {
    ActivityConfiguration(for: RelavoiCallAttributes.self) { context in
      // Lock Screen / banner UI
      RelavoiCallActivityView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          RelavoiCallCompactView.expandedLeading(context)
        }
        DynamicIslandExpandedRegion(.trailing) {
          RelavoiCallCompactView.expandedTrailing(context)
        }
        DynamicIslandExpandedRegion(.center) {
          RelavoiCallCompactView.expandedCenter(context)
        }
      } compactLeading: {
        RelavoiCallCompactView.compactLeading(context)
      } compactTrailing: {
        RelavoiCallCompactView.compactTrailing(context)
      } minimal: {
        RelavoiCallCompactView.minimal(context)
      }
    }
  }
}
```

`RelavoiCallActivityView` (iOS 16.1+) renders the Lock Screen banner. `RelavoiCallCompactView` (iOS 17.0+) provides static helpers for each Dynamic Island region: `compactLeading`, `compactTrailing`, `minimal`, `expandedLeading`, `expandedTrailing`, and `expandedCenter`. Both show the proxy number, an elapsed timer, and a verified/unverified badge.

## 3. The attributes type

`RelavoiCallAttributes` conforms to `ActivityAttributes`. Its `ContentState` is a nested type named `State`:

```swift
@available(iOS 16.1, *)
public struct RelavoiCallAttributes: ActivityAttributes {
  public typealias ContentState = State

  public struct State: Codable, Hashable {
    public let elapsedSeconds: Int
    public let verified: Bool
    public let otherPartyLabel: String
  }

  public let sessionId: String
  public let proxyNumber: String
  public let startedAt: Date
}
```

You typically do not construct this yourself — `LiveActivityManager.start(...)` does. If you have custom needs you can build a `RelavoiCallAttributes(sessionId:proxyNumber:startedAt:)` and drive `Activity.request` directly.

## 4. Manual updates

To push a new state (e.g. an updated elapsed time), build a `RelavoiCallAttributes.State` and pass it to `update`:

```swift
await controller.liveActivity.update(
  state: RelavoiCallAttributes.State(
    elapsedSeconds: 42,
    verified: true,
    otherPartyLabel: "Chowdeck rider"
  )
)
```

## 5. End on call termination

Call `end` when the call finishes. `dismissPolicy` defaults to `.immediate`:

```swift
// Immediate dismissal (default)
await controller.liveActivity.end()

// Or let it linger briefly after the call ends
await controller.liveActivity.end(dismissPolicy: .after(.now + 5))
```

`dismissPolicy` is an `ActivityUIDismissalPolicy`; common values are `.immediate`, `.default`, and `.after(Date)`.

:::tip Brand fidelity
The activity views use `Color.accentColor` for branding, so set your app's accent color in the Widget Extension's asset catalog and it flows through automatically.
:::

That completes the iOS SDK. Pair this with [Call verification](./call-verification) for a Revolut-grade trust UX.
