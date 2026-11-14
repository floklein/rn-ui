# React Native support

The spec for running ui-sdk on React Native. It gathers the decisions of the planning map, [React Native support at parity with upstream][map], into one document to build from. Each section names the issue its decisions come from, and a line that comes from another issue names that one. The work is sliced in [the build plan](react-native-build-plan.md), which also lists, as questions, what the resolutions leave unsettled.

Words follow [GLOSSARY.md](../../GLOSSARY.md): the **host** is the DOM host or the native host, a **twin** is the native-host counterpart of a module that owns a host capability, and a **native behavior file** does for the native host what a slot's `bind` does on the DOM host.

## What is being built

A sixth adapter, `@ui-sdk/react-native`, that renders core's primitives as real React Native views on iOS and Android, at 1:1 parity with upstream. It isn't React Native Web or a DOM layer on native ([React Native support at parity with upstream][map]).

- **Parity** is the end state: every component upstream ships gets a native entry, and so do the agent layer, the checks, the docs and the examples ([What parity means for every component][parity]).
- **Floor:** React Native 0.88 with the New Architecture, which is Expo SDK 58, and it works in Expo with no Metro configuration ([What React Native gives for accessibility, focus and keyboards][rn-a11y], [How Metro and Expo resolve a workspace package][metro]).
- **The web doesn't change.** The web public API stays as it is, the existing web specs stay green, and the fork keeps merging upstream ([React Native support at parity with upstream][map]).
- **Proof:** a first tier of ten components on an iOS simulator and an Android emulator, then every other component ([What parity means for every component][parity]).

### Out of scope

- tvOS, macOS, Windows and React Native Web ([React Native support at parity with upstream][map]).
- React Native's old architecture ([React Native support at parity with upstream][map]).
- Native code in the adapter, controls the OS ships and native modules. Every component is drawn from `react-native` views ([What parity means for every component][parity]).
- Animation. The adapter is unstyled and ships none ([How presence and exit animation work on native][presence]).
- A performance budget ([Which budgets the native adapter has][budgets]).
- Automated screen-reader specs ([How native correctness is checked][checking]).
- A direction for part of the screen ([How direction and locale are read on native][direction]).
- Keyboard patterns that need key events on a view, if the owner accepts the exception listed under [Open for the owner](#open-for-the-owner) ([How focus works on the native host][focus]).

## Architecture

The seam is recorded in [docs/adr/0001-host-seam.md](../adr/0001-host-seam.md) and isn't restated here. In short ([What the seam's ADR records][adr-ticket], which rewords [Where the host seam sits in core][seam]):

- Both hosts share one primitive definition per component: options, state, `sync`, api, controller, change details and reasons, the declarative slot fields and the pure engines.
- The native adapter reads the declarative fields, translates the attribute map in one place and delivers `press`. It never calls `bind`, `asleep`, `connect`, the `on` handlers or the DOM writers.
- What `bind` orchestrates, and each decision that reads the DOM (where focus goes, Dialog's Escape rule, the layer stack), is restated in a native behavior file in core, written against a small host interface the adapter implements. Core never imports `react-native`. A restatement behaves as the rule it mirrors.
- A host capability that shared code reaches without `bind` gets a twin, a `.native.ts` file with the same exports. Each twin asserts at compile time that its values and exported types match its module's, and declares what it widens.
- Native input reaches shared logic through the api only. A change's details carry no `event` on the native host, and the source is named on the native side: `touch`, or `virtual` for an accessibility action ([Where the host seam sits in core][seam]).

What may change inside files upstream owns is the ADR's list: types, import lines and additive entries; one-call focus reroutes at the smallest shared helper; and three changes to the popup files (the unmount on close handed to presence and an accessor for a close's focus mode in `popup.ts`, the opener passed by the caller in `popup-features.ts`). Any other change to the logic of `popup.ts` or `form.ts` is a new decision ([What the seam's ADR records][adr-ticket]).

Two things keep the second implementation honest ([What the seam's ADR records][adr-ticket], [How the fork takes upstream changes][upstream]):

- **The registry** maps each twin, native behavior file, reroute and additive edit to the upstream files it mirrors and the upstream commit it was last reviewed against.
- **Its checks.** One lists the mirrored files that changed since that commit. One lists every component core exports and every slot that declares a hook the native adapter skips (`bind`, `on`, `connect`, `asleep`), and fails for any that has no native entry, isn't marked as covered by a named file or as needing nothing, and isn't listed as `pending`.

Twins resolve in two ways ([Where the host seam sits in core][seam], [Does the host seam hold for Switch and Dialog][prototype]). From workspace source, Metro picks the `.native.ts` file. The published core gets a second build, `dist/native`, with each twin in the place of its module; every entry gains a `react-native` condition, and `#dev` and `#name-check` gain it too, so a native bundle never loads the DOM tree.

Every primitive is also instantiated with no `document`, to find the paths that throw. A path that throws, or that loses behavior parity needs, is routed through an owning module that has a twin ([Where the host seam sits in core][seam]). The prototype found six `press` handlers that throw and listed 19 places where the seam leaked; its report is `docs/prototypes/host-seam.md` on the `prototype/host-seam` branch ([Does the host seam hold for Switch and Dialog][prototype]).

## The adapter's public contract

From [Where native names diverge from @ui-sdk/react][names] and [How state reaches native styles][styles]. Names match `@ui-sdk/react` wherever the concept exists.

### Entries

- The same subpaths as `@ui-sdk/react`, one per component, with no root entry. An entry whose concept doesn't exist on native is absent.
- `@ui-sdk/react-native/primitive` exports the names the React adapter's does (`usePrimitive`, `usePart`, `createParts`, `mergeProps`, `renderElement`, `RenderProp` and the part and handle types), with the same argument order. Where React takes an HTML tag string, native takes a `react-native` host component.
- `@ui-sdk/react-native/sheet` is the sheet presentation's entry. It and Drawer's entry are the only ones that import Gesture Handler ([Which dependencies the native adapter may take][dependencies]).

### Parts and props

- Every part accepts `style`, `className`, `children` and `render`, with the meaning they have in `@ui-sdk/react`. The first three may be functions of the part's state. The part resolves them, so a host view never receives a function.
- Styles merge as arrays, in the order the React adapter merges props, never spread or flattened.
- The part forwards the resolved `className` as a string, `ref`, `disabled` and unknown props without reading them.
- Host props are React Native's own (`onPress`, `style`, `testID`), forwarded as they are.
- A user's `role` and `aria-*` props go through the same translation as core's and are consumed by it. A user's `accessibility*` props win over the translation field by field: `accessibilityState={{ busy: true }}` merges over core's `checked` and `expanded`.
- Web-only options, and a single web-only value of an option, are absent from the native types, not accepted and ignored. Today: `container`; `shortcut` and the `shortcuts` entry; the `modal` value `"trap-focus"`; `name`, `form` and the hidden `input` part ([What forms become on the native host][forms]).
- Native-only names: `OverlayHost` with `children` and `insets`; the `interaction` argument; File Input's `pick`; `onExit` ([How presence and exit animation work on native][presence]); the `/sheet` entry.

### Default hosts and `render`

- The default host is `Pressable` for a part that is pressed, `TextInput` for a text field, `Text` for a part whose content is text (Label, a Title, a Description, an item's text, a Select's value) and `View` otherwise. Scroll Area's viewport is a `ScrollView`. Text inside a `View` or `Pressable` part goes in a `Text` the user writes.
- `render` is an element or `(props, state, interaction) => element`, and may replace the host.
- The `props` it receives are native props ready to spread on a `react-native` host: handlers, `style`, `ref`, and accessibility in React Native's `accessibility*`, `accessible` and `importantForAccessibility` names only, never `role` or `aria-*`.

### State and `interaction`

- Part state is identical to the web's.
- Native parts emit no `dataSet` and no `data-*` props. Every CSS variable and data attribute core writes on a part is a field of that part's state. For popups: `side`, `align`, `anchorWidth`, `anchorHeight`, `availableWidth`, `availableHeight`, `transformOrigin` and `arrowOffset` on the content, and `side`, `align` and `arrowClamped` on the arrow.
- Press, hover and focus feedback is a separate argument: `(state, interaction) => ...` for `style`, `className` and `children`, and a third argument for `render`. `interaction` is `{ pressed, hovered, focused }`, on parts whose host is a `Pressable` or a `TextInput`.
- No styling library is assumed. NativeWind v5 and Uniwind work as is; NativeWind v4 users call `cssInterop` on the parts they style, and the package keeps its compiled build and its name.

## Accessibility

### Translation

- Core's ARIA is the source vocabulary. The adapter translates the attribute map to React Native accessibility props in one place ([Where the host seam sits in core][seam]).
- `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped. What they achieve on the web is kept by behavior: each option is its own accessible element ([How names and descriptions reach native screen readers][labels]).
- The adapter doesn't forward core's roving `tabindex="-1"`, which would take every non-active item out of Android's keyboard traversal ([How focus works on the native host][focus]).
- `required`, `disabled` and `readOnly` stay as state and reach accessibility ([What forms become on the native host][forms]).
- There is one behavior for iOS and Android, unless an accessibility API forces a difference ([What parity means for every component][parity]).

### Names and descriptions

From [How names and descriptions reach native screen readers][labels].

- A part whose children are plain text (a string, a number or an array of those) registers that text under its id, and updates or removes it as it changes or unmounts.
- `aria-labelledby` resolves to `accessibilityLabel`: the referenced texts, joined in order, kept current when a referenced part mounts or changes later. `aria-describedby` resolves the same way to `accessibilityHint`, joining the description and any error that is showing. `accessibilityLabelledBy` isn't used.
- This applies only to a part that is a single accessible element, such as a field's control, a trigger or a slider thumb. A container's name is never set on the container.
- A dialog is named by its title: the title carries the header role, and the focus request on open goes to it when the dialog has one.
- When the referenced content isn't plain text, nothing is extracted. The app passes `aria-label` or `aria-description` on the referring part.
- Development warns when a part that must have a name ends up without one, including when a referenced id resolves to nothing. Containers are exempt.

### Focus

From [How focus works on the native host][focus].

- Focus means two things: accessibility focus, the screen reader's cursor, and input focus, which belongs to text inputs. Core's focus behaviors request accessibility focus, and input focus as well when the element is a text input that should start editing.
- A request is never treated as observed. With no screen reader running, a request does nothing apart from input focus.
- On open, a popup requests accessibility focus once the element is mounted. Where it goes is restated in the popup's native behavior file ([What the seam's ADR records][adr-ticket]).
- On close, it requests focus on the trigger through core's chain of candidates. The chain starts at the trigger.
- Focus trapping is the `Modal`'s isolation for screen readers. It isn't a hardware-keyboard trap.
- A controller's `focus()` requests accessibility focus, and input focus for a text input.
- Nothing is built for roving focus, arrow keys, Home, End or typeahead. Every item is its own accessible element, reached by swiping.
- A combobox's highlighted option is announced. `selected` keeps meaning the committed value only.

### Hardware keyboards

From [How focus works on the native host][focus].

- Support is each OS's own keyboard navigation over correctly exposed elements: every part can be reached and activated with iOS Full Keyboard Access and Android's focus traversal, and a popup can be dismissed from the keyboard where the OS routes Escape to back or to the escape gesture.
- The adapter ships no native code to receive key events.
- Visible focus during keyboard traversal comes from `interaction.focused`, where the OS reports focus.
- Left out, as a scope exception that stands only if the owner accepts it: arrow keys inside a composite, Home, End, typeahead, a combobox's arrow keys, keyboard shortcuts, a keyboard focus trap, and Escape wherever the OS doesn't route it. It is revisited when React Native delivers key events to views in a stable build.

## Popups

From [How native popups layer, dismiss and place themselves][popups].

- **Where a popup renders.** A popup that is modal when it opens renders in React Native's `Modal`; a non-modal one renders in a host. Which it is follows from the popup's resolved `modal` setting and `presentation` at open time, not from the component's name.
- **Hosts.** The root host is `OverlayHost`, which wraps the app: `<OverlayHost>{app}</OverlayHost>`. Each `Modal` carries a host of its own. A popup renders into the nearest host above its trigger. A popup opened while a modal popup is open renders inside that popup's `Modal`, never as a sibling `Modal`. Overlays opened from code (`toast()`, `confirm()`) render in the topmost open host.
- **Dismissal.** Core's layer stack and dismissal rules are shared; the layer stack is restated in its twin ([What the seam's ADR records][adr-ticket]). A modal popup's backdrop consumes an outside press, and a non-modal popup lets it through. Android back goes to the topmost layer, through `onRequestClose` in a `Modal` and `BackHandler` in the root host, with the `"back"` reason. A layer that refuses the dismissal still consumes it. The iOS screen-reader escape gesture closes the topmost layer with the `"escape-key"` reason.
- **Placement.** `computePlacement` is shared. The anchor and the popup are measured in a layout effect, in the coordinate space of the host the popup renders into, and the popup is placed in its first frame. While an anchored popup is open it is measured again as the web does while things move, writing only what changed. The space it may use excludes the insets the app passed and the on-screen keyboard, counted once.
- **Insets.** The adapter never reads insets. The app passes them once to `OverlayHost`, zero by default, and the docs show wiring it to `react-native-safe-area-context` ([Which dependencies the native adapter may take][dependencies]).
- **`presentation="auto"`** resolves to the sheet on a phone-sized screen when the app has imported the sheet entry, and to the component's own form otherwise.
- **The principle** "popups work without portals" reads, on the native host: modal popups need nothing from the app; non-modal popups and toasts need the app wrapped in one `OverlayHost`. A part that needs the host and finds none says so in a development warning.

## Presence and motion

From [How presence and exit animation work on native][presence].

- **Leaving.** A part that can animate out takes `onExit`, called with a `done` function when it starts closing. The part stays mounted until `done` is called or a timeout passes; that clears `mounted` and fires `onOpenChangeComplete(false)`. `done` is idempotent. Reopening before it arrives cancels the pending exit and its timeout. While it exits, the part takes no input and is hidden from accessibility. With `keepMounted` the close settles without unmounting. Without `onExit` the part unmounts at once.
- **Entering.** The part's state carries the web's first-frame and closing flags as fields. The first-frame flag clears on the next frame. Entering settles at once, so `onOpenChangeComplete(true)` fires when the part mounts.
- **Panels.** Collapsible's and Accordion's panels measure their content, apart from the panel's own constrained height, and expose the size as state, including the size at close when an opening was interrupted. How the height animates is the app's choice.
- **Drawer and the sheet.** The physics in `foundation/motion` are shared as they are: core owns the decisions and the adapter owns the `Animated` values. During a drag the value follows the gesture from the JavaScript thread. On release the target and velocity come from the shared code, and the settle plays the shared spring.
- Reanimated isn't a peer. A user who wants it uses it in their own `render` and `style` ([Which dependencies the native adapter may take][dependencies]).

## Input, gestures and text entry

- **Press.** A press stands for a click and a touch drag for a pointer drag ([What parity means for every component][parity]).
- **Hover.** Tooltip and Hover Card stay closed on touch, a `toggleable` Tooltip opens on press, and both open on hover where the device reports one. There is no long press ([What parity means for every component][parity]).
- **Drags.** The state and the math are shared: a value from a position, snapping, the drafts, the target index, spans. A native behavior file turns the built-in responder system's start, move and end into the api calls the web's pointer handlers make. A responder that is cancelled, taken away or unmounted cancels the draft and never commits it. Pinch is computed from the responder's touches ([How drags and canvas components work on native][drags]).
- **Gesture Handler** is Drawer's and the sheet's alone. Another component joins them only if a device check shows the responder system can't deliver its behavior, and that is a new decision ([How drags and canvas components work on native][drags]).
- **Reordering and moving between lists** work by touch drag, started and cancelled as upstream does on touch. Scrolling near an edge during a drag works inside the library's own Scroll Area and nowhere else, and that Scroll Area stops its own scrolling for the length of a drag inside it ([How drags and canvas components work on native][drags]).
- **Text edits.** `TextInput` reports an edit after it happens. Where the web would refuse an edit, the native component accepts it and writes the corrected value back at once, through the same shared rules, and a write that rewrites the text carries its own selection. Nothing imitates `beforeinput` ([How text entry components work on TextInput][text-entry], on the findings of [What TextInput gives for selection, composition and the caret][textinput]).
- **Keys inside a field.** `onSubmitEditing` runs the component's submit action, including a combobox's choice of the highlighted option. A multiline field keeps Enter as a new line. Nothing else is built ([How text entry components work on TextInput][text-entry]).

## Forms

From [What forms become on the native host][forms].

- There is no submission, reset, `name`, `form` or hidden `input` part, and no form component. The app reads values from change callbacks and controllers, and resets a control by setting its value.
- The adapter computes no validity. Field is invalid only when the app passes `invalid`. An Error part's `match` takes `true` or `false` only. `valid` on Field and its parts and `message` on Error are absent.
- Field keeps `disabled` and `invalid` reaching its control and parts through state, its label activating the control when pressed, and its Error parts shown by the existing rules. An error is announced when it appears or changes, and stays silent on first render.
- FieldSet's `disabled` is handed down through state to the Fields and controls inside it, and a disabled FieldSet around another still disables it.
- Enter in a control submits nothing. A text field reports it through its own callback.
- Where shared api code calls form participation in `foundation/forms/form.ts`, the call reaches a twin that does nothing. The general disabled checks and focus registration in that file get real native behavior, and the value and toggle logic beside it is shared as it is.

## Direction and locale

From [How direction and locale are read on native][direction].

- The direction twin reads `I18nManager.isRTL` and keeps `isRTL(el)`'s signature, ignoring the element. There is one direction for the whole app.
- The locale resolves from `Intl`, and a component's own `locale` option overrides it. Native behavior files make the call `bind` makes on the web.

## The agent layer

From [What the agent layer reads and drives on native][agent].

- The registry, a snapshot's state and actions, `act` through the api with the `"agent"` source, `observe` and `history` keep their behavior. What depends on the host goes through a native twin: the registry and the bridge.
- A part's name and text come from what the adapter rendered: its translated accessibility label, the text it registered and its press handler.
- A part is shown when its slot's `present` says so, never because it is mounted. It isn't shown under a hidden mark or under a part hidden from accessibility.
- The marks keep their names (`data-agent-confirm`, `data-agent-hidden`, `data-agent-secret`) and are props on any part. One native-only wrapper component marks a region that isn't a part. A mark covers everything rendered inside it and applies before any label, text, value or action is exposed.
- The entry exports `snapshot` and `act`, and the app or its tooling calls them. The adapter ships no transport.

## Per-component parity

### The rule

From [What parity means for every component][parity].

- Every upstream component gets a native entry with the same parts, options, state and controller.
- Its behavior is what upstream's web component does on a touch screen, wherever upstream has decided that.
- Where iOS and Android have no form for a component and upstream has no touch decision, it keeps the same parts and the same interaction outcomes as the web, with no redesign for either OS.
- The parts are unstyled, so a visual form (a checkmark row, a segmented control) is the app's to draw.
- A component ships with its native behavior, its entry, its examples, its checks and its docs page, as on the web ([contributing/README.md](../../contributing/README.md)).

### The first tier

Ten components, each proving a job once: Button, Switch, Checkbox, Tabs, Input with Field, Dialog, Popover, Select, Slider and Drawer. The rest follow by the engine they share in core: toggles and form controls, then disclosure, lists, the remaining popups, date, text entry, and direct manipulation and canvas last ([What parity means for every component][parity]).

### Every component

These hold for every row and aren't repeated in it: no `data-*` props, state through functions, web-only options absent, no `event` in details, no arrow keys or typeahead, and each item its own accessible element. "Nothing recorded" means no resolution names a difference for that component beyond those. The table has a row per component folder in core, plus Alert Dialog and Time Input, which have entries of their own. Textarea is in Input's row and FieldSet in Field's.

| Component         | Group                          | What differs on native                                                                                                                                                                                           | Decided in                                                                                                                                                                                |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion         | Disclosure                     | Each panel exposes its measured size as state and closes through `onExit`.                                                                                                                                       | [How presence and exit animation work on native][presence]                                                                                                                                |
| Alert Dialog      | First tier, with Dialog        | As Dialog.                                                                                                                                                                                                       | [How native popups layer, dismiss and place themselves][popups], [How names and descriptions reach native screen readers][labels]                                                         |
| Autocomplete      | Lists                          | `onSubmitEditing` runs the submit action, including the choice of the highlighted option. The highlighted option is announced. The sheet needs the sheet entry.                                                  | [How text entry components work on TextInput][text-entry], [How focus works on the native host][focus], [Which dependencies the native adapter may take][dependencies]                    |
| Avatar            | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Button            | First tier                     | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Calendar          | Date                           | The locale comes from `Intl`.                                                                                                                                                                                    | [How direction and locale are read on native][direction]                                                                                                                                  |
| Carousel          | Direct manipulation and canvas | Dragged through the responder system.                                                                                                                                                                            | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Checkbox          | First tier                     | No hidden `input` part.                                                                                                                                                                                          | [What forms become on the native host][forms]                                                                                                                                             |
| Collapsible       | Disclosure                     | Its panel exposes its measured size as state and closes through `onExit`.                                                                                                                                        | [How presence and exit animation work on native][presence]                                                                                                                                |
| Color Picker      | Direct manipulation and canvas | The same parts and outcomes as the web, dragged through the responder system.                                                                                                                                    | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |
| Combobox          | Lists                          | As Autocomplete. `selected` means the committed value only.                                                                                                                                                      | [How text entry components work on TextInput][text-entry], [How focus works on the native host][focus], [Which dependencies the native adapter may take][dependencies]                    |
| Command           | Lists                          | The same parts and outcomes as the web. `shortcut` is absent.                                                                                                                                                    | [What parity means for every component][parity], [Where native names diverge from @ui-sdk/react][names]                                                                                   |
| Date Input        | Text entry                     | One `TextInput` per segment, with the keyboard its content needs. Focus advances when a segment is complete, and Backspace in an empty segment goes back. An edit the web would refuse shows, then is corrected. | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Date Picker       | Date                           | The sheet needs the sheet entry.                                                                                                                                                                                 | [Which dependencies the native adapter may take][dependencies]                                                                                                                            |
| Dialog            | First tier                     | In a `Modal` when modal, in a host otherwise. Named by its title, which takes the focus request on open. The `modal` value `"trap-focus"` is absent.                                                             | [How native popups layer, dismiss and place themselves][popups], [How names and descriptions reach native screen readers][labels], [Where native names diverge from @ui-sdk/react][names] |
| Drawer            | First tier                     | Its entry imports Gesture Handler, an optional peer. The physics are shared and the adapter owns the `Animated` values.                                                                                          | [Which dependencies the native adapter may take][dependencies], [How presence and exit animation work on native][presence]                                                                |
| Field             | First tier, with Input         | Invalid only when the app passes `invalid`. Error's `match` is `true` or `false`. No `valid`, `message` or `name`. FieldSet hands `disabled` down through state.                                                 | [What forms become on the native host][forms]                                                                                                                                             |
| File Input        | Toggles and form controls      | Its root takes a `pick` function the app passes in. The files it returns carry `name`, `size`, `type` and `uri`.                                                                                                 | [What parity means for every component][parity], [Where native names diverge from @ui-sdk/react][names]                                                                                   |
| Hover Card        | Popups                         | Stays closed on touch, and opens on hover where the device reports one.                                                                                                                                          | [What parity means for every component][parity]                                                                                                                                           |
| Image Cropper     | Direct manipulation and canvas | Reports the crop area, with its rotation and flips. `cropImage` is absent. Pinch is computed from the responder's touches.                                                                                       | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Input             | First tier, with Field         | A `TextInput`. Enter submits nothing. Textarea keeps Enter as a new line, and has no modifier-plus-Enter submit.                                                                                                 | [What forms become on the native host][forms], [How text entry components work on TextInput][text-entry]                                                                                  |
| Label             | Toggles and form controls      | A `Text` host.                                                                                                                                                                                                   | [Where native names diverge from @ui-sdk/react][names]                                                                                                                                    |
| Listbox           | Lists                          | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Menu              | Popups                         | `shortcut` is absent. The sheet needs the sheet entry.                                                                                                                                                           | [Where native names diverge from @ui-sdk/react][names], [Which dependencies the native adapter may take][dependencies]                                                                    |
| Menubar           | Popups                         | The same parts and outcomes as the web, with a press for a click.                                                                                                                                                | [What parity means for every component][parity]                                                                                                                                           |
| Meter             | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Navigation Menu   | Popups                         | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Number Input      | Text entry                     | An edit the web would refuse shows, then is corrected. It keeps its increment and decrement parts and has no arrow-key stepping.                                                                                 | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| OTP Input         | Text entry                     | One `TextInput` under drawn slots, with one-time-code autofill. The active slot follows the selection, and tapping a slot selects it through the `selection` prop.                                               | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Pagination        | Toggles and form controls      | The same parts and outcomes as the web.                                                                                                                                                                          | [What parity means for every component][parity]                                                                                                                                           |
| Password Input    | Text entry                     | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Popover           | First tier                     | In a host when non-modal, so the app needs `OverlayHost`. Its placement values are state fields.                                                                                                                 | [How native popups layer, dismiss and place themselves][popups], [How state reaches native styles][styles]                                                                                |
| Progress          | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Radio             | Toggles and form controls      | No hidden `input` part.                                                                                                                                                                                          | [What forms become on the native host][forms]                                                                                                                                             |
| Rating            | Toggles and form controls      | Upstream's touch behavior.                                                                                                                                                                                       | [What parity means for every component][parity]                                                                                                                                           |
| Resizable         | Direct manipulation and canvas | Upstream's touch behavior, dragged through the responder system.                                                                                                                                                 | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |
| Scroll Area       | Direct manipulation and canvas | Its viewport is a `ScrollView`. It stops its own scrolling during a drag inside it, and is the only place edge scrolling works.                                                                                  | [Where native names diverge from @ui-sdk/react][names], [How drags and canvas components work on native][drags]                                                                           |
| Segmented Control | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Select            | First tier                     | `presentation="auto"` is the sheet only when the app imports the sheet entry. Its value is a `Text`.                                                                                                             | [How native popups layer, dismiss and place themselves][popups], [Where native names diverge from @ui-sdk/react][names]                                                                   |
| Separator         | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Slider            | First tier                     | Dragged through the responder system.                                                                                                                                                                            | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Switch            | First tier                     | No hidden `input` part. It needs no native behavior file.                                                                                                                                                        | [What forms become on the native host][forms], [Does the host seam hold for Switch and Dialog][prototype]                                                                                 |
| Tabs              | First tier                     | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Time Input        | Text entry, with Date Input    | As Date Input.                                                                                                                                                                                                   | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Timeline          | Direct manipulation and canvas | Dragged through the responder system.                                                                                                                                                                            | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Toast             | Popups                         | Renders in the topmost open host, so the app needs `OverlayHost`.                                                                                                                                                | [How native popups layer, dismiss and place themselves][popups]                                                                                                                           |
| Toggle            | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Token Input       | Text entry                     | The tokens are a row of parts beside a plain `TextInput`. Backspace in an empty field removes the last token. Text between tokens isn't possible.                                                                | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Toolbar           | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Tooltip           | Popups                         | Stays closed on touch. A `toggleable` one opens on press. It opens on hover where the device reports one, and never on a long press.                                                                             | [What parity means for every component][parity]                                                                                                                                           |
| Tree              | Lists                          | Nothing recorded.                                                                                                                                                                                                |                                                                                                                                                                                           |
| Trigger Menu      | Text entry                     | The menu anchors to the field's box, above or below it. The trigger is found by diffing the text on each change.                                                                                                 | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Waterfall         | Direct manipulation and canvas | The same parts and outcomes as the web, dragged through the responder system.                                                                                                                                    | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |

[What parity means for every component][parity] names no group for Avatar, Separator, Progress, Meter and Pagination; the build plan puts them with the toggles and form controls.

## Checking

From [How native correctness is checked][checking].

- **The pattern check** runs in Jest with no device, over the accessibility props the rendered parts pass to host views. It asserts roles and ownership, required states, accessible names, one accessible element per item and hidden content. Where the web check presses a key, it performs the accessibility action a screen reader user has and checks the resulting state, and it checks that accessibility focus was requested on open and close. It takes the rendered host tree as an argument and never imports a renderer. It runs once for iOS and once for Android, because the actions differ. It ships publicly, like the web check. `checkDirection` and the "creating a primitive reads no host API" rule of `checkServer` get counterparts at the same level.
- **Device specs** cover behavior with real touches, a snapshot per state of the accessibility tree the OS built, and Apple's audit on iOS. That snapshot checks what the OS exposes; it doesn't stand in for speech or screen-reader navigation. Android gets no automated audit. The tool is Appium, alone, and that choice is provisional: [Measure Appium on GitHub runners][appium] is still running, and its numbers confirm the tool or not.
- **Specs are written apart** from the web specs, with no abstraction over Playwright and the device tool. They keep the same kinds of file per component and the same scenario names where the scenario exists.
- **The manual pass.** Each component gets one pass with VoiceOver on a physical iPhone and one with TalkBack, against a short checklist, with the result recorded in the component's pull request. The pass also has a hardware-keyboard step on iOS and Android, run with the screen reader off and iOS Full Keyboard Access on: every part can be reached and activated, a modal contains the keyboard, and every popup can be dismissed and focus returns ([How focus works on the native host][focus]).
- **Done.** A component is done only when both its device specs and its manual pass succeed.

What runs when:

| When                                   | What runs                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A pull request                         | The Jest-level checks, and the device specs for the components it touched, on iOS and Android. The device specs run without blocking until [Measure Appium on GitHub runners][appium] shows they can.        |
| After a merge that touches shared code | A sweep of every device spec.                                                                                                                                                                                |
| After merging upstream                 | The registry checks, then the web gates the repo already has, then the native Jest-level checks ([How the fork takes upstream changes][upstream]).                                                           |
| Per component, once                    | The manual pass.                                                                                                                                                                                             |
| Never                                  | A spec with a screen reader on, a browser-measured performance test ([Which budgets the native adapter has][budgets]), and `pnpm test:docs` on a native example ([How native docs and examples ship][docs]). |

## Dependencies, packaging and publishing

- **Peers.** `react` and `react-native` are the only required peers. Nothing is a hard dependency. A library becomes an optional peer only when a behavior parity requires can't be built on the built-ins, and then only the entry that needs it imports it ([Which dependencies the native adapter may take][dependencies]).
- **Gesture Handler** is the one optional peer, imported by Drawer's entry and the sheet entry. The popup entries never import it. Reanimated, `react-native-safe-area-context` and `react-native-screens` aren't peers ([Which dependencies the native adapter may take][dependencies]).
- **Resolution.** Expo SDK 58 resolves the workspace packages and their `dist` with no Metro configuration ([How Metro and Expo resolve a workspace package][metro]).
- **Names.** In the repo every package keeps its `@ui-sdk/*` name. A pack step rewrites the scope to `@rn-ui-sdk` in the package names, the `@ui-sdk/core` dependency keys and the import specifiers in the built `.js`, `.d.ts` and source maps ([How the fork publishes its packages][publishing]).
- **What is published:** `@rn-ui-sdk/core`, `@rn-ui-sdk/react` and `@rn-ui-sdk/react-native`. Vue, Svelte, Solid and web components aren't ([How the fork publishes its packages][publishing]).
- **Versions.** The three share one version line of their own, starting at `0.1.0`, and each release states the upstream version it contains ([How the fork publishes its packages][publishing]).
- **Release flow.** The fork never runs `changeset version` on the shared packages and never adds a changeset that names one. Its version lives in one fork-only file applied by the pack step, its changes in one fork-only changelog, and a fork-only workflow publishes on demand ([How the fork publishes its packages][publishing]).
- **Timing.** Nothing is published before the first tier passes its checks on both simulators. Until then the playground consumes workspace code ([How the fork publishes its packages][publishing]).
- **The playground** is `apps/native-playground`, an Expo SDK 58 app in Expo Go that sets its own port ([Scaffold an Expo playground that runs workspace code on both simulators][playground]).

## Docs, examples, the expert and budgets

- **Docs.** A sixth section, `react-native`, written from React's and changed only where native differs. `/docs/react-native/llms.txt` and the package's Markdown docs are generated as the others' are ([How native docs and examples ship][docs]).
- **Examples** live in `examples/components/<name>/react-native/<example>.tsx`, with the same names as the other frameworks. A page shows an example's code only: no live preview, no screenshots, nothing through React Native Web ([How native docs and examples ship][docs]).
- **Kept working.** The playground's screen list is generated from those folders, so every example is type-checked and bundled with it, and the device specs open them. A file-level check enforces that native has every example the other frameworks have, with a listed exemption for each example of a web-only feature, naming the feature and why. An exemption never stands in for an example not yet written ([How native docs and examples ship][docs]).
- **Reference tables.** A native page keeps the option, state, reason and controller tables. A per-part table of the state fields a part's style functions receive replaces the data attribute and CSS variable tables ([How native docs and examples ship][docs]).
- **The expert.** A `react-native` expert in `.agents/experts/react-native/`, with its subagent file in `.claude/agents/`, its `decisions.md` seeded from the map and the ADR. It joins `scripts/expert-scope.mjs`, with one new clause for the native playground. Twins and native behavior files reach every expert, as core does ([What the React Native expert covers][expert]).
- **The shipped skill** in `packages/core/skills/ui-sdk` gains a short native section when the first tier lands ([What the React Native expert covers][expert]).
- **Budgets.** Each native entry gets a byte budget in `size-budget.json`, set from its measured size when its component lands, measured by `scripts/size.mjs` with `react` and `react-native` external and core included ([Which budgets the native adapter has][budgets]).

## Taking upstream changes

From [How the fork takes upstream changes][upstream].

- Upstream's `main` is merged into the fork's `main` with a merge commit, never rebased.
- After a merge the registry checks run first, then the web gates, then the native Jest-level checks. The mirrored files the drift check lists are reviewed before the registry's commit advances.
- `pending` is one list, read by the parity check, the size check and the example check. A component upstream adds doesn't turn the fork red: it stays visibly incomplete in the check's output, which is the parity list. There is no separate tracker.

## Recorded differences from the web

Every difference the resolutions record, by subject.

**Contract**

- No `dataSet`, `data-*` props or CSS variables; their values are state fields ([How state reaches native styles][styles]).
- Press, hover and focus feedback is the `interaction` argument, not `:active`, `:hover` or `:focus-visible` ([How state reaches native styles][styles]).
- `container`, `shortcut`, the `shortcuts` entry and the `modal` value `"trap-focus"` are absent ([Where native names diverge from @ui-sdk/react][names]).
- A part's host is a `react-native` component, not a tag string, and `render` receives native props with accessibility in `accessibility*` names only ([Where native names diverge from @ui-sdk/react][names]).
- A user writes React Native's host props, such as `onPress` for `onClick` ([Where native names diverge from @ui-sdk/react][names]).
- A change's details carry no `event` ([Where the host seam sits in core][seam]).
- NativeWind v4 users call `cssInterop` on the parts they style ([How state reaches native styles][styles]).

**Accessibility, focus and keyboards**

- `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped ([How names and descriptions reach native screen readers][labels]).
- A name or description comes only from plain text, only on a single accessible element, and never on a container ([How names and descriptions reach native screen readers][labels]).
- A dialog is named by its title, which takes the focus request on open ([How names and descriptions reach native screen readers][labels]).
- Focus is requested, never observed, and the return chain starts at the trigger ([How focus works on the native host][focus]).
- A focus trap is the `Modal`'s isolation for screen readers, not a keyboard trap ([How focus works on the native host][focus]).
- No roving focus, arrow keys, Home, End or typeahead; the roving `tabindex` isn't forwarded ([How focus works on the native host][focus]).
- A combobox's highlighted option is announced, not exposed as an active descendant ([How focus works on the native host][focus]).
- With a hardware keyboard there are no arrow keys inside a composite, no Home, End or typeahead, no combobox arrow keys, no keyboard shortcuts, no keyboard focus trap, and Escape only where the OS routes it ([How focus works on the native host][focus]).

**Popups**

- Modal popups render in `Modal`, and non-modal popups and toasts need the app wrapped in `OverlayHost` ([How native popups layer, dismiss and place themselves][popups]).
- Android back dismisses the topmost layer with the `"back"` reason, and a refused dismissal still consumes it ([How native popups layer, dismiss and place themselves][popups]).
- The iOS escape gesture stands for Escape, with the `"escape-key"` reason ([How native popups layer, dismiss and place themselves][popups]).
- `presentation="auto"` is the sheet only when the app imports the sheet entry ([How native popups layer, dismiss and place themselves][popups]).
- The sheet presentation is a separate entry ([Which dependencies the native adapter may take][dependencies]).
- Insets are a value the app passes ([Which dependencies the native adapter may take][dependencies]).

**Presence and motion**

- An exit ends when the app calls `done` from `onExit`, or at a timeout; nothing reads an animation ([How presence and exit animation work on native][presence]).
- Entering settles at once, so `onOpenChangeComplete(true)` doesn't wait for an enter animation ([How presence and exit animation work on native][presence]).
- A panel's size is a state field ([How presence and exit animation work on native][presence]).

**Input and text entry**

- An edit the web would refuse shows for a moment before it is corrected ([How text entry components work on TextInput][text-entry]).
- Token Input's tokens sit in a row beside a plain field, and text between tokens isn't possible ([How text entry components work on TextInput][text-entry]).
- Trigger Menu anchors to the field's box, not the caret ([How text entry components work on TextInput][text-entry]).
- A multiline field has no modifier-plus-Enter submit, and Number Input has no arrow-key stepping ([How text entry components work on TextInput][text-entry]).
- Edge scrolling during a drag works only inside the library's Scroll Area ([How drags and canvas components work on native][drags]).
- `cropImage` is absent ([How drags and canvas components work on native][drags]).
- File Input takes a `pick` function, and its files carry a `uri` ([What parity means for every component][parity]).

**Forms**

- No submission, reset, `name`, `form` or hidden `input` part ([What forms become on the native host][forms]).
- No validity is computed: Field is invalid only when the app says so, Error's `match` is `true` or `false`, and `valid` and `message` are absent ([What forms become on the native host][forms]).
- FieldSet disables what is inside it through state, not through the browser ([What forms become on the native host][forms]).
- Enter in a control submits nothing ([What forms become on the native host][forms]).

**Direction and the agent layer**

- One direction for the whole app, with none for part of the screen ([How direction and locale are read on native][direction]).
- The agent layer sees only the library's components and parts; an app's own `Pressable` is invisible to it ([What the agent layer reads and drives on native][agent]).
- Agent marks are props, plus a wrapper for a region that isn't a part ([What the agent layer reads and drives on native][agent]).

**Checking, docs and budgets**

- The pattern check performs accessibility actions where the web check presses keys, and runs once per OS ([How native correctness is checked][checking]).
- No spec runs with a screen reader; a manual pass per component stands in, and Android has no automated audit ([How native correctness is checked][checking]).
- Examples are shown as code only, and a per-part state table replaces the data attribute and CSS variable tables ([How native docs and examples ship][docs]).
- No performance budget ([Which budgets the native adapter has][budgets]).

## Left to a device check

Nothing in the resolutions was run on a device, apart from the playground and the prototype. These points are recorded as waiting for one.

**Popups** ([How native popups layer, dismiss and place themselves][popups])

- Sibling and nested `Modal`s on iOS, and so whether a nested modal popup gets a nested `Modal` or a view in its parent's host with the isolation done by hand.
- Measuring an anchor outside a `Modal` against a popup inside one.
- Coordinates inside an Android `Modal`, with and without a translucent status bar.
- Whether following a scrolling anchor keeps up.

**Motion** ([How presence and exit animation work on native][presence])

- Whether Drawer's settle plays as a timed animation on the native driver with the shared spring as its easing. If not, it plays from JavaScript each frame.

**Text entry** ([How text entry components work on TextInput][text-entry], [What TextInput gives for selection, composition and the caret][textinput])

- Whether writing a corrected value back disturbs an IME that is composing.
- Whether the `selection` prop holds up for selecting an OTP slot on tap.
- The twelve points the `TextInput` research lists, mainly how visible the flicker is, what arrives during composition, and whether Android offers an SMS code.

**Drags** ([How drags and canvas components work on native][drags])

- Slider, Resizable, Carousel, Color Picker, Image Cropper, Timeline, Waterfall and reordering, each inside a scroll view scrolling along the same axis, on iOS and Android.
- Pinch computed from the responder's touches.

**Locale** ([How direction and locale are read on native][direction])

- Whether `Intl` reports the device's locale on iOS and Android. If it doesn't on one, the locale comes through the host interface.

**The seam** ([What the seam's ADR records][adr-ticket], [Does the host seam hold for Switch and Dialog][prototype])

- That a focus request moves a screen reader's cursor, for `focus()`, on open and on close.
- The rest of the screen hidden from VoiceOver while a dialog is open, and heard through TalkBack.
- The iOS escape gesture, and the `virtual` source of a screen reader's activation.
- A pending Close action's announcement.
- Nested dialogs, non-modal dialogs and Alert Dialog.
- The packed build on a device, and its types.
- Whether Tree's `press` throws on Hermes, which defines `HTMLElement`.

**Names** ([How names and descriptions reach native screen readers][labels])

- That naming a dialog through its title works, in the manual screen-reader pass.

**Overlays, gestures and animation** ([What native overlays, placement, gestures and animation can do with no extra dependencies][builtins])

- The seven checks its research file lists.

**The playground** ([Scaffold an Expo playground that runs workspace code on both simulators][playground])

- The `development` condition on Android, a production bundle and a development build.

**The device tool** ([Measure Appium on GitHub runners][appium])

- Appium's build time, spec time and failure rate on GitHub runners. Still running.

Also left for the build, though not a device check: `pnpm test:pr` was not seen to pass in full on the prototype ([What the seam's ADR records][adr-ticket]).

## Open for the owner

- **The hardware-keyboard exception.** Whether the owner accepts leaving out of native parity the keyboard patterns listed under [Hardware keyboards](#hardware-keyboards). The only way to keep them is native code in the adapter, which the dependency and drawn-from-views decisions rule out ([How focus works on the native host][focus]).
- **A physical iPhone** for the manual VoiceOver pass, since a simulator has no VoiceOver ([How native correctness is checked][checking]).

[map]: https://github.com/floklein/rn-ui/issues/2
[rn-a11y]: https://github.com/floklein/rn-ui/issues/5
[builtins]: https://github.com/floklein/rn-ui/issues/6
[metro]: https://github.com/floklein/rn-ui/issues/7
[publishing]: https://github.com/floklein/rn-ui/issues/11
[playground]: https://github.com/floklein/rn-ui/issues/12
[seam]: https://github.com/floklein/rn-ui/issues/13
[prototype]: https://github.com/floklein/rn-ui/issues/14
[parity]: https://github.com/floklein/rn-ui/issues/15
[dependencies]: https://github.com/floklein/rn-ui/issues/16
[popups]: https://github.com/floklein/rn-ui/issues/17
[styles]: https://github.com/floklein/rn-ui/issues/18
[checking]: https://github.com/floklein/rn-ui/issues/19
[names]: https://github.com/floklein/rn-ui/issues/20
[focus]: https://github.com/floklein/rn-ui/issues/21
[adr-ticket]: https://github.com/floklein/rn-ui/issues/22
[forms]: https://github.com/floklein/rn-ui/issues/23
[presence]: https://github.com/floklein/rn-ui/issues/24
[textinput]: https://github.com/floklein/rn-ui/issues/25
[text-entry]: https://github.com/floklein/rn-ui/issues/26
[drags]: https://github.com/floklein/rn-ui/issues/27
[agent]: https://github.com/floklein/rn-ui/issues/28
[appium]: https://github.com/floklein/rn-ui/issues/29
[labels]: https://github.com/floklein/rn-ui/issues/30
[docs]: https://github.com/floklein/rn-ui/issues/31
[direction]: https://github.com/floklein/rn-ui/issues/32
[budgets]: https://github.com/floklein/rn-ui/issues/33
[expert]: https://github.com/floklein/rn-ui/issues/34
[upstream]: https://github.com/floklein/rn-ui/issues/35
