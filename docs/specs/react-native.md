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
- A user's `role` and `aria-*` props go through the same translation as core's and are consumed by it. They merge with core's attributes as in `@ui-sdk/react`: core's value wins where it has one, and the user's stands where core gives none, so `<Button role="link">` is a link. `presentation` and `none` are ignored on a part whose default host is `Pressable`, which keeps its button role, as a browser does for a focusable element ([council batch 2][council-2]). A user's `accessibility*` props win over the translation field by field: `accessibilityState={{ busy: true }}` merges over core's `checked` and `expanded`.
- Web-only options, and a single web-only value of an option, are absent from the native types, not accepted and ignored. Today: `container`; `shortcut` and the `shortcuts` entry; the `modal` value `"trap-focus"`; `name`, `form`, the hidden `input` part and Switch's `value` ([What forms become on the native host][forms]); Pagination's `getHref` (ticket 87).
- Native-only names: `OverlayHost` with `children` and `insets`; the `interaction` argument; File Input's `pick`; `onExit` ([How presence and exit animation work on native][presence]); the `/sheet` entry.

### Default hosts and `render`

- The default host is `Pressable` for a part that is pressed, `TextInput` for a text field, `Text` for a part whose content is text (Label, a Title, a Description, an item's text, a Select's value) and `View` otherwise. Scroll Area's viewport is a `ScrollView`. Text inside a `View` or `Pressable` part goes in a `Text` the user writes.
- `render` is an element or `(props, state, interaction) => element`, and may replace the host.
- The `props` it receives are native props ready to spread on a `react-native` host: handlers, `style`, `ref`, and accessibility in React Native's `accessibility*`, `accessible` and `importantForAccessibility` names only, never `role` or `aria-*`.

### State and `interaction`

- Part state is identical to the web's.
- Native parts emit no `dataSet` and no `data-*` props. Every CSS variable and data attribute core writes on a part is a field of that part's state. For popups: `side`, `align`, `anchorWidth`, `anchorHeight`, `availableWidth`, `availableHeight`, `transformOrigin` and `arrowOffset` on the content, and `side`, `align` and `arrowClamped` on the arrow.
- Press, hover and focus feedback is a separate argument: `(state, interaction) => ...` for `style`, `className` and `children`, and a third argument for `render`. `interaction` is `{ pressed, hovered, focused }`, on parts whose host is a `Pressable` or a `TextInput`. A part disabled through `disabled` or `aria-disabled` reports no press or hover and takes no touch, so no ripple plays (#126).
- No styling library is assumed. NativeWind v5 and Uniwind work as is; NativeWind v4 users call `cssInterop` on the parts they style, and the package keeps its compiled build and its name.

## Accessibility

### Translation

- Core's ARIA is the source vocabulary. The adapter translates the attribute map to React Native accessibility props in one place ([Where the host seam sits in core][seam]).
- `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped. What they achieve on the web is kept by behavior: each option is its own accessible element ([How names and descriptions reach native screen readers][labels]).
- The adapter doesn't forward core's roving `tabindex="-1"`, which would take every non-active item out of Android's keyboard traversal ([How focus works on the native host][focus]).
- `required`, `disabled` and `readOnly` stay as state and reach accessibility ([What forms become on the native host][forms]).
- Accessibility actions do what a press does. On Android an expanded state declares TalkBack's `expand` or `collapse`, whichever changes it, and the part runs its press for it with the `virtual` source; undeclared, React Native flips the expanded state it reports without the press. `activate` already reaches the press on both OSes. `increment` and `decrement` (sliders, number inputs) and `escape` (popups) are routed by those components when they land: core moves a value or dismisses through key handlers the adapter never runs, so no generic route exists (ticket #127).
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

| Component         | Group                          | What differs on native                                                                                                                                                                                             | Decided in                                                                                                                                                                                |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion         | Disclosure                     | Each panel exposes its measured size as state and closes through `onExit`.                                                                                                                                         | [How presence and exit animation work on native][presence]                                                                                                                                |
| Alert Dialog      | First tier, with Dialog        | As Dialog.                                                                                                                                                                                                         | [How native popups layer, dismiss and place themselves][popups], [How names and descriptions reach native screen readers][labels]                                                         |
| Autocomplete      | Lists                          | `onSubmitEditing` runs the submit action, including the choice of the highlighted option. The highlighted option is announced. The sheet needs the sheet entry.                                                    | [How text entry components work on TextInput][text-entry], [How focus works on the native host][focus], [Which dependencies the native adapter may take][dependencies]                    |
| Avatar            | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Button            | First tier                     | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Calendar          | Date                           | The locale comes from `Intl`.                                                                                                                                                                                      | [How direction and locale are read on native][direction]                                                                                                                                  |
| Carousel          | Direct manipulation and canvas | Dragged through the responder system.                                                                                                                                                                              | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Checkbox          | First tier                     | No hidden `input` part.                                                                                                                                                                                            | [What forms become on the native host][forms]                                                                                                                                             |
| Collapsible       | Disclosure                     | Its panel exposes its measured size as state and closes through `onExit`.                                                                                                                                          | [How presence and exit animation work on native][presence]                                                                                                                                |
| Color Picker      | Direct manipulation and canvas | The same parts and outcomes as the web, dragged through the responder system.                                                                                                                                      | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |
| Combobox          | Lists                          | As Autocomplete. `selected` means the committed value only.                                                                                                                                                        | [How text entry components work on TextInput][text-entry], [How focus works on the native host][focus], [Which dependencies the native adapter may take][dependencies]                    |
| Command           | Lists                          | The same parts and outcomes as the web. `shortcut` is absent.                                                                                                                                                      | [What parity means for every component][parity], [Where native names diverge from @ui-sdk/react][names]                                                                                   |
| Date Input        | Text entry                     | One `TextInput` per segment, with the keyboard its content needs. Focus advances when a segment is complete, and Backspace in an empty segment goes back. An edit the web would refuse shows, then is corrected.   | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Date Picker       | Date                           | The sheet needs the sheet entry.                                                                                                                                                                                   | [Which dependencies the native adapter may take][dependencies]                                                                                                                            |
| Dialog            | First tier                     | In a `Modal` when modal, in a host otherwise. Named by its title, which takes the focus request on open. The `modal` value `"trap-focus"` is absent.                                                               | [How native popups layer, dismiss and place themselves][popups], [How names and descriptions reach native screen readers][labels], [Where native names diverge from @ui-sdk/react][names] |
| Drawer            | First tier                     | Its entry imports Gesture Handler, an optional peer. The physics are shared and the adapter owns the `Animated` values.                                                                                            | [Which dependencies the native adapter may take][dependencies], [How presence and exit animation work on native][presence]                                                                |
| Field             | First tier, with Input         | Invalid only when the app passes `invalid`. Error's `match` is `true` or `false`. No `valid`, `message` or `name`. FieldSet hands `disabled` down through state.                                                   | [What forms become on the native host][forms]                                                                                                                                             |
| File Input        | Toggles and form controls      | Its root takes a `pick` function the app passes in. The files it returns carry `name`, `size`, `type` and `uri`.                                                                                                   | [What parity means for every component][parity], [Where native names diverge from @ui-sdk/react][names]                                                                                   |
| Hover Card        | Popups                         | Stays closed on touch, and opens on hover where the device reports one.                                                                                                                                            | [What parity means for every component][parity]                                                                                                                                           |
| Image Cropper     | Direct manipulation and canvas | Reports the crop area, with its rotation and flips. `cropImage` is absent. Pinch is computed from the responder's touches.                                                                                         | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Input             | First tier, with Field         | A `TextInput`. Enter submits nothing. Textarea keeps Enter as a new line, and has no modifier-plus-Enter submit.                                                                                                   | [What forms become on the native host][forms], [How text entry components work on TextInput][text-entry]                                                                                  |
| Label             | Toggles and form controls      | A `Text` host.                                                                                                                                                                                                     | [Where native names diverge from @ui-sdk/react][names]                                                                                                                                    |
| Listbox           | Lists                          | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Menu              | Popups                         | `shortcut` is absent. The sheet needs the sheet entry.                                                                                                                                                             | [Where native names diverge from @ui-sdk/react][names], [Which dependencies the native adapter may take][dependencies]                                                                    |
| Menubar           | Popups                         | The same parts and outcomes as the web, with a press for a click.                                                                                                                                                  | [What parity means for every component][parity]                                                                                                                                           |
| Meter             | Toggles and form controls      | It has the progress bar role, as neither platform has a meter role. Its Value part is hidden from screen readers, which hear the value from the root (ticket 86).                                                  |                                                                                                                                                                                           |
| Navigation Menu   | Popups                         | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Number Input      | Text entry                     | An edit the web would refuse shows, then is corrected. It keeps its increment and decrement parts and has no arrow-key stepping.                                                                                   | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| OTP Input         | Text entry                     | One transparent `TextInput` over drawn slots, with one-time-code autofill and Paste. The active slot follows the selection, and a tap selects the slot under it through `selection`.                               | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Pagination        | Toggles and form controls      | The same parts and outcomes as the web.                                                                                                                                                                            | [What parity means for every component][parity]                                                                                                                                           |
| Password Input    | Text entry                     | A secure `TextInput`. `capsLock` is always `false`. On iOS, hiding the password while editing erases it at the next keystroke.                                                                                     | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Popover           | First tier                     | In a host when non-modal, so the app needs `OverlayHost`. Its placement values are state fields.                                                                                                                   | [How native popups layer, dismiss and place themselves][popups], [How state reaches native styles][styles]                                                                                |
| Progress          | Toggles and form controls      | Its Value part is hidden from screen readers, which hear the value from the root (ticket 86).                                                                                                                      |                                                                                                                                                                                           |
| Radio             | Toggles and form controls      | No hidden `input` part.                                                                                                                                                                                            | [What forms become on the native host][forms]                                                                                                                                             |
| Rating            | Toggles and form controls      | Upstream's touch behavior.                                                                                                                                                                                         | [What parity means for every component][parity]                                                                                                                                           |
| Resizable         | Direct manipulation and canvas | Upstream's touch behavior, dragged through the responder system.                                                                                                                                                   | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |
| Scroll Area       | Direct manipulation and canvas | Its viewport is a `ScrollView`. It stops its own scrolling during a drag inside it, and is the only place edge scrolling works.                                                                                    | [Where native names diverge from @ui-sdk/react][names], [How drags and canvas components work on native][drags]                                                                           |
| Segmented Control | Toggles and form controls      | No hidden `input` part. Its indicator's box is the `indicator*` state fields.                                                                                                                                      | [What forms become on the native host][forms], [How state reaches native styles][styles]                                                                                                  |
| Select            | First tier                     | `presentation="auto"` is the sheet only when the app imports the sheet entry. Its value is a `Text`.                                                                                                               | [How native popups layer, dismiss and place themselves][popups], [Where native names diverge from @ui-sdk/react][names]                                                                   |
| Separator         | Toggles and form controls      | No screen reader hears it: neither OS announces a separator role, so it's a plain `View` (ticket 85).                                                                                                              |                                                                                                                                                                                           |
| Slider            | First tier                     | Dragged through the responder system.                                                                                                                                                                              | [How drags and canvas components work on native][drags]                                                                                                                                   |
| Switch            | First tier                     | No hidden `input` part. It needs no native behavior file.                                                                                                                                                          | [What forms become on the native host][forms], [Does the host seam hold for Switch and Dialog][prototype]                                                                                 |
| Tabs              | First tier                     | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Time Input        | Text entry, with Date Input    | As Date Input.                                                                                                                                                                                                     | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Timeline          | Lists                          | No drag, as upstream: a swipe on it scrolls the view around it (#116). A feed is a list; no position or current step is announced. An event is read text by text, or as one element with `accessible`.             | [What parity means for every component][parity]                                                                                                                                           |
| Toast             | Popups                         | Renders in the topmost open host, so the app needs `OverlayHost`.                                                                                                                                                  | [How native popups layer, dismiss and place themselves][popups]                                                                                                                           |
| Toggle            | Toggles and form controls      | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Token Input       | Text entry                     | The tokens are a row of parts beside a plain `TextInput`. Backspace in an empty field removes the last token. Text between tokens isn't possible.                                                                  | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Toolbar           | Toggles and form controls      | Its link is a `Pressable` with the link role, and navigates from `onPress`. The controller's `focus()` goes to the first enabled item, since native reports no focus for the toolbar's stop to follow (ticket 80). |                                                                                                                                                                                           |
| Tooltip           | Popups                         | Stays closed on touch. A `toggleable` one opens on press. It opens on hover where the device reports one, and never on a long press.                                                                               | [What parity means for every component][parity]                                                                                                                                           |
| Tree              | Lists                          | Nothing recorded.                                                                                                                                                                                                  |                                                                                                                                                                                           |
| Trigger Menu      | Text entry                     | The menu anchors to the field's box, above or below it. The trigger is found by diffing the text on each change.                                                                                                   | [How text entry components work on TextInput][text-entry]                                                                                                                                 |
| Waterfall         | Direct manipulation and canvas | The same parts and outcomes as the web, dragged through the responder system.                                                                                                                                      | [What parity means for every component][parity], [How drags and canvas components work on native][drags]                                                                                  |

[What parity means for every component][parity] names no group for Avatar, Separator, Progress, Meter and Pagination; the build plan puts them with the toggles and form controls.

## Checking

From [How native correctness is checked][checking].

- **The pattern check** runs in Jest with no device, over the accessibility props the rendered parts pass to host views. It asserts roles and ownership, required states, accessible names, one accessible element per item and hidden content. Where the web check presses a key, it performs the accessibility action a screen reader user has and checks the resulting state, and on iOS it checks that accessibility focus was requested after escape; each popup pattern checks its own focus requests when it lands. A disclosure keeps focus on its button, and its content outside the button must follow the expanded state after each action. It takes the rendered host tree as an argument and never imports a renderer. It runs once for iOS and once for Android, because the actions differ. It ships publicly, like the web check. `checkDirection` and the "creating a primitive reads no host API" rule of `checkServer` get counterparts at the same level.
- **Device specs** cover behavior with real touches, a snapshot per state of the accessibility tree the OS built, and Apple's audit on iOS. That snapshot checks what the OS exposes; it doesn't stand in for speech or screen-reader navigation. Android gets no automated audit. The tool is Appium, alone, on both platforms, with the session and launch limits its measurement had to raise written into the harness. They run against a standalone build of the playground that carries its JavaScript bundle, with its native folders generated by `expo prebuild` in CI and not committed ([Whether Appium stays and device specs block a pull request][gate], [Measure Appium on GitHub runners][appium]).
- **Specs are written apart** from the web specs, with no abstraction over Playwright and the device tool. They keep the same kinds of file per component and the same scenario names where the scenario exists.
- **The manual pass.** Each component gets one pass with VoiceOver on a physical iPhone and one with TalkBack, against a short checklist, with the result recorded in the component's pull request. The pass also has a hardware-keyboard step on iOS and Android, run with the screen reader off and iOS Full Keyboard Access on: every part can be reached and activated, a modal contains the keyboard, and every popup can be dismissed and focus returns ([How focus works on the native host][focus]).
- **Done.** A component is done only when both its device specs and its manual pass succeed.

What runs when:

| When                                   | What runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A pull request                         | The Jest-level checks, and the device specs for the components it touched, on iOS and Android. The Android device specs block. The iOS ones report without blocking, since 3 of 20 measured runs failed with no real fault: a red iOS run is rerun once by hand, its first result stays on the pull request, and a failure that repeats holds the merge until it is diagnosed. iOS blocks once a later series of 20 runs shows no such failure ([Whether Appium stays and device specs block a pull request][gate]). |
| After a merge that touches shared code | A sweep of every device spec.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| After merging upstream                 | The registry checks, then the web gates the repo already has, then the native Jest-level checks ([How the fork takes upstream changes][upstream]).                                                                                                                                                                                                                                                                                                                                                                   |
| Per component, once                    | The manual pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Never                                  | A spec with a screen reader on, a browser-measured performance test ([Which budgets the native adapter has][budgets]), and `pnpm test:docs` on a native example ([How native docs and examples ship][docs]).                                                                                                                                                                                                                                                                                                         |

## Dependencies, packaging and publishing

- **Peers.** `react` and `react-native` are the only required peers. Nothing is a hard dependency. A library becomes an optional peer only when a behavior parity requires can't be built on the built-ins, and then only the entry that needs it imports it ([Which dependencies the native adapter may take][dependencies]).
- **Gesture Handler** is the one optional peer, imported by Drawer's entry and the sheet entry. The popup entries never import it. Reanimated, `react-native-safe-area-context` and `react-native-screens` aren't peers ([Which dependencies the native adapter may take][dependencies]).
- **Resolution.** Expo SDK 58 resolves the workspace packages and their `dist` with no Metro configuration ([How Metro and Expo resolve a workspace package][metro]).
- **Names.** In the repo every package keeps its `@ui-sdk/*` name. A pack step rewrites the scope to `@rn-ui-sdk` in the package names, the `@ui-sdk/core` dependency keys and the import specifiers in the built `.js`, `.d.ts` and source maps ([How the fork publishes its packages][publishing]).
- **What is published:** `@rn-ui-sdk/core`, `@rn-ui-sdk/react` and `@rn-ui-sdk/react-native`. Vue, Svelte, Solid and web components aren't ([How the fork publishes its packages][publishing]).
- **Versions.** The three share one version line of their own, starting at `0.1.0`, and each release states the upstream version it contains ([How the fork publishes its packages][publishing]).
- **Release flow.** The fork never runs `changeset version` on the shared packages and never adds a changeset that names one. Its version lives in one fork-only file applied by the pack step, its changes in one fork-only changelog, and a fork-only workflow publishes on demand ([How the fork publishes its packages][publishing]).
- **Timing.** Nothing is published before the first tier passes its checks on both simulators. Until then the playground consumes workspace code ([How the fork publishes its packages][publishing]).
- **The playground** is `apps/native-playground`, an Expo SDK 58 app that sets its own port. It runs in Expo Go for development, and as a standalone build for device specs ([Scaffold an Expo playground that runs workspace code on both simulators][playground]).

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

## Rules for the build

Small rules every implementation ticket shares, so that no ticket decides them alone ([What the build plan's open questions resolve to][build-rules]).

1. **Storage and preferences.** The storage twin keeps values in memory, and keeps them between launches through a storage the app passes in as two functions, get and set. The `preferences` entry exists with the same names.
2. **Building one's own component.** On native a custom component is built as the library's own are: `definePrimitive`, `@ui-sdk/react-native/primitive` and the native host interface. Core's exported helpers that take elements, such as `createRovingFocus` and reordering, are web-only.
3. **Absent entries.** An entry is absent only when every export in it needs a concept that doesn't exist on native, which today is `shortcuts`. In an entry that exists, an export that needs the DOM, such as `cropImage`, is absent.
4. **`required` and `readOnly`** stay in state, where the app's styles and labels can use them, and are not announced. The adapter adds no words of its own to a label, since it has no translations.
5. **Sources.** A change reports `touch` for a press and for Android back, and `virtual` for the iOS escape gesture, for an accessibility action, and for a press while a screen reader is running.
6. **The exit timeout** is two seconds, fixed, with no option.
7. **`presentation="sheet"` without the sheet entry:** the component uses its own form, and development warns.
8. **Context across a `Modal`.** A Dialog's Backdrop and Content share one `Modal` by being moved into an outlet the root renders, so React context from a provider placed between the root and the content doesn't reach the content. A provider goes above the root or inside the content. The adapter's own contexts, like a disabled FieldSet's, are carried across: the outlet provides them again inside the `Modal` with the values they have where the content renders (#131). A non-modal popup renders in the topmost host (`OverlayHost`, or an open `Modal`'s), so a provider of the app's it reads goes above that host; the adapter's own contexts are carried there too. A modal popup renders its `Modal` in place, unless a `Modal` it isn't inside is up, when it renders in that `Modal`'s host.
9. **Gesture Handler's root view.** The app renders its own at its root, as Gesture Handler asks of every app. Drawer's entry and the sheet entry render the one inside their `Modal` themselves.
10. **Development warnings.** The native build of core resolves `#dev` and `#name-check` to their real modules and guards them with React Native's `__DEV__`, so warnings work with no app configuration and release bundles drop them.
11. **New public names** in core and the adapter get a docs page and a stability label like any public name, in the ticket that introduces them.
12. **The native pattern check** ships from `@ui-sdk/react-native/testing`.
13. **The adapter's own Jest tests** render parts with React Native Testing Library, a development dependency of the repo and never a peer.
14. **The no-document check** skips a component until it leaves `pending`.
15. **Device specs** open fixtures of their own in the native playground, as the web specs use fixtures in `apps/playground`. Each example is opened once to prove it runs.
16. **Spec kinds.** Every kind of web spec gets a native file wherever it applies: behavior, right to left, accessibility (the platform tree per state and Apple's audit), custom rendering, enhancements, kitchen sinks and one-off specs. Server rendering, count gates, leak specs and the screen-reader phrase log have none. The coverage script counts native as a framework, with a listed exemption per web-only case.
17. **After an upstream merge** the sweep of every device spec runs, since it is a merge that touches shared code.
18. **A device check that fails with no recorded fallback** stops its ticket, which records what it saw. The question comes back to the council as a new decision; the builder doesn't pick a fallback alone.
19. **Sizes.** Gesture Handler is external when Drawer's entry and the sheet entry are measured, like `react-native`.
20. **Guides.** The native docs section has the guides React's has, each written for native, leaving out a guide whose whole subject is web-only.
21. **Scroll Area** keeps its scrollbar and thumb parts, drawn from the scroll position the `ScrollView` reports, with the `ScrollView`'s own indicator hidden. Dragging a thumb scrolls.
22. **The agent layer's region wrapper** is `AgentRegion`. The `data-agent-*` props are read by the adapter and not forwarded to the host.
23. **A missing manual step.** A component whose only missing checks are the manual VoiceOver pass, the TalkBack pass or the iOS hardware-keyboard step can be merged with those recorded as outstanding, since the build's agents can't perform them. It stays listed as incomplete in the parity list until they are done by hand. The Android hardware-keyboard step stays required.
24. **Package names in the native docs.** The `react-native` docs section shows the published names, `@rn-ui-sdk/*`, in install commands and in every import of its pages and examples, rewritten when the docs are built, so a user's copy works as it is.

## Recorded differences from the web

Every difference the resolutions record, by subject.

**Contract**

- No `dataSet`, `data-*` props or CSS variables; their values are state fields ([How state reaches native styles][styles]).
- Press, hover and focus feedback is the `interaction` argument, not `:active`, `:hover` or `:focus-visible` ([How state reaches native styles][styles]).
- `container`, `shortcut`, the `shortcuts` entry and the `modal` value `"trap-focus"` are absent ([Where native names diverge from @ui-sdk/react][names]).
- Pagination has no `getHref`: native has no URLs to follow, so its pages and steps are always buttons, and an app navigates from `onPageChange` (ticket 87).
- A part's host is a `react-native` component, not a tag string, and `render` receives native props with accessibility in `accessibility*` names only ([Where native names diverge from @ui-sdk/react][names]).
- A user writes React Native's host props, such as `onPress` for `onClick` ([Where native names diverge from @ui-sdk/react][names]).
- A change's details carry no `event` ([Where the host seam sits in core][seam]).
- NativeWind v4 users call `cssInterop` on the parts they style ([How state reaches native styles][styles]).
- An Accordion item's `index` updates as items mount and unmount, not when they move: nothing reports a view that moves without remounting, where the web watches the page with a `MutationObserver` (ticket 89).

**Accessibility, focus and keyboards**

- `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped ([How names and descriptions reach native screen readers][labels]).
- A name or description comes only from plain text, only on a single accessible element, and never on a container ([How names and descriptions reach native screen readers][labels]).
- A dialog is named by its title, which takes the focus request on open ([How names and descriptions reach native screen readers][labels]).
- Focus is requested, never observed, and the return chain starts at the trigger ([How focus works on the native host][focus]).
- A focus trap is the `Modal`'s isolation for screen readers, not a keyboard trap ([How focus works on the native host][focus]).
- No roving focus, arrow keys, Home, End or typeahead; the roving `tabindex` isn't forwarded ([How focus works on the native host][focus]).
- A combobox's highlighted option is announced, not exposed as an active descendant ([How focus works on the native host][focus]).
- With a hardware keyboard there are no arrow keys inside a composite, no Home, End or typeahead, no combobox arrow keys, no keyboard shortcuts, no keyboard focus trap, and Escape only where the OS routes it ([How focus works on the native host][focus]).
- A part core keeps focusable but inert (`aria-disabled`: a pending Button, a disabled menu item, option or tab) is disabled on Android, since React Native has no way to say "disabled" to TalkBack without disabling the view. It leaves Android's keyboard order and a focused one loses keyboard focus; TalkBack still reaches it and says "disabled". iOS is unaffected ([aria-disabled on Android][aria-disabled]).
- On Android, busy and a mixed checked state are spoken from the view's description, so they need the part's own `aria-label`. A mixed checkbox or toggle named by its text reads as unchecked on Android (ticket 60).
- Android's keyboard Tab order follows the view tree, and Fabric removes a layout-only `View` from it. A part that isn't pressed and has a role or a label keeps its view (`collapsable={false}`), so a group's members stay together and in order. An app's own layout `View` can still be flattened, which lets Tab jump between its children and their neighbors; the app marks it `collapsable={false}` (#125).
- A progress bar or meter is one element on iOS, where React Native gives no role word, only the trait for a value that changes often. On Android it keeps its view and is no Tab stop; its description joins its label and value text, and the label's text stays in the tree beside it; what TalkBack stops on is unchecked. A labelled indeterminate bar's Android description ends in a comma ("Connecting, "), since React Native joins the label and the empty value text that clears the old value. A meter has the progress bar role on both (ticket 86).
- A separator is never announced: React Native takes `role="separator"` but neither OS gives it a trait or a class, so its role and `aria-orientation` reach no screen reader, and `decorative` changes nothing they hear (ticket 85).
- On iOS a tab list is a tab bar (`tabbar`), the only role that gives VoiceOver's tab bar trait, so its tabs are read as "tab, n of m"; each tab stays its own element. Android keeps the tab list role. Unchecked with VoiceOver ([council batch 2][council-2]).
- `presentation` and `none` yield to the button role by the part's default host, not by whether it can take focus: a part that defaults to `Pressable` stays a button, a `View` part becomes `none`, and a `render` host doesn't change which ([council batch 2][council-2]).
- A Toggle given `role="switch"` announces its on or off state from `aria-pressed`, where the web's switch ignores `aria-pressed` and announces no state; an app can still pass `aria-checked` ([council batch 2][council-2]).
- The current page of a Pagination is announced as selected: `aria-current="page"` becomes `accessibilityState.selected` unless the part sets `aria-selected`, since React Native has no current state. Pagination has no landmark: `navigation` and `listitem` reach no screen reader, and each page and step is its own button (ticket 87).
- A Label names and presses only a control beside it, through `htmlFor`: it can't wrap one, since VoiceOver reads a `Text` as one element. It reaches Input, Textarea, Switch, Checkbox and Slider, not a radio group; a Label for a range names every thumb without a name of its own, where the web names the group; a control has one label, the one mounted last, and ids are shared by every mounted screen. On Android a Label is its own TalkBack and Tab stop, as a pressable `Text` (ticket 82).
- A Calendar's days are buttons named by their full date, selected when picked: React Native has no grid cell, so days are reached by swiping, and a month's grid role reaches Android only. Today isn't announced, since neither OS has a current-date state. Unavailable days are disabled on Android, where they also leave the keyboard's Tab order (ticket 102).
- A Select's trigger keeps core's combobox role, which TalkBack announces as "combo box"; on iOS React Native gives `combobox` no trait and no role word, so VoiceOver reads the trigger's label and its value. The selected label is the trigger's accessibility value, so a label part names it without hiding the value. An option is a button whose selected state is the committed value (ticket 70).
- A Listbox's options are buttons whose selected state is the value, each its own element reached by swiping, as Select's are; the list itself has no role on native, so its name, from `aria-label` or a Field's label, reaches no screen reader, and with `multiple` VoiceOver and TalkBack don't say several can be chosen. A press toggles an option with `multiple`, as a touch does on the web, and Shift ranges, Ctrl or ⌘ and select all from the keyboard are absent. An option is highlighted while it has Android keyboard focus. `keepInView` does nothing: the list's `ScrollView` is the app's, so the selected option isn't scrolled into view (ticket 90).
- A live region's new text is announced on iOS, which has no live regions; Android keeps its own (`accessibilityLiveRegion`). Calendar's heading is the first part with one (ticket 102).
- An Accordion's header has no heading role: React Native gives an element one role, the trigger keeps the button's, and a header role on the `View` around it doesn't reach VoiceOver, which reads traits only from accessible elements; what TalkBack makes of a heading container around a button is unchecked. Heading navigation doesn't reach the items (ticket 89).

**Popups**

- Modal popups render in `Modal`, and non-modal popups and toasts need the app wrapped in `OverlayHost` ([How native popups layer, dismiss and place themselves][popups]).
- Tooltip's and Hover Card's `closeDelay` is at least 100 ms, so a pointer can cross from the trigger to the content: native has no bridge spanning the two, and the content's pointer-enter keeps it open. While a screen reader runs, a toast with an action or a close button waits until it stops, since native never tells core that focus reached a toast; other toasts still close on time, and durations aren't scaled ([council batch 5][council-5]). A toast's root takes VoiceOver's escape gesture and a "Dismiss" accessibility action, which TalkBack offers on the Android root from Android 9, so a screen reader can dismiss a held toast (on Android, from Android 9) ([council batch 6][council-6]).
- Android back dismisses the topmost layer with the `"back"` reason, and a refused dismissal still consumes it ([How native popups layer, dismiss and place themselves][popups]).
- The iOS escape gesture stands for Escape, with the `"escape-key"` reason ([How native popups layer, dismiss and place themselves][popups]).
- `presentation="auto"` is the sheet only when the app imports the sheet entry ([How native popups layer, dismiss and place themselves][popups]).
- The sheet presentation is a separate entry ([Which dependencies the native adapter may take][dependencies]).
- React Native has no dialog role: a dialog is announced by its title, a header, and on iOS its content is `accessibilityViewIsModal` (ticket 65).
- An alert dialog opened with a touch asks for focus on its title, as the web focuses the popup itself for touch; opened another way, on its first Close part (ticket 65).
- A closed modal dialog's `keepMounted` content leaves the screen anyway: React Native's `Modal` renders nothing while hidden (ticket 65).
- `persistentElements` does nothing on native, where nothing outside a `Modal` takes touches (ticket 65).
- A Select's list loads more only when its highlight reaches the last item: scrolling near the end calls nothing, since the list's `ScrollView` is the app's. `alignItemWithTrigger` is absent, as on the web for touch. A value's label is known before the list opens only from the items among the root's children, or its data `items` (ticket 70).
- Insets are a value the app passes ([Which dependencies the native adapter may take][dependencies]).

**Presence and motion**

- An exit ends when the app calls `done` from `onExit`, or at a timeout; nothing reads an animation ([How presence and exit animation work on native][presence]).
- Entering settles at once, so `onOpenChangeComplete(true)` doesn't wait for an enter animation ([How presence and exit animation work on native][presence]).
- A panel's size is a state field ([How presence and exit animation work on native][presence]).
- Drawer's content leaves with its own close settle, so it takes no `onExit` (ticket 72).
- A scroll view inside a drawer, scrolled away from its start while the drawer rests at its largest snap point, keeps the whole touch: reaching its start doesn't hand the rest of that touch to the drawer, as the web does. At its start the drawer takes the touch and scrolls the content itself, as the web's pointer driver does (ticket 72).
- A drawer with `modalAbove` renders in the `OverlayHost`, like a non-modal dialog, since a `Modal` takes every press and the page behind must stay usable (ticket 72).
- Drawer's `themeColor`, `preventEdgeSwipe` and the scroll-snap `driver` are absent; the handle's arrow keys, Home and End are a screen reader's increment and decrement (ticket 72).
- A drawer opened from another scales the one below back by 4% per drawer above it, as it rises: native has no `--drawer-stack` variable for a style to read. A field inside a drawer taller than the room above the keyboard isn't scrolled into view; a `ScrollView` around it does that (ticket 132).

**Input and text entry**

- Tabs' `direction` state is always `"none"`, since core works out which way the selection moved from the tabs' positions on the page ([Tabs](https://github.com/floklein/rn-ui/issues/61)).
- A read-only text field reads as disabled and leaves keyboard Tab order on Android and on single-line iOS fields, since React Native has no `TextInput` that is read-only yet enabled; multiline iOS fields stay enabled ([council batch 1][council-1]).
- Password Input's `capsLock` state is always `false`, since `TextInput` reports no modifier keys. On iOS a secure field erases its text when typing resumes after the password was hidden again while editing, as UIKit does; Android and the web keep it (seen on a simulator, [Password input](https://github.com/floklein/rn-ui/issues/104)).
- OTP Input handles no keys itself, so arrow keys, Home and End are left to the field's own caret; it has no undo history of its own and no `paste` reason: a paste is `input-change`. Its field sits at 1.1% opacity over the slots, since iOS draws its selection handles whatever `selectionColor` says; that keeps it hit-testable and in the accessibility tree. A tap selects the slot under its `locationX`, measured from the root, rather than where the field puts its caret, so the slots are drawn `View`s, not pressable. A refused character's caret is put back where the selection was ([OTP input](https://github.com/floklein/rn-ui/issues/106)).
- An edit the web would refuse shows for a moment before it is corrected ([How text entry components work on TextInput][text-entry]).
- Number Input writes a refused edit back with the selection it had, through core's shared corrected edit (`foundation/text/corrected-edit.ts`); deleting is always accepted. On iOS the write back ends an input method's composition: letters composed on the Japanese keyboard are removed at once, while composed digits are accepted and stay composing (seen on a simulator; Android unchecked). It has no `name`, `form`, hidden input or `wheel`; its step buttons step as the finger goes down and repeat while held, a screen reader's activation steps once, and they are Tab stops, since there's no arrow-key stepping. The field isn't adjustable: the step buttons stand in for a screen reader's increment and decrement. A scrub area works inside its number input only, with no pointer lock, cursor or Shift and Alt steps. Hermes on iOS has no `Intl.NumberFormat` `formatToParts`, so the parser works a locale's separators out of formatted text (twin `number-parts.native.ts`) ([Number input](https://github.com/floklein/rn-ui/issues/105)).
- Date Input and Time Input render one `TextInput` per segment. Each edit is diffed against the segment's text and typed through core's segment rules, a pasted value sets the whole date, and an edit that puts in nothing the segment takes is written back with its selection (the shared corrected edit). Backspace in an empty segment goes back: `onKeyPress` reports it before the deletion on iOS and on either side of it on Android, so each deletion pairs with its Backspace, and Android's hardware Backspace, which `onKeyPress` never reports, doesn't go back. Segments keep the spinbutton role, and TalkBack's increment and decrement step them as the arrow keys do; VoiceOver can't adjust them, since an iOS `TextInput`'s accessibility element is its `UITextField`, which takes no adjust or custom actions. There are no arrow keys, Page Up, Page Down, Home, End or Delete. Each segment is named by the group's name before its unit ("Birthday, month") and takes the Field's description as its hint, since a container's name reaches no screen reader. Hermes has no `Intl.DisplayNames`, so segment names fall back to English. No `name`, `form` or hidden input ([Date input and time input](https://github.com/floklein/rn-ui/issues/107)).
- Token Input's tokens sit in a row beside a plain field, and text between tokens isn't possible ([How text entry components work on TextInput][text-entry]).
- Trigger Menu anchors to the field's box, not the caret ([How text entry components work on TextInput][text-entry]).
- A multiline field has no modifier-plus-Enter submit, and Number Input has no arrow-key stepping ([How text entry components work on TextInput][text-entry]).
- Edge scrolling during a drag works only inside the library's Scroll Area ([How drags and canvas components work on native][drags]).
- A drag inside a plain `ScrollView` that scrolls along the same axis needs the app to pass `scrollEnabled={!dragging}`, with `dragging` set from the drag part's responder grant, release and termination. On iOS the scroll view otherwise pans along with the drag, since Fabric only stops it for a responder above it, not inside it. A perpendicular scroll view needs nothing, and the library's Scroll Area stops its own scrolling ([council batch 3][council-3]).
- A touch drag starts on the first move, as upstream's `touch-action: none` does, so a swipe that starts on a draggable item drags it and never scrolls its list. A list that must scroll gives each item a handle: the item's content takes its own touches, like a `Pressable`, so a swipe there goes to the scroll view, and a drag starts only on the handle the content leaves free. A transfer's list takes its items' touches, so its items have no handle. Carousel, Waterfall and reordering follow this ([council batch 5][council-5]).
- Scroll Area scrolls one axis, as a `ScrollView` does: vertical, or horizontal with the viewport's `horizontal` prop. Android has no `ScrollView` that scrolls both, so both axes need a horizontal `ScrollView` inside the viewport. Its edges reach styles as the `atStart` and `atEnd` state, not as the web's overflow and progress variables; touch never hovers, so `type="hover"` shows the scrollbars while scrolling; a touch on the scrollbar beside the thumb pages once, and the wheel, Alt and Escape behaviors of a mouse are absent ([Scroll area](https://github.com/floklein/rn-ui/issues/110)).
- A Resizable handle is an adjustable element, read as a slider whose value is the size of the panel before it: React Native announces no separator. A screen reader's increment and decrement move it one `step`; no keys reach it, so arrow keys, Home, End, Enter and `largeStep` do nothing, and neither a double tap nor a double-click collapses a panel. A panel's size is a state field the adapter turns into a length in points, measured by the group's `onLayout`, so panels render on every move of a drag, and `autoSaveId` saves only into the `storage` the app passes ([Resizable](https://github.com/floklein/rn-ui/issues/112)).
- `cropImage` is absent ([How drags and canvas components work on native][drags]).
- Image Cropper's crop is in the file's pixels, from `Image.getSize` once the image loads (`onLoad` reports the bitmap decoded for the view, smaller for a large photo). Its viewport's content lays out left to right, as the web's physical crop does. The selection's children (grid, handles) render over it beside its own element, since an accessible iOS view hides what's inside it. The image and selection are placed in points by the adapter, the viewport's content box measured by an inner view's `onLayout`, and the web's `--image-cropper-aspect-ratio` is the state's `imageAspectRatio`. The zoom is a track that follows touches, with a `zoomPosition` for its thumb, not a range input. No keys reach it: a screen reader's increment and decrement move the selection or a handle as Shift with an arrow does on the web, and the zoom a tenth of its range; there's no wheel and no Escape to cancel a drag. A pinch comes from `NativeDrag`'s `fingers`, every touch the responder reports ([Image cropper](https://github.com/floklein/rn-ui/issues/115)).
- Reordering and moving between lists bind their parts with `bindReorderItem`, `bindTransferList` and `bindTransferItem` from `@ui-sdk/core/native`; a transfer's list takes its items' touches (`pointerEvents="box-only"`), since a touch on an item that moves to another list ends with no release when its old view unmounts, so an item's own buttons take no touches. The moving item doesn't follow the finger between places (no `--drag-x`/`--drag-y`), an item the app doesn't `label` is announced by its key, and the keys and the `preview` option are the web's ([Reordering and moving between lists](https://github.com/floklein/rn-ui/issues/111)).
- Carousel moves its content with a transform, through the responder, where the web scrolls the viewport natively with CSS scroll snap: a touch on the viewport becomes a drag on its first move along the axis, as the web's mouse drag does, and nothing else scrolls it. A drag taken away springs back to its page. `loop` rewinds instead of wrapping the slides round (views have no CSS order); `--carousel-progress` and `--carousel-interval` are absent (the controller's `getProgress()` reads the progress); rotation doesn't pause for hover, a hidden app or a carousel off screen, and doesn't stop for keyboard focus, which native doesn't report; the viewport's arrow keys and the indicators' single tab stop are absent ([Carousel](https://github.com/floklein/rn-ui/issues/113)).
- File Input takes a `pick` function, and its files carry a `uri` ([What parity means for every component][parity]).
- Calendar renders no month or year select part, since native has no select element; an app controls `month` from a Select of its own, as its `custom-select` and `month-year-select` examples do. No focus is observed, so its `focused` state moves only when the months turn to show a day, and a press on a day of the month shown reports no `onFocusedChange` (ticket 102).

**Forms**

- No submission, reset, `name`, `form` or hidden `input` part ([What forms become on the native host][forms]).
- No validity is computed: Field is invalid only when the app says so, Error's `match` is `true` or `false`, and `valid` and `message` are absent ([What forms become on the native host][forms]).
- FieldSet disables what is inside it through state, not through the browser ([What forms become on the native host][forms]).
- Enter in a control submits nothing ([What forms become on the native host][forms]).

**Direction and the agent layer**

- One direction for the whole app, with none for part of the screen ([How direction and locale are read on native][direction]).
- Hermes's `Intl` has no `Intl.Locale` and no `formatRange`. The first day of the week comes from the locale tag's region, so a tag with no region, like `"en"`, starts on Monday where a browser maximizes it to `en-US` and starts on Sunday; a range of dates, like the heading of two months, is written as its two dates, "October 2026 – November 2026" where the web writes "October – November 2026" (twins `week.native.ts` and `format.native.ts`, ticket 102).
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

- Slider, Resizable, Carousel, Color Picker, Image Cropper, Waterfall and reordering, each inside a scroll view scrolling along the same axis, on iOS and Android. Resolved for Slider and Resizable on iOS: the app passes `scrollEnabled={!dragging}` and the view stays while the slider or handle moves, and a perpendicular scroll view needs nothing ([council batch 3][council-3]). Reordering on iOS (#111): with the same wiring from an item's responder events the list reorders and a same-axis `ScrollView` stays at 0, and a swipe beside the items still scrolls it; inside a Scroll Area no wiring is needed and a drag held at its edge scrolls it. Android is checked in #124.
- Pinch computed from the responder's touches. Resolved on iOS (#115): two fingers spreading and closing on a frame zoom it in and out, committing once as `pinch`, and one finger pans it; a box cropper's selection and handle drags inside a same-axis `ScrollView` with `scrollEnabled={!dragging}` leave it at 0.
- A reorderable list's handle on iOS and Android (#133): a swipe on the item's content, which takes its own touches, scrolls the list, and a drag on the handle reorders it.

**Locale** ([How direction and locale are read on native][direction])

- Whether `Intl` reports the device's locale on iOS and Android. If it doesn't on one, the locale comes through the host interface. Resolved on iOS (#71): after the simulator's language and region changed from French to German, the relaunched app read `en-DE` instead of `en-FR` and formatted 1234.5 as `1.234,5` instead of `1 234,5`; the language stays English because the app has only an English localization. Android is owed.

**The seam** ([What the seam's ADR records][adr-ticket], [Does the host seam hold for Switch and Dialog][prototype])

- That a focus request moves a screen reader's cursor, for `focus()`, on open and on close.
- The rest of the screen hidden from VoiceOver while a dialog is open, and heard through TalkBack.
- The iOS escape gesture, and the `virtual` source of a screen reader's activation.
- A pending Close action's announcement.
- Nested dialogs, non-modal dialogs and Alert Dialog.
- The packed build on a device, and its types.
- Whether Tree's `press` throws on Hermes, which defines `HTMLElement`.

**Tabs** ([council batch 2][council-2])

- That VoiceOver reads a tab list's tabs as "tab, n of m" from the `tabbar` role, on a physical iPhone.

**Names** ([How names and descriptions reach native screen readers][labels])

- That naming a dialog through its title works, in the manual screen-reader pass.

**Overlays, gestures and animation** ([What native overlays, placement, gestures and animation can do with no extra dependencies][builtins])

- The seven checks its research file lists.

**The playground** ([Scaffold an Expo playground that runs workspace code on both simulators][playground])

- The `development` condition on Android, a production bundle and a development build.

**The device tool** ([Measure Appium on GitHub runners][appium])

- What loses a tap on a stalling iOS runner, which caused two of the three iOS failures. Until it is known, iOS device specs don't block a pull request.

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
[build-rules]: https://github.com/floklein/rn-ui/issues/37
[gate]: https://github.com/floklein/rn-ui/issues/119
[aria-disabled]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6904500686
[council-1]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6909822604
[council-2]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6920083782
[council-3]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6922314446
[council-5]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6947711242
[council-6]: https://github.com/floklein/rn-ui/issues/2#issuecomment-6951331230
