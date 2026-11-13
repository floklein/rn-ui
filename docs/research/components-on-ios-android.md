# What each component means on iOS and Android

Research for [issue #10](https://github.com/floklein/rn-ui/issues/10), read on 2026-11-13. It feeds the later decision "What parity means for every component" and chooses nothing itself.

## The answer in short

Sorted per platform, since the two disagree on 16 of the 51 components:

| Category                           | iOS | Android | Either platform at its weaker |
| ---------------------------------- | --- | ------- | ----------------------------- |
| Same on native                     | 26  | 36      | 25                            |
| Same behavior in a different form  | 14  | 9       | 14                            |
| No established native form         | 11  | 6       | 12                            |

- **No established form on either platform (5):** Hover Card, Image Cropper, Menubar, Pagination, Waterfall.
- **No established form on iOS only (6):** Rating, Resizable, Toast, Token Input, Tooltip, Trigger Menu. Android has a form for each: `RatingBar`, pane expansion on large screens, toasts and snackbars, input chips, long-press tooltips, `MultiAutoCompleteTextView`.
- **No established form on Android only (1):** Color Picker. iOS ships a system color picker.
- **Tooltip on long press is an Android convention, not an iOS one.** Apple documents tooltips for pointer hover only.
- **React Native itself ships few of the platform controls.** `Switch`, `TextInput`, `ScrollView`, `Modal`, `Alert`, `ActivityIndicator`, `ActionSheetIOS` and `ToastAndroid` are in; date pickers, menus and context menus, select pickers, segmented controls, sliders, sheet detents, color, file and photo pickers and tooltips are not. Deferring to any of those takes a native module. File Input is the only component that cannot be drawn instead.
- **Keyboard and hover behavior has no touch counterpart**, and both platforms say so: Apple tells iPad apps to "avoid supporting keyboard navigation for controls", and Android calls keyboard navigation "rarely implemented in touch-centric apps" yet expected once a keyboard is attached.

## How to read this

- **Verified** means I read the cited page on 2026-11-13 and the claim is on it. Every claim with a link is verified unless it says otherwise.
- **(inferred)** marks my own conclusion, usually from an absence: a component missing from Apple's HIG index, from Android's Compose Material 3 component list or from React Native's component list.
- **Sources read.** Apple's Human Interface Guidelines and UIKit/SwiftUI reference (developer.apple.com), Android's developer guides and API reference (developer.android.com), the Material Components for Android docs that Google maintains (github.com/material-components), and React Native's docs (reactnative.dev, `main`, versions up to 0.88).
- **Material Design 3's own site was not readable.** m3.material.io renders with JavaScript and returned no text. Everything said about Material 3 comes from Google's Android pages for the same components, which describe types and behavior but less design rationale than the spec.
- **Scope.** iOS means iPhone and iPad. Android means phones and large screens. The 51 rows are the folders of `packages/core/src/components/`; Alert Dialog, Textarea and Time Input live inside `dialog`, `input` and `date-input` and are covered in those rows.

## What React Native ships

From [Core Components and APIs][r-core] and each component's page:

| Ships in `react-native`                                                                                                             | Not in `react-native`                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `View`, `Text`, `Image`, `TextInput`, `Pressable`, `Button`, `ScrollView`, `FlatList`, `SectionList`                                | `CheckBox`, `DatePickerIOS`, `DatePickerAndroid`, `SegmentedControlIOS`: "Removed from React Native" ([1][r-checkbox], [2][r-datepickerios], [3][r-datepickerandroid], [4][r-segmented]) |
| `Switch` ([docs][r-switch]), `ActivityIndicator` ([docs][r-activity])                                                               | `Picker`, `Slider`, `ProgressViewIOS`: their docs pages return 404 (removed earlier, from memory)                                    |
| `Modal` with iOS `presentationStyle` `pageSheet` and `formSheet`, `allowSwipeDismissal`, Android `onRequestClose` ([docs][r-modal]) | Sheet detents: `Modal` has no prop for them ([docs][r-modal])                                                                      |
| `Alert` on both, `Alert.prompt` on iOS, three buttons at most on Android ([docs][r-alert])                                          | Menus, context menus, popovers, tooltips, color, file and photo pickers: none listed ([docs][r-core])                              |
| `ActionSheetIOS` ([docs][r-actionsheet]), `ToastAndroid` ([docs][r-toast]), `DrawerLayoutAndroid` ([docs][r-drawer])                | `ProgressBarAndroid` is deprecated ([docs][r-progressbar]); `InputAccessoryView` is deprecated ([docs][r-iav])                     |
| `Pressable` `onLongPress` (500 ms), `onHoverIn`, `onHoverOut` ([docs][r-pressable]); `PanResponder` ([docs][r-panresponder])        | Hardware key events on `View`: no `onKeyDown` or `onKeyUp` prop ([docs][r-view]); Android has `focusable`, `tabIndex`, `nextFocus*` |

Accessibility in React Native ([docs][r-a11y], [View props][r-view]): `role` covers `button`, `checkbox`, `combobox`, `grid`, `list`, `listitem`, `menu`, `menubar`, `menuitem`, `progressbar`, `radio`, `radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch`, `tab`, `tablist`, `toolbar` and a few more. It has no `dialog`, `listbox`, `option`, `tree`, `treeitem`, `treegrid`, `tooltip` or `separator`, and no `aria-pressed`, `aria-describedby` or `aria-activedescendant`. `aria-labelledby` and `aria-live` are Android only; `aria-modal` is iOS only. `accessibilityRole="adjustable"` with `increment` and `decrement` actions is how a drawn slider answers VoiceOver and TalkBack.

## What upstream already does for touch on the web

The web components already carry touch decisions, in `apps/docs/content/docs/react/components`:

- `presentation="sheet"` or `"auto"` turns Select, Combobox, Autocomplete, Menu, Popover, Dialog and Date Picker into a bottom sheet on small touch screens.
- Tooltip and Hover Card stay closed on touch: "Touch screens have no hover", and anything in a hover card "should be on the page the link goes to".
- A context menu opens "at a right-click or long press". A navigation menu opens on tap. Rating shows no preview on touch. A resizable handle's hit area is 24 pixels for touch. A drawer follows native scrolling on a touch screen, and a toast can be swiped away.

## The table

Category reads **iOS · Android**. "Module" answers whether deferring to the platform control needs a native module beyond `react-native`; "drawn" means the adapter can build it from `View`, `Pressable`, `TextInput` and `ScrollView` instead.

| Component | On the web | iOS | Android | Category | Platform control it would defer to, and module | Input touch lacks |
| --- | --- | --- | --- | --- | --- | --- |
| Accordion | Headings that open and close panels, one or several at a time. | Disclosure controls, "available in iOS, iPadOS, and visionOS with the SwiftUI DisclosureGroup view" ([HIG][h-disclosure], [API][a-disclosuregroup]). | No Material 3 accordion in the component list ([list][d-components]) (inferred). The framework has `ExpandableListView`, whose groups "can individually be expanded" ([API][d-expandable]). | Same · Same | Nothing to defer to in `react-native`. Drawn, with `aria-expanded` ([docs][r-view]). | Arrow keys, Home and End between headings. |
| Autocomplete | A text field with a suggestion list; any text is valid. | A search field can show "suggested search terms" ([HIG][h-search]); `UISearchSuggestion`, iOS 16 ([API][a-searchsuggestion]). No suggestion popup on a plain text field (inferred). | `AutoCompleteTextView` "shows completion suggestions automatically while the user is typing", "in a drop down menu" ([API][d-autocomplete]). Exposed dropdown menus: "Some variations can accept user-entered input" ([MDC][m-menu]). | Different form · Same | `TextInput` is in core ([docs][r-textinput]); the list is drawn. The platform suggestion UIs need a module. | Arrow keys to move the highlight, Enter, Escape, hover. |
| Avatar | An image with initials or an icon while it loads or if it fails. | No HIG component; an image view ([HIG][h-imageviews]) (inferred). | No standalone component; list items have a slot for a leading avatar ([MDC][m-list]). | Same · Same | `Image` with `onLoad` and `onError` ([docs][r-image]). No module. | Nothing. |
| Button | A press action with a pending state; can stay focusable while disabled. | Buttons, which can "display an activity indicator when you need to provide feedback about an action that doesn't instantly complete" ([HIG][h-buttons]). | Buttons, five types ([guide][d-button]). | Same · Same | `Pressable`, `Button`, `ActivityIndicator` ([1][r-pressable], [2][r-button], [3][r-activity]). No module. | Enter and Space; focus on a disabled button. |
| Calendar | A month grid for one date, several dates or a range. | The inline date picker is "an inline calendar view" ([HIG][h-pickers]); `UICalendarView`, iOS 16, selects "a single date or multiple dates" ([API][a-calendarview]). | The docked date picker "Appears inline within the layout"; date range picker ([guide][d-datepickers]). | Same · Same | `UIDatePicker`, `UICalendarView`, Material `DatePicker`. Module: yes, React Native removed its date pickers ([1][r-datepickerios], [2][r-datepickerandroid]). Or drawn as a grid of pressables. | Arrow keys, Page Up and Page Down across days and months. |
| Carousel | Slides on native scroll snap, with Previous, Next and optional rotation. | A scroll view with "page-by-page scrolling" ([HIG][h-scroll]) and a page control ([HIG][h-pagecontrols]). | Material carousel: multi-browse, uncontained, hero, full-screen ([guide][d-carousel]); pager ([guide][d-pager]). | Same · Same | `ScrollView` with `pagingEnabled`, `snapToInterval`, `snapToOffsets` ([docs][r-scrollview]). No module. | Arrow keys on the viewport; mouse drag. |
| Checkbox | Check or uncheck one choice, or a group; has a mixed state. | The HIG places checkboxes under macOS. On iOS: "Use the switch toggle style only in a list row" and "Outside of a list, use a button that behaves like a toggle" ([HIG][h-toggles]); option lists mark the chosen row with a checkmark ([HIG][h-lists]). | Checkbox ([guide][d-checkbox]). | Different form · Same | Android `CheckBox`; React Native's was removed ([docs][r-checkbox]). Drawn, with `role="checkbox"` and `aria-checked`, mixed included ([docs][r-a11y]). | Space. |
| Collapsible | One panel that shows and hides. | Disclosure controls, as for Accordion ([HIG][h-disclosure]). | As for Accordion (inferred). | Same · Same | Drawn. No module. | Enter and Space. |
| Color Picker | An area for two channels, a slider per channel, a text input and presets. | A color well opens "the system-provided one or a custom interface that you design" ([HIG][h-colorwells]); `UIColorPickerViewController`, iOS 14 ([API][a-colorpicker]). | No platform or Material color picker ([list][d-components]) (inferred). | Different form · None | iOS system picker: module. Drawn: the area and sliders follow a finger through `PanResponder` ([docs][r-panresponder]). | Arrow keys on the area and the thumbs. |
| Combobox | Type to filter a list and choose one or several values. | Combo boxes are "Not supported in iOS, iPadOS" ([HIG][h-combo]). The nearest forms are a search field over results ([HIG][h-search]) and, for "a very large set of items", a list ([HIG][h-pickers]). | Exposed dropdown menu that accepts input ([MDC][m-menu]); `AutoCompleteTextView` ([API][d-autocomplete]); search bar and full-screen search view ([MDC][m-search]). | Different form · Same | `TextInput` and `FlatList` are in core. Drawn. Upstream's sheet presentation already moves the input into a sheet header. | Arrow keys, Enter, Escape; a highlight that moves while focus stays in the input. |
| Command | A search field over a list of actions, with pages; often in a dialog as a palette. | No command palette in the HIG (inferred). Search sits "As a tab in a tab bar", "In a toolbar at the bottom or top of the screen" or "Directly inline with content" ([HIG][h-search]). | Search bar, "a persistent and prominent search field", and search view, "a full-screen modal" ([MDC][m-search]). No command palette (inferred). | Different form · Different form | Drawn from `TextInput` and a list. No module. | The shortcut that opens it, arrow keys, Enter, Escape, Backspace to leave a page. |
| Date Input | Type a date or time one part at a time. | Date picker wheels "also supports data entry through built-in or external keyboards"; the compact style opens "a modal view" ([HIG][h-pickers]). | Modal date input "Combines a text field with a modal date picker" ([guide][d-datepickers]); time input "using their keyboard" ([guide][d-timepickers]). | Different form · Different form | `UIDatePicker`, Material date and time input: module. Drawn: one `TextInput` per part with a numeric keyboard ([docs][r-textinput]). | Arrow Up and Down to step a part, Left and Right between parts. |
| Date Picker | A text field that opens a calendar; ranges. | Compact date picker: "A button that displays editable date and time content in a modal view" ([HIG][h-pickers]). | Modal date picker, a dialog, or modal date input ([guide][d-datepickers]); `DatePickerDialog` ([guide][d-dialogs-views]). | Different form · Same | As for Calendar: module to defer. Upstream has a sheet presentation. | Arrow keys in the grid, Escape. |
| Dialog | A focused task over the page; Alert Dialog asks for confirmation. | A task goes in a sheet, which "helps people perform a scoped task" ([HIG][h-sheets]). A confirmation is an alert ([HIG][h-alerts]), or an action sheet for "choices related to an action" ([HIG][h-actionsheets]). | Dialogs ([guide][d-dialog]); `AlertDialog` shows "a title, up to three buttons, a list of selectable items, or a custom layout" ([guide][d-dialogs-views]). | Different form · Same | `Modal` and `Alert` are in core ([1][r-modal], [2][r-alert]). No module. | Escape, Tab kept inside. Android has Back, which `Modal` reports through `onRequestClose`. |
| Drawer | A sheet from an edge that drags and rests at snap points. | A resizable sheet with detents and a grabber; "Support swiping to dismiss a sheet" ([HIG][h-sheets]); `UISheetPresentationController`, iOS 15 ([API][a-sheet]). | Standard and modal bottom sheets with a drag handle and a half-expanded state ([MDC][m-bottomsheet], [guide][d-bottomsheet]); side sheets ([MDC][m-sidesheet]). | Same · Same | Detents and Material bottom sheets: module, since `Modal` has no detents ([docs][r-modal]). Or drawn with `Animated` and `PanResponder`. | Arrow keys on the handle, Escape. |
| Field | Connects a control to its label, description and errors. | "include a separate label describing the field" ([HIG][h-textfields]). | Text field label, supporting text and error ([MDC][m-textfield]). | Same · Same | Drawn. `aria-labelledby` is Android only; iOS takes `aria-label`; descriptions go in `accessibilityHint` ([docs][r-view]). | Nothing. |
| File Input | Choose, drop or paste files, then validate them. | `UIDocumentPickerViewController` ([API][a-docpicker]) and `PHPickerViewController` ([API][a-phpicker]); drag and drop works "through gestures on the touchscreen" ([HIG][h-dnd]). | The Storage Access Framework's "system picker" ([guide][d-saf]) and the photo picker ([guide][d-photopicker]); drag and drop "between apps in multi-window mode" ([guide][d-dnd]). | Different form · Different form | Module: yes, and it cannot be drawn. No picker is in core ([docs][r-core]). | Dropping from a desktop, pasting with a shortcut, Delete on a listed file. |
| Hover Card | A preview of a link on hover or keyboard focus. | Nearest: a context menu "can display a preview of the current content" on touch and hold ([HIG][h-context]); pointer hover on iPad ([HIG][h-pointing], [API][a-hover]). | Nearest: a rich tooltip, shown when "long-pressed (on touch devices) or hovered over" ([guide][d-tooltip]). | None · None | `Pressable` `onHoverIn`, `onHoverOut`, `onLongPress` ([docs][r-pressable]). A context menu preview needs a module. | Hover; a pause with keyboard focus. |
| Image Cropper | Move and resize a selection, or pan and zoom the image under it. | No component. `UIImagePickerController.allowsEditing` lets someone "edit a selected still image" ([API][a-allowsediting]); `PHPickerViewController` only picks ([API][a-phpicker]). | No component; the photo picker only selects ([guide][d-photopicker]) (inferred). | None · None | Drawn with `PanResponder`; `ScrollView` zoom props are iOS only ([docs][r-scrollview]). Producing the cropped pixels needs image code outside core (inferred). | Arrow keys on the selection, wheel zoom. Touch adds pinch. |
| Input | A native text field with a clear button; Textarea is the multi-line one. | Text field with a Clear button ([HIG][h-textfields], [API][a-clear]). | Text fields ([MDC][m-textfield]). | Same · Same | `TextInput`, `multiline`, `clearButtonMode` on iOS only ([docs][r-textinput]). No module. | Nothing. |
| Label | Names any control; a press on it moves focus to the control. | A label is "a static piece of text" ([HIG][h-labels]); the name reaches VoiceOver as an accessibility label (inferred). | Same (inferred). | Same · Same | `Text`, `aria-label`, `aria-labelledby` on Android ([docs][r-view]). No module. | Moving focus on press only means something for a text field. |
| Listbox | An always-visible list to choose one or several options. | A list that marks chosen rows; "people must enter an edit mode before they can select table items" ([HIG][h-lists]). | Lists with checkable items ([MDC][m-list]); the contextual action mode "lets the user select multiple items" ([guide][d-menus-views]). | Same · Same | `FlatList` and `Pressable`. No module. No `listbox` or `option` role ([docs][r-a11y]). | Arrow keys, typeahead, Shift-click ranges, Ctrl or ⌘ click. |
| Menu | Actions and settings from a button or a context menu, with submenus. | Menus from pull-down and pop-up buttons ([HIG][h-menus], [HIG][h-pulldown]); a context menu on touch and hold ([HIG][h-context]); `UIMenu` ([API][a-menu]). | Dropdown menu ([guide][d-menu]); a context menu "appears when the user performs a touch & hold"; popup menu ([guide][d-menus-views]). | Same · Same | `UIMenu`, `UIContextMenuInteraction`, `PopupMenu`: module. Core has only `ActionSheetIOS` ([docs][r-actionsheet]), and the HIG says "Use an action sheet — not a menu — to provide choices related to an action" ([HIG][h-actionsheets]). Or drawn in a `Modal`. | Right click, Shift+F10, arrow keys, typeahead, hover into submenus. |
| Menubar | An application's menus in a row with one tab stop. | "Not supported in iOS". On iPad, a system menu bar, "Hidden until revealed" ([HIG][h-menubar]); `UIMainMenuSystem`, iOS 26 ([API][a-mainmenu]). | No menubar; the options menu lives in the app bar with an overflow ([guide][d-menus-views]). | None · None | The iPad menu bar: module. `role="menubar"` exists ([docs][r-a11y]). | Arrow keys between menus, hover to switch the open menu. |
| Meter | A value within a known range. | Gauge, which "displays a specific numerical value within a range" ([HIG][h-gauges]); SwiftUI `Gauge`, iOS 16 ([API][a-gauge]). | No Material meter (inferred); a determinate progress indicator looks alike ([guide][d-progress]). | Same · Same | Drawn; `role="progressbar"` with `aria-valuenow`, as there is no meter role ([docs][r-a11y]). | Nothing. |
| Navigation Menu | A site's links in panels that open from a row of triggers. | "Use a tab bar to support navigation" ([HIG][h-tabbars]); a sidebar on iPad ([HIG][h-sidebars]). | Navigation bar for "Three to five destinations of equal importance", navigation rail, navigation drawer ([1][d-navbar], [2][d-navrail], [3][d-drawer]). | Different form · Different form | Core has only `DrawerLayoutAndroid` ([docs][r-drawer]). Drawn, or left to the app's navigation library. | Hover to open a panel, arrow keys. |
| Number Input | A formatted number with step buttons and a drag on its label. | A text field with a number keyboard ([HIG][h-textfields]) and a stepper: "Consider pairing a stepper with a text field" ([HIG][h-steppers]). | A text field with a numeric keyboard (inferred); the framework's `NumberPicker` selects "a number from a predefined range" ([API][d-numberpicker]). No Material stepper (inferred). | Same · Same | `TextInput` with `inputMode` ([docs][r-textinput]). Step buttons drawn. No module. | Arrow Up and Down, Page Up and Down, the wheel. |
| OTP Input | A one-time code, one character per slot, with paste and autofill. | One text field with the `oneTimeCode` content type ([API][a-otp]). The HIG's digit entry view is tvOS only ([HIG][h-digit]). | `AUTOFILL_HINT_SMS_OTP`, with per-character hints for one view per digit ([guide][d-autofill]). | Same · Same | `TextInput` `textContentType="oneTimeCode"` and `autoComplete="sms-otp"` ([docs][r-textinput]). No module. | Arrow keys between slots. |
| Pagination | Page buttons with Previous and Next. | A page control shows "an ordered list of pages", and "More than about 10 dots are hard to count" ([HIG][h-pagecontrols]). No numbered pagination (inferred). | None in the component list ([list][d-components]); the data table is "yet to be completed" ([MDC][m-datatable]) (inferred). | None · None | Drawn from buttons. No module. | Nothing: it is buttons. |
| Password Input | A password field with a show and hide button. | Secure text field ([HIG][h-textfields], [API][a-securefield]). No built-in reveal button (inferred). | A text field whose password toggle switches "between masking the password or displaying the password as plain-text" ([MDC][m-textfield]); `SecureTextField` ([API][d-m3api]). | Same · Same | `TextInput` `secureTextEntry` ([docs][r-textinput]). No module. | Nothing. |
| Popover | A small task beside its trigger. | "Avoid displaying popovers in compact views ... use all available screen space by presenting information in a full-screen modal view like a sheet instead" ([HIG][h-popovers]); UIKit adapts the popover style in compact environments ([API][a-popover]). | No popover component (inferred); menus, rich tooltips, dialogs and bottom sheets cover its uses ([list][d-components]). | Different form · Different form | iPad popovers: module. Drawn: a transparent `Modal` placed from a measured anchor ([docs][r-modal]). Upstream has a sheet presentation. | Hover to open, Escape, Tab order. |
| Progress | A task's progress, or an indeterminate state. | Progress bar and activity indicator ([HIG][h-progress]). | Linear and circular, determinate and indeterminate ([guide][d-progress]). | Same · Same | `ActivityIndicator` ([docs][r-activity]); `ProgressBarAndroid` is deprecated ([docs][r-progressbar]). A determinate bar is drawn. | Nothing. |
| Radio | One choice from a short list. | Radio buttons sit under macOS in the HIG ([HIG][h-toggles]). On iOS: a checkmark in a list ([HIG][h-lists]), a pop-up button for "a flat list of mutually exclusive options" ([HIG][h-popup]), a picker or a segmented control. | Radio button ([guide][d-radio]). | Different form · Same | Drawn; `role="radiogroup"` and `"radio"` ([docs][r-a11y]). No module. | Arrow keys moving the selection. |
| Rating | A score from a row of stars, with a preview under the pointer. | Rating indicators are "Not supported in iOS, iPadOS" ([HIG][h-rating]). | The framework's `RatingBar` "shows a rating in stars. The user can touch/drag or use arrow keys" ([API][d-ratingbar]). Not a Material 3 component (inferred); the slider guide lists "setting a rating in a review" ([guide][d-slider]). | None · Same | `RatingBar`: module. Drawn from pressables. | The hover preview, arrow keys. |
| Resizable | Panels sized by dragging the handle between them. | Dividers that "support dragging to resize" are described for macOS; on iOS, "Prefer using a split view in a regular — not a compact — environment" ([HIG][h-split]). `UISplitViewController` sets column widths in code ([API][a-split]). | Pane scaffolds with pane expansion and drag handles, for large screens ([API][d-adaptive]). Nothing for phones (inferred). | None · Different form | Drawn with `PanResponder`. No module. | A thin handle to drag, hover feedback, arrow keys on the handle. |
| Scroll Area | Native scrolling with styled scrollbars and edge indicators. | Scroll view with system scroll indicators ([HIG][h-scroll]). | System scrolling and scrollbars (inferred). | Same · Same | `ScrollView`: `showsVerticalScrollIndicator`, `indicatorStyle` on iOS, `persistentScrollbar` and `fadingEdgeLength` on Android ([docs][r-scrollview]). No module. A custom scrollbar is drawn from `onScroll`. | Hover to reveal the scrollbar, dragging its thumb, the wheel. |
| Segmented Control | One of a few options, with a sliding indicator. | Segmented control ([HIG][h-segmented], [API][a-segmented]). | Segmented button ([guide][d-segmented]), "being deprecated in the Material 3 expressive" update for the connected button group ([MDC][m-togglegroup], [MDC][m-buttongroup]). | Same · Same | `UISegmentedControl`: module, as `SegmentedControlIOS` was removed ([docs][r-segmented]). Or drawn. | Arrow keys. |
| Select | One or several values from a popup list. | A pop-up button for a short flat list ([HIG][h-popup]); a picker for "medium-to-long lists"; a list for a very large set ([HIG][h-pickers]). | Exposed dropdown menu ([MDC][m-menu]); `Spinner` ([guide][d-spinner]); a dialog with a list ([guide][d-dialogs-views]). | Different form · Same | `UIMenu`, `UIPickerView`, `Spinner`: module. Or drawn as a list in a sheet; upstream has a sheet presentation. | Arrow keys, typeahead, Escape, hover. |
| Separator | A line between groups of content. | No HIG component; lists draw their own separators (inferred). | Divider ([guide][d-divider]). | Same · Same | A `View`. No `separator` role ([docs][r-a11y]). | Nothing. |
| Slider | A number or a range along a track. | Slider ([HIG][h-sliders], [API][a-slider]). One thumb; no range slider in UIKit (inferred). | Slider with standard, centered and range variants ([MDC][m-slider], [guide][d-slider]). | Same · Same | `UISlider`, Material `Slider`: module. Or drawn with `PanResponder` and `accessibilityRole="adjustable"` ([docs][r-a11y]). | Arrow keys, Home, End, Page Up and Down. |
| Switch | A setting that is on or off. | Toggle in the switch style ([HIG][h-toggles]). | Switch ([guide][d-switch]). | Same · Same | `Switch` ([docs][r-switch]). No module. | Space. |
| Tabs | Related panels with one tab selected. | Tab views are "Not supported in iOS, iPadOS", and "consider using a segmented control instead" ([HIG][h-tabviews]); a tab bar is for "top-level sections" ([HIG][h-tabbars]). | Primary and secondary tabs ([guide][d-tabs]); with a pager, "Synchronize the selected tab and tab indicator position with page swipes" ([MDC][m-tabs]). | Different form · Same | Drawn; `role="tablist"` and `"tab"` ([docs][r-a11y]). No module. | Arrow keys, Home, End. Touch adds a swipe between panels. |
| Timeline | Dated events in order, with arrow keys between them. | A list ([HIG][h-lists]); no timeline component (inferred). | A list ([MDC][m-list]) (inferred). | Same · Same | Drawn; `role="list"` and `"listitem"` ([docs][r-a11y]). | Arrow keys between events. |
| Toast | A notification that leaves on its own, with actions and stacking. | No toast in the HIG (inferred). "Consider integrating status feedback into your interface", and "Avoid using an alert merely to provide information" ([HIG][h-feedback], [HIG][h-alerts]). | Toast, text only and two lines at most from Android 12; "consider using a snackbar instead", which carries an action ([guide][d-toasts], [guide][d-snackbar]). | None · Same | `ToastAndroid`, Android only and text only ([docs][r-toast]). Drawn for the rest; announced with `AccessibilityInfo.announceForAccessibility` ([docs][r-a11yinfo]). | Hover to pause the timer, a shortcut to reach the toasts. |
| Toggle | A button that stays pressed; a group shares a value. | "use a button that behaves like a toggle" ([HIG][h-toggles], [API][a-toggle-button]). | Toggle icon button ([guide][d-iconbutton]); button groups ([MDC][m-buttongroup]). | Same · Same | Drawn; `accessibilityRole="togglebutton"`, as there is no `aria-pressed` ([docs][r-a11y]). | Enter and Space; arrow keys in a group. |
| Token Input | Text mixed with tokens for people, files and tags. | Token fields are "Not supported in iOS, iPadOS" ([HIG][h-token]). Tokens exist only in search fields ([HIG][h-search], [API][a-searchtoken]). | Input chips "enable user input and verify that input by converting text into chips" ([MDC][m-chip]). | None · Same | `TextInput` holds a string ([docs][r-textinput]); chips are drawn beside it. Tokens inside the text are out of reach in core (inferred). | Arrow keys across tokens, copying a token as one piece. |
| Toolbar | Controls with one tab stop and arrow keys between them. | Toolbar ([HIG][h-toolbars]). | App bars ([guide][d-appbars]); docked and floating toolbars ([MDC][m-toolbars]). | Same · Same | Drawn; `role="toolbar"` ([docs][r-a11y]). | The single tab stop and arrow keys. |
| Tooltip | A name or short hint on hover and keyboard focus. | Pointer only: "tooltips can appear when a person holds the pointer over an element" ([HIG][h-help]); `UIToolTipInteraction` shows one "when hovering a pointer" ([API][a-tooltip]). TipKit tips teach a feature, another job ([HIG][h-help]). | Plain and rich tooltips, by "Hovering over the icon with a cursor" or "Long-pressing the icon on a mobile device" ([guide][d-tooltip]); `setTooltipText` shows "On long click" and "On hover" ([API][d-view-tooltip]). | None · Different form | Both platform tooltips: module, as `View` has no tooltip prop ([docs][r-view]). Drawn from `onLongPress` and `onHoverIn` ([docs][r-pressable]). | Hover, keyboard focus. |
| Tree | A hierarchy with expandable branches, selection and checkboxes. | Outline views are "Not supported in iOS, iPadOS" ([HIG][h-outline]), but a sidebar can "Group hierarchy with disclosure controls" ([HIG][h-sidebars]); SwiftUI `OutlineGroup`, iOS 14 ([API][a-outlinegroup]). | `ExpandableListView` is "a vertically scrolling two-level list" ([API][d-expandable]). No Material tree (inferred). | Same · Different form | Drawn from `FlatList`. No `tree` or `treeitem` role; `aria-expanded` on rows ([docs][r-a11y]). | Arrow keys to move, open and close; typeahead; Shift and Ctrl selection. |
| Trigger Menu | Suggestions at the caret after `@`, `/` or `#`. | No guidance and no control (inferred). | `MultiAutoCompleteTextView` shows "completion suggestions for the substring of the text where the user is typing", as a dropdown on the field ([API][d-autocomplete]). | None · Different form | `TextInput` reports `onSelectionChange` but no caret position on screen ([docs][r-textinput]), so nothing in core anchors a menu to the caret. | Arrow keys, Enter and Escape while typing. |
| Waterfall | Spans as bars on one time axis, in a treegrid. | No component. Charts through Swift Charts ([HIG][h-charts], [API][a-charts]). | None (inferred). | None · None | Drawn. `role="grid"` is for scrolling lists; no treegrid ([docs][r-a11y]). | Arrow keys through rows and cells. |

## Hard cases

Each lists what the platforms' own guidance offers. None is chosen here.

### Hover Card

- Upstream keeps it closed on touch and requires its content on the linked page.
- iOS offers a context menu with a preview on touch and hold, and says "Always make context menu items available in the main interface, too" ([HIG][h-context]).
- With a pointer on iPad, hover exists ([HIG][h-pointing]); Android asks apps to handle hover for mice on large screens ([guide][d-largescreen]). `Pressable` reports both.
- Android's rich tooltip opens on long press and can hold "an optional title, link, and buttons" ([guide][d-tooltip]).

### Tooltip

- iOS: no touch tooltip. The options are a pointer-only tooltip, an accessibility label and hint in place of a visible tip, or a TipKit-style tip, which Apple scopes to teaching features ([HIG][h-help]).
- Android: long press or hover, plain or rich ([guide][d-tooltip]). A long press already taken by a context menu wins over the tooltip ([API][d-view-tooltip]).
- Upstream already has `toggleable`, a tooltip that opens on press "with a finger, a mouse or the keyboard", for an info button whose only job is the tip.

### Menubar

- iPhone has none. iPad has the system menu bar, and Apple warns: "ensure that people can access all of your app's functions through its UI" ([HIG][h-menubar]).
- Android puts an activity's commands in the options menu of the app bar ([guide][d-menus-views]).
- The options: a row of pull-down buttons in the app's own UI, the system menu bar on iPad through a module, or one overflow menu.

### Resizable

- Apple documents draggable dividers for the Mac. On iPhone it steers away from split views in compact width ([HIG][h-split]).
- Android has pane expansion with a drag handle on large screens ([API][d-adaptive]).
- The options: a drag handle sized for a finger, preset sizes to snap between, or one pane at a time in compact width.

### Toast

- iOS has no toast. Apple's guidance is status shown in place, and alerts only for what is critical and actionable ([HIG][h-feedback]).
- Android has both a toast and a snackbar, and prefers the snackbar in the foreground because it "include[s] user-actionable options" ([guide][d-toasts]).
- The options: one drawn toast on both platforms, the system toast on Android with a drawn one on iOS, or status in place.

### Rating

- iOS has no control; the Mac's indicator "doesn't display partial symbols" ([HIG][h-rating]).
- Android's `RatingBar` takes a touch or a drag ([API][d-ratingbar]), and Android's slider guide names rating as a slider use.
- The options: a row of star buttons with radio semantics, or one adjustable control that follows a drag.

### Token Input and Trigger Menu

- iOS has tokens only in search fields. Android has input chips and `MultiAutoCompleteTextView`.
- React Native's `TextInput` holds a string and gives no caret position on screen.
- The options: chips in a row beside a plain field, the Material form; suggestions in a list above the keyboard instead of at the caret; or a module for a native token field.

### Pagination

- Neither platform has numbered pagination. Apple's page control is for a few peer pages ([HIG][h-pagecontrols]).
- The options: Previous and Next buttons as on the web, a page control for short runs, or a list that keeps loading as it scrolls.

### Color Picker and Image Cropper

- Color: iOS has a system picker that keeps saved colors across apps ([HIG][h-colorwells]); Android has nothing. The options are the system picker on iOS with a drawn one on Android, or a drawn one on both.
- Cropper: no component on either platform. iOS only offers editing inside its older image picker ([API][a-allowsediting]). Drawing it is a gesture problem; producing pixels needs code outside `react-native`.

### Waterfall and Command

- Waterfall has no native form. The nearest forms are an outline list whose rows carry bars, or a chart.
- Command maps onto platform search: a search tab, a field in a toolbar, or Android's full-screen search view. The palette's shortcut has no touch form. I sorted it as a different form; it borders on none.

### Controls that change form on iOS only

- Checkbox, Radio, Select, Tabs, Dialog, Combobox, Autocomplete and Date Picker keep their web form on Android and take another on iOS.
- The iOS forms: a switch or a checkmark row for Checkbox; a checkmark list, pop-up button or picker for Radio and Select; a segmented control for Tabs; a sheet for Dialog.
- The option on each is the platform's form on each, or one form for both.

### Deferring to a platform control or drawing it

- Deferring means a native module for Calendar, Date Input, Date Picker, Menu, Select, Segmented Control, Slider, Drawer detents, Color Picker, File Input, Tooltip and the iPad menu bar.
- Drawing keeps `react` and `react-native` as the only peers for all of them except File Input, which has no drawn form.

### Keyboard and hover behavior

- Arrow keys, typeahead, Escape, a single tab stop and hover run through most of the 51 components and have no touch counterpart.
- Apple: "avoid supporting keyboard navigation for controls, such as buttons, segmented controls, and switches. Instead, let people use Full Keyboard Access" ([HIG][h-keyboards]). iPadOS has a focus system for "text fields, text views, and sidebars", collection views and custom views ([HIG][h-focus]).
- Android: "Keyboard navigation is rarely implemented in touch‑centric apps, but users expect it when they're using an app and have their hands on a keyboard" ([guide][d-largescreen]).
- React Native documents hover on `Pressable` and focus props on Android, but no key events on `View` ([docs][r-view]).

## Not verified

- Material Design 3's guidelines pages themselves, as said above.
- Whether iPadOS lets people drag a split view's divider. The HIG and the `UISplitViewController` page describe widths set in code only.
- When React Native removed `Picker`, `Slider` and `ProgressViewIOS`. Their pages are gone; the versions are from memory.
- The Android SMS User Consent API page returned nothing readable, so the OTP row cites the autofill hint only.

[h-disclosure]: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
[h-search]: https://developer.apple.com/design/human-interface-guidelines/search-fields
[h-buttons]: https://developer.apple.com/design/human-interface-guidelines/buttons
[h-toggles]: https://developer.apple.com/design/human-interface-guidelines/toggles
[h-pickers]: https://developer.apple.com/design/human-interface-guidelines/pickers
[h-popup]: https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons
[h-pulldown]: https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons
[h-menus]: https://developer.apple.com/design/human-interface-guidelines/menus
[h-context]: https://developer.apple.com/design/human-interface-guidelines/context-menus
[h-menubar]: https://developer.apple.com/design/human-interface-guidelines/the-menu-bar
[h-colorwells]: https://developer.apple.com/design/human-interface-guidelines/color-wells
[h-combo]: https://developer.apple.com/design/human-interface-guidelines/combo-boxes
[h-sheets]: https://developer.apple.com/design/human-interface-guidelines/sheets
[h-alerts]: https://developer.apple.com/design/human-interface-guidelines/alerts
[h-actionsheets]: https://developer.apple.com/design/human-interface-guidelines/action-sheets
[h-popovers]: https://developer.apple.com/design/human-interface-guidelines/popovers
[h-dnd]: https://developer.apple.com/design/human-interface-guidelines/drag-and-drop
[h-lists]: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
[h-outline]: https://developer.apple.com/design/human-interface-guidelines/outline-views
[h-gauges]: https://developer.apple.com/design/human-interface-guidelines/gauges
[h-tabbars]: https://developer.apple.com/design/human-interface-guidelines/tab-bars
[h-sidebars]: https://developer.apple.com/design/human-interface-guidelines/sidebars
[h-tabviews]: https://developer.apple.com/design/human-interface-guidelines/tab-views
[h-segmented]: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
[h-steppers]: https://developer.apple.com/design/human-interface-guidelines/steppers
[h-textfields]: https://developer.apple.com/design/human-interface-guidelines/text-fields
[h-digit]: https://developer.apple.com/design/human-interface-guidelines/digit-entry-views
[h-pagecontrols]: https://developer.apple.com/design/human-interface-guidelines/page-controls
[h-scroll]: https://developer.apple.com/design/human-interface-guidelines/scroll-views
[h-progress]: https://developer.apple.com/design/human-interface-guidelines/progress-indicators
[h-rating]: https://developer.apple.com/design/human-interface-guidelines/rating-indicators
[h-split]: https://developer.apple.com/design/human-interface-guidelines/split-views
[h-sliders]: https://developer.apple.com/design/human-interface-guidelines/sliders
[h-feedback]: https://developer.apple.com/design/human-interface-guidelines/feedback
[h-token]: https://developer.apple.com/design/human-interface-guidelines/token-fields
[h-toolbars]: https://developer.apple.com/design/human-interface-guidelines/toolbars
[h-help]: https://developer.apple.com/design/human-interface-guidelines/offering-help
[h-pointing]: https://developer.apple.com/design/human-interface-guidelines/pointing-devices
[h-keyboards]: https://developer.apple.com/design/human-interface-guidelines/keyboards
[h-focus]: https://developer.apple.com/design/human-interface-guidelines/focus-and-selection
[h-charts]: https://developer.apple.com/design/human-interface-guidelines/charts
[h-imageviews]: https://developer.apple.com/design/human-interface-guidelines/image-views
[h-labels]: https://developer.apple.com/design/human-interface-guidelines/labels
[a-disclosuregroup]: https://developer.apple.com/documentation/swiftui/disclosuregroup
[a-outlinegroup]: https://developer.apple.com/documentation/swiftui/outlinegroup
[a-calendarview]: https://developer.apple.com/documentation/uikit/uicalendarview
[a-colorpicker]: https://developer.apple.com/documentation/uikit/uicolorpickerviewcontroller
[a-docpicker]: https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller
[a-phpicker]: https://developer.apple.com/documentation/photosui/phpickerviewcontroller
[a-menu]: https://developer.apple.com/documentation/uikit/uimenu
[a-sheet]: https://developer.apple.com/documentation/uikit/uisheetpresentationcontroller
[a-popover]: https://developer.apple.com/documentation/uikit/uimodalpresentationstyle/popover
[a-segmented]: https://developer.apple.com/documentation/uikit/uisegmentedcontrol
[a-slider]: https://developer.apple.com/documentation/uikit/uislider
[a-tooltip]: https://developer.apple.com/documentation/uikit/uitooltipinteraction
[a-allowsediting]: https://developer.apple.com/documentation/uikit/uiimagepickercontroller/allowsediting
[a-searchtoken]: https://developer.apple.com/documentation/uikit/uisearchtoken
[a-searchsuggestion]: https://developer.apple.com/documentation/uikit/uisearchsuggestion
[a-otp]: https://developer.apple.com/documentation/uikit/uitextcontenttype/onetimecode
[a-hover]: https://developer.apple.com/documentation/uikit/uihovergesturerecognizer
[a-gauge]: https://developer.apple.com/documentation/swiftui/gauge
[a-mainmenu]: https://developer.apple.com/documentation/uikit/uimainmenusystem
[a-split]: https://developer.apple.com/documentation/uikit/uisplitviewcontroller
[a-charts]: https://developer.apple.com/documentation/charts
[a-toggle-button]: https://developer.apple.com/documentation/uikit/uibutton/changesselectionasprimaryaction
[a-securefield]: https://developer.apple.com/documentation/swiftui/securefield
[a-clear]: https://developer.apple.com/documentation/uikit/uitextfield/clearbuttonmode
[d-components]: https://developer.android.com/develop/ui/compose/components
[d-tooltip]: https://developer.android.com/develop/ui/compose/components/tooltip
[d-datepickers]: https://developer.android.com/develop/ui/compose/components/datepickers
[d-timepickers]: https://developer.android.com/develop/ui/compose/components/time-pickers
[d-menu]: https://developer.android.com/develop/ui/compose/components/menu
[d-segmented]: https://developer.android.com/develop/ui/compose/components/segmented-button
[d-tabs]: https://developer.android.com/develop/ui/compose/components/tabs
[d-carousel]: https://developer.android.com/develop/ui/compose/components/carousel
[d-dialog]: https://developer.android.com/develop/ui/compose/components/dialog
[d-bottomsheet]: https://developer.android.com/develop/ui/compose/components/bottom-sheets
[d-slider]: https://developer.android.com/develop/ui/compose/components/slider
[d-snackbar]: https://developer.android.com/develop/ui/compose/components/snackbar
[d-drawer]: https://developer.android.com/develop/ui/compose/components/drawer
[d-progress]: https://developer.android.com/develop/ui/compose/components/progress
[d-iconbutton]: https://developer.android.com/develop/ui/compose/components/icon-button
[d-appbars]: https://developer.android.com/develop/ui/compose/components/app-bars
[d-checkbox]: https://developer.android.com/develop/ui/compose/components/checkbox
[d-radio]: https://developer.android.com/develop/ui/compose/components/radio-button
[d-switch]: https://developer.android.com/develop/ui/compose/components/switch
[d-divider]: https://developer.android.com/develop/ui/compose/components/divider
[d-navbar]: https://developer.android.com/develop/ui/compose/components/navigation-bar
[d-navrail]: https://developer.android.com/develop/ui/compose/components/navigation-rail
[d-button]: https://developer.android.com/develop/ui/compose/components/button
[d-toasts]: https://developer.android.com/guide/topics/ui/notifiers/toasts
[d-photopicker]: https://developer.android.com/training/data-storage/shared/photo-picker
[d-saf]: https://developer.android.com/training/data-storage/shared/documents-files
[d-menus-views]: https://developer.android.com/develop/ui/views/components/menus
[d-spinner]: https://developer.android.com/develop/ui/views/components/spinner
[d-largescreen]: https://developer.android.com/develop/ui/compose/touch-input/input-compatibility-on-large-screens
[d-dnd]: https://developer.android.com/develop/ui/views/touch-and-input/drag-drop
[d-pager]: https://developer.android.com/develop/ui/views/animations/screen-slide-2
[d-dialogs-views]: https://developer.android.com/develop/ui/views/components/dialogs
[d-autofill]: https://developer.android.com/identity/autofill/autofill-optimize
[d-ratingbar]: https://developer.android.com/reference/android/widget/RatingBar
[d-autocomplete]: https://developer.android.com/reference/android/widget/AutoCompleteTextView
[d-expandable]: https://developer.android.com/reference/android/widget/ExpandableListView
[d-view-tooltip]: https://developer.android.com/reference/android/view/View#setTooltipText(java.lang.CharSequence)
[d-adaptive]: https://developer.android.com/reference/kotlin/androidx/compose/material3/adaptive/layout/package-summary
[d-numberpicker]: https://developer.android.com/reference/android/widget/NumberPicker
[d-m3api]: https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary
[m-menu]: https://github.com/material-components/material-components-android/blob/master/docs/components/Menu.md
[m-bottomsheet]: https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
[m-sidesheet]: https://github.com/material-components/material-components-android/blob/master/docs/components/SideSheet.md
[m-search]: https://github.com/material-components/material-components-android/blob/master/docs/components/Search.md
[m-togglegroup]: https://github.com/material-components/material-components-android/blob/master/docs/components/ToggleButtonGroup.md
[m-buttongroup]: https://github.com/material-components/material-components-android/blob/master/docs/components/ButtonGroup.md
[m-toolbars]: https://github.com/material-components/material-components-android/blob/master/docs/components/DockedFloatingToolbars.md
[m-list]: https://github.com/material-components/material-components-android/blob/master/docs/components/List.md
[m-textfield]: https://github.com/material-components/material-components-android/blob/master/docs/components/TextField.md
[m-chip]: https://github.com/material-components/material-components-android/blob/master/docs/components/Chip.md
[m-datatable]: https://github.com/material-components/material-components-android/blob/master/docs/components/DataTable.md
[m-slider]: https://github.com/material-components/material-components-android/blob/master/docs/components/Slider.md
[m-tabs]: https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md
[r-core]: https://reactnative.dev/docs/components-and-apis
[r-switch]: https://reactnative.dev/docs/switch
[r-modal]: https://reactnative.dev/docs/modal
[r-scrollview]: https://reactnative.dev/docs/scrollview
[r-textinput]: https://reactnative.dev/docs/textinput
[r-actionsheet]: https://reactnative.dev/docs/actionsheetios
[r-alert]: https://reactnative.dev/docs/alert
[r-pressable]: https://reactnative.dev/docs/pressable
[r-button]: https://reactnative.dev/docs/button
[r-activity]: https://reactnative.dev/docs/activityindicator
[r-toast]: https://reactnative.dev/docs/toastandroid
[r-image]: https://reactnative.dev/docs/image
[r-a11y]: https://reactnative.dev/docs/accessibility
[r-view]: https://reactnative.dev/docs/view
[r-panresponder]: https://reactnative.dev/docs/panresponder
[r-drawer]: https://reactnative.dev/docs/drawerlayoutandroid
[r-iav]: https://reactnative.dev/docs/inputaccessoryview
[r-checkbox]: https://reactnative.dev/docs/checkbox
[r-datepickerios]: https://reactnative.dev/docs/datepickerios
[r-datepickerandroid]: https://reactnative.dev/docs/datepickerandroid
[r-segmented]: https://reactnative.dev/docs/segmentedcontrolios
[r-progressbar]: https://reactnative.dev/docs/progressbarandroid
[r-a11yinfo]: https://reactnative.dev/docs/accessibilityinfo
