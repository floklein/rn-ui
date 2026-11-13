# What React Native gives for accessibility, focus and keyboards

Research for [issue #5](https://github.com/floklein/rn-ui/issues/5), part of the React Native effort mapped in [issue #2](https://github.com/floklein/rn-ui/issues/2). Written on 2026-11-13.

## Versions this holds for

| What                 | Version                                                                           | Source                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| React Native, stable | 0.88.1 (2026-10-27)                                                               | npm `react-native` dist-tag `latest`                                                                                  |
| React Native, next   | 0.89.0-rc.1 (2026-11-10)                                                          | npm dist-tag `next`                                                                                                   |
| Expo SDK, stable     | 58 (`expo@58.0.25`), ships React Native 0.88, React 19.3.0, iOS 16.4+, Android 7+ | [Expo SDK reference](https://docs.expo.dev/versions/latest/); `expo-template-blank@sdk-58` pins `react-native` 0.88.1 |
| Older Expo SDKs      | 57 → 0.86, 56 → 0.85, 55 → 0.83, 54 → 0.81, 53 → 0.79, 52 → 0.76                  | `expo-template-blank@sdk-N` on npm                                                                                    |

Every source fact below was read in the React Native repository at tag [`v0.88.1`](https://github.com/react/react-native/tree/v0.88.1) (commit `c30b7f86`), unless a different version is named. The repository now lives at `react/react-native`; `facebook/react-native` redirects to it. Paths are relative to `packages/react-native/`. "0.89" means the `0.89.0-rc.0` section of the [changelog on `main`](https://github.com/react/react-native/blob/main/CHANGELOG.md), which is not released as stable yet.

How to read the marks:

- **Verified**: read in the source, the changelog or the platform's own documentation, linked.
- **Inferred**: follows from verified facts but was not observed. Nothing here was run on a device, so what VoiceOver or TalkBack actually says is inferred from what React Native sets on the native element.

## The short answer

1. **Roles and states pass through, but the mapping is lossy and differs by platform.** React Native accepts `role` and a subset of `aria-*` on host components. iOS reduces a role to a handful of `UIAccessibilityTraits`. Android reduces it to a class name plus a role description string. Dialog, listbox, option, tabpanel, group and tooltip reach neither screen reader as a role. `listbox`, `menuitemcheckbox`, `menuitemradio`, `gridcell` and `textbox` are not in React Native's `Role` type at all.
2. **Relationships do not exist.** There is no `aria-controls`, `aria-describedby`, `aria-activedescendant`, `aria-owns`, `aria-haspopup`, `aria-orientation`, `aria-multiselectable`, `aria-posinset` or `aria-setsize`. `aria-labelledby` is Android only and takes one id.
3. **Accessibility focus can be moved but not observed.** `AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')` moves it on both platforms. Nothing tells JavaScript where the screen reader's focus is or when it moves.
4. **Holding focus in a modal is native, not scripted.** iOS has `accessibilityViewIsModal`. Android has no equivalent prop: the choices are `Modal` (its own window) or hiding the siblings with `importantForAccessibility="no-hide-descendants"`.
5. **Live regions are Android only.** iOS has only imperative announcements.
6. **Hardware keyboards: a JavaScript component cannot receive key events on a `View` in a stable build, on either platform.** Android has `onKeyDown` and `onKeyUp`, and both platforms have `ref.focus()` on a `View`, but all of it sits behind native feature flags that are off and that only native code can turn on. Without them, Android gives native focus traversal with `onFocus`, `onBlur` and a click on Enter; iOS gives Full Keyboard Access traversal and activation, with no focus events.
7. **Right to left is app wide and fixed at startup.** `I18nManager.isRTL` is a constant; changing it needs a reload.
8. **No React Native version gives all of this.** 0.88 (Expo SDK 58) is the sensible floor, and the adapter has to translate roles itself rather than pass `role` through.

## Roles and ARIA props versus the `accessibility*` props

### What is accepted

`View` destructures these and rewrites them in JavaScript before the native component sees them ([`Libraries/Components/View/View.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/View.js#L34-L118), verified):

| Web-style prop                                                                 | Becomes                                                                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `aria-label`                                                                   | `accessibilityLabel`                                                                            |
| `aria-labelledby` (comma-separated string)                                     | `accessibilityLabelledBy` (array)                                                               |
| `aria-live` (`off` \| `polite` \| `assertive`)                                 | `accessibilityLiveRegion` (`none` \| `polite` \| `assertive`)                                   |
| `aria-hidden`                                                                  | `accessibilityElementsHidden`, plus `importantForAccessibility="no-hide-descendants"` when true |
| `aria-busy`, `aria-checked`, `aria-disabled`, `aria-expanded`, `aria-selected` | merged into `accessibilityState`                                                                |
| `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`            | merged into `accessibilityValue`                                                                |
| `id`                                                                           | `nativeID`                                                                                      |
| `tabIndex`                                                                     | `focusable = !tabIndex`, so `0` is focusable and `-1` is not                                    |

`role` is not rewritten in JavaScript. It goes to native as its own prop, next to `accessibilityRole`, and wins when both are set ([`AccessibilityProps.cpp`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/components/view/AccessibilityProps.cpp#L20-L40), [`ReactAccessibilityDelegate.kt` `fromViewTag`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L548-L556), verified).

These aliases and `role` have existed since 0.71 ([changelog for 0.7x](https://github.com/react/react-native/blob/v0.88.1/CHANGELOG-0.7x.md), verified).

Three traps in 0.88.1, all verified in source:

- **`aria-modal` does nothing on a `View`.** `View.js` does not read it and no native code does. Only `Pressable` and the `Touchable*` components map it to `accessibilityViewIsModal` ([`Pressable.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/Pressable/Pressable.js#L277-L278)). 0.89 fixes this ("`aria-modal` on `View` now sets `accessibilityViewIsModal`"). Use `accessibilityViewIsModal` directly.
- **`role` can remove a role.** Because `role` wins, a `role` with no native mapping hides a working `accessibilityRole`. On Android `fromRole` returns `null` for an unmapped role and the `accessibilityRole` tag is never consulted. On iOS `role="slider"` yields no trait, where `accessibilityRole="adjustable"` yields `UIAccessibilityTraitAdjustable`; 0.89 fixes that one case.
- **The `Role` type is narrower than ARIA.** It has 65 values and lacks `listbox`, `menuitemcheckbox`, `menuitemradio`, `gridcell`, `textbox` and `search` ([`ViewAccessibility.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewAccessibility.js#L60-L125)). An unknown string logs an error and falls back to none ([`accessibilityPropsConversions.h`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/components/view/accessibilityPropsConversions.h)).

What follows for the adapter (inferred): translate core's ARIA output into `accessibilityRole`, `accessibilityState`, `accessibilityValue`, `accessibilityLabel`, `accessibilityHint` and `accessibilityActions` in one place, per platform, and do not forward `role` or `aria-*` blindly.

### How iOS presents a role

A role becomes a bit mask of traits ([`accessibilityPropsConversions.h` `fromString`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/components/view/accessibilityPropsConversions.h#L24-L117), verified). Only these role strings produce a trait:

| Role string                          | Trait                                       |
| ------------------------------------ | ------------------------------------------- |
| `button`, `togglebutton`             | Button                                      |
| `link`                               | Link                                        |
| `image`, `img`                       | Image                                       |
| `header`, `heading`                  | Header                                      |
| `search`                             | SearchField                                 |
| `adjustable`                         | Adjustable                                  |
| `switch`                             | a private switch trait (`0x20000000000001`) |
| `tabbar`                             | TabBar                                      |
| `summary`                            | SummaryElement                              |
| `progressbar`                        | UpdatesFrequently                           |
| `text`, `keyboardkey`, `imagebutton` | StaticText, KeyboardKey, Image + Button     |

Every other role gives no trait. UIKit has no trait for checkbox, radio, tab, menu, menu item, dialog, combobox or option ([`UIAccessibilityTraits`](https://developer.apple.com/documentation/uikit/uiaccessibilitytraits), verified). React Native fills two gaps by writing words into `accessibilityValue`: "checkbox" and "radio button", followed by "checked", "unchecked", "mixed", "expanded" or "busy" ([`RCTViewComponentView.mm` `accessibilityValue`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1569-L1638), verified). `selected` adds the Selected trait and `disabled` adds NotEnabled.

Two more iOS details, verified:

- `expanded: false` says nothing in 0.88.1. Only `true` adds "expanded". 0.89 adds "collapsed".
- `accessibilityValue` with `min`, `max` and `now` is spoken as a percentage computed as `now / (max - min)`, which ignores a non-zero `min`. Pass `text` when `min` is not 0.

### How Android presents a role

A role sets `AccessibilityNodeInfo.className`, which TalkBack turns into a role, and sometimes a `roleDescription` string ([`ReactAccessibilityDelegate.kt` `getValue`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L457-L500) and [`setRole`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L647-L719), verified). TalkBack's own role table has button, check box, radio button, switch, toggle button, seek control, drop-down list, progress bar, edit text, list, grid, tab bar, pager, dialog and alert dialog, and nothing for menu, menu item, tab, combobox, option or tab panel ([TalkBack `Role.java`](https://github.com/google/talkback/blob/master/utils/src/main/java/com/google/android/accessibility/utils/Role.java), verified).

ARIA `role` values map through `fromRole` ([source](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L517-L546), verified). Mapped: `alert`, `button`, `checkbox`, `combobox`, `grid`, `heading`, `img`, `link`, `list`, `menu`, `menubar`, `menuitem`, `progressbar`, `radio`, `radiogroup`, `scrollbar`, `searchbox`, `slider`, `spinbutton`, `summary`, `switch`, `tab`, `tablist`, `timer`, `toolbar`. Everything else, including `dialog`, `alertdialog`, `option`, `tabpanel`, `group`, `tooltip`, `tree`, `treeitem`, `listitem`, `row`, `region`, `status`, `log` and `separator`, maps to nothing.

States ([`BaseViewManager.java` `setViewState`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L363-L417), [`ReactAccessibilityDelegate.kt` `setState`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L625-L643), verified):

- `selected` sets `isSelected`; React Native announces "unselected" itself because Android does not.
- `disabled` sets `isEnabled = false` on the node and `setEnabled(false)` on the view.
- `checked` as a boolean sets `isCheckable` and `isChecked`. `"mixed"` and `busy` are appended to the content description as words.
- `expanded` adds `ACTION_EXPAND` or `ACTION_COLLAPSE` to the node, which is how TalkBack knows the state.

`accessibilityValue` with `min`, `max` and `now` becomes a real `RangeInfo`, so TalkBack treats it as a range ([source](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L139-L166), verified).

### Actions

`accessibilityActions` plus `onAccessibilityAction` are the only way a screen reader user can do something other than activate ([Accessibility guide](https://reactnative.dev/docs/accessibility#accessibility-actions), verified).

| Action name              | iOS                                                   | Android                                           |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| `activate`               | double tap                                            | `ACTION_CLICK`                                    |
| `increment`, `decrement` | swipe up or down on an Adjustable element             | `ACTION_SCROLL_FORWARD`, `ACTION_SCROLL_BACKWARD` |
| `longpress`              | no                                                    | `ACTION_LONG_CLICK`                               |
| `expand`, `collapse`     | no                                                    | `ACTION_EXPAND`, `ACTION_COLLAPSE`                |
| `escape`                 | two-finger scrub, also `onAccessibilityEscape`        | no                                                |
| `magicTap`               | two-finger double tap, also `onMagicTap`              | no                                                |
| custom name with `label` | `UIAccessibilityCustomAction`, in the rotor's Actions | custom action in the TalkBack menu                |

Sources: [`ViewAccessibility.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewAccessibility.js#L127-L160), [`ReactAccessibilityDelegate.kt` `actionIdMap`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.kt#L565-L572), [`RCTViewComponentView.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1647-L1731), all verified.

Actions matter more on native than on the web, because they replace the arrow keys for a screen reader user: a slider needs `increment` and `decrement`, a dismissible popup needs `escape` on iOS, and anything reachable only by a gesture needs a custom action (inferred).

## The mapping table

What core emits most, and what React Native 0.88.1 hands to each screen reader. "Words" means React Native writes a localized string into the element's value or description instead of a native role or state. Support marks: **full**, **partial**, **none**.

### Roles

| ARIA role (core)                    | In RN `Role` type | VoiceOver (iOS)                                                                | TalkBack (Android)                                                  | Support                                      |
| ----------------------------------- | ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------- |
| `button`                            | yes               | Button trait                                                                   | `android.widget.Button`, clickable                                  | full                                         |
| `link`                              | yes               | Link trait                                                                     | role description "link"                                             | full                                         |
| `switch`                            | yes               | switch trait, value "1" or "0"                                                 | `android.widget.Switch`                                             | full                                         |
| `checkbox`                          | yes               | no trait; words "checkbox", "checked" / "unchecked" / "mixed"                  | `android.widget.CheckBox`, checkable                                | partial on iOS, full on Android              |
| `radio`                             | yes               | no trait; words "radio button", "checked" / "unchecked"                        | `android.widget.RadioButton`                                        | partial on iOS, full on Android              |
| `radiogroup`                        | yes               | nothing                                                                        | role description only                                               | partial                                      |
| `tab`                               | yes               | no trait; Selected trait from `selected`                                       | role description "tab"; `isSelected`                                | partial                                      |
| `tablist`                           | yes               | nothing from `role`; `accessibilityRole="tabbar"` gives the TabBar trait       | role description only                                               | partial                                      |
| `tabpanel`                          | yes               | nothing                                                                        | nothing                                                             | none                                         |
| `dialog`, `alertdialog`             | yes               | nothing                                                                        | nothing (TalkBack's dialog role needs a real `Dialog` window)       | none as a role                               |
| `menu`, `menubar`                   | yes               | nothing                                                                        | role description only                                               | partial                                      |
| `menuitem`                          | yes               | nothing                                                                        | role description only                                               | partial                                      |
| `menuitemcheckbox`, `menuitemradio` | no                | nothing                                                                        | nothing                                                             | none                                         |
| `listbox`                           | no                | nothing                                                                        | nothing                                                             | none                                         |
| `option`                            | yes               | no trait; Selected trait from `selected`                                       | nothing; `isSelected`                                               | none as a role                               |
| `combobox`                          | yes               | nothing                                                                        | role description only                                               | partial                                      |
| `slider`                            | yes               | nothing in 0.88.1; Adjustable in 0.89, or via `accessibilityRole="adjustable"` | `android.widget.SeekBar` with `RangeInfo`                           | partial on iOS, full on Android              |
| `spinbutton`                        | yes               | nothing                                                                        | role description only (the class name it sets is not a real widget) | partial                                      |
| `progressbar`                       | yes               | UpdatesFrequently trait                                                        | role description only                                               | partial                                      |
| `group`, `region`, `toolbar`        | yes               | nothing                                                                        | nothing, except a description for `toolbar`                         | none                                         |
| `grid`, `row`, `gridcell`           | `gridcell` no     | nothing                                                                        | `grid` → `android.widget.GridView`; rows and cells nothing          | none                                         |
| `tree`, `treeitem`                  | yes               | nothing                                                                        | nothing                                                             | none                                         |
| `status`, `log`, `alert`            | yes               | nothing                                                                        | `alert` gets a role description; no implied live region             | none                                         |
| `tooltip`, `separator`              | yes               | nothing                                                                        | nothing                                                             | none                                         |
| `heading`                           | yes               | Header trait                                                                   | `isHeading`                                                         | full, but no `aria-level`                    |
| `img`                               | yes               | Image trait                                                                    | `android.widget.ImageView`                                          | full                                         |
| `none`, `presentation`              | yes               | no role                                                                        | no role                                                             | full (`accessible={false}` is the real tool) |

### States and properties

| ARIA (core)                                                           | React Native                                                              | VoiceOver (iOS)                                           | TalkBack (Android)                       | Support                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| `aria-disabled`                                                       | `accessibilityState.disabled`                                             | NotEnabled trait ("dimmed")                               | `isEnabled = false`, view disabled       | full                            |
| `aria-selected`                                                       | `accessibilityState.selected`                                             | Selected trait                                            | `isSelected`                             | full                            |
| `aria-checked`                                                        | `accessibilityState.checked` (`true`, `false`, `'mixed'`)                 | words, or switch value                                    | `isChecked`; "mixed" as a word           | full                            |
| `aria-pressed`                                                        | none; closest is `togglebutton` with `checked`, or `selected`             | Button trait plus words or Selected                       | `android.widget.ToggleButton`, checkable | partial                         |
| `aria-expanded`                                                       | `accessibilityState.expanded`                                             | "expanded" only; "collapsed" from 0.89                    | expand or collapse action on the node    | partial on iOS in 0.88          |
| `aria-busy`                                                           | `accessibilityState.busy`                                                 | word "busy"                                               | word "busy"                              | partial                         |
| `aria-valuenow`, `-min`, `-max`, `-valuetext`                         | `accessibilityValue`                                                      | value string; percentage ignores `min`                    | `RangeInfo`, or text                     | full with `text`                |
| `aria-label`                                                          | `accessibilityLabel`                                                      | label                                                     | content description                      | full                            |
| `aria-labelledby`                                                     | `accessibilityLabelledBy` (`nativeID`)                                    | **ignored**                                               | `setLabeledBy`, **first id only**        | none on iOS, partial on Android |
| `aria-describedby`, `aria-description`                                | none; closest is `accessibilityHint` (a string, not a reference)          | hint                                                      | tooltip text                             | partial, by copying the text    |
| `aria-controls`, `aria-owns`, `aria-flowto`, `aria-details`           | none                                                                      | —                                                         | —                                        | none                            |
| `aria-activedescendant`                                               | none                                                                      | —                                                         | —                                        | none                            |
| `aria-haspopup`, `aria-autocomplete`                                  | none                                                                      | —                                                         | —                                        | none                            |
| `aria-orientation`, `aria-multiselectable`                            | none                                                                      | —                                                         | —                                        | none                            |
| `aria-posinset`, `aria-setsize`, `aria-level`                         | none public (`accessibilityCollectionItem` is internal to lists, Android) | —                                                         | —                                        | none                            |
| `aria-required`, `aria-invalid`, `aria-readonly`, `aria-errormessage` | none                                                                      | —                                                         | —                                        | none                            |
| `aria-current`, `aria-keyshortcuts`, `aria-roledescription`           | none                                                                      | —                                                         | —                                        | none                            |
| `aria-hidden`                                                         | `accessibilityElementsHidden` + `importantForAccessibility`               | subtree hidden                                            | subtree hidden                           | full                            |
| `aria-live`, `aria-atomic`                                            | `accessibilityLiveRegion`                                                 | **ignored**                                               | live region; no `atomic`                 | none on iOS                     |
| `aria-modal`                                                          | `accessibilityViewIsModal`                                                | siblings ignored (not via `aria-modal` on `View` in 0.88) | **ignored**                              | none on Android                 |

Sources for the "ignored" cells, verified: no file under `React/` (the iOS implementation) mentions `liveRegion` or `labelledBy`; `accessibilityLabelledBy`, `accessibilityLiveRegion`, `importantForAccessibility` and `screenReaderFocusable` are typed Android only and `accessibilityViewIsModal`, `accessibilityElementsHidden`, `accessibilityLanguage` and `accessibilityRespondsToUserInteraction` iOS only in [`ViewAccessibility.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewAccessibility.js#L214-L350); Android takes the first `labelledBy` id in [`BaseViewManager.java`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L313-L327).

### What this means for the patterns core relies on

- **`aria-activedescendant` has no counterpart, and neither platform has the idea.** A screen reader on a phone moves its own cursor over real elements; there is no "focus stays here while a descendant is active". Combobox, Autocomplete, Command and any listbox driven from an input need a different model on native: each option is its own accessible element that the screen reader reaches by swiping (inferred).
- **`aria-controls` and `aria-describedby` cannot be expressed.** The trigger-to-popup link is lost. A description has to be copied into `accessibilityHint` as text, and on iOS a label reference has to be resolved to its text and passed as `accessibilityLabel`.
- **Composite roles are flat.** Listbox, menu, tree and grid have no container semantics and no "3 of 7". Position has to be spoken through the label or value if it is wanted at all.

## Accessibility focus

### Moving it

`AccessibilityInfo.sendAccessibilityEvent(hostInstance, 'focus')` is the supported call; `setAccessibilityFocus(reactTag)` is deprecated since 0.85 ([API reference](https://reactnative.dev/docs/accessibilityinfo), [`AccessibilityInfo.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo.js#L428-L451), verified).

- iOS posts `UIAccessibilityLayoutChangedNotification` with the view as its argument ([`RCTMountingManager.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/RCTMountingManager.mm#L342-L348), verified). Apple documents that argument as "the accessibility element for VoiceOver to move to" ([layoutChanged](https://developer.apple.com/documentation/uikit/uiaccessibility/notification/layoutchanged), verified). `'focus'` is the only event type iOS acts on.
- Android sends `TYPE_VIEW_FOCUSED` from the view; `'click'`, `'viewHoverEnter'` and `'windowStateChange'` also exist there ([`FabricUIManager.java`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/fabric/FabricUIManager.java#L1361-L1376), verified).

The target must be an accessibility element, and the call is a request the screen reader may decline (inferred from both platforms' documentation). Timing matters: the element must be mounted and laid out first.

### Hearing it move

Not possible. No prop, event or module reports where accessibility focus is. A search of the JavaScript, iOS, Android and C++ sources for `onAccessibilityFocus`, `accessibilityElementDidBecomeFocused`, `TYPE_VIEW_ACCESSIBILITY_FOCUSED` and `ElementFocusedNotification` finds nothing (verified). UIKit does post [`elementFocusedNotification`](https://developer.apple.com/documentation/uikit/uiaccessibility/elementfocusednotification), but React Native does not forward it.

What JavaScript can know: whether a screen reader is on (`AccessibilityInfo.isScreenReaderEnabled()` and the `screenReaderChanged` event), and that an element was activated (`onPress`, `onAccessibilityTap`, `onAccessibilityAction`).

Consequence (inferred): core features that react to focus, such as "highlight follows focus", roving tab stops and "close when focus leaves", cannot be driven by the screen reader's cursor. They need an activation, an action, or a native module.

### Holding it inside a modal

| Tool                                                                | iOS                                                                               | Android                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `accessibilityViewIsModal`                                          | VoiceOver ignores "the elements within views that are siblings of the receiver"   | no effect                                                           |
| `importantForAccessibility="no-hide-descendants"` on the background | no effect                                                                         | hides that subtree from TalkBack                                    |
| `accessibilityElementsHidden` on the background                     | hides that subtree from VoiceOver                                                 | no effect                                                           |
| `aria-hidden` on the background                                     | sets both of the above                                                            | sets both of the above                                              |
| `Modal`                                                             | a presented view controller; saves the focused element and restores it on dismiss | a `Dialog` in its own window; Back and Escape call `onRequestClose` |

Sources, verified: the [Accessibility guide](https://reactnative.dev/docs/accessibility#accessibilityviewismodal-ios) for the sibling rule ("if a window contains sibling views A and B, setting `accessibilityViewIsModal` to true on view B causes VoiceOver to ignore the elements in view A. On the other hand, if view B contains a child view C and you set `accessibilityViewIsModal` to true on view C, VoiceOver does not ignore the elements in view A"); [`RCTModalHostViewComponentView.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm#L236-L251) for save and restore; [`ReactModalHostView.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt#L307-L316) for Back and Escape.

The sibling rule is the catch for "popups work without portals": `accessibilityViewIsModal` only hides siblings of the view it is on, so a popup rendered deep in the tree does not hide the rest of the screen on iOS. On Android there is no modal flag at all. A cross-platform trap without `Modal` means marking everything outside the popup `aria-hidden`, which needs the popup and the background to be separable in the tree (inferred).

Dismissal by a screen reader user, verified: iOS has the escape gesture, delivered to `onAccessibilityEscape` or the `escape` action on the element or an ancestor ([`accessibilityPerformEscape`](<https://developer.apple.com/documentation/objectivec/nsobject-swift.class/accessibilityperformescape()>)). Android has the Back gesture, which reaches `BackHandler` in the main window or `onRequestClose` in a `Modal`.

## Announcements and live regions

| Need                               | iOS                                                                                                  | Android                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Say a string now                   | `AccessibilityInfo.announceForAccessibility` → `UIAccessibilityAnnouncementNotification`             | same call → `AccessibilityEvent.TYPE_ANNOUNCEMENT`               |
| Queue or prioritize                | `announceForAccessibilityWithOptions` with `queue`; `priority` (`low`, `default`, `high`) on iOS 17+ | options ignored                                                  |
| Know it was spoken                 | `announcementFinished` event                                                                         | no                                                               |
| Region that speaks when it changes | **no**                                                                                               | `accessibilityLiveRegion` / `aria-live`, `polite` or `assertive` |

Sources, verified: [`RCTAccessibilityManager.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/CoreModules/RCTAccessibilityManager.mm#L318-L350), [`AccessibilityInfoModule.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/accessibilityinfo/AccessibilityInfoModule.kt#L282-L292), [`BaseViewManager.java` `setAccessibilityLiveRegion`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L543-L552), [`AccessibilityInfo` reference](https://reactnative.dev/docs/accessibilityinfo). Priority landed in 0.84.

Three things to know:

- **Android is moving away from announcements.** `View.announceForAccessibility` is "deprecated in API level 36. Use one of the methods described in the documentation above to semantically describe UI instead of using an announcement, as accessibility services may choose to ignore events dispatched with this method" ([Android `View` reference](<https://developer.android.com/reference/android/view/View#announceForAccessibility(java.lang.CharSequence)>), verified). React Native still sends the event, with the deprecation suppressed. Android recommends live regions, pane titles and state descriptions; React Native exposes only the first.
- **`aria-live` on a `View` can be lost on Android in 0.88.** 0.89 lists "A `View` with `aria-live` or `accessibilityLiveRegion` is no longer flattened, so the live region is announced" and "`aria-live` on `Text` now sets `accessibilityLiveRegion`" as fixes. Until then set `collapsable={false}` or put the prop on `Text` as `accessibilityLiveRegion` (inferred from the fix).
- **A cross-platform live region needs both mechanisms.** Android: `accessibilityLiveRegion`. iOS: watch the text and call `announceForAccessibility`. `status`, `log` and `alert` roles imply nothing on either platform. `aria-atomic` has no counterpart.

## Reading order and grouping

- **Grouping.** `accessible={true}` makes a `View` one accessibility element; its children stop being separately focusable and their text is concatenated into the label ([Accessibility guide](https://reactnative.dev/docs/accessibility#accessible); [`RCTViewComponentView.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1502-L1539) on iOS and `getTalkbackDescription` on Android, verified). On Android `accessible` also sets the view focusable for the keyboard ([`ReactViewManager.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewManager.kt#L94-L97)). `screenReaderFocusable` (Android, 0.80) groups for the screen reader without making the view keyboard focusable. This is the opposite default from the web: a pressable row swallows its children unless told otherwise.
- **Order.** By default the screen reader follows layout position, not tree order (inferred from platform behavior). `experimental_accessibilityOrder`, an array of `nativeID`s, sets it explicitly on both platforms since 0.80. It is exhaustive (unlisted elements are skipped) and nestable ([Accessibility guide](https://reactnative.dev/docs/accessibility#experimental_accessibilityorder), verified). **It is off in a stable build**: it is gated by the `enableAccessibilityOrder` feature flag, default `false`, release stage `canary` ([flag definition](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L161-L171), verified). An Expo app can turn it on with `reactNativeReleaseLevel: 'canary'` in [`expo-build-properties`](https://docs.expo.dev/versions/latest/sdk/build-properties/), which also turns on every other canary flag.
- **Hiding.** `aria-hidden` works on both platforms.
- **Language.** `accessibilityLanguage` is iOS only.

## Hardware keyboards

The honest summary: **React Native does not give a JavaScript component a keyboard on native.** It gives native focus traversal, and activation of the focused element. Arrow-key navigation, typeahead, Home and End, and Escape, which core implements in `keydown` handlers, have nothing to run on in a stable build.

### What a JavaScript component can observe without a native module

| Capability                               | iOS (0.88.1, stable)                                                                                                     | Android (0.88.1, stable)                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Key down and key up on a `View`          | **no.** There is no `onKeyDown` in the iOS view config and no `pressesBegan` handling in the Fabric view                 | **no in a stable build.** `onKeyDown`, `onKeyUp` exist since 0.84 behind `enableKeyEvents`, default off |
| Keys in a `TextInput`                    | `onKeyPress` (`key` only), `onSubmitEditing`                                                                             | `onKeyPress` for the soft keyboard only, "not the hardware keyboard inputs"; `onSubmitEditing`          |
| Make a view a keyboard focus stop        | automatic under Full Keyboard Access for accessible elements with an interactive trait or role; `focusable` is tvOS only | `focusable` or `tabIndex={0}`; also `accessible`                                                        |
| Know that keyboard focus arrived or left | **no.** `onFocus` and `onBlur` on a `View` fire only for first responder changes, behind `enableImperativeFocus`         | **yes.** `onFocus`, `onBlur` on any view since 0.81                                                     |
| Move keyboard focus from JavaScript      | **no** for a `View` (`ref.focus()` is a no-op without `enableImperativeFocus`); yes for `TextInput`                      | **no** for a `View`, same flag; yes for `TextInput`                                                     |
| Activate the focused element             | Space under Full Keyboard Access → accessibility activation → `onPress` or `onAccessibilityTap` (inferred)               | Enter, Space or D-pad center → click → `onPress`                                                        |
| Tab and arrow traversal                  | the system's, not observable                                                                                             | the system's focus search; `nextFocusUp`/`Down`/`Left`/`Right`/`Forward` props steer it                 |
| Trap keyboard focus                      | `accessibilityViewIsModal` under Full Keyboard Access (inferred), or `Modal`                                             | `Modal` (own window); otherwise no                                                                      |
| Escape                                   | no key event; VoiceOver's escape gesture only                                                                            | reaches `onRequestClose` inside a `Modal`; Back via `BackHandler` elsewhere                             |
| Global shortcuts                         | no (`RCTKeyCommands` is development only)                                                                                | no                                                                                                      |

Sources, all verified in 0.88.1:

- Feature flags: [`enableKeyEvents`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L426-L436) and [`enableImperativeFocus`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js#L394-L404) are `defaultValue: false`, `ossReleaseStage: 'none'`, so no release level turns them on. Both are unchanged on `main` as of 2026-11-13.
- "Overrides for common feature flags can only be defined in native" ([feature flags README](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/src/private/featureflags/__docs__/README.md)). A JavaScript library cannot enable them, and an Expo app would need a config plugin that patches native startup code.
- Android key events: [`JSKeyDispatcher.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/JSKeyDispatcher.kt), [`ReactSurfaceView.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactSurfaceView.kt#L199-L243), [event shape](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Types/CoreEventTypes.js#L329-L358): `key`, `code`, `altKey`, `ctrlKey`, `metaKey`, `shiftKey`, targeted at the focused view, with capture and bubble phases. The event is dispatched to JavaScript asynchronously, so a handler cannot cancel the native handling of the key (inferred).
- Android focus events: [`BaseViewManager.java` `BaseVMFocusChangeListener`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L1057-L1094). Android click on a focusable view: [`ReactViewManager.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewManager.kt#L419-L437), consumed by [`Pressability.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Pressability/Pressability.js#L530-L548).
- Imperative focus: [`ReactNativeElement.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/src/private/webapis/dom/nodes/ReactNativeElement.js#L154-L173), [`ReactViewManager.kt`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewManager.kt#L514-L524), [`RCTViewComponentView.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L1816-L1905).
- iOS Full Keyboard Access: [`RCTViewComponentView.mm`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm#L43-L105) and `canBecomeFocused`. Buttons and links were reachable before; 0.88.0 added "checkbox, radio, combobox, dropdownlist, menuitem, spinbutton, tab, option, searchbox, slider and treeitem roles". This is the one place where the ARIA `role` matters on iOS even though it produces no trait.
- `TextInput`: [`onKeyPress`](https://reactnative.dev/docs/textinput#onkeypress).

### What follows

- The keyboard on native is a system feature the adapter cooperates with, not one it drives. The work is making each interactive part an accessible element with the right role so the system's traversal reaches it and activates it.
- Android can reach parity with core's keyboard model only with the two flags on, which is the app's decision in native code. iOS cannot, even with flags, because there are no key events for a `View`.
- Anything more (arrow keys inside a listbox on iOS, a focus trap, shortcuts) needs a native module, which is a new peer dependency and so a decision for another ticket.

## Right to left

- `I18nManager.isRTL` is read once from native constants at startup ([`I18nManager.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/ReactNative/I18nManager.js), verified). `allowRTL` and `forceRTL` "take effect on the next app reload". There is no change event.
- Layout mirrors without any work: Yoga resolves `flexDirection: 'row'`, `start` and `end`, and the logical properties (`marginStart`, `paddingInlineStart`, `insetInlineStart`, `borderStartStartRadius`) against the direction; `left` and `right` are swapped too while `doLeftAndRightSwapInRTL` is true ([`StyleSheetTypes.js`](https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/StyleSheet/StyleSheetTypes.js), verified).
- The `direction` style (`'inherit' | 'ltr' | 'rtl'`) sets direction for a subtree, and nothing reads the resolved direction back for a given view (verified by absence of such an API). So core's `isRTL(element)` can only be answered app wide on native, or by the adapter carrying direction in context (inferred).
- Expo SDK 58: "RTL support is enabled by default". Before SDK 58 it was disabled in Expo Go. `supportsRTL` and `forcesRTL` are options of the `expo-localization` config plugin; `getLocales()[0].textDirection` gives the locale's direction; a runtime override needs `Updates.reloadAsync()` and "does not work in Expo Go" ([Expo localization guide](https://docs.expo.dev/guides/localization/), verified).
- 0.88.0 fixed two right-to-left bugs: direction is detected "from the active locale instead of an arbitrary installed one" (Android), and text aligns right by default on iOS, matching Android.
- Screen reader order follows the mirrored layout (inferred). Arrow-key direction, which core swaps in right to left, is moot without key events.

## Minimum React Native version

No version provides everything the question lists. What each floor buys:

| Version   | Expo SDK             | What arrives                                                                                                                              |
| --------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0.71      | not checked          | `role`, the `aria-*` aliases, `id`, `tabIndex`                                                                                            |
| 0.80      | none (54 ships 0.81) | `experimental_accessibilityOrder` (flagged), `screenReaderFocusable`, `accessibilityRespondsToUserInteraction`                            |
| 0.81      | 54                   | `onFocus` and `onBlur` on every Android view                                                                                              |
| 0.84      | none (56 ships 0.85) | Android `onKeyDown` and `onKeyUp` (flagged), announcement priority on iOS                                                                 |
| 0.85      | 56                   | `setAccessibilityFocus` deprecated in favor of `sendAccessibilityEvent`                                                                   |
| 0.87      | none (58 ships 0.88) | Android fix for the screen reader behavior of `expanded`                                                                                  |
| **0.88**  | **58**               | iOS Full Keyboard Access reaches checkbox, radio, tab, option, menu item, slider, combobox; right-to-left fixes                           |
| 0.89 (rc) | none yet             | iOS `role="slider"` adjustable, VoiceOver "collapsed", `aria-modal` on `View`, Android `aria-live` on an unflattened `View` and on `Text` |

Recommendation (inferred): set the floor at **React Native 0.88, Expo SDK 58**. It is the current stable on both, and the first where a hardware keyboard user on iOS can reach roles other than button and link. Everything 0.89 fixes can be worked around in the adapter by setting `accessibilityRole`, `accessibilityState`, `accessibilityViewIsModal` and `accessibilityLiveRegion` directly, which the adapter has to do anyway because `role` and `aria-*` passthrough is lossy. A lower floor of 0.81 (Expo SDK 54) would work for the prop surface but loses the Full Keyboard Access reach.

Still missing at any version, flags or not: observing accessibility focus, `aria-activedescendant`, `aria-controls`, `aria-describedby` by reference, live regions on iOS, a modal flag on Android, key events on iOS.

## Open questions this leaves for other tickets

- Whether the keyboard gap justifies a native module, and with it a peer beyond `react` and `react-native`.
- What core's focus management (roving focus, trap, return, initial focus) becomes when the only lever is "move accessibility focus here" and nothing can be observed.
- Whether popups stay in the tree or use `Modal`, given that `accessibilityViewIsModal` hides siblings only and Android has no flag.
- How checking (`@ui-sdk/core/testing`) asserts roles on native, given that iOS expresses several of them as words in a value string.
- None of the spoken output was verified on a device. The prototype should run VoiceOver and TalkBack over a first tier of components and correct this table where it is wrong.
