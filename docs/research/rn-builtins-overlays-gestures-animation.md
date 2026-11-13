# What React Native's built-ins cover for overlays, placement, gestures and animation

Research for [issue #6](https://github.com/floklein/rn-ui/issues/6), part of the React Native effort in [issue #2](https://github.com/floklein/rn-ui/issues/2). It feeds two later decisions: which dependencies the native adapter may take, and how native popups layer, dismiss and place themselves.

Researched on 2026-11-13.

## How to read this

Each claim carries a mark:

- **[V]** verified by reading the source or the official docs at the version named.
- **[I]** inferred from verified facts plus platform knowledge. Not observed on a device.
- **[R]** reported by a third party, not confirmed here.

Nothing in this note was run on a simulator or an emulator. The section [Open checks](#open-checks-for-a-prototype) lists what a prototype has to confirm.

## Versions these facts hold for

| Package | Version | Source |
| --- | --- | --- |
| `react-native` | 0.88.1 (0.88.0 released 2026-10-15), peer `react ^19.3.0` | [npm](https://www.npmjs.com/package/react-native), [package.json at v0.88.1](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/package.json) |
| Expo SDK | 58 (published 2026-10-15), React Native 0.88, React 19.3.0, Android 7+, `targetSdkVersion` 36, iOS 16.4+ | [SDK 58 changelog](https://expo.dev/changelog/sdk-58), [Expo version table](https://docs.expo.dev/versions/latest/) |
| `react-native-reanimated` | 4.7.1, with `react-native-worklets` 0.13.x | [npm](https://www.npmjs.com/package/react-native-reanimated) |
| `react-native-gesture-handler` | 3.5.0 on npm, `~3.3.0` pinned by Expo SDK 58 | [npm](https://www.npmjs.com/package/react-native-gesture-handler), [Expo page](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) |
| `react-native-screens` | 4.30.1 | [npm](https://www.npmjs.com/package/react-native-screens) |
| `react-native-safe-area-context` | 5.11.1 | [npm](https://www.npmjs.com/package/react-native-safe-area-context) |
| `@gorhom/portal` | 1.0.14 | [npm](https://www.npmjs.com/package/@gorhom/portal) |
| `react-native-teleport` | 1.2.4 | [npm](https://www.npmjs.com/package/react-native-teleport) |
| `@rn-primitives/*` | 1.5.x | [npm](https://www.npmjs.com/package/@rn-primitives/portal) |

React Native source links point at the `v0.88.1` tag. Library links point at the commit read on 2026-11-13.

Expo Go for SDK 58 was announced as coming "within a few weeks" of the SDK, and supports SDK 58 only ([SDK 58 changelog](https://expo.dev/changelog/sdk-58)) **[V]**. Whether it had shipped by 2026-11-13 was not checked.

## The answer in short

With `react` and `react-native` as the only peers, the adapter can build every popup, place it beside an anchor in the frame it appears, close it on Android back, and animate it in and out on the UI thread. Five things are out of reach:

1. Safe-area insets on Android, and insets as numbers on iOS.
2. A gesture that shares a touch with a native scroll view, which a sheet with scrolling content needs.
3. A drag that tracks the finger on the UI thread.
4. Layout properties animated on the UI thread, and any built-in layout animation on Android.
5. A popup above a native modal or sheet that the app presented, without using `Modal` itself.

`react-native-safe-area-context` fixes 1. `react-native-gesture-handler` fixes 2 and 3, and it does so with `Animated`, without Reanimated. Reanimated fixes 4. `Modal` fixes 5 for modal popups, and `FullWindowOverlay` from `react-native-screens` fixes it on iOS only. A portal library is not needed: the JavaScript ones are a few dozen lines the adapter can own.

## Popups

### Two ways to layer, and neither covers everything

**`Modal`.** On Android each `Modal` is a `ComponentDialog`, a separate window ([ReactModalHostView.kt#L278](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L278)) **[V]**. On iOS it is a view controller presented from the nearest view controller above the `Modal` in the view tree ([RCTModalHostViewComponentView.mm#L153-L159](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm#L153-L159)) **[V]**. So a `Modal` sits above everything in the app, including native navigation.

What `Modal` gives:

- `transparent`, which maps to `overFullScreen` on iOS and removes the dim on Android **[V]** ([Modal.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Modal/Modal.js), [ReactModalHostView.kt#L403-L411](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L403-L411)).
- `animationType` of `none`, `slide` or `fade` only **[V]**. On iOS these are the UIKit transition styles; on Android they are window themes, and changing the value recreates the dialog **[V]**. The old `animated` prop was removed in 0.88 ([SDK 58 changelog](https://expo.dev/changelog/sdk-58)) **[V]**.
- `onShow` on both platforms, `onDismiss` on iOS only **[V]** ([Modal.js#L315-L324](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Modal/Modal.js#L315-L324)).
- On iOS, `presentationStyle` of `pageSheet` or `formSheet` with `allowSwipeDismissal`: the system sheet, swipe to dismiss included, reported through `onRequestClose` **[V]** ([Modal docs, 0.88](https://reactnative.dev/docs/modal)). There are no detents, no custom physics, and nothing like it on Android.
- VoiceOver focus saved before presenting and restored after dismissal on iOS **[V]** ([RCTModalHostViewComponentView.mm#L236-L251](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm#L236-L251)).

What `Modal` can't do:

- **Be non-modal.** It always fills the window and takes every touch **[V]**: the Android dialog root returns `true` from `onTouchEvent`, and `Modal` sets `onStartShouldSetResponder` so no responder event leaves it ([Modal.js#L365-L368](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Modal/Modal.js#L365-L368)). No prop lets a press through to the page. The web presets that keep the page live (`tooltip`, `hoverCard`, a non-modal `popover`, and `combobox`, whose input must keep focus) can't sit in a `Modal`.
- **Custom enter and exit.** Anything beyond slide and fade is drawn inside a transparent `Modal` with `animationType="none"`, and `visible` stays `true` until the exit animation ends **[I]**.

### Nested modals and a modal over a modal

- **Nested in the React tree** (a `Modal` rendered inside another `Modal`'s content): on iOS the inner one presents from the outer one's view controller, and on Android it opens a second dialog over the first **[I]**, from the two presentation paths above. The source comments expect it: "There can be different ones, either nested or as siblings" ([Modal.js#L34-L37](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Modal/Modal.js#L34-L37)) **[V]**.
- **Siblings on iOS** (two `Modal`s under the same view controller, both visible): UIKit lets a view controller present one view controller at a time, so the second presentation is refused **[I]**. React Native sets `_isPresented = YES` before it calls `presentViewController` and has no failure path ([RCTModalHostViewComponentView.mm#L168-L186](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm#L168-L186)) **[V]**, so the second modal never shows and the state stays wrong. A project patching React Native for exactly this describes the same mechanism ([RabbyHub/rabby-mobile#2320](https://github.com/RabbyHub/rabby-mobile/pull/2320)) **[R]**.
- **A `Modal` at the app root while a native sheet is open on iOS**: same refusal, because the root view controller is already presenting ([getsentry/sentry-react-native#6875](https://github.com/getsentry/sentry-react-native/issues/6875)) **[R]**.
- **Siblings on Android**: each is its own dialog, so they stack in the order they are shown **[I]**.

For the popup layer this means: a popup opened from inside another popup must render inside its parent's `Modal`, never beside it. That matches the web rule that "submenus and nested popups never portal; they move with their root popup" (`contributing/architecture.md`, Popups). A dialog opened from a menu item that then closes the menu is the case to test, because for a moment both exist.

### In-tree overlay through a portal host

The alternative is a full-window view rendered last at the app root, filled through a portal.

- React Native has no public portal. The Fabric renderer contains `createPortal(children, containerTag)`, which targets a root container tag, and `react-native` doesn't export it ([ReactFabric-prod.js#L11767](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Renderer/implementations/ReactFabric-prod.js#L11767), [index.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/index.js)) **[V]**.
- View Transitions are not available: `viewTransitionEnabled` defaults to `false` with `ossReleaseStage: 'none'`, and nothing public is exported ([ReactNativeFeatureFlags.config.js#L945](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L945)) **[V]**.
- Rendering a popup in place, the way the web does without a portal, isn't workable: an absolutely positioned child is clipped by any ancestor that clips, such as a scroll view, is drawn under later siblings, and gets no touches outside its parent's bounds **[I]**.
- A host at the root covers everything inside the React root view, native stack screens included, but not a view controller or dialog the app presented natively **[I]**. Both portal libraries read say so and point to `FullWindowOverlay` ([@gorhom/portal README](https://github.com/gorhom/react-native-portal/blob/85799ebd338ccb2fcdede8905635f8325df0a368/README.md), [@rn-primitives/portal](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/portal/src/portal.tsx)) **[V]**.
- The app must render the host, which is setup the web adapters don't ask for ("popups work without portals").
- `pointerEvents="box-none"` on the host lets presses through to the page where no popup is ([ViewPropTypes.js#L542](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewPropTypes.js#L542)) **[V]**, which is what non-modal popups need.

### Outside press

- **Modal popups**: a full-window `Pressable` behind the content, inside the `Modal` or the host. It swallows the press, so a press that dismisses never lands on the page, the same rule the web layer has. rn-primitives' `Overlay` part is exactly this ([dialog.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/dialog/src/dialog.tsx)) **[V]**.
- **Non-modal popups**: the press must reach the page and still close the popup. That takes a listener at the app root that sees every touch start without claiming it, for example `onStartShouldSetResponderCapture` returning `false` on the wrapper that also holds the host **[I]**. It only sees touches inside the React root, so not inside another `Modal`.

### Accessibility of content outside a popup

- **`Modal`, iOS**: the presented view controller is what VoiceOver reads; content behind it is not reachable **[I]**.
- **`Modal`, Android**: the dialog is its own window. The host view hides its children from the activity window's accessibility tree ([ReactModalHostView.kt#L183-L190](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L183-L190)) **[V]**, and TalkBack stays in the top window **[I]**.
- **In-tree overlay**: nothing is hidden for you, and there is no `inert`. The props that exist are `accessibilityViewIsModal` and `aria-modal` (iOS: VoiceOver ignores the view's siblings), `importantForAccessibility="no-hide-descendants"` (Android only, set on the content to hide), `accessibilityElementsHidden` and `aria-hidden` ([ViewAccessibility.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewAccessibility.js)) **[V]**. On Android the adapter has to mark the background itself. rn-primitives sets `aria-modal` and `onAccessibilityEscape` on its dialog content and moves accessibility focus by hand **[V]**.

The accessibility ticket of this effort covers this ground in depth; the point here is only that `Modal` contains assistive technology for free and an in-tree overlay doesn't.

### Android back and predictive back

- **With a `Modal` open**: the dialog gets back, and Escape on a hardware keyboard, and calls `onRequestClose`. JavaScript decides whether to close ([ReactModalHostView.kt#L291-L332](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L291-L332)) **[V]**. "`BackHandler` events will not be emitted as long as the modal is open" ([Modal docs, 0.88](https://reactnative.dev/docs/modal)) **[V]**. This fits `dismissible` and `onDismissAttempt`.
- **Without a `Modal`**: `BackHandler.addEventListener('hardwareBackPress', handler)`. Handlers run last registered first, and returning `true` stops the rest ([BackHandler.android.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Utilities/BackHandler.android.js)) **[V]**. That order is the layer stack's order as long as each popup registers when it opens. On iOS `BackHandler` does nothing.
- **Predictive back**: when the app targets SDK 36, which Expo SDK 58 does, `ReactActivity` registers an `OnBackPressedCallback` that is always enabled ([ReactActivity.java#L29-L39](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java#L29-L39)) **[V]**. Android's guide says that with an enabled callback "the predictive back animations don't run and you must handle the back event" ([Android predictive back guide](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)) **[V]**. Both `ReactActivity` and `Modal` override only `handleOnBackPressed`, never `handleOnBackStarted` or `handleOnBackProgressed` **[V]**. So back reaches JavaScript once, when the swipe commits. A popup can close on back; it can't follow the swipe. None of the libraries read exposes the swipe's progress for an arbitrary view either; that was not searched for exhaustively.

### Status bar and edge-to-edge

- React Native turns edge-to-edge on for apps that target SDK 35 or higher: always on Android 16 devices, and on Android 15 unless the theme opts out ([WindowUtil.kt#L45-L69](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/view/WindowUtil.kt#L45-L69)) **[V]**. Expo SDK 58 targets 36.
- With edge-to-edge on, a `Modal`'s `statusBarTranslucent` and `navigationBarTranslucent` read as `true` whatever was passed ([ReactModalHostView.kt#L83-L95](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L83-L95)) **[V]**. Modal content draws under the system bars, as the activity's content does.
- The dialog copies the activity's status bar style and bar visibility when it opens ([ReactModalHostView.kt#L424-L457](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L424-L457)) **[V]**. On iOS the modal keeps the status bar it had before presenting until JavaScript changes it **[V]**.
- **There is no built-in way to read insets.** `SafeAreaView` is iOS only, pads instead of reporting numbers, and is deprecated with a warning that names `react-native-safe-area-context` ([index.js#L121-L134](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/index.js#L121-L134), [SafeAreaView.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js)) **[V]**. `StatusBar.currentHeight` is Android only and covers the top edge only **[V]**. Nothing reports the navigation bar, the gesture area or a cutout. Placement needs these as collision padding, and a sheet needs the bottom inset.

### Placement beside an anchor

This part works with no dependency.

- Under the New Architecture, `measure`, `measureInWindow`, `measureLayout` and `getBoundingClientRect()` read the committed shadow tree and answer during the call. The callbacks are invoked before the method returns ([NativeDOM.cpp#L412-L447](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/nativemodule/dom/NativeDOM.cpp#L412-L447), [ReactNativeElement.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/src/private/webapis/dom/nodes/ReactNativeElement.js)) **[V]**.
- Called in `useLayoutEffect`, they let a component "read layout information synchronously and update the UI in the same frame", and the tooltip is the example the React Native team uses ([The New Architecture is here](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here), [layout measurements docs, 0.88](https://reactnative.dev/docs/the-new-architecture/layout-measurements)) **[V]**. So: render the popup, measure the anchor and the popup in the layout effect, set the position, and no wrong frame is painted.
- `measureInWindow` and `getBoundingClientRect` include the root's offset in the window; `measure`'s `pageX` and `pageY` don't ([DOM.cpp#L492-L551](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/dom/DOM.cpp#L492-L551)) **[V]**.
- `computePlacement` in `platform/position.ts` is pure, so it ports as it is. Its inputs become the anchor rectangle, the popup size, the window size from `useWindowDimensions`, the insets and the keyboard height.

Limits:

- **Keeping the popup placed while things move.** The web layer rechecks on scroll, resize and DOM changes. React Native has no global scroll event, and `ResizeObserver`, `MutationObserver` and `IntersectionObserver` are behind flags that default to `false` ([ReactNativeFeatureFlags.config.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js)) **[V]**. What is left is measuring again each animation frame while the popup is open, which is one synchronous call per frame, plus window-size and keyboard events **[I]**.
- **Values are from the shadow tree, not the screen.** A view moved by a UI-thread animation or a scroll in progress may be reported where it was last committed **[I]**.
- **Anchor and popup in different windows.** An anchor in the activity and a popup in a `Modal` are measured in the same shadow tree, but whether the numbers line up on both platforms was not verified. rn-primitives ships a `useModalPortalRoot` hook that corrects an offset by hand, which suggests they don't always ([portal.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/portal/src/portal.tsx)) **[V that the hook exists, I for the reason]**.

### Keyboard avoidance

- `Keyboard` events: iOS has `keyboardWillShow`, `keyboardWillHide` and the frame-change events, with the end frame, duration and easing. "Only `keyboardDidShow` and `keyboardDidHide` are available on Android" ([Keyboard.js#L88-L98](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/Keyboard/Keyboard.js#L88-L98)) **[V]**. `Keyboard.metrics()` and `Keyboard.isVisible()` read the current state **[V]**.
- `KeyboardAvoidingView` compares its own frame with the keyboard's and animates with `LayoutAnimation` ([KeyboardAvoidingView.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js)) **[V]**, which does nothing on Android (see [Animation](#enter-and-exit-animation)).
- An Android `Modal` sets `SOFT_INPUT_ADJUST_RESIZE` on its own window ([ReactModalHostView.kt#L334](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L334)) **[V]**.
- So: a popup can be moved or shrunk once the keyboard's end frame is known, animated to match on iOS, and after the fact on Android. Following the keyboard frame by frame isn't possible on either platform. `react-native-keyboard-controller` does that; it has native code and declares `react-native-reanimated >=3.0.0` as a peer ([npm](https://www.npmjs.com/package/react-native-keyboard-controller)) **[V]**. Reanimated's own `useAnimatedKeyboard` is deprecated in 4.x in its favor ([useAnimatedKeyboard docs](https://github.com/software-mansion/react-native-reanimated/blob/1b66ac4decf871f94e6598ad536a5a1f1c1e5f35/docs/docs-reanimated/docs/device/useAnimatedKeyboard.mdx)) **[V]**.

## Gestures

### What the built-ins do

- `Pressable` covers press, long press, press in and out, `hitSlop` and the retention offset. Enough for triggers, items and backdrops.
- `PanResponder` wraps the responder system and reports `dx`, `dy`, `vx`, `vy` for the touch it owns ([PanResponder.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Interaction/PanResponder.js)) **[V]**. Every event goes through the JavaScript thread.
- `Animated.event` with the native driver "does not work with `PanResponder`", because it only takes direct events such as `onScroll` ([Animations docs, 0.88](https://reactnative.dev/docs/animations#caveats)) **[V]**. A `PanResponder` drag therefore calls `setValue` from JavaScript on every move. The view can still be moved by a native-driven value, but each update waits for the JavaScript thread **[I]**. When JavaScript is busy, the drag lags the finger.
- The release can run on the UI thread: `Animated.spring` or `Animated.decay` with `useNativeDriver: true`, started with the gesture's velocity **[V that the API takes it, I for the feel]**.

### Where they fall short: sharing a touch with a scroll view

- On Android, when a native `ScrollView` decides the touch is a scroll, it calls `notifyNativeGestureStarted`, which cancels the touch for JavaScript, so the responder is terminated ([ReactScrollView.kt#L560-L583](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/scroll/ReactScrollView.kt#L560-L583)) **[V]**.
- A responder can stop that with `onShouldBlockNativeResponder`, which defaults to `true` and is "currently only supported on android" ([PanResponder.js#L208-L212](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Interaction/PanResponder.js#L208-L212)) **[V]**. Then the scroll view doesn't scroll at all for that touch.
- So one touch goes to the pan or to the scroll view. There is no way to say "scroll until the content reaches its top, then drag the sheet", or "both at once", or "this pan waits for that scroll to fail" **[I]**. A flag that changes the hand-off, `shouldTriggerResponderTransferOnScrollAndroid`, exists and defaults to `false` **[V]**.

### What each interaction needs

| Interaction | Built-ins alone | Shortfall |
| --- | --- | --- |
| Slider thumb, splitter, resize handle | `PanResponder`. The value has to reach JavaScript on every move anyway. | Inside a scroll view it must block the native responder, so a drag that starts on the thumb never scrolls. Fine in practice. |
| Swipe to dismiss a toast or a sheet with no scrolling content | `PanResponder` for tracking, native-driven spring for the release. | Tracking is on the JavaScript thread. |
| Sheet with scrolling content, with the web Drawer's physics | Not expressible. | Needs the scroll hand-off above. |
| iOS system sheet | `Modal` with `pageSheet` and `allowSwipeDismissal`. | iOS only, system look, no snap points. |
| Drag and drop, Image Cropper, Timeline | `PanResponder`, with multi-touch read from `touchHistory`. | Same thread and scroll limits; pinch and rotation are computed by hand. |

### What Gesture Handler adds, and what it costs

- Gestures recognized natively: `UIGestureRecognizer` on iOS and its own orchestrator on Android ([How does it work](https://github.com/software-mansion/react-native-gesture-handler/blob/b9b1140e1f9fd2aaa9841a065b0dfdee74100045/packages/docs-gesture-handler/docs/under-the-hood/how-does-it-work.md)) **[V]**.
- Relations between gestures: `simultaneousWith`, `requireToFail` and `block`, and `useNativeGesture` to put a native `ScrollView` into those relations ([base gesture config](https://github.com/software-mansion/react-native-gesture-handler/blob/b9b1140e1f9fd2aaa9841a065b0dfdee74100045/packages/docs-gesture-handler/docs/gestures/_shared/base-gesture-config.mdx), [native gesture](https://github.com/software-mansion/react-native-gesture-handler/blob/b9b1140e1f9fd2aaa9841a065b0dfdee74100045/packages/docs-gesture-handler/docs/gestures/use-native-gesture.mdx)) **[V]**. This is the scroll hand-off.
- **UI-thread tracking without Reanimated.** In version 3 a gesture's `onUpdate` accepts an `Animated.event` with `useNativeDriver: true` when `useAnimated: true` is set ([Integration with Animated](https://github.com/software-mansion/react-native-gesture-handler/blob/b9b1140e1f9fd2aaa9841a065b0dfdee74100045/packages/docs-gesture-handler/docs/fundamentals/animated-interactions.mdx)) **[V]**. The translation drives an `Animated.Value` on the UI thread. Without that or Reanimated, callbacks run on the JavaScript thread **[V]**. Reanimated and `Animated` can't be mixed in one detector **[V]**.
- Cost: native code on both platforms, peers `react` and `react-native` at `*`, runtime dependencies `invariant` and a types package ([npm](https://www.npmjs.com/package/react-native-gesture-handler)) **[V]**. It supports "the three latest minor releases of `react-native`" ([Getting started](https://github.com/software-mansion/react-native-gesture-handler/blob/b9b1140e1f9fd2aaa9841a065b0dfdee74100045/packages/docs-gesture-handler/docs/fundamentals/getting-started.mdx)) **[V]**. Included in Expo Go ([Expo page](https://docs.expo.dev/versions/latest/sdk/gesture-handler/)) **[V]**.
- Setup: the app wraps its root in `GestureHandlerRootView`, and on Android "if you want to use gestures in Modals you need to wrap Modal's content with `GestureHandlerRootView`" **[V]**. If the popup layer uses `Modal`, the adapter has to add that wrapper itself.

## Enter and exit animation

### What the built-ins do

- `Animated` with `useNativeDriver: true` runs timing, spring and decay on the UI thread: "once the animation has started, the JS thread can be blocked without affecting the animation" ([Animations docs, 0.88](https://reactnative.dev/docs/animations#using-the-native-driver)) **[V]**.
- The native driver takes `transform`, `opacity`, colors, border radii, `elevation`, `zIndex`, `filter` and the iOS shadow props ([NativeAnimatedAllowlist.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Animated/NativeAnimatedAllowlist.js)) **[V]**. That covers fade, scale from a transform origin, and slide, which is what popups, sheets and toasts use.
- **Presence.** Enter starts in an effect on mount. Exit keeps the view mounted and unmounts in the animation's `start` callback. That is the web layer's own model, where `mounted` is render state separate from `open` and `animateOut(el, done)` ends the exit, so the core logic carries over **[I]**.
- `AccessibilityInfo.isReduceMotionEnabled()` reads the system setting **[V]**.

### Where they fall short

- **Layout properties.** `height`, `width`, `top`, `flex`, margins and padding are on the native driver's list only when `useSharedAnimatedBackend` is on, and that flag defaults to `false` with `ossReleaseStage: 'experimental'` ([NativeAnimatedAllowlist.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Animated/NativeAnimatedAllowlist.js), [ReactNativeFeatureFlags.config.js#L904](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L904)) **[V]**. An accordion's height, or a sheet that resizes, animates on the JavaScript thread, one update per frame.
- **`LayoutAnimation` on Android.** Under the New Architecture it is gated by `enableLayoutAnimationsOnAndroid`, which defaults to `false` ([FabricUIManagerBinding.cpp#L207](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/jni/react/fabric/FabricUIManagerBinding.cpp#L207), [ReactNativeFeatureFlags.config.js#L437](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L437)) **[V]**. `UIManager.setLayoutAnimationEnabledExperimental`, which the docs still tell you to call, "is currently a no-op in the New Architecture" ([BridgelessUIManager.js#L184-L190](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/ReactNative/BridgelessUIManager.js#L184-L190)) **[V]**. `configureNext` then animates nothing, and the completion callback fires from a timer ([LayoutAnimation.js](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/LayoutAnimation/LayoutAnimation.js)) **[V]**. On iOS it is on. So there is no built-in layout animation that works on both platforms, and a library can't turn the flag on for an app.
- **Exit after unmount.** A view React has removed can't animate. The adapter must own the delay, as above.
- **Gesture-driven animation** on the UI thread needs Gesture Handler, as above.

### What Reanimated adds, and what it costs

- Animation code that runs on the UI thread as worklets, so any style property, layout included, animates without the JavaScript thread; `entering`, `exiting` and `layout` props that animate a view after React removed it; CSS-style transitions and animations; and a synchronous `measure` on the UI thread ([Reanimated docs](https://github.com/software-mansion/react-native-reanimated/tree/1b66ac4decf871f94e6598ad536a5a1f1c1e5f35/docs/docs-reanimated/docs)) **[V]**. With Gesture Handler, gesture callbacks run on the UI thread too.
- Cost:
  - Two packages with native code, `react-native-reanimated` and `react-native-worklets`, whose versions must match (4.7.x with 0.13.x) ([compatibility.json](https://github.com/software-mansion/react-native-reanimated/blob/1b66ac4decf871f94e6598ad536a5a1f1c1e5f35/packages/react-native-reanimated/compatibility.json)) **[V]**.
  - **A narrow React Native range.** 4.7.1 declares `react-native: 0.86 - 0.88` as a peer, and 4.6.x covers 0.83 to 0.87 **[V]**. An adapter that peers on Reanimated supports only the React Native versions the installed Reanimated does.
  - A Babel plugin, `react-native-worklets/plugin`, listed last. `babel-preset-expo` adds it for Expo apps; Community CLI apps add it by hand ([Getting started](https://github.com/software-mansion/react-native-reanimated/blob/1b66ac4decf871f94e6598ad536a5a1f1c1e5f35/docs/docs-reanimated/docs/fundamentals/getting-started.mdx), [Expo page](https://docs.expo.dev/versions/latest/sdk/reanimated/)) **[V]**. A library that ships worklets depends on the app's Babel setup compiling them, or must compile them before publishing **[I]**.
  - New Architecture only, which this effort already requires **[V]**. Included in Expo Go **[V]**.

## What each extra library fixes and costs

| Shortfall | Library | Native code | In Expo Go | Setup and other cost |
| --- | --- | --- | --- | --- |
| Insets on Android, insets as numbers | `react-native-safe-area-context` 5.11 | Yes | Yes | `SafeAreaProvider` at the root, and again "at the root of modals" ([docs](https://github.com/AppAndFlow/react-native-safe-area-context/blob/2468ed0394339097697ca960299a3484607ff8d3/docs/docs/api/safe-area-provider.mdx)). No runtime dependencies. React Native's own deprecation notice sends people to it. |
| Scroll hand-off, gesture relations, UI-thread drag | `react-native-gesture-handler` 3 | Yes | Yes | `GestureHandlerRootView` at the root and inside every Android `Modal`. Latest three React Native minors. |
| Layout props on the UI thread, exit after unmount, layout animation on Android | `react-native-reanimated` 4.7 with `react-native-worklets` | Yes, two packages | Yes | Babel plugin. Peer range of three React Native minors. |
| Above a native modal or sheet, without `Modal` | `FullWindowOverlay` from `react-native-screens` 4.30 | Yes | Yes | iOS only: on Android it warns and renders a plain `View` ([FullWindowOverlay.tsx](https://github.com/software-mansion/react-native-screens/blob/a1f25d01fda5d1203a65704c960c4facb6d5b372/src/legacy/components/FullWindowOverlay.tsx)). Its accessibility prop is still named `unstable_accessibilityContainerViewIsModal`. On `main` the file sits under `src/legacy`. |
| Portal that keeps React context | `react-native-teleport` 1.2 | Yes | No ([installation](https://github.com/kirillzyusko/react-native-teleport/blob/58da6a0ef42d6736b98a1df405cfc4027e6e4816/docs/docs/installation.mdx)) | New Architecture only. Moves native views, so context and the React tree stay intact. |
| Portal, JavaScript only | `@gorhom/portal` 1.0, `@rn-primitives/portal` 1.5 | No | Yes | A provider or host at the root. Depend on `nanoid` and `zustand`. React context from the call site is lost. |
| Keyboard frame by frame | `react-native-keyboard-controller` 1.23 | Yes | Not checked | Peers on Reanimated. |

All of `react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens` and `react-native-safe-area-context` are marked "Included in Expo Go" on their Expo pages, and Expo SDK 58 pins a version of each ([bundledNativeModules.json](https://unpkg.com/expo@58.0.25/bundledNativeModules.json)) **[V]**. An app outside Expo Go installs each one and rebuilds.

## How libraries with few dependencies cope

**rn-primitives** is the closest prior art: headless parts, and peers of `react`, `react-native` and its own portal package. Read at [1bebe66](https://github.com/roninoss/rn-primitives/tree/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4) **[V]**:

- **No `Modal`.** Dialog, popover, menus, select and tooltip render through `@rn-primitives/portal`: a `zustand` store of React nodes and a `<PortalHost />` the app places at its root. The whole package is about 60 lines.
- **Context is rebuilt by hand.** Each `Portal` part wraps its children in the component's own context provider again, because a JavaScript portal renders them under the host. The app's own contexts must sit above the host.
- **Above native modals**: its docs tell the app to wrap the host in `FullWindowOverlay` on iOS.
- **Back**: `BackHandler` in each content part. **Outside press**: a `Pressable` overlay part. **Accessibility**: `aria-modal`, `onAccessibilityEscape`, and hooks that move and restore accessibility focus.
- **Placement**: the trigger is measured with the asynchronous form of `measure` when pressed, the content with `onLayout`, and the content is rendered off-screen at `opacity: 0` until both are known ([useRelativePosition.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/hooks/src/useRelativePosition.tsx)). Sides are `top` and `bottom` only. Insets are a prop the app fills in, in practice from `react-native-safe-area-context`. The synchronous layout-effect path above is better than this and needs nothing more.
- **Gestures**: none. The native slider exposes only `increment` and `decrement` accessibility actions and leaves dragging to the app ([slider.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/slider/src/slider.tsx)).
- **Animation**: none. Parts take `forceMount`, and the app brings Reanimated.

So the low-dependency route is real, and it gets there by leaving out the three things that need native help: dragging, motion and insets. This effort's parity goal includes all three: a Drawer with gesture physics, sliders, and presence with enter and exit.

**`@gorhom/portal`** is the same idea with a reducer and `nanoid`, has no native code, and gives the same two warnings: use `FullWindowOverlay` to get above native views, and keep the provider under `GestureHandlerRootView` ([README](https://github.com/gorhom/react-native-portal/blob/85799ebd338ccb2fcdede8905635f8325df0a368/README.md)) **[V]**.

**React Native's own examples** in RN Tester show `Modal` only as a single modal with the system presentations, and `PanResponder` only for a free drag with nothing scrolling beneath ([Modal examples](https://github.com/facebook/react-native/tree/v0.88.1/packages/rn-tester/js/examples/Modal), [PanResponder example](https://github.com/facebook/react-native/tree/v0.88.1/packages/rn-tester/js/examples/PanResponder)) **[V]**. They contain no anchored popup, no sibling modals and no sheet.

## What this gives the two decisions

This section is a reading of the findings, not a decision.

**How native popups layer, dismiss and place themselves.**

- `Modal` suits modal popups: it is above everything, routes back, contains assistive technology and needs no setup from the app. It can't host anything non-modal, and each open root popup must be one `Modal` with its nested popups inside.
- An in-tree host suits non-modal popups and is the only place a tooltip, a hover card or a combobox list can live. It needs the app to render a host, its own back, outside-press and accessibility handling, and it can't rise above a native modal the app presented.
- A mix of the two follows the preset: the modal triple decides which one a popup uses.
- Placement needs no library. Insets do.

**Which dependencies the native adapter may take.**

- With no extra peer: every popup, placement, back, native-driven fade, scale and slide, sliders, and swipe to dismiss where nothing scrolls. Missing: insets on Android, the Drawer's scroll hand-off, UI-thread drags, layout animation.
- `react-native-safe-area-context` is the cheapest gap to close and the hardest to work around. The alternative is to ask the app for insets as a prop, as rn-primitives does.
- `react-native-gesture-handler` closes both gesture gaps and, with `Animated`, the UI-thread drag, at the cost of one native peer and a root wrapper.
- `react-native-reanimated` is the only fix for layout animation, and the most expensive peer: two packages, a Babel plugin, and a three-minor React Native range.
- Optional peers are possible in principle: the direct-manipulation components could require Gesture Handler while popups don't. Whether that fits "one shape everywhere" is for the decision.

## Open checks for a prototype

None of this was run. A prototype on an iOS simulator and an Android emulator should confirm:

1. Sibling `Modal`s on iOS: that the second one fails to show, and that nesting it inside the first works, including a dialog opened from a menu item that closes the menu.
2. Measurements across windows: an anchor in the activity and a popup inside a `Modal`, on both platforms, with edge-to-edge on.
3. Focus and the keyboard on Android when a `Modal` opens while a `TextInput` in the activity is focused. If the dialog window takes focus, a combobox list can't use `Modal`.
4. `Keyboard` events and `KeyboardAvoidingView` inside an Android `Modal` under edge-to-edge.
5. The feel of a `PanResponder` drag with a native-driven release against a Gesture Handler drag, on a mid-range Android device.
6. VoiceOver and TalkBack behind a transparent `Modal`, and behind an in-tree overlay marked with `accessibilityViewIsModal` and `importantForAccessibility`.
7. Whether measuring each frame keeps a popup attached to an anchor inside a scrolling list.
