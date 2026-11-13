# How native accessibility and behavior can be tested

Research for [issue #8](https://github.com/floklein/rn-ui/issues/8), part of the React Native effort mapped in [issue #2](https://github.com/floklein/rn-ui/issues/2). Written on 2026-11-13.

**How to read this.** Every claim carries a link to the source that owns it. **[V]** means verified in that source on the date above (docs, or source code at the tagged version). **[I]** means inferred from verified facts and not tested. Nothing here was run on a simulator or an emulator: run times and flakiness are the tools' own statements plus inference, and are the first thing a prototype should measure. The spec snippets show each tool's shape with API names taken from its docs; none was run.

## The answer in short

- **Nothing drives VoiceOver on an iOS simulator.** Apple says VoiceOver isn't available on Simulator, so every iOS tool below reads what VoiceOver would read and never drives it. TalkBack can run on an Android emulator. Appium's UiAutomator2 driver and `agent-device` both keep it alive during a test, and only Appium documents reading where its focus is.
- **Three levels exist, and each sees a different thing.** In Jest, React Native Testing Library reads the props a component passes to host views. On a booted device, Appium, Maestro, Detox and `agent-device` read the accessibility tree the platform built from those props. With a screen reader running, only Android on an emulator is reachable in CI.
- **The props and the platform tree disagree in ways that matter.** React Native maps `tab`, `menu`, `menuitem`, `combobox`, `toolbar` and `radiogroup` to no iOS trait, folds `checkbox`, `radio`, `checked`, `expanded` and `busy` into a localized iOS value string, and applies `aria-modal` on iOS only. A JS-only check can pass where a device check fails.
- **Appium reads the most of the native tree** (iOS traits, custom actions and Apple's accessibility audit; Android accessibility focus, actions, heading, live region, pane title and windows). Maestro is the simplest to write and to run in Expo's CI but reads the least: no role and no actions. Detox sits between, and officially supports React Native 0.77 to 0.84 while React Native is at 0.88.
- **CI is free on this repo.** Standard GitHub-hosted runners are free for public repositories, and `floklein/rn-ui` is public. iOS simulators need a macOS runner; Android emulators run with hardware acceleration on Linux runners and can't run on the arm64 macOS runners.

## What the web checks assert

This is what a native counterpart has to answer to. All **[V]** in this repo at `d101ca04`.

| Web check | What it asserts | Source |
| --- | --- | --- |
| `checkPattern(root, pattern)` | Roles, required states, accessible names and id references; one tab stop per composite; then drives the pattern's keys from the focused element (arrows by `aria-orientation`, swapped right to left, Home, End, typeahead, Escape, Enter, Space). After every key, focus must not fall to the body or land in `aria-hidden` or `inert` content. Fifteen patterns: listbox, menu, menubar, tabs, radio group, toolbar, tree, dialog, alert dialog, disclosure, accordion, combobox, slider, switch, checkbox. | [`check-pattern.ts`](../../packages/core/src/testing/check-pattern.ts), [`pattern-context.ts`](../../packages/core/src/testing/pattern-context.ts) |
| `checkDirection(primitive, options, markup)` | Mounts left to right and right to left, and checks ArrowLeft in right to left does what ArrowRight does in left to right, on focus and on state. | [`check-direction.ts`](../../packages/core/src/testing/check-direction.ts) |
| `checkServer(primitive, ...)` | Creating the primitive reads no DOM, clock or randomness, and every part's attributes read state alone. | [`check-server.ts`](../../packages/core/src/testing/check-server.ts) |
| `<name>.a11y.spec.ts` | Axe in each state, ARIA snapshots of the tree, and `checkPattern` in a real browser. | [`tests/README.md`](../../tests/README.md#accessibility) |
| `<name>.sr.spec.ts` | The phrase log of a virtual screen reader (`@guidepup/virtual-screen-reader`) walking the component. Every implementation must say the same. | [`tests/README.md`](../../tests/README.md#screen-reader) |
| `<name>.spec.ts`, `.rtl.spec.ts` | Keyboard, pointer and touch behavior, focus, dismissal, positioning; mirrored arrows and placement in right to left. | [`tests/README.md`](../../tests/README.md#behavior) |

The rules `checkPattern` reports fall in five families: a role is present and owns the right children (`owns no tab; a tablist's items have role tab`); a state is present and valid (`has no aria-checked`); a name is present (`has no accessible name`); a reference resolves (`aria-controls points at ...`); and a key does what the pattern says, including where focus goes (`focus should return here when Escape closes ...`).

## What React Native exposes, and what each platform keeps

Every tool below reads either these props or what the platform made of them. React Native 0.88.1.

- **Props.** `role` (which wins over `accessibilityRole`), `accessibilityLabel` or `aria-label`, `accessibilityState` or `aria-disabled`, `aria-selected`, `aria-checked`, `aria-busy`, `aria-expanded`, `accessibilityValue` or `aria-valuemin`, `-max`, `-now`, `-text`, `accessibilityActions` with `onAccessibilityAction`, `aria-hidden`. **[V]** [React Native: Accessibility](https://reactnative.dev/docs/accessibility)
- **Platform-only props.** `aria-labelledby`, `aria-live` and `importantForAccessibility` are Android only; `aria-modal`, `accessibilityViewIsModal`, `accessibilityElementsHidden` and `onAccessibilityEscape` are iOS only. **[V]** [same page](https://reactnative.dev/docs/accessibility)
- **No id references besides `aria-labelledby`.** There is no `aria-controls`, `aria-activedescendant`, `aria-describedby` or `aria-haspopup` in the documented props. **[V]** [same page](https://reactnative.dev/docs/accessibility)
- **Standard actions.** `activate`, `increment`, `decrement` on both; `magicTap`, `escape` on iOS only; `longpress`, `expand`, `collapse` on Android only. **[V]** [Accessibility actions](https://reactnative.dev/docs/accessibility#accessibility-actions)
- **iOS traits.** Only `button`, `togglebutton`, `link`, `image`, `img`, `text`, `search`, `adjustable`, `header`, `heading`, `imagebutton`, `summary`, `switch`, `tabbar`, `keyboardkey` and `progressbar` produce a trait. `tab`, `tablist`, `menu`, `menubar`, `menuitem`, `combobox`, `toolbar`, `radiogroup`, `checkbox`, `radio` and `alert` produce none. **[V]** [`accessibilityPropsConversions.h`](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/components/view/accessibilityPropsConversions.h)
- **iOS value.** The view's `accessibilityValue` is a comma-joined, localized string built from the role (`checkbox`, `radio button`), then `checked`, `unchecked` or `mixed`, `expanded`, `busy`, then the value set by props. A switch returns `"1"` or `"0"`. **[V]** [`RCTViewComponentView.mm`, `accessibilityValue`](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm)
- **iOS actions.** Every entry of `accessibilityActions` becomes a `UIAccessibilityCustomAction`, named by its label, or by its name when it has no label. **[V]** [same file, `accessibilityCustomActions`](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm)
- **Android class.** A role becomes a class name: `button` is `android.widget.Button`, `checkbox` is `android.widget.CheckBox`, `switch` is `android.widget.Switch`, `adjustable` is `android.widget.SeekBar`. `tab`, `tablist`, `menu`, `menubar`, `menuitem`, `combobox`, `toolbar`, `radiogroup`, `progressbar`, `link`, `alert` and `header` are all `android.view.View`. **[V]** [`ReactAccessibilityDelegate.kt`, `getValue`](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt)
- **Android role description.** Those `android.view.View` roles are told apart by a localized `roleDescription` string (`link`, `alert`, `combobox`, `menu`, `menubar`, `menuitem`, `progressbar`, `radiogroup`, `tab`, `tablist`, `toolbar`), and `header` by `isHeading`. **[V]** [same file](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt)
- **Android expanded.** The expanded state is exposed as which action the node offers: `ACTION_COLLAPSE` when expanded, `ACTION_EXPAND` when not. **[V]** [same file](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt)
- **Screen readers on virtual devices.** "VoiceOver isn't available via the simulator." "Android emulators don't have TalkBack installed by default. You can install TalkBack on your emulator via the Google Play Store", and it toggles with `adb shell settings put secure enabled_accessibility_services ...`. **[V]** [React Native: Accessibility](https://reactnative.dev/docs/accessibility#testing-talkback-support-android). Apple says the same: "Install your app on a physical device, since VoiceOver isn't available on Simulator." **[V]** [Apple: Performing accessibility testing for your app](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)

**Consequence.** **[I]** A role string like `tab` survives to the device only as an Android role description in the device's language, and not at all on iOS. A device-level check can't assert "this element has role tab" on iOS; it can assert the label, the selected state and the behavior. Only the JS level sees the role as written.

## The tools

Versions are the latest published on 2026-11-13, from the npm registry or the project's GitHub releases.

| Tool | Version | Needs a device | Reads |
| --- | --- | --- | --- |
| React Native Testing Library | 14.1.0 | No | Props |
| Maestro | CLI 2.12.1 | Yes | Platform tree, reduced |
| Detox | 20.51.4 | Yes | Views inside the app |
| Appium | 3.9.0, XCUITest driver 13.1.1, UiAutomator2 driver 9.0.3 | Yes | Platform tree, most of it |
| XCTest accessibility audit | iOS 17, Xcode 15 and later | Yes | Platform tree, as rules |
| Accessibility Test Framework for Android | 4.1.1 | Yes | View hierarchy, as rules |
| `agent-device` | 0.21.37 | Yes | Platform tree |

### What each reads of the accessibility tree

"Focus" has two meanings on native: input focus (the text field with the keyboard) and accessibility focus (where the screen reader's cursor is). The table says which one.

| Tool | Role | Label | State | Value | Actions | Focus | Hidden and modal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RNTL | The `role` prop as written | Yes, with `aria-labelledby` and text content | disabled, selected, checked, busy, expanded | min, max, now, text | Declared actions, fired by name | None | Yes, from props |
| Maestro | No | Yes | enabled, selected, checked, focused | iOS only, as text | No | Input focus | No |
| Detox | iOS traits only | Yes | enabled, toggle value | Yes | By name, around the platform | Input focus | No |
| Appium, iOS | Element type and traits | Yes | enabled, selected | Yes | Custom actions | Input focus | `accessible`, `visible` |
| Appium, Android | Class, extras | Yes | enabled, selected, checkable, checked, invalid | Not listed | Full action list | Input focus and accessibility focus | `a11y-important`, windows |
| XCTest audit | Rule: trait | Rule: description | No | No | No | No | Rule: element detection |
| ATF | Rule: class name | Rule: speakable text | No | No | No | No | Rule: traversal order |
| `agent-device` | type, role, role description | Yes | enabled, selected, checked | Yes | iOS simulator, names only | Input focus | `visibleToUser`, `hittable` |

### React Native Testing Library under Jest

Version 14.1.0, peers `react >= 19`, `react-native >= 0.78`, `test-renderer ^1.0.0`. **[V]** [`package.json`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/package.json)

- **What it is.** It "simulates the React Native runtime on top of Test Renderer". No native code runs, so it sees props on host elements and nothing a platform computes. **[V]** [README](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/README.md)
- **Role.** `getByRole` matches the `role` or `accessibilityRole` prop on an element that is an accessibility element (`accessible`, or a host `Text`, `TextInput` or `Switch`). A host `Text` defaults to `text`; everything else to `none`. **[V]** [`accessibility.ts`, `getRole` and `isAccessibilityElement`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/src/helpers/accessibility.ts)
- **Name.** `aria-labelledby` or `accessibilityLabelledBy` resolved through `nativeID`, then `aria-label` or `accessibilityLabel`, then an image's `alt`, then a text input's placeholder, then the text content of children. **[V]** [`computeAccessibleName`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/src/helpers/accessibility.ts)
- **State and value.** `getByRole` options and the matchers `toBeDisabled`, `toBeSelected`, `toBeChecked`, `toBePartiallyChecked`, `toBeBusy`, `toBeExpanded`, `toHaveAccessibilityValue`, `toHaveAccessibleName`. Checked is read only for `checkbox`, `radio` and `switch`. **[V]** [`role.ts`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/src/queries/role.ts), [`src/matchers`](https://github.com/callstack/react-native-testing-library/tree/v14.1.0/src/matchers)
- **Hidden and modal.** `isHiddenFromAccessibility` is true under `aria-hidden`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`, `display: none`, or for a sibling of an element with `aria-modal` or `accessibilityViewIsModal`. **[V]** [`isSubtreeInaccessible`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/src/helpers/accessibility.ts). It applies the modal rule on every platform, though React Native applies it on iOS only, so a JS check of a modal passes for Android too. **[I]**
- **Actions.** `userEvent.accessibilityAction(element, name)` calls `onAccessibilityAction`, and throws when the action isn't declared in `accessibilityActions` or the element is disabled. **[V]** [`accessibility-action.ts`](https://github.com/callstack/react-native-testing-library/blob/v14.1.0/src/user-event/accessibility-action/accessibility-action.ts)
- **Focus and announcements.** No focus matcher exists. React Native's Jest preset mocks `AccessibilityInfo`: `announceForAccessibility`, `setAccessibilityFocus` and `sendAccessibilityEvent` are `jest.fn()`, and `isScreenReaderEnabled` resolves `false`. A test can assert they were called, not what the platform did. **[V]** [`mocks/AccessibilityInfo.js`](https://github.com/facebook/react-native/blob/v0.88.1/packages/jest-preset/jest/mocks/AccessibilityInfo.js)
- **Platform.** The preset's default platform is `ios`, so Android branches need a second Jest project. **[V]** [`jest-preset.js`](https://github.com/facebook/react-native/blob/v0.88.1/packages/jest-preset/jest-preset.js)
- **Screen readers.** Neither drives nor emulates one.
- **Spec.**

  ```tsx
  const user = userEvent.setup()
  await render(<Tabs />)
  await user.press(screen.getByRole("tab", { name: "Billing" }))
  expect(screen.getByRole("tab", { name: "Billing" })).toBeSelected()
  ```

- **Run time and flakiness.** Runs in Node with no build and no device. **[I]** Milliseconds per test, and as deterministic as any Jest test.
- **CI.** A Linux runner and `jest`.

### Maestro

CLI 2.12.1. Needs Java 17. Runs on emulators, simulators and physical Android devices; "Physical iOS devices are not yet supported." **[V]** [README](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/README.md)

- **What it reads on iOS.** From an XCTest snapshot: `label`, `identifier`, `value`, `title`, `placeholderValue`, `enabled`, `selected`, `hasFocus`, frame and `elementType`. **[V]** [`AXElement.swift`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-ios-xctest-runner/maestro-driver-iosUITests/Routes/Models/AXElement.swift). It maps them to `accessibilityText`, `resource-id`, `value`, `text`, `hintText`, `enabled`, `selected`, `focused`, and `checked`, which is true only for a checkbox, switch or toggle whose value is `"1"`. The element type isn't kept. **[V]** [`IOSDriver.kt`, `mapViewHierarchy`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-client/src/main/java/maestro/drivers/IOSDriver.kt)
- **What it reads on Android.** From the accessibility node: text, hint, `resource-id`, class, `content-desc`, checkable, checked, clickable, enabled, focusable, focused, selected, `visible-to-user`, `important-for-accessibility`, error. **[V]** [`ViewHierarchy.kt`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-android/src/androidTest/java/dev/mobile/maestro/ViewHierarchy.kt)
- **What a flow can select on.** Text (which also matches the hint and the accessibility label), id, `enabled`, `selected`, `checked`, `focused`, position, size and index. The `traits` selector is `text`, `square` and `long-text`, not accessibility traits. No selector for role, value or actions. **[V]** [`ElementSelector.kt`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-orchestra-models/src/main/java/maestro/orchestra/ElementSelector.kt), [`Filters.kt`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-client/src/main/java/maestro/Filters.kt), [`TraitFilters.kt`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/filter/TraitFilters.kt)
- **Screen readers.** A code search of the repository for `voiceover` and `talkback` returns nothing. `focused` is input focus. **[V]** [repository](https://github.com/mobile-dev-inc/Maestro), searched 2026-11-13
- **Spec.**

  ```yaml
  appId: dev.example.fixtures
  ---
  - launchApp
  - tapOn: "Billing"
  - assertVisible:
      text: "Billing"
      selected: true
  ```

- **Run time and flakiness.** "Built-in flakiness tolerance and automatic waiting". **[V]** [README](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/README.md). An element lookup waits up to 17 seconds, 7 for an optional one. **[V]** [`Orchestra.kt`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/Orchestra.kt). The iOS driver carries recovery code for XCTest snapshot failures on large or changing trees (`kAXErrorIllegalArgument`). **[V]** [`ViewHierarchyHandler.swift`](https://github.com/mobile-dev-inc/Maestro/blob/cli-2.12.1/maestro-ios-xctest-runner/maestro-driver-iosUITests/Routes/Handlers/ViewHierarchyHandler.swift)
- **CI.** A built app and a booted device. Expo's own guide runs Maestro from EAS Workflows with a `build` job and a `maestro` job taking `build_id` and `flow_path`. **[V]** [Expo: Run E2E tests on EAS Workflows and Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/). Maestro's CI docs describe its own cloud for GitHub Actions and others. **[V]** [Maestro: CI](https://docs.maestro.dev/getting-started/running-flows-on-ci)

### Detox

Version 20.51.4 on npm. Gray box: it runs inside the app and waits for it to go idle. **[V]** [README](https://github.com/wix/Detox/blob/master/README.md)

- **React Native support.** "RN `v0.77.x` - `v0.84.x`: Fully compatible with React Native's New Architecture. Newer RN versions might work with Detox, but they've not been thoroughly tested". React Native is at 0.88.1. **[V]** [README](https://github.com/wix/Detox/blob/master/README.md#supported-react-native-versions)
- **Expo.** "Expo integration with Detox is entirely a community-driven effort. There is no special support for Expo projects in Detox". **[V]** [Getting started, Expo](https://github.com/wix/Detox/blob/master/docs/introduction/partials/_getting-started-expo.md)
- **What it reads.** Matchers `by.id`, `by.label`, `by.text`, `by.type`, and `by.traits` on iOS only. **[V]** [Matchers](https://wix.github.io/Detox/docs/api/matchers). Expectations `toHaveLabel`, `toHaveValue`, `toHaveToggleValue`, `toHaveSliderPosition`, `toBeFocused`, `toBeVisible`. **[V]** [Expect](https://wix.github.io/Detox/docs/api/expect). `getAttributes()` returns text, label, placeholder, enabled, identifier, visible, value and frame, plus `hittable` on iOS and `focused` on Android. **[V]** [Actions](https://wix.github.io/Detox/docs/api/actions#getattributes)
- **Focus.** `toBeFocused` on iOS is `isFocused || isFirstResponder`: input focus. **[V]** [`NSObject+DetoxUtils.m`](https://github.com/wix/Detox/blob/master/detox/ios/Detox/Utilities/NSObject%2BDetoxUtils.m)
- **Actions.** `performAccessibilityAction(name)`. On Android it dispatches React Native's `topAccessibilityAction` event straight to the view, so it doesn't prove the platform exposes the action. On iOS it looks the name up in `accessibilityCustomActions`. **[V]** [`RNDetoxAccessibilityAction.kt`](https://github.com/wix/Detox/blob/master/detox/android/detox/src/full/java/com/wix/detox/espresso/action/RNDetoxAccessibilityAction.kt), [`Element.swift`](https://github.com/wix/Detox/blob/master/detox/ios/Detox/Invocation/Element.swift)
- **Labels.** Detox computes the label of a React Native element with no explicit label as a concatenation of its children's labels, bridging a difference between iOS and Android. What it reports is not always what the platform holds. **[V]** [Expect, `toHaveLabel`](https://wix.github.io/Detox/docs/api/expect#tohavelabellabel)
- **Screen readers.** No API to turn one on or read one: a code search of the repository for `voiceover` and `talkback` returns nothing. **[V]** [repository](https://github.com/wix/Detox), searched 2026-11-13
- **Spec.**

  ```js
  await element(by.label("Billing")).tap()
  await expect(element(by.id("billing-panel"))).toBeVisible()
  const { value } = await element(by.id("volume")).getAttributes()
  ```

- **Run time and flakiness.** Detox's docs: a suite of 100 tests each flaky 0.5% of the time fails 40% of runs without a bug; its answer is synchronization, which fails a test when timers or animations never stop. **[V]** [Flakiness](https://wix.github.io/Detox/docs/troubleshooting/flakiness), [Synchronization](https://wix.github.io/Detox/docs/troubleshooting/synchronization)
- **CI.** A release build per platform through `detox build`, then `detox test`. Its CI guide is marked outdated. **[V]** [Preparing for CI](https://wix.github.io/Detox/docs/introduction/preparing-for-ci)

### Appium

Server 3.9.0 is `latest` on npm; 4.0.0-beta.8 is `beta`. The newest drivers, XCUITest 13.1.1 and UiAutomator2 9.0.3, declare a peer of `appium ^4.0.0-beta.8`, so on the stable server an older driver major has to be pinned. **[V]** npm registry, [`appium-xcuitest-driver` `package.json`](https://github.com/appium/appium-xcuitest-driver/blob/master/package.json), [`appium-uiautomator2-driver` `package.json`](https://github.com/appium/appium-uiautomator2-driver/blob/master/package.json)

**XCUITest driver, iOS.**

- **What it reads.** `type` (`XCUIElementTypeButton`), `name`, `label`, `value`, `placeholderValue`, `minValue`, `maxValue`, `enabled`, `selected`, `focused` (XCTest's `hasFocus`), `hittable`, `visible`, `accessible`, `nativeAccessibilityElement`, `traits` (`Button, Adjustable`) and `customActions`. **[V]** [Element attributes](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/element-attributes.md)
- **Apple's audit.** `mobile: performAccessibilityAudit` wraps XCTest's audit and returns the issues with their element. Xcode 15 and iOS 17 or later. **[V]** [Execute methods](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/execute-methods.md#mobile-performaccessibilityaudit)
- **Settings a test can change.** Content size up to the accessibility sizes, increase contrast, reduce motion, appearance. **[V]** [Execute methods](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/execute-methods.md), [Settings](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/settings.md)
- **Screen readers.** No method for VoiceOver is documented, and it isn't on the simulator. **[V]** for the absence in [Execute methods](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/reference/execute-methods.md)

**UiAutomator2 driver, Android.**

- **What it reads.** `class`, `content-desc`, `text`, `hint`, `checkable`, `checked`, `enabled`, `selected`, `focused`, `displayed`, `content-invalid`, `error`, plus `a11y-important`, `screen-reader-focusable`, `a11y-focused` ("whether this element is accessibility focused"), `heading`, `live-region`, `pane-title`, `actions` (the node's action list, behind the `includeA11yActionsInPageSource` setting), `extras`, and collection info. **[V]** [README, element attributes](https://github.com/appium/appium-uiautomator2-driver/blob/master/README.md#element-attributes)
- **Windows.** `mobile: listWindows` returns the accessibility windows with their type and `isAccessibilityFocused`. **[V]** [README](https://github.com/appium/appium-uiautomator2-driver/blob/master/README.md#mobile-listwindows)
- **Screen readers.** `appium:disableSuppressAccessibilityService` "tells the instrumentation process to not suppress accessibility services during the automated test". **[V]** [README, capabilities](https://github.com/appium/appium-uiautomator2-driver/blob/master/README.md). That matters because "UiAutomation suppresses accessibility services by default". **[V]** [Android: `UiAutomation`](https://developer.android.com/reference/android/app/UiAutomation#FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES). With TalkBack installed and enabled through `adb`, a test can swipe to move TalkBack's focus and read `a11y-focused`. **[I]** Reading what TalkBack spoke isn't documented by the driver; TalkBack's developer settings can display or log speech output. **[V]** [Android: Test your app's accessibility](https://developer.android.com/guide/topics/ui/accessibility/testing#optional_talkback_developer_settings)
- **Role description.** `extras` likely carries React Native's `roleDescription`, which is how a `tab` would be told from a `menuitem`. **[I]** Not checked on a device.

**Both.**

- **Spec.** In JavaScript through WebdriverIO, or any WebDriver client.

  ```js
  const tab = await $("~Billing")
  await tab.click()
  expect(await tab.getAttribute("selected")).toBe("true")
  const issues = await driver.execute("mobile: performAccessibilityAudit", {
    auditTypes: ["XCUIAccessibilityAuditTypeSufficientElementDescription"],
  })
  ```

- **Run time and flakiness.** Black box, with no knowledge of the app's idle state. On Android, UiAutomator waits for the accessibility event stream to go idle before each lookup, which "need at least 10 seconds or more" per element in an app that never idles unless `waitForIdleTimeout` is lowered. **[V]** [README](https://github.com/appium/appium-uiautomator2-driver/blob/master/README.md). The iOS driver has a troubleshooting page for WebDriverAgent slowness. **[V]** [WDA slowness](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/troubleshooting/wda-slowness.md). **[I]** The slowest of the device tools per step, and the one with the most moving parts.
- **CI.** The Appium server, a driver per platform, WebDriverAgent built on the macOS runner, a built app and a booted device. **[V]** [CI setup](https://github.com/appium/appium-xcuitest-driver/blob/master/docs/guides/ci-setup.md)

### XCTest accessibility audits

- **What it is.** `XCUIApplication.performAccessibilityAudit(for:_:)`, iOS 17 and later, called from a UI test. It throws on issues unless the handler returns `true` for one. **[V]** [Apple: `performAccessibilityAudit(for:_:)`](https://developer.apple.com/documentation/xcuiautomation/xcuiapplication/performaccessibilityaudit%28for:_:%29)
- **Audit types on iOS.** `contrast`, `dynamicType`, `elementDetection`, `hitRegion`, `sufficientElementDescription`, `textClipped`, `trait`. `action` and `parentChild` are macOS only. **[V]** [Apple: `XCUIAccessibilityAuditType`](https://developer.apple.com/documentation/xcuiautomation/xcuiaccessibilityaudittype)
- **What an issue holds.** The audit type, a compact and a detailed description, and the element. **[V]** [Apple: `XCUIAccessibilityAuditIssue`](https://developer.apple.com/documentation/xcuiautomation/xcuiaccessibilityauditissue)
- **What else XCTest reads.** `identifier`, `elementType`, `value`, `placeholderValue`, `title`, `label`, `hasFocus`, `isEnabled`, `isSelected`, frame. No traits and no actions in the public protocol. **[V]** [Apple: `XCUIElementAttributes`](https://developer.apple.com/documentation/xcuiautomation/xcuielementattributes)
- **What it is not.** A rule set about a screen, like axe. It doesn't know a tablist needs tabs or that a menu returns focus. **[I]**
- **Spec.**

  ```swift
  let app = XCUIApplication()
  app.launch()
  try app.performAccessibilityAudit(for: [.sufficientElementDescription, .hitRegion, .trait])
  ```

- **CI.** A UI test target in the Xcode project, which Expo generates and doesn't keep, so the target has to be added by a config plugin, or the audit reached through Appium instead. **[I]**

### Accessibility Test Framework for Android and Espresso

- **What it is.** A library of checks over `View` and `AccessibilityNodeInfo` objects. Version 4.1.1 is the latest on Google Maven, and the GitHub repository was last pushed on 2024-04-03. **[V]** [README](https://github.com/google/Accessibility-Test-Framework-for-Android/blob/master/README.md), [Google Maven index](https://dl.google.com/android/maven2/com/google/android/apps/common/testing/accessibility/framework/group-index.xml)
- **Checks.** `SpeakableTextPresentCheck`, `DuplicateSpeakableTextCheck`, `RedundantDescriptionCheck`, `EditableContentDescCheck`, `ClassNameCheck`, `TouchTargetSizeCheck`, `DuplicateClickableBoundsCheck`, `ClickableSpanCheck`, `LinkPurposeUnclearCheck`, `TraversalOrderCheck`, `TextContrastCheck`, `ImageContrastCheck`, `TextSizeCheck`, `UnexposedTextCheck`. **[V]** [`checks/`](https://github.com/google/Accessibility-Test-Framework-for-Android/tree/master/src/main/java/com/google/android/apps/common/testing/accessibility/framework/checks)
- **In Espresso.** `AccessibilityChecks.enable()` runs the checks on every `ViewActions` action, on the acted view and its descendants, or on the whole screen with `setRunChecksFromRootView(true)`. Results can be suppressed with a matcher. **[V]** [Android: Accessibility checking](https://developer.android.com/training/testing/espresso/accessibility-checking)
- **Same engine elsewhere.** Accessibility Scanner and Google Play's pre-launch report run the same framework. **[V]** [Android: Test your app's accessibility](https://developer.android.com/guide/topics/ui/accessibility/testing)
- **What it is not.** Like Apple's audit, a rule set about a screen with no notion of a pattern. **[I]**
- **CI.** An instrumentation test inside the app's Android project, on an emulator. For an Expo app that is an `androidTest` source set added by a config plugin. Detox already installs an Espresso test in the app, so the checks could be enabled there. **[I]**

### `agent-device`

Version 0.21.37 on npm; the help text quoted here is from 0.21.36.

- **What it is.** A CLI, MCP server and Node API. It "uses a local accessibility bridge for iOS Simulator snapshots and XCTest for iOS interactions", and "ADB and the snapshot helper on Android". **[V]** [README](https://github.com/callstack/agent-device/blob/main/README.md)
- **What it reads.** A snapshot node holds `type`, `role`, `subrole`, `label`, `value`, `contentDescription`, `identifier`, `enabled`, `selected`, `checked`, `focused`, `heading`, `roleDescription`, `editable`, `visibleToUser`, `hittable` and a rect. **[V]** [`packages/kernel/src/snapshot.ts`](https://github.com/callstack/agent-device/blob/main/packages/kernel/src/snapshot.ts). `snapshot --actions` names "the affordances merged inside an element (iOS sim); not directly invokable". **[V]** `agent-device help snapshot`
- **What it asserts.** `is <predicate> <selector>` with `visible`, `hidden`, `exists`, `absent`, `editable`, `selected`, `focused`, `text`; `get attrs`; `wait`. Selector keys are `id`, `role`, `text`, `label`, `value`, `visible`, `hidden`, `editable`, `selected`, `focused`, `enabled`, `hittable`. **[V]** `agent-device help`, `agent-device help is`
- **Screen readers.** `settings` covers text size, appearance, animations and permissions, with no VoiceOver or TalkBack switch. **[V]** `agent-device help settings`. On Android API 24 and later its snapshot helper connects with `FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES` "so enabled accessibility services such as TalkBack can remain bound during snapshots and gestures". **[V]** [`android/snapshot-helper/README.md`](https://github.com/callstack/agent-device/blob/main/android/snapshot-helper/README.md). Its node has `focused` and no accessibility focus field. **[V]** [`snapshot.ts`](https://github.com/callstack/agent-device/blob/main/packages/kernel/src/snapshot.ts)
- **Modal scope.** Its iOS runner has a modal-scope capture of the accessibility tree. **[V]** that it exists, [`RunnerAXModalScopeCapture.h`](https://github.com/callstack/agent-device/blob/main/apple/runner/AgentDeviceRunner/AgentDeviceRunnerUITests/UnitTests/RunnerAXModalScopeCapture.h). What it reports for content behind a React Native modal wasn't examined.
- **Spec.** A `.ad` script, one command per line, run by `agent-device test <glob>` with retries, sharding across devices and a JUnit reporter. It also runs "a supported Maestro YAML subset". **[V]** `agent-device help test`, `agent-device help scripting`

  ```
  open dev.example.fixtures --relaunch
  press 'role="button" label="Billing"' --settle
  is selected 'label="Billing"'
  close
  ```

- **Caveat it states itself.** "`hittable: false` on a resolved element does not block dispatch (iOS AX flags are unreliable on deep RN trees)". **[V]** `agent-device help workflow`
- **Run time and flakiness.** `--settle` waits for the UI to go quiet with a 10 second default deadline. **[V]** `agent-device help snapshot`. It is the youngest tool here: version 0.21, with 0.21.37 published the day this was written. **[V]** npm registry. **[I]** Its interface may move under a test suite.
- **CI.** "Apple CI: prepare ios-runner after boot/install, before replay/test". **[V]** `agent-device help workflow`
- **Fit.** It is what the agent layer's `snapshot` and `act` look like on a device, which issue #2 lists as sharing ground with testing. **[I]**

### What exists beside these

- **Guidepup**, which this repo uses in its virtual form for web specs, drives "NVDA on Windows", "Orca on Linux" and VoiceOver on macOS. Not iOS and not TalkBack. **[V]** [README](https://github.com/guidepup/guidepup/blob/main/README.md)
- No virtual screen reader for React Native trees was found. **[I]** The absence was not searched exhaustively.

## Running on GitHub Actions

- **Price.** Standard GitHub-hosted runners are free in public repositories. Elsewhere, per minute: Linux 2-core $0.006, macOS 3 or 4-core $0.062, macOS 12-core larger $0.077, macOS M2 Pro 5-core larger $0.102. Larger runners are billed in public repositories too. **[V]** [GitHub: Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing), [GitHub: Billing for Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- **This repository.** `floklein/rn-ui` is public, so standard macOS and Linux runners cost nothing. **[V]** `gh repo view floklein/rn-ui --json visibility`. If it went private, a 20 minute iOS job would cost $1.24 and a 20 minute Android job on Linux $0.12. **[I]**
- **macOS runners.** `macos-latest`, `macos-15`, `macos-26`: 3 vCPU (M1), 7 GB of memory, 14 GB of storage. Intel: `macos-15-intel`, `macos-26-intel`, 4 vCPU and 14 GB. **[V]** [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- **iOS simulators.** The `macos-26` arm64 image (20261102) ships iOS 26.2, 26.4 and 26.5 simulators. **[V]** [`macos-26-arm64-Readme.md`](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)
- **Android emulators.** On arm64 macOS runners, "nested-virtualization is not supported", so no emulator there. "GitHub-hosted Linux runners support hardware acceleration for Android SDK tools." **[V]** [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). The usual action enables KVM with a udev rule first, and calls Ubuntu runners "2-3 times faster" than macOS ones. **[V]** [`android-emulator-runner` v2.38.0](https://github.com/ReactiveCircus/android-emulator-runner/blob/main/README.md)
- **Linux runners.** 4 vCPU and 16 GB in public repositories, 2 vCPU and 8 GB in private ones. **[V]** [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- **Shape of a job.** **[I]** Two jobs: iOS on `macos-26`, Android on `ubuntu-latest`. Each builds the fixture app natively, boots a device, and runs the specs. The native build dominates, and 7 GB of memory on the macOS runner is tight for an Xcode build beside a simulator. Caching the built app, keyed on the native dependencies, lets most runs skip the build since ui-sdk's own code is JavaScript.
- **Not measured.** No job was run for this research. Build and spec times on these runners are the first numbers a prototype should record.

## JS only versus a booted device

| Can be asserted | In Jest, no device | On a booted device |
| --- | --- | --- |
| The `role` a part sets, as written | Yes | Android: class or role description. iOS: a trait for some roles, nothing for `tab`, `menu`, `menuitem`, `combobox`, `toolbar`, `radiogroup` |
| Accessible name | Yes, as RNTL computes it | Yes, as the platform computes it |
| disabled, selected, checked | Yes | Yes. On iOS, checked is a word inside the value string |
| expanded, busy | Yes | iOS: a word in the value string. Android: expanded as the offered action |
| Value: min, max, now, text | Yes | iOS: value, and min and max through Appium. Android: not in any tool's listed attributes |
| An action is declared and its handler runs | Yes | Declared: Appium on both, `agent-device` on the iOS simulator. Run: Detox, around the platform |
| A press, a gesture, a drag changes state | A simulated press event | Yes, with real touches and real layout |
| Input focus | No | Yes, every device tool |
| Screen reader focus moved to the opened popup | Only that `setAccessibilityFocus` was called | Android with TalkBack on, through Appium. iOS: no |
| An announcement was made | Only that `announceForAccessibility` was called | Android: live region attribute. Spoken text: not readable by any tool here |
| Content behind a modal is hidden | From props, on both platforms alike | What the tree holds, per platform. Needs a prototype |
| Hardware keyboard: arrows, Escape, Tab | No | **[I]** Possible on a simulator through key events; not researched here |
| Right to left | **[I]** By mocking `I18nManager` | By launching the app in a right to left locale |
| Contrast, touch target size, text clipping, Dynamic Type | No | Apple's audit and ATF |
| Positioning, animation, scrolling | No | Yes |
| What VoiceOver says | No | No. Physical device only, outside hosted CI |
| What TalkBack says | No | Not documented by any tool; developer settings can display or log it |

## What a native counterpart of the WAI-ARIA check could assert

The web check has two halves: a static read of roles, states, names and references, and a drive of the pattern's keys with focus checked after each. Each half has a native form, but neither is a port.

### Level 1: in JavaScript, over the rendered props

A `checkPattern` for the native host that takes a rendered tree and a pattern name, and runs under Jest with no device. **[I]** throughout; the facts it stands on are verified above.

- **Roles and ownership.** The root has the pattern's role, and its items have theirs: a `tablist` holds `tab`, a `menu` holds `menuitem`, a `radiogroup` holds `radio`. This is the only level that can check it on iOS.
- **Required states.** A `tab` has `aria-selected` and exactly one is selected; a `checkbox`, `radio` or `switch` has `aria-checked`; a disclosure trigger and a combobox have `aria-expanded`; a `slider` has `aria-valuenow`, `aria-valuemin` and `aria-valuemax`.
- **Names.** Every interactive element has an accessible name, a tablist and a dialog have one, each slider thumb has its own.
- **References.** Only `aria-labelledby`, on Android: its `nativeID` exists in the tree. The `aria-controls` and `aria-activedescendant` rules have no native form and drop out.
- **One accessibility element per item.** The native analogue of "one tab stop per composite" is that each item is exactly one `accessible` element and has no accessible descendants that would split or duplicate it.
- **Hidden content.** A closed panel or popup is absent or hidden from accessibility; a modal marks itself with `aria-modal` and, for Android, hides its siblings with `importantForAccessibility`. Checked per platform, since RNTL's own helper doesn't distinguish.
- **Actions in place of keys.** Where the web check presses a key, the native check performs the gesture or action a screen reader user has: `activate` selects a tab, toggles a checkbox, opens a disclosure; `increment` and `decrement` step a slider between its bounds; `expand` and `collapse` open and close; `escape` on iOS dismisses a dialog or a menu. Each is declared in `accessibilityActions`, handled, and leaves the state the pattern says.
- **Focus intent.** After opening a dialog or a menu, `setAccessibilityFocus` or `sendAccessibilityEvent` was called for an element inside it, and after closing, for the trigger. Only the call is checked.
- **`checkDirection`.** State after a horizontal action or swipe is mirrored when `I18nManager.isRTL` is true.
- **`checkServer`.** No native form is needed for rendering on a server, but its core rule holds: creating the primitive reads no host API, and every part's props read state alone. That is checkable in Node without React Native loaded.

What this level can't see: whether the platform built the element the props describe, where focus really went, anything about layout, and the screen reader.

### Level 2: on a simulator and an emulator, over the platform's tree

The counterpart of `<name>.a11y.spec.ts` and of the behavior specs. Verified capabilities are in the tool sections; how they compose is **[I]**.

- **The tree that was built.** Each item is one accessibility element with the expected label; selected, disabled and checked match the state; on iOS the value string holds `checked` or `expanded`; on Android the class or role description matches the role and `ACTION_EXPAND` or `ACTION_COLLAPSE` matches the state. A snapshot of this tree per state is the native `toMatchAriaSnapshot`.
- **Declared actions.** The item offers the actions the pattern needs: iOS custom actions and Android's action list, both through Appium.
- **Behavior with real input.** Tap, long press, swipe and drag change state and the tree follows; a popup opens next to its trigger and stays on screen; scrolling, dismissal by tapping outside, and the Android back button work.
- **Nothing reachable behind a modal.** Elements behind an open dialog are absent from the tree or not accessible, on each platform.
- **Input focus.** A text field inside an opened popup takes focus, and it returns on close.
- **Platform audits as the native axe.** Apple's audit through Appium (element description, hit region, trait, contrast, Dynamic Type, clipped text) and ATF through Espresso (speakable text, touch target, class name, traversal order, contrast) on each state, with page-level rules turned off the way the web specs turn off axe's.
- **Right to left.** The same specs with the app launched in a right to left locale.

What this level can't see: on iOS, the role for most composite patterns, and screen reader focus.

### Level 3: with a screen reader running

The counterpart of `<name>.sr.spec.ts`.

- **Android.** With TalkBack installed on the emulator image, enabled through `adb`, and Appium told not to suppress accessibility services, a spec can swipe to the next element and read which node has accessibility focus: after a dialog opens, focus is inside it; swiping never reaches content behind it; closing returns focus to the trigger; the swipe order through a menu is the item order. **[I]** composed from the verified capability and attributes; untested.
- **iOS.** Not possible on a simulator. A physical iPhone is outside GitHub-hosted runners, so VoiceOver stays a manual check or a self-hosted one. **[V]** for the premise, [Apple](https://developer.apple.com/documentation/accessibility/performing-accessibility-testing-for-your-app)
- **Spoken phrases.** No tool reads what either screen reader says. A phrase log like the web's would have to be computed from the tree (label, value, role or trait, state), which is a virtual screen reader for React Native that doesn't exist yet. **[I]**

### What follows for the decision

**[I]**, for issue #19 to weigh.

- The pattern check belongs at level 1. It is the only level that sees roles on iOS, it runs in Node like the web check does, and it is the one users of the adapter can run on what they build.
- Level 2 needs one device tool. Appium reads the most and is the only JavaScript route to Apple's audit and to TalkBack focus; Maestro is the cheapest to write and is what Expo documents, but can't check roles, values or actions; Detox trails React Native by four minors today; `agent-device` reads nearly as much as Appium with far less setup and matches the agent layer, at the cost of a young interface.
- Level 3 is Android only in CI. Whether it is worth its setup depends on how much of focus management the first tier of components needs proven.
- The gaps that no level closes automatically are VoiceOver itself and spoken output on both platforms.

## Not verified here

- Any run time, flake rate or CI duration. Nothing was booted.
- That Appium's `extras` attribute carries React Native's role description on Android.
- What XCTest's snapshot holds for elements behind a view with `accessibilityViewIsModal`, and whether Appium's `accessible` attribute reflects it.
- That TalkBack on a CI emulator can be installed without a Google Play image, and that its focus is stable enough to assert on.
- Hardware keyboard navigation on either platform (iOS Full Keyboard Access, Android focus traversal). The APG keys the web check presses may matter for it; this research didn't cover it.
- Pricing and versions will drift: each is dated 2026-11-13.
