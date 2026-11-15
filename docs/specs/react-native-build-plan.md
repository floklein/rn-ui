# React Native build plan

The work of [the spec](react-native.md), sliced into 62 implementation tickets. Each is sized for one agent session and leaves the repo green. The plan decides nothing: each ticket names the map issues that govern it, and what is still open is listed under [questions](#questions) at the end.

The tickets are on the tracker, as sub-issues of [React Native support](https://github.com/floklein/rn-ui/issues/38), with the same titles and blocking as here. Tickets are numbered 1 to 18, then 37 to 80: the numbers in between belonged to the first plan's horizontal foundation, which was re-sliced into tracer bullets and is closed as superseded on the tracker.

## How the plan is ordered

The order is the one [What parity means for every component](https://github.com/floklein/rn-ui/issues/15) set, cut into vertical slices: no ticket delivers a layer alone, and each piece of the foundation lands with the first component that needs it.

1. **The tracer bullet**, tickets 1 to 4. Switch, from the package to a press on both simulators (1), then its Jest-level checks (2), its device specs (3), and its docs, budget, expert and manual pass (4). Together they bring every layer a component needs.
2. **First tier**, tickets 5 to 16. The other nine components, in the order the map set, each bringing the engine or twin it is the first to need.
3. **Packing and publishing**, tickets 17 and 18. The packed build can start as soon as ticket 1 lands; publishing waits for the first tier.
4. **The rest**, tickets 37 to 80. Every other component by the engine it shares in core: toggles and form controls, disclosure, lists, the remaining popups, date, text entry, then direct manipulation and canvas. The guides, the shipped skill and the agent layer are here too.

Inside the rest, the groups run in this order: the guides and the shipped skill (37 and 38), toggles and form controls (39 to 49), disclosure (50 and 51), lists (52 to 56), the remaining popups (57 to 63), date (64 and 65), text entry (66 to 71), direct manipulation and canvas (72 to 79), and the agent layer (80). No resolution names a group for Avatar, Separator, Progress, Meter and Pagination, or a place for the agent layer; they sit where they block nothing.

### What blocks what

- **Ticket 1 blocks everything.** Tickets 2, 3, 4 and 17 can then run in parallel.
- **Button (5) is the gate to every later component.** It waits on Switch's checks, device specs and docs (2, 3 and 4), so no component lands unchecked. A later component depends on Button and on the engine it needs, so its line lists few numbers.
- **Each layer lands with its first user:** focusing a part with Switch (1), the announcer with Button (5), input focus with Input (6), names, descriptions and the form twin with Field (7), presence with Checkbox (8), the disclosure engine with Tabs (9), the popup changes, the popup's native behavior and the layer stack with Dialog (10), `OverlayHost` (11), placement with Popover (12), the listbox engine with Select (13), drags and the direction and locale twins with Slider (14), Gesture Handler with Drawer (15), the corrected edit with Number Input (67).
- **Popups** run in a line: Dialog (10), `OverlayHost` (11), Popover (12), Select (13). Drawer (15) needs Dialog and Slider's direction twin. The sheet entry (16) needs Popover, Select and Drawer.
- **Publishing (18)** needs the packed build (17) and every first-tier ticket.
- **Outside the plan:** The manual VoiceOver pass in every component ticket needs the physical iPhone that is open for the owner.

### What every ticket's checks mean

- **The repo gates:** `pnpm lint`, `pnpm format`, `pnpm typecheck`, the unit tests of the packages touched, `pnpm check:packages --build` and `pnpm test:pr`, each by its exit code, run through `scripts/test-slot.sh` with its own port. A ticket that edits a file upstream owns records the edit in the registry.
- **The component checks**, for a ticket that ships a component ([What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [Which budgets the native adapter has](https://github.com/floklein/rn-ui/issues/33), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35)):
  1. The component leaves `pending`, and the registry checks exit 0 with each of its slots that declares a skipped hook marked as covered by a named file or as needing nothing.
  2. The no-document probe lists no throw for its primitives.
  3. The pattern check passes for iOS and for Android, with its direction and no-host-API counterparts.
  4. Its examples are in `examples/components/<name>/react-native/`, the example check exits 0, and the playground type-checks and bundles them.
  5. Its device specs pass on an iOS simulator and an Android emulator.
  6. Its page is in the `react-native` docs section, with the per-part state table, and the docs build.
  7. Its entry has a budget in `size-budget.json`.
  8. Its manual pass with VoiceOver, with TalkBack and with a hardware keyboard is recorded in the pull request.
  9. The repo gates exit 0, and `ui-sdk-expert-review` has run.

A ticket created from this plan links back to this section.

## Tickets

### 1. Switch toggles on both simulators

- **Depends on:** nothing
- **Delivers:** An app developer installs `@ui-sdk/react-native`, renders Switch from its entry, and a press toggles it on an iOS simulator and an Android emulator. This is the tracer bullet: the thinnest path through every layer, which the next three tickets check, document and run on devices.

  It brings the package with its `primitive` entry (`usePrimitive`, `usePart`, `createParts`, `mergeProps`, `renderElement`, `RenderProp`, the part and handle types) and the native host interface in core behind `@ui-sdk/core/native`. A part reads the declarative slot fields, renders its default host, and delivers `press` through the api with the `touch` or `virtual` source and no `event`. It never calls `bind`, `asleep`, `connect` or the `on` handlers.

  It also brings:

  - **The styling contract.** `style`, `className` and `children` are values or functions of `(state, interaction)`, and `render` is an element or a function. Styles merge as arrays in the React adapter's order. The part forwards the resolved `className`, a merged `ref`, `disabled` and unknown props.
  - **The translation.** One place turns core's attribute map into React Native accessibility props.
  - **The twin convention, and the first twin: focusing a part.** It comes with the toggle control's focus reroute, so Switch's controller `focus()` requests accessibility focus.
  - **The playground's screen list,** generated from the example folders, starting with Switch's example.

- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What React Native gives for accessibility, focus and keyboards](https://github.com/floklein/rn-ui/issues/5), [How Metro and Expo resolve a workspace package](https://github.com/floklein/rn-ui/issues/7), [Scaffold an Expo playground that runs workspace code on both simulators](https://github.com/floklein/rn-ui/issues/12), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** a Jest test (React Native Testing Library) builds parts over `switchPrimitive` with `createParts`, and a press toggles it with `source=touch` and no `event`; an exports test finds the names of `@ui-sdk/react/primitive` in `@ui-sdk/react-native/primitive`; the package's peers are `react` and `react-native` only; core imports nothing from `react-native`; a host never receives a function; a style that isn't a plain object survives the merge unflattened; `interaction.pressed` reaches `style`, `className`, `children` and `render`; no `dataSet` or `data-*` prop reaches a host; a table-driven test covers every attribute core's slots emit, for iOS and for Android; `accessibilityState={{ busy: true }}` merges over `checked` and `expanded`; a user's `role` and `aria-*` are consumed and none reaches a host or `render`; `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped; an item with `tabindex="-1"` stays in keyboard traversal; the twin check exits 0, and fails on a twin with a missing or extra export; `tsc` fails on a twin whose exported type differs with no declared widening; `focusPart` reaches the host with the part's mounted view and makes no request once it has unmounted; Switch's controller `focus()` requests accessibility focus; adding an example file adds a playground screen with no other edit; the examples type-check; an Expo export for iOS and Android exits 0 and lists the twin, not its DOM module; Switch toggles by press in the playground on an iOS simulator and an Android emulator, with screenshots in the pull request; the repo gates exit 0

### 2. Switch passes its Jest-level checks

- **Depends on:** 1
- **Delivers:** Switch is checked with no device, the way every later component will be. Three things come with it.

  **The native pattern check.** It is the counterpart of `checkPattern`, shipped from `@ui-sdk/react-native/testing`. It takes a rendered host tree and the OS, and imports no renderer. It asserts roles and ownership, required states, names, one accessible element per item, hidden content, the state after each accessibility action, and the focus requests on open and close. `checkDirection` and the no-host-API rule of `checkServer` get counterparts.

  **The registry.** It maps each twin, native behavior file, reroute and additive edit to the upstream files it mirrors and the upstream commit it was reviewed against. Its checks are drift, slot coverage and parity. `pending` is one list, holding every component but Switch. The routine for merging upstream is written in `contributing/`.

  **The no-document probe and the example check.** The probe creates, keeps, reads, presses, focuses and destroys every primitive with no `document` and lists each path that throws. The example check enforces that native has every example the other frameworks have, with a listed exemption per web-only feature.

- **Decisions:** [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How native accessibility and behavior can be tested](https://github.com/floklein/rn-ui/issues/8), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35), [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31)
- **Done when:** the pattern check passes on Switch for iOS and for Android; it fails on each seeded fault: a missing name, a wrong role, a state that doesn't change after an action, a missing focus request; `escape` runs on iOS only, and `expand` and `collapse` on Android only; its module imports no renderer; the drift check lists a mirrored file that changed since its recorded commit, and nothing otherwise; the coverage and parity check exits 0 with Switch out of `pending` and each of its slots that declares a skipped hook marked; it fails when a component leaves `pending` with no native entry, or with an unmarked slot; ticket 1's twin, its reroute and its edits in upstream's files are in the registry; the routine for merging upstream is in `contributing/`; the probe runs from one command, lists the six `press` throws the prototype's report names, each against its component, and lists none for Switch; the example check exits 0, and fails when a component leaves `pending` with an example missing and no exemption; an exemption with no feature or reason fails; the repo gates exit 0

### 3. Switch's device specs run on both platforms

- **Depends on:** 1
- **Delivers:** Switch is proven with real touches on an iOS simulator and an Android emulator, locally and in CI. This sets up the device spec harness every component uses.

  - The specs are written apart from the web specs, with the same kinds of file and scenario names.
  - They open the playground's screens, drive real touches, snapshot the accessibility tree per state and run Apple's audit on iOS.
  - The tool is Appium on both platforms, with the session and launch limits its measurement raised.
  - They run against a standalone build of the playground that carries its JavaScript bundle. Its native folders are generated by `expo prebuild` in CI.
  - In CI the Android job blocks a pull request and the iOS job reports without blocking. A red iOS run is rerun once by hand, and a failure that repeats holds the merge until it is diagnosed.

- **Decisions:** [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How native accessibility and behavior can be tested](https://github.com/floklein/rn-ui/issues/8), [Measure Appium on GitHub runners](https://github.com/floklein/rn-ui/issues/29), [Whether Appium stays and device specs block a pull request](https://github.com/floklein/rn-ui/issues/119), [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31)
- **Done when:** Switch's device specs cover controlled and cancelled changes, disabled and read-only, the controller and teardown, and pass on an iOS simulator and an Android emulator, locally and on GitHub runners; a pull request that touches one component's native files plans only that component's device specs; one command runs the sweep of every device spec; in CI the Android job blocks the pull request and the iOS job reports without blocking; `tests/README.md` gives the commands and the port each server sets; the repo gates exit 0

### 4. Switch documented, budgeted and reviewed

- **Depends on:** 1
- **Delivers:** Switch gets everything a component ships with apart from its checks, and with it each piece every later component reuses:

  - **Docs.** The sixth docs section, `react-native`, with its installation page and Switch's page. The docs' example component gets a code-only path. `/docs/react-native/llms.txt` and the package's Markdown docs are generated. A per-part table of state fields, generated from the per-slot source, replaces the data attribute and CSS variable tables, and `pnpm test:docs` skips native.
  - **Size.** `scripts/size.mjs` measures each native entry with `react` and `react-native` external and core included, against a budget in `size-budget.json`, and reads `pending`.
  - **The expert.** The `react-native` expert, with its subagent file and its place in `scripts/expert-scope.mjs`, including a clause for the native playground.
  - **The manual pass.** Its checklist is kept in the repo, and Switch's own pass is recorded.

- **Decisions:** [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [Which budgets the native adapter has](https://github.com/floklein/rn-ui/issues/33), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35), [What the React Native expert covers](https://github.com/floklein/rn-ui/issues/34), [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the docs build exits 0 and the section is in the framework switch; Switch's page shows its example as code with no preview, and its per-part table lists the state fields; `/docs/react-native/llms.txt` is served; `pnpm test:docs` exits 0; `pnpm size` prints rows with budgets for `@ui-sdk/react-native/primitive` and Switch's entry; an entry that isn't `pending` and has no budget is reported; the other adapters' rows are unchanged; `node scripts/expert-scope.mjs --base main` names the expert for a change under the native package, the native playground, its docs and its examples; a change to a `.native.ts` file in core reaches every expert; `ui-sdk-expert-review` runs it; the checklist for the manual pass is in the repo, with its VoiceOver, TalkBack and hardware-keyboard steps; Switch's pass is recorded in the pull request (VoiceOver may be recorded as outstanding until a physical iPhone exists); the repo gates exit 0

### 5. Button

- **Depends on:** 2, 3, 4
- **Delivers:** Button on the native host: its entry, its press, and its async action with the pending announcement. Button's shared api calls the announcer, so this ticket brings the announcer's twin: an announcement reaches the screen reader through the host interface.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** the component checks pass; the twin check passes for the announcer; a Jest test shows an announcement reaching the host; a device spec covers the async action and its pending state

### 6. Input and textarea

- **Depends on:** 5
- **Delivers:** Input and Textarea on `TextInput`, with the native behavior of the text field the other text components share. `focus()` requests input focus as well as accessibility focus, through the twin ticket 1 brought. Enter submits nothing, and a multiline field keeps it as a new line. They are one ticket because both are defined in one file and render one host.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; a device spec shows `focus()` starting editing; the probe lists no throw for the text field's `press`

### 7. Field and field set

- **Depends on:** 6
- **Delivers:** Field and FieldSet. `disabled` and `invalid` reach the control and parts through state, and the label activates the control on press. Error parts are shown by `match` and announced when they appear or change. FieldSet hands `disabled` down through state.

  It brings two things later components reuse:

  - **Names and descriptions from referenced parts.** A registry of the plain text a part renders, kept by id. `aria-labelledby` resolves into `accessibilityLabel` and `aria-describedby` into `accessibilityHint` on single accessible elements, kept current as referenced parts mount, change and unmount. Development warns when a part that must have a name has none.
  - **The form twin.** Form participation does nothing, while the general disabled checks and focus registration behave as on the web.

- **Decisions:** [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the component checks pass; Jest tests show a label joined from several ids in order, following the referenced text when it changes and clearing when it unmounts; content that isn't plain text gives no partial name; a container gets no label and no warning; the warning fires for an id that resolves to nothing; the form twin's check passes; a Jest test shows a change making no form call and a disabled control refusing a press; focus registration reaches the host's `focus`; the probe lists no throw for Field's label; a device spec shows a disabled FieldSet around another disabling the controls inside both; `valid`, `message`, `name` and the validity-flag values of `match` are absent from the native types

### 8. Checkbox

- **Depends on:** 5
- **Delivers:** Checkbox, on the toggle control Switch brought, with no hidden `input` part. Its indicator leaves through `onExit`, so this ticket brings presence on the native host:

  - The first-frame and closing flags are state fields, and the first-frame flag clears on the next frame.
  - `onExit` comes with its `done` function. A part stays mounted until `done` or the two-second timeout.
  - While it exits, a part takes no input and is hidden from accessibility.
  - Under `keepMounted` it settles without unmounting.

- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24)
- **Done when:** the component checks pass; an example holds the indicator through `onExit`; Jest tests cover an unmount at once with no `onExit`, on `done` and at the timeout; `done` called twice, a reopen before `done`, and `keepMounted`; an exiting part exposes no accessible element and takes no press

### 9. Tabs

- **Depends on:** 8
- **Delivers:** Tabs, with the native behavior of the disclosure trigger and panel it shares with Collapsible, Accordion and Navigation Menu. Each tab is its own accessible element with no roving `tabindex`, and the indicator's size and position are state fields.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18)
- **Done when:** the component checks pass; the pattern check finds every tab reachable; the disclosure file is in the registry

### 10. Dialog and alert dialog

- **Depends on:** 7, 8
- **Delivers:** Dialog and Alert Dialog as modal popups in `Modal`. The backdrop and content share one `Modal`, and the backdrop consumes an outside press. Android back and the iOS escape gesture dismiss it. The rest of the screen is hidden from accessibility. The title carries the header role and takes the focus request on open, and `onExit` holds the content until its exit ends.

  It brings the popup machinery every later popup reuses:

  - **The three changes the ADR allows in upstream's popup files.** The unmount on close is handed to presence, a close's focus mode gets an accessor, and the caller passes the opener.
  - **The popup's native behavior file and the layer stack's twin.** Pushing and popping a layer, the open steps, back, escape and outside press through the host's `listen`, the focus request on open, the return on close through the chain that starts at the trigger, and the focus reroute in the popup's controller.

  Alert Dialog is Dialog's primitive with another role and focus rule. If the ticket proves too large for one session, the popup changes and native behavior split back out into a ticket of their own that blocks it.

- **Decisions:** [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; core's unit tests cover the focus-mode accessor and the opener; `pnpm test:pr --engines` exits 0; the diff of the popup files holds only the three changes; Jest tests with a fake host cover each dismissal with its reason, a refused dismissal still taken, each focus mode of a close, and teardown while open; the layer stack twin's compile-time assertion passes with its widening declared and no cast of a native value to a DOM event; a non-modal dialog closes on escape only where the web's rule would close it; device specs cover outside press, back, a refused dismissal, cancelled open and close, an async close, the controller, controlled `open` and teardown; the device check of sibling `Modal`s on iOS is recorded in the pull request; the popup changes, both files and the reroute are in the registry

### 11. OverlayHost and non-modal popups

- **Depends on:** 10
- **Delivers:** `OverlayHost`, with `children` and `insets`, wraps the app, and each `Modal` carries a host of its own. A non-modal popup renders into the nearest host above its trigger, and a popup opened under a modal popup renders inside its `Modal`. An outside press is observed and let through. `BackHandler` serves the root host, and a part that finds no host warns in development.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16)
- **Done when:** device specs show a non-modal dialog in the root host, and one opened from a modal dialog inside its `Modal`; an outside press reaching what is under a non-modal popup; back dismissing the topmost layer in the root host; the device check of a nested modal popup, as a nested `Modal` or as a view in its parent's host, is recorded with the form kept; a Jest test shows the warning with no host; the installation page shows `OverlayHost` and wiring `insets` to `react-native-safe-area-context`; the repo gates exit 0

### 12. Popover

- **Depends on:** 11
- **Delivers:** Popover, in a `Modal` when modal and in a host otherwise, placed beside its trigger with its arrow. It brings placement on the native host around the shared `computePlacement`:

  - The anchor and the popup are measured in a layout effect, in the host's coordinate space.
  - The popup is placed in its first frame and measured again while it is open.
  - The insets and the keyboard are excluded once.
  - The result is written as state fields on the content and the arrow.

- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the component checks pass; device specs run it modal and non-modal, and show no frame at a wrong position; Jest tests show `side`, `align`, `anchorWidth`, `anchorHeight`, `availableWidth`, `availableHeight`, `transformOrigin`, `arrowOffset` and `arrowClamped` in state; the device checks are recorded: an anchor outside a `Modal` against a popup inside one, an Android `Modal` with and without a translucent status bar, and a scrolling anchor; the placement file is in the registry

### 13. Select

- **Depends on:** 12
- **Delivers:** Select on placement and the listbox engine, with its value in a `Text`. `presentation="auto"` gives the component's own form until an app imports the sheet entry.

  It brings the native behavior of the listbox engine under Combobox, Autocomplete, Command and Trigger Menu. Every option is its own accessible element, and a press chooses it through the api. The highlighted option is announced, `selected` means the committed value, and there is no roving `tabindex`. The `async-options` and `text-match` entries come with it.

  If Select and the engine prove too large for one session, the engine splits back out into a ticket of its own that blocks this one.

- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the component checks pass; its entry bundles no Gesture Handler; Jest tests cover single and multiple selection by press, a disabled option, and the announcement of a highlight; the pattern check passes on a list built from the engine, for iOS and for Android; the engine's files are in the registry

### 14. Slider

- **Depends on:** 7
- **Delivers:** Slider, with the native behavior that turns the responder system's start, move and end into the api calls the web's pointer handlers make, which every later drag reuses. A cancelled, taken or unmounted responder cancels the draft, and each thumb is named through its label.

  Slider's shared code reads the direction and the page locale, so this ticket brings both twins. `isRTL` reads `I18nManager.isRTL` through the host interface and ignores the element. The locale resolves from `Intl`.

- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [How direction and locale are read on native](https://github.com/floklein/rn-ui/issues/32)
- **Done when:** the component checks pass; its entry bundles no Gesture Handler; Jest tests show a cancelled responder committing nothing, and `isRTL` following the host; the twin check passes for direction and locale; a playground screen shows the device's locale on iOS and Android after the device language changes, and the result is recorded; if `Intl` doesn't report it on one of them, the locale comes through the host interface; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 15. Drawer

- **Depends on:** 10, 14
- **Delivers:** Drawer, the one component entry that imports Gesture Handler, as an optional peer. Core's physics decide and the adapter owns the `Animated` values: the value follows the gesture during a drag, and on release the shared code gives the target, the velocity and the spring. The `gesture` entry comes with it, and its sheet axis reads the direction twin Slider brought.
- **Decisions:** [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What native overlays, placement, gestures and animation can do with no extra dependencies](https://github.com/floklein/rn-ui/issues/6)
- **Done when:** the component checks pass; Gesture Handler is an optional peer, and no other component entry imports it; the device check of the settle is recorded: a timed animation on the native driver with the spring as its easing, or the spring played from JavaScript each frame; a device spec drags it over content that scrolls

### 16. Sheet presentation entry

- **Depends on:** 12, 13, 15
- **Delivers:** `@ui-sdk/react-native/sheet`, the entry that makes the sheet presentation available. Once an app imports it, Dialog, Popover and Select present as a sheet, and `presentation="auto"` resolves to the sheet on a phone-sized screen. No popup entry imports Gesture Handler.
- **Decisions:** [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** device specs run Dialog, Popover and Select as a sheet; without the entry, `presentation="auto"` gives the component's own form; the size check finds no Gesture Handler in a popup entry; the entry has a budget and its docs; the repo gates exit 0

### 17. Packed packages run the playground

- **Depends on:** 1
- **Delivers:** The playground runs on both simulators from packed tarballs, as a user's app will. Two pieces make that work:

  - **The native build of core.** Core gets a second build, `dist/native`, with each twin in the place of its module. Every published entry gains a `react-native` condition, and `#dev` and `#name-check` gain it around their own pair.
  - **The pack step.** It turns core, the React adapter and the native adapter into tarballs without touching the repo. It rewrites the scope to `@rn-ui-sdk` in package names, dependency keys and the import specifiers of the built `.js`, `.d.ts` and source maps, and applies the fork's version from one fork-only file.

- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [How Metro and Expo resolve a workspace package](https://github.com/floklein/rn-ui/issues/7), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [How the fork publishes its packages](https://github.com/floklein/rn-ui/issues/11)
- **Done when:** each twin's code is in `dist/native` in the place of its module; a web bundle of the package lists none of them; the additive entries in upstream's build files are in the registry; the three tarballs carry one version and no `@ui-sdk/` specifier; an Expo SDK 58 app outside the workspace installs them, and its `tsc --noEmit` and its export for iOS and Android exit 0; its source maps list core modules from `@rn-ui-sdk/core/dist/native` only; Switch toggles in it on both simulators; `git status` is clean after a run; the repo gates exit 0

### 18. Publishing workflow and the first release

- **Depends on:** 7, 9, 13, 14, 16, 17
- **Delivers:** The fork-only release flow: the version file starting at `0.1.0`, the changelog, and a workflow that packs and publishes `@rn-ui-sdk/core`, `@rn-ui-sdk/react` and `@rn-ui-sdk/react-native` on demand, each release stating the upstream version it contains. No changeset names a shared package.
- **Decisions:** [How the fork publishes its packages](https://github.com/floklein/rn-ui/issues/11), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the first-tier components run from the packed tarballs on an iOS simulator and an Android emulator, in an app outside the workspace whose `tsc --noEmit` exits 0; a run of the workflow publishes the three packages at one version, and the release states the upstream version it contains (needs npm publish access to the `@rn-ui-sdk` scope); every shared package's `package.json` version and `CHANGELOG.md` is unchanged; the repo gates exit 0

### 37. Guide pages of the native docs section

- **Depends on:** 7, 16
- **Delivers:** The guide pages of the `react-native` section, written from React's and changed only where native differs: styling through functions of state and `interaction`, popups and `OverlayHost`, forms, exits through `onExit`, and the differences from the web.
- **Decisions:** [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24)
- **Done when:** the docs build exits 0; the pages follow `ui-sdk-write-docs`; the `react-native` expert reviewed them; `pnpm lint` and `pnpm format` exit 0

### 38. Native section of the shipped skill

- **Depends on:** 18
- **Delivers:** A short native section in the skill shipped in `packages/core/skills/ui-sdk`.
- **Decisions:** [What the React Native expert covers](https://github.com/floklein/rn-ui/issues/34)
- **Done when:** the section names only what has landed; the `react-native` expert reviewed it; `pnpm lint` and `pnpm format` exit 0

### 39. Radio

- **Depends on:** 8
- **Delivers:** Radio and its group on the toggle control: each radio its own accessible element with no roving `tabindex`, and no hidden `input` part.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23)
- **Done when:** the component checks pass

### 40. Toggle

- **Depends on:** 5
- **Delivers:** Toggle and Toggle Group, which share an entry.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 41. Segmented control

- **Depends on:** 9
- **Delivers:** Segmented Control, with its selection indicator's size and position as state fields.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18)
- **Done when:** the component checks pass

### 42. Toolbar

- **Depends on:** 40
- **Delivers:** Toolbar, with the controls inside it reachable as separate accessible elements.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 43. Rating

- **Depends on:** 5
- **Delivers:** Rating, with upstream's touch behavior.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 44. Label

- **Depends on:** 6
- **Delivers:** Label on a `Text` host, with upstream's behavior when it is pressed.
- **Decisions:** [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 45. File input

- **Depends on:** 7
- **Delivers:** File Input with its parts, state and validation, opening through a `pick` function the app passes to its root. The files carry `name`, `size`, `type` and `uri`, and no picker is wrapped.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; a Jest test runs core's validation on the files `pick` returns; the docs page shows passing `pick` from a picker library

### 46. Avatar

- **Depends on:** 5
- **Delivers:** Avatar, with its fallback following the image's status.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 47. Separator

- **Depends on:** 5
- **Delivers:** Separator.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 48. Progress and meter

- **Depends on:** 5
- **Delivers:** Progress and Meter. One ticket because both are the value bar of `foundation/gauge` and differ only in role and value text.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 49. Pagination

- **Depends on:** 5
- **Delivers:** Pagination, with the same parts and outcomes as the web and a press for a click.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 50. Collapsible

- **Depends on:** 9
- **Delivers:** Collapsible on the disclosure behavior Tabs brought. Its panel measures its content apart from its own constrained height, exposes the size as state, including the size at close when an opening was interrupted, and closes through `onExit`.
- **Decisions:** [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; a Jest test shows the size at close after an interrupted opening

### 51. Accordion

- **Depends on:** 50
- **Delivers:** Accordion on Collapsible's panel behavior.
- **Decisions:** [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 52. Listbox

- **Depends on:** 13
- **Delivers:** Listbox on the listbox engine, in place with no popup.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 53. Autocomplete

- **Depends on:** 6, 13
- **Delivers:** Autocomplete, the input that filters a list, which Combobox and Command build on: a `TextInput` with its list in a host anchored to it, the highlighted option announced, and `onSubmitEditing` running the submit action.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass; the probe lists no throw for its label

### 54. Combobox

- **Depends on:** 53
- **Delivers:** Combobox on Autocomplete's core, with `onSubmitEditing` choosing the highlighted option and `selected` meaning the committed value.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the probe lists no throw for its label

### 55. Command

- **Depends on:** 53
- **Delivers:** Command, Autocomplete inline with action items, with no `shortcut`.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass

### 56. Tree

- **Depends on:** 52
- **Delivers:** Tree on the list collection, each item its own accessible element.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass; the probe lists no throw for its item

### 57. Menu

- **Depends on:** 13
- **Delivers:** Menu, with its items, groups, submenus and context trigger behaving as upstream does on touch, and no `shortcut`.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 58. Menubar

- **Depends on:** 57
- **Delivers:** Menubar on Menu, with a press for a click.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 59. Navigation menu

- **Depends on:** 12, 50
- **Delivers:** Navigation Menu on the disclosure and popup behaviors.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 60. Tooltip

- **Depends on:** 12
- **Delivers:** Tooltip: closed on touch, opened on press when `toggleable` and on hover where the device reports one, never on a long press.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 61. Hover card

- **Depends on:** 60
- **Delivers:** Hover Card: closed on touch, opened on hover where the device reports one.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 62. Overlays opened from code

- **Depends on:** 11
- **Delivers:** The `overlays` entry: `confirm()` and the other overlays opened from code, rendered in the topmost open host.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** a device spec shows `confirm()` opened over a modal dialog rendering above it, and its promise resolving with the choice; a Jest test shows the development warning with no `OverlayHost`; the entry has a budget and its docs; the repo gates exit 0

### 63. Toast

- **Depends on:** 14, 62
- **Delivers:** Toast and its toaster, rendered in the topmost open host, dismissed by a swipe through the responder system, with their announcements.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; a device spec shows a toast fired over a modal dialog above it

### 64. Calendar

- **Depends on:** 5
- **Delivers:** Calendar, formatting in the locale from `Intl` or in its own `locale` option. The `date` entry comes with it.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How direction and locale are read on native](https://github.com/floklein/rn-ui/issues/32)
- **Done when:** the component checks pass

### 65. Date picker

- **Depends on:** 12, 64
- **Delivers:** Date Picker, a Calendar in a popup.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 66. Password input

- **Depends on:** 6
- **Delivers:** Password Input on the text field's native behavior, with secure entry.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What TextInput gives for selection, composition and the caret](https://github.com/floklein/rn-ui/issues/25), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the probe lists no throw for its root

### 67. Number input

- **Depends on:** 6, 14
- **Delivers:** Number Input, with the edit the other text components reuse: one the web would refuse is accepted and corrected at once through the shared rules, and the write carries its own selection. It keeps its increment and decrement parts. The `number` entry comes with it.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What TextInput gives for selection, composition and the caret](https://github.com/floklein/rn-ui/issues/25), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; Jest tests show a refused edit corrected with its selection; the device check of writing a value back while an IME composes is recorded

### 68. OTP input

- **Depends on:** 6
- **Delivers:** OTP Input: one `TextInput` under drawn slots with one-time-code autofill, the active slot following the selection, and a tap on a slot selecting it through the `selection` prop.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What TextInput gives for selection, composition and the caret](https://github.com/floklein/rn-ui/issues/25), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check of the `selection` prop is recorded for iOS and Android

### 69. Date input and time input

- **Depends on:** 64, 67
- **Delivers:** Date Input and Time Input: one `TextInput` per segment with the keyboard its content needs, focus advancing when a segment is complete and Backspace in an empty one going back. One ticket because both are the same segmented input over one model.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 70. Token input

- **Depends on:** 53, 67
- **Delivers:** Token Input: its tokens as a row of parts beside a plain `TextInput`, with Backspace in an empty field removing the last token.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 71. Trigger menu

- **Depends on:** 53, 67
- **Delivers:** Trigger Menu: the trigger found by diffing the text on each change, and the menu anchored to the field's box, above or below it.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 72. Scroll area

- **Depends on:** 14
- **Delivers:** Scroll Area, its viewport a `ScrollView` that stops its own scrolling for the length of a drag inside it.
- **Decisions:** [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 73. Reordering and moving between lists

- **Depends on:** 72
- **Delivers:** Reordering and moving between lists by touch drag, started and cancelled as upstream does on touch, with scrolling near an edge inside the library's Scroll Area only.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27)
- **Done when:** Jest tests show a cancelled drag committing nothing; a device spec reorders a list and moves an item between two; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android; its files are in the registry; the repo gates exit 0

### 74. Resizable

- **Depends on:** 14
- **Delivers:** Resizable, with upstream's touch behavior through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 75. Carousel

- **Depends on:** 9, 14
- **Delivers:** Carousel, dragged through the responder system, with its indicators as separate accessible elements.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 76. Color picker

- **Depends on:** 14
- **Delivers:** Color Picker, its area and sliders dragged through the responder system. The `color` entry comes with it.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 77. Image cropper

- **Depends on:** 14
- **Delivers:** Image Cropper, reporting the crop area with its rotation and flips, with pinch computed from the responder's touches. The `image` entry comes without `cropImage`.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android; the device check of pinch is recorded

### 78. Timeline

- **Depends on:** 14
- **Delivers:** Timeline, dragged through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 79. Waterfall

- **Depends on:** 13, 14
- **Delivers:** Waterfall, with the same parts and outcomes as the web, dragged through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 80. Agent layer on the native host

- **Depends on:** 7, 10
- **Delivers:** The agent layer on the native host: twins for the registry and the bridge, a snapshot built from what the adapter rendered, `act` through the api with the `"agent"` source, the three marks as props on any part, the wrapper that marks a region, and the `agent`, `observe` and `history` entries.
- **Decisions:** [What the agent layer reads and drives on native](https://github.com/floklein/rn-ui/issues/28), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30)
- **Done when:** Jest tests show a snapshot listing a part by its label and text; it leaves out a part whose slot isn't `present`, one under a hidden mark and one behind an open modal; `act` changes state with `source=agent`; a mark on the wrapper covers everything inside it; the twin check passes, and the entries have budgets and docs; the repo gates exit 0

## Questions

The questions this plan first listed are settled in [What the build plan's open questions resolve to](https://github.com/floklein/rn-ui/issues/37), and the answers are in [the spec](react-native.md#rules-for-the-build). Every ticket follows them. What is left:

- Who supplies npm publish access to the `@rn-ui-sdk` scope is open for the owner.
- A physical iPhone for the manual VoiceOver pass is open for the owner. Until there is one, a component merges with that pass recorded as outstanding.
- Whether the owner accepts the hardware-keyboard exception is open. If it is refused, no ticket here carries key events, and the plan needs new ones.
