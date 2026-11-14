# React Native build plan

The work of [the spec](react-native.md), sliced into 80 implementation tickets. Each is sized for one agent session and leaves the repo green. The plan decides nothing: each ticket names the map issues that govern it, and what they leave open is listed as [questions](#questions) at the end.

## How the plan is ordered

The order is the one [What parity means for every component](https://github.com/floklein/rn-ui/issues/15) set.

1. **Foundation**, tickets 1 to 19. What the first component needs to land honestly. No ticket here ships a component.
2. **First tier**, tickets 20 to 35. The ten components, in the order the map set, with each shared engine's ticket just before the first component that needs it.
3. **Publishing**, ticket 36. One slice, once the first tier passes its checks.
4. **The rest**, tickets 37 to 80. Every other component by the engine it shares in core: toggles and form controls, disclosure, lists, the remaining popups, date, text entry, then direct manipulation and canvas. The guides, the shipped skill and the agent layer are here too.

Inside the rest, the groups run in this order: the guides and the shipped skill (37 and 38), toggles and form controls (39 to 49), disclosure (50 and 51), lists (52 to 56), the remaining popups (57 to 63), date (64 and 65), text entry (66 to 71), direct manipulation and canvas (72 to 79), and the agent layer (80). No resolution names a group for Avatar, Separator, Progress, Meter and Pagination, or a place for the agent layer; they sit where they block nothing.

### What blocks what

- **Ticket 1 blocks everything.** The foundation then fans out: the adapter's contract (2 to 4), the registry and the twins (5 to 11), the build (12 and 13), the checks (14 to 16), and the docs, budgets and expert (17 to 19).
- **Button (20) is the gate to every component.** It depends on the whole foundation except presence, the popup changes and the build, and it sets what later components copy. A later component depends on Button and on the engine it needs, so its line lists few numbers.
- **Engines are brought once**, by a ticket of their own or by the first component that needs them: the toggle control by Switch (21), disclosure by Tabs (23), the text field by Input (24), popups by 26, 28 and 29, the listbox engine by 31, drags by Slider (33), the corrected edit by Number Input (67).
- **Popups** run in a line: the three popup changes (11), the popup's native behavior (26), Dialog (27), `OverlayHost` (28), placement (29), Popover (30). Select (32) needs Popover and the listbox engine. The sheet entry (35) needs Drawer, Popover and Select.
- **Publishing (36)** needs the pack step (13) and every first-tier ticket.
- **Outside the plan:** [Measure Appium on GitHub runners](https://github.com/floklein/rn-ui/issues/29) is still running. Until it reports, the device tool in ticket 16 is provisional and device specs don't block a pull request. The manual VoiceOver pass in every component ticket needs the physical iPhone that is open for the owner.

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

### 1. Native adapter package with its generic core

- **Depends on:** nothing
- **Delivers:** `packages/react-native` as `@ui-sdk/react-native`, with the `/primitive` entry (`usePrimitive`, `usePart`, `createParts`, `mergeProps`, `renderElement`, `RenderProp`, the part and handle types) and the native host interface in core behind `@ui-sdk/core/native`. A part reads the declarative slot fields, renders its default host, delivers `press` through the api with the `touch` or `virtual` source and no `event`, and never calls `bind`, `asleep`, `connect` or the `on` handlers.
- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16)
- **Done when:** a Jest test builds parts over `switchPrimitive` with `createParts`, and a press toggles it with `source=touch` and no `event`; an exports test finds the names of `@ui-sdk/react/primitive` in `@ui-sdk/react-native/primitive`; the package's peers are `react` and `react-native` only; core imports nothing from `react-native`; the repo gates exit 0

### 2. Styling contract of a native part

- **Depends on:** 1
- **Delivers:** `style`, `className` and `children` as values or functions of `(state, interaction)`, resolved by the part, and `render` as an element or `(props, state, interaction) => element`. Styles merge as arrays in the React adapter's order, `interaction` exists on parts whose host is a `Pressable` or a `TextInput`, and the part forwards the resolved `className`, a `ref` merged with the user's, `disabled` and unknown props.
- **Decisions:** [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** Jest tests show a host never receives a function; a style that isn't a plain object survives the merge unflattened; `interaction.pressed` reaches `style`, `className`, `children` and `render`; no `dataSet` or `data-*` prop reaches a host; the repo gates exit 0

### 3. Accessibility translation

- **Depends on:** 1
- **Delivers:** The one place that turns core's attribute map into React Native accessibility props. It consumes a user's `role` and `aria-*`, lets a user's `accessibility*` props win field by field, drops `aria-controls`, `aria-owns` and `aria-activedescendant`, never forwards the roving `tabindex="-1"`, and hands `render` accessibility in `accessibility*`, `accessible` and `importantForAccessibility` names only.
- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What React Native gives for accessibility, focus and keyboards](https://github.com/floklein/rn-ui/issues/5)
- **Done when:** a table-driven Jest test covers every attribute core's slots emit, for iOS and for Android; `accessibilityState={{ busy: true }}` merges over `checked` and `expanded`; no `role` or `aria-*` prop reaches a host or `render`; an item with `tabindex="-1"` stays in keyboard traversal; the repo gates exit 0

### 4. Names and descriptions from referenced parts

- **Depends on:** 3
- **Delivers:** A registry of the plain text a part renders, kept by id, and the resolution of `aria-labelledby` into `accessibilityLabel` and of `aria-describedby` into `accessibilityHint` on single accessible elements, kept current as referenced parts mount, change and unmount. Development warns when a part that must have a name has none.
- **Decisions:** [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30)
- **Done when:** Jest tests show a label joined from several ids in order; the label follows the referenced text when it changes and clears when it unmounts; content that isn't plain text gives no partial name; a container gets no label and no warning; the warning fires for an id that resolves to nothing; the repo gates exit 0

### 5. Registry with its drift, coverage and parity checks

- **Depends on:** 1
- **Delivers:** The registry that maps each twin, native behavior file, reroute and additive edit to the upstream files it mirrors and the upstream commit it was reviewed against, with its checks: drift, slot coverage and parity. `pending` is one list, starting with every component, and the routine for merging upstream is written in `contributing/`.
- **Decisions:** [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35)
- **Done when:** the drift check lists a mirrored file that changed since its recorded commit, and nothing otherwise; the coverage and parity check exits 0 with every component in `pending`; it fails when a component leaves `pending` with no native entry, or with a slot whose skipped hook is unmarked; the edits ticket 1 made in upstream's files are in the registry; the repo gates exit 0

### 6. Twins and focusing a part

- **Depends on:** 5
- **Delivers:** The twin convention (a `.native.ts` file with the same exports, asserting at compile time that its values and exported types match its module's), a check that every pair exports the same names, and the first twin: the module that owns focusing a part. The adapter implements the host's `focus` as a request for accessibility focus, plus input focus for a text input, on the view it keeps for each part.
- **Decisions:** [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How Metro and Expo resolve a workspace package](https://github.com/floklein/rn-ui/issues/7)
- **Done when:** the twin check exits 0, and fails on a twin with a missing or extra export; `tsc` fails on a twin whose exported type differs with no declared widening; a Jest test shows `focusPart` reaching the host with the part's mounted view, and making no request once it has unmounted; an Expo export of the playground lists the twin and not its DOM module; the twin is in the registry; the repo gates exit 0

### 7. No-document probe of every primitive

- **Depends on:** 5
- **Delivers:** A check that creates, keeps, reads, presses, focuses and destroys every primitive core exports with no `document`, and lists each path that throws.
- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** the probe runs from one command and lists the six `press` throws the prototype's report names, each against its component; it exits 0 on the repo as it stands; the repo gates exit 0

### 8. Twins for announcements, direction and locale

- **Depends on:** 6
- **Delivers:** Twins for the announcer, direction and the locale. An announcement goes to the screen reader through the host interface, `isRTL` reads `I18nManager.isRTL` through it and ignores the element, and the locale resolves from `Intl`.
- **Decisions:** [How direction and locale are read on native](https://github.com/floklein/rn-ui/issues/32), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** the twin check passes for the three pairs; Jest tests show an announcement reaching the host, and `isRTL` following it; a playground screen shows the device's locale on iOS and on Android after the device language changes, and the result is recorded; if `Intl` doesn't report it on one of them, the locale comes through the host interface; the repo gates exit 0

### 9. Form twin

- **Depends on:** 6
- **Delivers:** The twin of `foundation/forms/form.ts`. Form participation (change events, implicit submission, reading the form, validity, reset) does nothing, while the general disabled checks and focus registration behave as on the web.
- **Decisions:** [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the twin check passes; a Jest test shows a toggle's change making no form call, and a disabled control refusing a press; focus registration reaches the host's `focus`; the repo gates exit 0

### 10. Presence and the onExit prop

- **Depends on:** 2, 6
- **Delivers:** Presence on the native host: the first-frame and closing flags as state fields, the first-frame flag cleared on the next frame, and `onExit` with its `done` function. A part stays mounted until `done` or a timeout, takes no input and is hidden from accessibility while it exits, and settles without unmounting under `keepMounted`.
- **Decisions:** [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24)
- **Done when:** Jest tests cover an unmount at once with no `onExit`, on `done`, and at the timeout; they cover `done` called twice, a reopen before `done`, and `keepMounted`; an exiting part exposes no accessible element and takes no press; the repo gates exit 0

### 11. Three popup changes in upstream's files

- **Depends on:** 10
- **Delivers:** The three changes the ADR allows in the popup files: the unmount on close handed to presence and an accessor for a close's focus mode in `popup.ts`, and the opener passed by the caller in `popup-features.ts`. Web behavior is unchanged.
- **Decisions:** [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** core's unit tests cover the accessor and the opener; `pnpm test:pr --engines` exits 0; the diff of the two files holds only these changes, and the registry lists them; the repo gates exit 0

### 12. Native build of core

- **Depends on:** 6
- **Delivers:** Core's second build, `dist/native`, with each twin in the place of its module. Every published entry gains a `react-native` condition, and `#dev` and `#name-check` gain it around their own pair.
- **Decisions:** [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13), [How Metro and Expo resolve a workspace package](https://github.com/floklein/rn-ui/issues/7), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** a check shows each twin's code in `dist/native` in the place of its module; an Expo export of the playground against the built package lists core modules from `dist/native` only; a web bundle of the same package lists none of them; the additive entries in upstream's build files are in the registry; the repo gates exit 0

### 13. Pack step for the fork's packages

- **Depends on:** 12
- **Delivers:** The pack step that turns core, the React adapter and the native adapter into tarballs without touching the repo. It rewrites the scope to `@rn-ui-sdk` in package names, dependency keys and the import specifiers of the built `.js`, `.d.ts` and source maps, applies the fork's version from one fork-only file, and emits the native adapter's declarations.
- **Decisions:** [How the fork publishes its packages](https://github.com/floklein/rn-ui/issues/11), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14)
- **Done when:** the three tarballs carry one version and no `@ui-sdk/` specifier; an Expo SDK 58 app outside the workspace installs them, and its `tsc --noEmit` and its export for iOS and Android exit 0; its source maps list core modules from `@rn-ui-sdk/core/dist/native` only; `git status` is clean after a run; the repo gates exit 0

### 14. Native pattern check

- **Depends on:** 4
- **Delivers:** The native counterpart of `checkPattern`. It takes a rendered host tree and the OS, and asserts roles and ownership, required states, names, one accessible element per item, hidden content, the state after each accessibility action, and the focus requests on open and close. `checkDirection` and the no-host-API rule of `checkServer` get counterparts. It ships publicly and imports no renderer.
- **Decisions:** [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How native accessibility and behavior can be tested](https://github.com/floklein/rn-ui/issues/8)
- **Done when:** it passes a correct fixture tree; it fails on each seeded fault: a missing name, a wrong role, a state that doesn't change after an action, a missing focus request; it runs for iOS and for Android, with `escape` on iOS only and `expand` and `collapse` on Android only; its module imports no renderer; the repo gates exit 0

### 15. Native examples and the playground's screen list

- **Depends on:** 5
- **Delivers:** The `examples/components/<name>/react-native/` folders, the playground's screen list generated from them, and the file-level check that native has every example the other frameworks have, with a listed exemption for each example of a web-only feature. The check reads `pending`.
- **Decisions:** [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [Scaffold an Expo playground that runs workspace code on both simulators](https://github.com/floklein/rn-ui/issues/12), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35)
- **Done when:** adding an example file adds a playground screen with no other edit; `pnpm typecheck` covers the examples, and an Expo export for iOS and Android exits 0; the example check exits 0 with every component in `pending`, and fails when one leaves it with an example missing and no exemption; an exemption with no feature or reason fails; the repo gates exit 0

### 16. Device spec harness

- **Depends on:** 15
- **Delivers:** Device specs for an iOS simulator and an Android emulator, written apart from the web specs with the same kinds of file and scenario names. They open the playground's screens, drive real touches, snapshot the accessibility tree per state and run Apple's audit on iOS. The tool is Appium, provisional until [Measure Appium on GitHub runners](https://github.com/floklein/rn-ui/issues/29) reports, and CI runs the specs without blocking until then.
- **Decisions:** [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How native accessibility and behavior can be tested](https://github.com/floklein/rn-ui/issues/8), [Measure Appium on GitHub runners](https://github.com/floklein/rn-ui/issues/29), [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31)
- **Done when:** a smoke spec opens a playground screen and passes on an iOS simulator and an Android emulator, locally and on GitHub runners; a pull request that touches one component's native files plans only that component's device specs; one command runs the sweep of every device spec; the CI job reports its result without blocking the pull request; `tests/README.md` gives the commands and the port each server sets; the repo gates exit 0

### 17. Docs section for the native adapter

- **Depends on:** 15
- **Delivers:** The sixth docs section, `react-native`, with its installation page, a code-only path in the docs' example component, and `/docs/react-native/llms.txt` with the package's Markdown docs. A per-part table of state fields, generated from the per-slot source, replaces the data attribute and CSS variable tables. `pnpm test:docs` skips native.
- **Decisions:** [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16)
- **Done when:** the docs build exits 0 and the section is in the framework switch; a native example renders as code with no preview; the per-part table lists the state fields of a part that has data attributes on the web; `/docs/react-native/llms.txt` is served; `pnpm test:docs` exits 0; the repo gates exit 0

### 18. Size budgets for native entries

- **Depends on:** 5
- **Delivers:** `scripts/size.mjs` measures each native entry as it does the other adapters', with `react` and `react-native` external and core included, against a budget in `size-budget.json`. It reads `pending`.
- **Decisions:** [Which budgets the native adapter has](https://github.com/floklein/rn-ui/issues/33), [How the fork takes upstream changes](https://github.com/floklein/rn-ui/issues/35)
- **Done when:** `pnpm size` prints a row for `@ui-sdk/react-native/primitive` with a budget; an entry that isn't `pending` and has no budget is reported; the other adapters' rows are unchanged; the repo gates exit 0

### 19. Expert for the native adapter

- **Depends on:** 1
- **Delivers:** The `react-native` expert: `expert.md`, `knowledge.md` and a `decisions.md` seeded from the map's resolutions and the ADR in `.agents/experts/react-native/`, its subagent file in `.claude/agents/`, and its place in `scripts/expert-scope.mjs` with a clause for the native playground.
- **Decisions:** [What the React Native expert covers](https://github.com/floklein/rn-ui/issues/34)
- **Done when:** `node scripts/expert-scope.mjs --base main` names the expert for a change under `packages/react-native`, `apps/native-playground`, its docs and its examples; a change to a `.native.ts` file in core reaches every expert; `ui-sdk-expert-review` runs it; the repo gates exit 0

### 20. Button

- **Depends on:** 2, 4, 7, 8, 9, 14, 16, 17, 18, 19
- **Delivers:** Button on the native host: its entry, its press and its async action with the pending announcement, its examples, checks and docs page. As the first component it also sets what the rest copy: the device spec files, the docs page and the checklist for the manual pass.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass; the checklist for the manual pass is in the repo, with its screen-reader and hardware-keyboard steps

### 21. Switch

- **Depends on:** 20
- **Delivers:** Switch, with the focus reroute in the toggle control it shares with Checkbox. It renders no hidden `input` part and needs no native behavior file.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23)
- **Done when:** the component checks pass; device specs cover controlled and cancelled changes, disabled and read-only, the controller and teardown; the reroute is in the registry

### 22. Checkbox

- **Depends on:** 10, 21
- **Delivers:** Checkbox, on the toggle control Switch brought, with its indicator leaving through `onExit` and no hidden `input` part.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24)
- **Done when:** the component checks pass; an example holds the indicator through `onExit`

### 23. Tabs

- **Depends on:** 10, 20
- **Delivers:** Tabs, with the native behavior of the disclosure trigger and panel it shares with Collapsible, Accordion and Navigation Menu. Each tab is its own accessible element with no roving `tabindex`, and the indicator's size and position are state fields.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18)
- **Done when:** the component checks pass; the pattern check finds every tab reachable; the disclosure file is in the registry

### 24. Input and textarea

- **Depends on:** 20
- **Delivers:** Input and Textarea on `TextInput`, with the native behavior of the text field the other text components share, and input focus on `focus()`. Enter submits nothing, and a multiline field keeps it as a new line. One ticket because both are defined in one file and render one host.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; a device spec shows `focus()` starting editing; the probe lists no throw for the text field's `press`

### 25. Field and field set

- **Depends on:** 24
- **Delivers:** Field and FieldSet: `disabled` and `invalid` reaching the control and parts through state, the label activating the control on press, Error parts shown by `match` and announced when they appear or change, the control's name and hint resolved from the label, description and errors, and FieldSet's `disabled` handed down through state. One ticket because FieldSet lives in Field's folder and acts only on the Fields inside it.
- **Decisions:** [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the probe lists no throw for Field's label; a device spec shows a disabled FieldSet around another disabling the controls inside both; `valid`, `message`, `name` and the validity-flag values of `match` are absent from the native types

### 26. Popup native behavior and the layer stack twin

- **Depends on:** 8, 11
- **Delivers:** The native behavior file for what `popup.bind` orchestrates, and the twin that restates the layer stack: pushing and popping a layer, the open steps, back, escape and outside press through the host's `listen`, the focus request on open, the return on close through the chain that starts at the trigger, the flags slots set in `bind`, and the focus reroute in the popup's controller.
- **Decisions:** [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22), [Does the host seam hold for Switch and Dialog](https://github.com/floklein/rn-ui/issues/14), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** Jest tests with a fake host cover each dismissal with its reason, a refused dismissal still taken, each focus mode of a close, and teardown while open; the twin's compile-time assertion passes with its widening declared and no cast of a native value to a DOM event; a non-modal dialog closes on escape only where the web's rule would close it; both files and the reroute are in the registry; the repo gates exit 0

### 27. Dialog and alert dialog

- **Depends on:** 20, 26
- **Delivers:** Dialog and Alert Dialog as modal popups in `Modal`: backdrop and content in one `Modal`, the backdrop consuming an outside press, Android back and the iOS escape gesture, the rest of the screen hidden from accessibility, the title carrying the header role and taking the focus request on open, and `onExit` holding the content until its exit ends. One ticket because Alert Dialog is Dialog's primitive with another role and focus rule.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; device specs cover outside press, back, a refused dismissal, cancelled open and close, an async close, the controller, controlled `open` and teardown; the device check of sibling `Modal`s on iOS is recorded in the pull request

### 28. OverlayHost and non-modal popups

- **Depends on:** 27
- **Delivers:** `OverlayHost`, with `children` and `insets`, wrapping the app, and a host inside each `Modal`. A non-modal popup renders into the nearest host above its trigger, a popup opened under a modal popup renders inside its `Modal`, an outside press is observed and let through, `BackHandler` serves the root host, and a part that finds no host warns in development.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16)
- **Done when:** device specs show a non-modal dialog in the root host, and one opened from a modal dialog inside its `Modal`; they show an outside press reaching what is under a non-modal popup, and back dismissing the topmost layer in the root host; the device check of a nested modal popup, as a nested `Modal` or as a view in its parent's host, is recorded with the form kept; a Jest test shows the warning with no host; the installation page shows `OverlayHost`, and wiring `insets` to `react-native-safe-area-context`; the repo gates exit 0

### 29. Placement beside an anchor

- **Depends on:** 28
- **Delivers:** Placement on the native host, around the shared `computePlacement`: the anchor and the popup measured in a layout effect in the host's coordinate space, the popup placed in its first frame and measured again while it is open, the insets and the keyboard excluded once, and the result written as state fields on the content and the arrow.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** Jest tests show `side`, `align`, `anchorWidth`, `anchorHeight`, `availableWidth`, `availableHeight`, `transformOrigin`, `arrowOffset` and `arrowClamped` in state; a device spec shows no frame at a wrong position; the device checks are recorded: an anchor outside a `Modal` against a popup inside one, an Android `Modal` with and without a translucent status bar, and a scrolling anchor; the file is in the registry; the repo gates exit 0

### 30. Popover

- **Depends on:** 29
- **Delivers:** Popover, in a `Modal` when modal and in a host otherwise, placed beside its trigger with its arrow.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18)
- **Done when:** the component checks pass; device specs run it modal and non-modal

### 31. Listbox engine on the native host

- **Depends on:** 20
- **Delivers:** The native behavior of the listbox engine under Select, Combobox, Autocomplete, Command and Trigger Menu: every option its own accessible element, a press choosing it through the api, the highlighted option announced, `selected` meaning the committed value, and no roving `tabindex`. The `async-options` and `text-match` entries come with it.
- **Decisions:** [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** Jest tests cover single and multiple selection by press, a disabled option, and the announcement of a highlight; the pattern check passes on a list built from it, for iOS and for Android; its files are in the registry; the repo gates exit 0

### 32. Select

- **Depends on:** 30, 31
- **Delivers:** Select on the listbox engine and placement, with its value in a `Text`. `presentation="auto"` gives the component's own form until an app imports the sheet entry.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16)
- **Done when:** the component checks pass; its entry bundles no Gesture Handler

### 33. Slider

- **Depends on:** 20
- **Delivers:** Slider, with the native behavior that turns the responder system's start, move and end into the api calls the web's pointer handlers make, which every other drag reuses. A cancelled, taken or unmounted responder cancels the draft, and each thumb is named through its label.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30)
- **Done when:** the component checks pass; Jest tests show a cancelled responder committing nothing; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android; its entry bundles no Gesture Handler

### 34. Drawer

- **Depends on:** 27
- **Delivers:** Drawer, the one component entry that imports Gesture Handler, as an optional peer. Core's physics decide and the adapter owns the `Animated` values: the value follows the gesture during a drag, and on release the shared code gives the target, the velocity and the spring. The `gesture` entry comes with it.
- **Decisions:** [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [What native overlays, placement, gestures and animation can do with no extra dependencies](https://github.com/floklein/rn-ui/issues/6)
- **Done when:** the component checks pass; Gesture Handler is an optional peer in `package.json`, and no other entry imports it; the device check of the settle is recorded: a timed animation on the native driver with the spring as its easing, or the spring played from JavaScript each frame; a device spec drags it over content that scrolls

### 35. Sheet presentation entry

- **Depends on:** 30, 32, 34
- **Delivers:** `@ui-sdk/react-native/sheet`, the entry that makes the sheet presentation available. Once an app imports it, Dialog, Popover and Select present as a sheet, and `presentation="auto"` resolves to the sheet on a phone-sized screen. No popup entry imports Gesture Handler.
- **Decisions:** [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** device specs run Dialog, Popover and Select as a sheet; without the entry, `presentation="auto"` gives the component's own form; the size check finds no Gesture Handler in a popup entry; the entry has a budget and its docs; the repo gates exit 0

### 36. Publishing workflow and the first release

- **Depends on:** 13, 22, 23, 25, 33, 35
- **Delivers:** The fork-only release flow: the version file starting at `0.1.0`, the changelog, and a workflow that packs and publishes `@rn-ui-sdk/core`, `@rn-ui-sdk/react` and `@rn-ui-sdk/react-native` on demand, each release stating the upstream version it contains. No changeset names a shared package.
- **Decisions:** [How the fork publishes its packages](https://github.com/floklein/rn-ui/issues/11), [What the seam's ADR records](https://github.com/floklein/rn-ui/issues/22)
- **Done when:** the first-tier components run from the packed tarballs on an iOS simulator and an Android emulator, in an app outside the workspace whose `tsc --noEmit` exits 0; a run of the workflow publishes the three packages at one version; the release states the upstream version it contains; every shared package's `package.json` version and `CHANGELOG.md` is unchanged; the repo gates exit 0

### 37. Guide pages of the native docs section

- **Depends on:** 25, 35
- **Delivers:** The guide pages of the `react-native` section, written from React's and changed only where native differs: styling through functions of state and `interaction`, popups and `OverlayHost`, forms, exits through `onExit`, and the differences from the web.
- **Decisions:** [How native docs and examples ship](https://github.com/floklein/rn-ui/issues/31), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23), [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24)
- **Done when:** the docs build exits 0; the pages follow `ui-sdk-write-docs`; the `react-native` expert reviewed them; `pnpm lint` and `pnpm format` exit 0

### 38. Native section of the shipped skill

- **Depends on:** 36
- **Delivers:** A short native section in the skill shipped in `packages/core/skills/ui-sdk`.
- **Decisions:** [What the React Native expert covers](https://github.com/floklein/rn-ui/issues/34)
- **Done when:** the section names only what has landed; the `react-native` expert reviewed it; `pnpm lint` and `pnpm format` exit 0

### 39. Radio

- **Depends on:** 22
- **Delivers:** Radio and its group on the toggle control: each radio its own accessible element with no roving `tabindex`, and no hidden `input` part.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21), [What forms become on the native host](https://github.com/floklein/rn-ui/issues/23)
- **Done when:** the component checks pass

### 40. Toggle

- **Depends on:** 20
- **Delivers:** Toggle and Toggle Group, which share an entry.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 41. Segmented control

- **Depends on:** 23
- **Delivers:** Segmented Control, with its selection indicator's size and position as state fields.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How state reaches native styles](https://github.com/floklein/rn-ui/issues/18)
- **Done when:** the component checks pass

### 42. Toolbar

- **Depends on:** 40
- **Delivers:** Toolbar, with the controls inside it reachable as separate accessible elements.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 43. Rating

- **Depends on:** 20
- **Delivers:** Rating, with upstream's touch behavior.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 44. Label

- **Depends on:** 24
- **Delivers:** Label on a `Text` host, with upstream's behavior when it is pressed.
- **Decisions:** [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 45. File input

- **Depends on:** 25
- **Delivers:** File Input with its parts, state and validation, opening through a `pick` function the app passes to its root. The files carry `name`, `size`, `type` and `uri`, and no picker is wrapped.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** the component checks pass; a Jest test runs core's validation on the files `pick` returns; the docs page shows passing `pick` from a picker library

### 46. Avatar

- **Depends on:** 20
- **Delivers:** Avatar, with its fallback following the image's status.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 47. Separator

- **Depends on:** 20
- **Delivers:** Separator.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 48. Progress and meter

- **Depends on:** 20
- **Delivers:** Progress and Meter. One ticket because both are the value bar of `foundation/gauge` and differ only in role and value text.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 49. Pagination

- **Depends on:** 20
- **Delivers:** Pagination, with the same parts and outcomes as the web and a press for a click.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 50. Collapsible

- **Depends on:** 23
- **Delivers:** Collapsible on the disclosure behavior Tabs brought. Its panel measures its content apart from its own constrained height, exposes the size as state, including the size at close when an opening was interrupted, and closes through `onExit`.
- **Decisions:** [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; a Jest test shows the size at close after an interrupted opening

### 51. Accordion

- **Depends on:** 50
- **Delivers:** Accordion on Collapsible's panel behavior.
- **Decisions:** [How presence and exit animation work on native](https://github.com/floklein/rn-ui/issues/24), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 52. Listbox

- **Depends on:** 31
- **Delivers:** Listbox on the listbox engine, in place with no popup.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 53. Autocomplete

- **Depends on:** 24, 32
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

- **Depends on:** 32
- **Delivers:** Menu, with its items, groups, submenus and context trigger behaving as upstream does on touch, and no `shortcut`.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass

### 58. Menubar

- **Depends on:** 57
- **Delivers:** Menubar on Menu, with a press for a click.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 59. Navigation menu

- **Depends on:** 30, 50
- **Delivers:** Navigation Menu on the disclosure and popup behaviors.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 60. Tooltip

- **Depends on:** 30
- **Delivers:** Tooltip: closed on touch, opened on press when `toggleable` and on hover where the device reports one, never on a long press.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 61. Hover card

- **Depends on:** 60
- **Delivers:** Hover Card: closed on touch, opened on hover where the device reports one.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 62. Overlays opened from code

- **Depends on:** 28
- **Delivers:** The `overlays` entry: `confirm()` and the other overlays opened from code, rendered in the topmost open host.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20)
- **Done when:** a device spec shows `confirm()` opened over a modal dialog rendering above it, and its promise resolving with the choice; a Jest test shows the development warning with no `OverlayHost`; the entry has a budget and its docs; the repo gates exit 0

### 63. Toast

- **Depends on:** 33, 62
- **Delivers:** Toast and its toaster, rendered in the topmost open host, dismissed by a swipe through the responder system, with their announcements.
- **Decisions:** [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17), [Which dependencies the native adapter may take](https://github.com/floklein/rn-ui/issues/16), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; a device spec shows a toast fired over a modal dialog above it

### 64. Calendar

- **Depends on:** 20
- **Delivers:** Calendar, formatting in the locale from `Intl` or in its own `locale` option. The `date` entry comes with it.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How direction and locale are read on native](https://github.com/floklein/rn-ui/issues/32)
- **Done when:** the component checks pass

### 65. Date picker

- **Depends on:** 30, 64
- **Delivers:** Date Picker, a Calendar in a popup.
- **Decisions:** [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How native popups layer, dismiss and place themselves](https://github.com/floklein/rn-ui/issues/17)
- **Done when:** the component checks pass

### 66. Password input

- **Depends on:** 24
- **Delivers:** Password Input on the text field's native behavior, with secure entry.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What TextInput gives for selection, composition and the caret](https://github.com/floklein/rn-ui/issues/25), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the probe lists no throw for its root

### 67. Number input

- **Depends on:** 24, 33
- **Delivers:** Number Input, with the edit the other text components reuse: one the web would refuse is accepted and corrected at once through the shared rules, and the write carries its own selection. It keeps its increment and decrement parts. The `number` entry comes with it.
- **Decisions:** [How text entry components work on TextInput](https://github.com/floklein/rn-ui/issues/26), [What TextInput gives for selection, composition and the caret](https://github.com/floklein/rn-ui/issues/25), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; Jest tests show a refused edit corrected with its selection; the device check of writing a value back while an IME composes is recorded

### 68. OTP input

- **Depends on:** 24
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

- **Depends on:** 33
- **Delivers:** Scroll Area, its viewport a `ScrollView` that stops its own scrolling for the length of a drag inside it.
- **Decisions:** [Where native names diverge from @ui-sdk/react](https://github.com/floklein/rn-ui/issues/20), [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass

### 73. Reordering and moving between lists

- **Depends on:** 72
- **Delivers:** Reordering and moving between lists by touch drag, started and cancelled as upstream does on touch, with scrolling near an edge inside the library's Scroll Area only.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27)
- **Done when:** Jest tests show a cancelled drag committing nothing; a device spec reorders a list and moves an item between two; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android; its files are in the registry; the repo gates exit 0

### 74. Resizable

- **Depends on:** 33
- **Delivers:** Resizable, with upstream's touch behavior through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 75. Carousel

- **Depends on:** 23, 33
- **Delivers:** Carousel, dragged through the responder system, with its indicators as separate accessible elements.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15), [How focus works on the native host](https://github.com/floklein/rn-ui/issues/21)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 76. Color picker

- **Depends on:** 33
- **Delivers:** Color Picker, its area and sliders dragged through the responder system. The `color` entry comes with it.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 77. Image cropper

- **Depends on:** 33
- **Delivers:** Image Cropper, reporting the crop area with its rotation and flips, with pinch computed from the responder's touches. The `image` entry comes without `cropImage`.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android; the device check of pinch is recorded

### 78. Timeline

- **Depends on:** 33
- **Delivers:** Timeline, dragged through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 79. Waterfall

- **Depends on:** 31, 33
- **Delivers:** Waterfall, with the same parts and outcomes as the web, dragged through the responder system.
- **Decisions:** [How drags and canvas components work on native](https://github.com/floklein/rn-ui/issues/27), [What parity means for every component](https://github.com/floklein/rn-ui/issues/15)
- **Done when:** the component checks pass; the device check inside a scroll view scrolling along the same axis is recorded for iOS and Android

### 80. Agent layer on the native host

- **Depends on:** 4, 27
- **Delivers:** The agent layer on the native host: twins for the registry and the bridge, a snapshot built from what the adapter rendered, `act` through the api with the `"agent"` source, the three marks as props on any part, the wrapper that marks a region, and the `agent`, `observe` and `history` entries.
- **Decisions:** [What the agent layer reads and drives on native](https://github.com/floklein/rn-ui/issues/28), [How names and descriptions reach native screen readers](https://github.com/floklein/rn-ui/issues/30)
- **Done when:** Jest tests show a snapshot listing a part by its label and text; it leaves out a part whose slot isn't `present`, one under a hidden mark and one behind an open modal; `act` changes state with `source=agent`; a mark on the wrapper covers everything inside it; the twin check passes, and the entries have budgets and docs; the repo gates exit 0

## Questions

What the resolutions don't settle and a builder will hit. None is answered here.

- What does the storage twin read and write, and does `@ui-sdk/react-native/preferences` exist? The ADR lists storage among the twins and no ticket decides it, so no ticket here covers either.
- How does a native app use the behaviors `@ui-sdk/core` exports for building one's own component (reordering, moving between lists, roving focus and the others that take elements), given that they aren't components and `@ui-sdk/react` has no entry for them?
- Which entries besides `shortcuts` count as a concept that doesn't exist on native?
- How do `required` and `readOnly` reach a screen reader, when React Native has no counterpart for `aria-required` and `aria-readonly`?
- Which source do Android back and the iOS escape gesture report, and how is a screen reader's activation told from a finger's press, when `onPress` doesn't say?
- How long is the timeout after which an exiting part unmounts when `done` is never called?
- What does `presentation="sheet"` do when the app hasn't imported the sheet entry?
- How do a sibling Backdrop and Content share one `Modal` without losing the React context of providers between the root and the content?
- Who renders Gesture Handler's root view, which it also needs inside each Android `Modal`: the Drawer and sheet entries, or the app?
- How does an Expo app get core's development warnings, when `#dev` resolves to the stub unless Metro adds the `development` condition?
- How do the new public names in core (the host interface, the native behavior entries) pass `public-docs-pages` and `stability` in `pnpm lint`: a docs page each, or a listed entry?
- Which entry does the public native pattern check ship from?
- Which renderer do the adapter's own Jest tests use, given that the pattern check imports none?
- How does the no-document probe gate while a component whose path throws is still `pending`?
- Do device specs run against Expo Go or a development build, locally and on GitHub runners?
- Do device specs open only the examples, or do they need screens of their own for scenarios no example shows, such as a cancelled change?
- Which kinds of web spec file have a native file: `ssr`, `render`, `counts`, `kitchen-sink`, `leaks`? And does `scripts/check-coverage.mjs` count native as a framework?
- Does merging upstream run the sweep of every device spec? The checking decision runs it after a merge that touches shared code; the upstream routine lists only the Jest-level checks.
- What happens when a device check fails where no fallback is recorded: a corrected value disturbing an IME, the `selection` prop for OTP slots, and the popup measurements?
- Is Gesture Handler external when `scripts/size.mjs` measures Drawer's entry and the sheet entry?
- Which guide pages does the native docs section have? React's include server rendering and building one's own parts.
- What do Scroll Area's scrollbar and thumb parts do over a `ScrollView`?
- What is the name of the wrapper component that marks a region for the agent layer, and are the `data-agent-*` props forwarded to the host?
- Who supplies npm publish access to the `@rn-ui-sdk` scope for the workflow?
- Can a component ticket close before the owner has a physical iPhone for the VoiceOver pass?
- If the owner refuses the hardware-keyboard exception, which tickets carry key events? None here does.
