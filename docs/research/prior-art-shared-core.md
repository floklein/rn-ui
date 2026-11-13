# Prior art: sharing a headless core between the DOM and React Native

Research for [issue #4](https://github.com/floklein/rn-ui/issues/4), feeding the decision "Where the host seam sits in core". Read on 2026-11-13.

## Answer in short

- **Nobody shares a behavior core between a DOM host and a native host.** Of the eleven projects read, six are DOM-only by their maintainers' own statement (React Aria, Radix, Zag and Ark, Base UI, Headless UI). The ones that reach native do it in one of four ways, and in all four the native side has less behavior than the web side.
- **The one split that was designed for two hosts is state above, host below** (React Stately under React Aria). It is the closest match to `definePrimitive`: `state`, `sync` and the pure part of `api` on one side, `slots` on the other. Its record: the shared layer works, the native behavior layer was never built by its owners, and the shared layer still broke on React Native in 2026 because nothing tested it there.
- **A host interface under an engine works when the interface is narrow and typed in the engine's terms**, not the DOM's. Floating UI's `Platform` (three required methods, with a DOM and a React Native implementation) and React Aria's `LayoutDelegate` hold. Zag's `Scope` does not: it is typed as `Document`, `HTMLElement` and `getElementById`, so it only moves the root node.
- **Module swapping (`.native.ts`, `.web.ts`) is a mechanism, not a seam.** What matters is the size of the swapped module. Whole components (rn-primitives) share nothing but types. Whole behavior hooks (react-native-aria) share state and leave native hooks as stubs. Leaf utilities (Tamagui) share the most code, and native loses focus scope, dismissal layers and roving focus without saying so.
- **Bringing a DOM subset to native (react-strict-dom) is still partial** at 0.0.55: no `dialog`, `form`, checkbox or radio inputs, no `inert`, `aria-controls` or `aria-activedescendant`, no `document.activeElement`, and events that don't match the web's.
- **For a parity goal, the evidence says the cost is in the host-specific layer, not in finding the seam.** Parity of behavior on native would be new: no project here has it.

## What was read

Each repository was cloned at the commit below and read locally. "Version" is the package version in that commit.

| Project                        | Repository                    | Commit                                                                                                    | Commit date | Version                                     |
| ------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------- |
| React Aria, React Stately      | `adobe/react-spectrum`        | [`360e351`](https://github.com/adobe/react-spectrum/tree/360e35170568dfc99a2baaa78e6b7bdd36458d91)        | 2026-11-13  | `react-aria` 3.53.1, `react-stately` 3.51.0 |
| react-native-aria (standalone) | `gluestack/react-native-aria` | [`8a1e73c`](https://github.com/gluestack/react-native-aria/tree/8a1e73cd6bf1ed4ddc3d0f22c08d1833e5a28e3a) | 2023-12-11  | deprecated                                  |
| gluestack-ui                   | `gluestack/gluestack-ui`      | [`b712c85`](https://github.com/gluestack/gluestack-ui/tree/b712c8541c85d57becbd1a1b2ba150a369223eb6)      | 2026-09-02  | `@gluestack-ui/core` 5.0.15                 |
| rn-primitives                  | `roninoss/rn-primitives`      | [`1bebe66`](https://github.com/roninoss/rn-primitives/tree/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4)      | 2026-08-08  | `@rn-primitives/dropdown-menu` 1.5.2        |
| Radix Primitives               | `radix-ui/primitives`         | [`eb3a2b7`](https://github.com/radix-ui/primitives/tree/eb3a2b7091293e27df8f9ba906632d8daa3d81a3)         | 2026-10-14  |                                             |
| Zag.js                         | `chakra-ui/zag`               | [`5f1b53a`](https://github.com/chakra-ui/zag/tree/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8)               | 2026-11-13  | 1.48.0                                      |
| Ark UI                         | `chakra-ui/ark`               | [`1019b2a`](https://github.com/chakra-ui/ark/tree/1019b2a33782e25bf5c89aea2c72ad2e9fd359b3)               | 2026-11-13  |                                             |
| Base UI                        | `mui/base-ui`                 | [`315eba7`](https://github.com/mui/base-ui/tree/315eba7a3d8a0a53d47fe7b902cb75daa21f6814)                 | 2026-11-13  | `@base-ui/react` 1.9.0                      |
| Tamagui                        | `tamagui/tamagui`             | [`385dcd1`](https://github.com/tamagui/tamagui/tree/385dcd1463f91c66545c81d13f567305eb8a83ba)             | 2026-11-13  | 3.3.3                                       |
| Headless UI                    | `tailwindlabs/headlessui`     | [`eea57cf`](https://github.com/tailwindlabs/headlessui/tree/eea57cf46fd6767ed1059012f7073b88eb159fba)     | 2026-04-13  | `@headlessui/react` 2.2.10                  |
| react-strict-dom               | `facebook/react-strict-dom`   | [`f3fbeaa`](https://github.com/facebook/react-strict-dom/tree/f3fbeaa01af5646081e8bcbbdb63c54c777548f3)   | 2026-11-07  | 0.0.55                                      |
| Floating UI (added, see below) | `floating-ui/floating-ui`     | [`c3042f1`](https://github.com/floating-ui/floating-ui/tree/c3042f1f37d96dfadff1d8894daa31e120d89ed4)     | 2026-11-12  |                                             |

Also read: the React Native 0.88 docs pages [Element nodes](https://reactnative.dev/docs/element-nodes) and [Accessibility](https://reactnative.dev/docs/accessibility), and the issues and discussions linked in each section.

**How to read the claims.** "Verified" means I read it in the source, doc or thread linked. "Inferred" means I concluded it from what I read; the reasoning is given. Nothing here was run on a device.

## Summary table

| Project                         | Reaches native        | Shared between hosts                         | Reimplemented per host                                    | Native accessibility props come from                                   |
| ------------------------------- | --------------------- | -------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| React Stately + React Aria      | No (Aria is DOM-only) | State hooks, collections, selection          | All behavior, in React Aria, for the DOM only             | n/a                                                                    |
| react-native-aria, gluestack-ui | Yes                   | React Stately; hook names and signatures     | Every behavior hook; positioning; focus scope is a no-op  | Native hooks return `role` and `aria-*` props for React Native to read |
| rn-primitives                   | Yes                   | Part names and prop types                    | The whole component: Radix on web, hand-written on native | Components set `role`, `aria-*` and `accessibilityState` by hand       |
| Radix Primitives                | No                    | n/a                                          | n/a                                                       | n/a                                                                    |
| Zag.js, Ark UI                  | No                    | Machines across frameworks, all on the DOM   | n/a                                                       | n/a                                                                    |
| Base UI                         | No                    | n/a                                          | n/a                                                       | n/a                                                                    |
| Tamagui                         | Yes                   | One component source for both hosts          | Leaf utilities by `.native.tsx`, mostly as stubs          | Components write `role` and `aria-*`; Tamagui's view passes them down  |
| Headless UI                     | No                    | n/a                                          | n/a                                                       | n/a                                                                    |
| react-strict-dom                | Yes                   | The app's code, written against a DOM subset | The DOM subset itself, polyfilled over React Native       | `useNativeProps` translates `aria-*` to `accessibility*` props         |

## React Stately and React Aria

**The seam: state hook above, behavior hook below.** Verified.

- The architecture page says the state hook "is shared across platforms — it could work on the web, react-native, or any other platform, and makes no assumptions about the view system it is running on", and the behavior hook "is platform specific, and depends on the platform API (e.g. the DOM or react-native)" ([architecture.mdx, lines 98-120](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/dev/docs/pages/architecture.mdx#L98-L120)).
- The same page: "We do not yet have behavior hooks for other platforms however, so if you're working in react-native or another view system, you'll need to use React Stately directly" ([lines 203-208](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/dev/docs/pages/architecture.mdx#L203-L208)).
- React Stately holds no DOM code. Of its 96 source files, two mention a DOM global: a comment in `useToastState.ts` and a guarded `typeof HTMLElement` check in `Virtualizer.ts`. It depends on `react`, `@internationalized/*` and `@react-types/shared`, not on `react-dom` ([package.json](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/react-stately/package.json)).
- What a state hook holds: `useToggleState` is controlled and uncontrolled value, `setSelected` and `toggle`, and nothing else ([useToggleState.ts](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/react-stately/src/toggle/useToggleState.ts)). What the behavior hook holds: `useToggle` takes that state and a ref to an `HTMLInputElement`, and returns `labelProps`, `inputProps`, press handling, form validation and form reset ([useToggle.ts](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/react-aria/src/toggle/useToggle.ts)). The behavior hook is the larger half.

**A host interface inside the web layer.** Verified. Keyboard navigation doesn't read the DOM directly. `ListKeyboardDelegate` asks a `LayoutDelegate` for rectangles and falls back to `DOMLayoutDelegate` when none is passed ([ListKeyboardDelegate.ts, line 71](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/react-aria/src/selection/ListKeyboardDelegate.ts#L71)). The interface is four methods: `getItemRect`, `getVisibleRect`, `getContentSize`, `getKeyRange` ([collections.d.ts, lines 137-146](https://github.com/adobe/react-spectrum/blob/360e35170568dfc99a2baaa78e6b7bdd36458d91/packages/%40react-types/shared/src/collections.d.ts#L137-L146)). It exists for virtualized lists, not for React Native, but it is a working example of an engine that asks its host for geometry.

**How the two sides were meant to stay in sync.** Verified, from the maintainer: shared TypeScript definitions in `@react-types` plus the stately layer, with "something like `@react-aria` as a middle layer for React Native as well, using react native props for accessibility and behavior instead of DOM props" ([devongovett, issue #696, 2020-07-17](https://github.com/adobe/react-spectrum/issues/696#issuecomment-660309502)).

**What was abandoned.** Verified.

- The native behavior layer was never built by the team. In 2020: "react-aria specifically is web only since it relies heavily on browser APIs… we'd be interested in working with the community on building out the higher layers on top of react-stately". In 2024 a maintainer answered the issue with a pointer to gluestack's react-native-aria ([issue #696](https://github.com/adobe/react-spectrum/issues/696#issuecomment-2436442162)). In 2026: "React Aria relies on the DOM and doesn't support React Native" ([snowystinger, issue #10760, 2026-10-13](https://github.com/adobe/react-spectrum/issues/10760#issuecomment-6155336730)).
- A community pull request scaffolding `@react-spectrum/native` was closed unmerged on 2026-05-09 ([#10035](https://github.com/adobe/react-spectrum/pull/10035)).

**What it cost.** Verified. The shared layer was not safe on native just because it had no DOM code. `useControlledState`, in React Stately, chose its effect by `typeof document !== 'undefined'`, meant as a server check. React Native has no `document`, so the effect was a no-op there and a controlled value changed by the parent stopped firing `onChange` ([issue #10512, 2026-08-25](https://github.com/adobe/react-spectrum/issues/10512)). The fix merged on 2026-09-09 ([#10550](https://github.com/adobe/react-spectrum/pull/10550)). A second one: importing `react-aria` 3.53 threw under React Native's Jest preset because a test shim read `window.screen` ([issue #10760](https://github.com/adobe/react-spectrum/issues/10760)).

## react-native-aria and gluestack-ui

**The seam: same hook name and signature, one file per host, React Stately above.** Verified.

- It began in 2021 as an attempt to spread React Aria's props onto React Native Web's `View` and `Pressable`, which failed: "View doesn't pass role and tabIndex to the rendered div element" and "Pressable/Touchable don't pass keyDown handler" ([intergalacticspacehighway, issue #696, 2021-01-27](https://github.com/adobe/react-spectrum/issues/696#issuecomment-768007466)). The approach then changed "after a suggestion from necolas", away from React Native Web's unstable APIs ([same thread, 2021-02-05](https://github.com/adobe/react-spectrum/issues/696#issuecomment-773962618)).
- The standalone repository is deprecated: "We have deprecated this repository and migrated our codebase to a new mono repository structure" ([README](https://github.com/gluestack/react-native-aria/blob/8a1e73cd6bf1ed4ddc3d0f22c08d1833e5a28e3a/README.md)). The `packages/react-native-aria` folder React Spectrum's maintainers pointed to in 2024 no longer exists either: at the commit read, the hooks live in `packages/gluestack-core/src/<component>/aria/` and `packages/gluestack-utils/src/aria/`.
- The swap is by file extension. `checkbox/aria/index.web.ts` re-exports `useCheckbox` from `@react-aria/checkbox`; `index.ts` exports a hand-written one ([index.web.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/checkbox/aria/index.web.ts), [index.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/checkbox/aria/index.ts)).
- State comes from `@react-stately/*` on both hosts ([package.json](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/package.json)).

**What the native side is.** Verified.

- `useCheckbox` on native calls a native `useToggle` and returns `role: 'checkbox'`, `aria-checked` and `aria-disabled` on `inputProps` ([useCheckbox.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/checkbox/aria/useCheckbox.ts)). The native `useToggle` carries the note "No support for Invalid in RN" ([useToggle.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-utils/src/aria/toggle/useToggle.ts)).
- `useMenu` on native returns `{ menuProps: { role: 'menu' } }` and ignores its state and its keyboard delegate ([useMenu.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/menu/aria/useMenu.ts)). `useMenuItem` is 87 lines on native and 203 on web.
- `useOverlay` on native returns `{ overlayProps: {} }`: no outside press, no Escape, no stacking ([useOverlay.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/overlay/aria/useOverlay.ts)).
- `FocusScope` on native renders a fragment, and `useFocusManager` is "Noop - Implement this for mac and windows" ([FocusScope.tsx](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-utils/src/aria/focus/FocusScope.tsx)).
- Positioning is a second implementation: 625 lines on native using `measureInWindow`, with the web side vendoring its own copy of React Aria's `calculatePosition` ([useOverlayPosition.ts](https://github.com/gluestack/gluestack-ui/blob/b712c8541c85d57becbd1a1b2ba150a369223eb6/packages/gluestack-core/src/overlay/aria/useOverlayPosition.ts)).

**How the sides stay in sync.** Inferred from the layout: the web side follows React Aria by a version bump, the native side by hand. The files keep Adobe's license header, so they started as copies. Nothing in the repository checks one host against the other.

**What it cost.** Inferred: the shared contract is the hook's signature, which was designed for the DOM. Native hooks still take `RefObject<HTMLElement>` and return types named `HTMLAttributes`. The signature survives; the behavior behind it mostly doesn't.

## Radix Primitives and rn-primitives

**Radix has no host seam.** Verified. Its base `Primitive` is a fixed list of DOM tags rendered through `react-dom` ([primitive.tsx](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/primitive/src/primitive.tsx)), and its core helpers resolve `ownerDocument` and `window`. The team's only statement found: "We've discussed releasing libs for other frameworks, but no immediate plans" ([colmtuite, discussion #612, 2021-04-20](https://github.com/radix-ui/primitives/discussions/612)). A community attempt to port it listed the DOM dependencies (`getBoundingClientRect`, `onMouseDown`, `useSize`, `tabIndex`) and "800+ errors in TS", and stopped ([discussion #1965, 2023-02-18](https://github.com/radix-ui/primitives/discussions/1965)).

**rn-primitives: the seam is the public API and nothing else.** Verified.

- Its own words: "One API across iOS, Android, and Web. Radix UI powers the web side; native implementations power the rest" ([docs index.mdx, line 38](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/apps/docs/src/content/docs/index.mdx#L38)).
- Each package is three files: `types.ts`, `<name>.web.tsx` and `<name>.tsx`. The web file wraps the Radix component around React Native Web's `Pressable` with `asChild`, then writes `data-state`, `type` and `role` onto the element by hand in layout effects ([checkbox.web.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/checkbox/src/checkbox.web.tsx)). The native file imports nothing from Radix: it is a context, a `Pressable` and an `onPress` ([checkbox.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/checkbox/src/checkbox.tsx)).
- 23 of 32 packages depend on a `@radix-ui/*` package, for the web file only. The shared packages are `hooks`, `portal`, `slot`, `types` and `utils`.
- Native Dropdown Menu, 653 lines, has its own positioning (`measure` and `useRelativePosition`), its own portal, `BackHandler` for Android's back button and `useAccessibilityFocus` to move the screen reader's focus. It has no keyboard navigation, typeahead or roving focus ([dropdown-menu.tsx](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/dropdown-menu/src/dropdown-menu.tsx)).
- Accessibility props are written twice on each part: `role='checkbox'` and `aria-checked` next to `accessibilityState={{ checked, disabled }}`.
- State is not shared, and the API was narrowed to make that easy: Checkbox requires `checked` and `onCheckedChange`, so there is no uncontrolled mode ([types.ts](https://github.com/roninoss/rn-primitives/blob/1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4/packages/checkbox/src/types.ts)).

**How the sides stay in sync.** Verified: by the shared `types.ts`, where the two hosts already differ. Props are marked "Platform: WEB ONLY" or "Platform: NATIVE ONLY" in the type comments (`select/src/types.ts`, `dialog/src/types.ts`, `dropdown-menu/src/types.ts`), and Select's `ScrollUpButton`, `ScrollDownButton` and `Viewport` are documented as web only.

**What was abandoned.** Verified, from the author: an earlier version used React Native's own `Modal` and was dropped because "the UX was not the greatest", and he "might give it another shot with react-strict-dom when it is more stable" ([mrzachnugent, discussion #1965, 2024-02-28](https://github.com/radix-ui/primitives/discussions/1965)).

## Zag.js and Ark UI

**The machines are framework-agnostic, not host-agnostic.** Verified.

- `@zag-js/core` depends on `@zag-js/dom-query` ([package.json](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/core/package.json)). Every machine gets a `Scope`, whose type is `getRootNode: () => ShadowRoot | Document | Element`, `getById`, `getActiveElement`, `getDoc: () => typeof document` and `getWin: () => typeof window` ([types.ts, lines 78-87](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/core/src/types.ts#L78-L87), [scope.ts](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/core/src/scope.ts)).
- Machines find their elements by id through that scope (`ctx.getById(getRootId(ctx))` in [checkbox.dom.ts](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/machines/checkbox/src/checkbox.dom.ts)) and run DOM effects inside the machine: the checkbox machine's effects are `trackFormControlState`, `trackPressEvent` and `trackFocusVisible`, and its actions set `inputEl.indeterminate` and dispatch an input event ([checkbox.machine.ts](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/machines/checkbox/src/checkbox.machine.ts)). By a grep for DOM calls: menu's machine has 59 in 1,016 lines, dialog's 27 in 270, toggle's none in 51.
- The `connect` function returns DOM props, grouped by HTML element: `normalize.label(...)`, `normalize.input(...)`, `normalize.element(...)`. The normalizer is the per-framework seam, and React's is the identity function ([normalize-props.ts](https://github.com/chakra-ui/zag/blob/5f1b53a7dc635ba6ef314dcf3b81bd3bb08ff0e8/packages/frameworks/react/src/normalize-props.ts)). It renames props (`onClick` versus `onclick`); it can't change what a prop is.
- Ark has four adapters, `react`, `solid`, `svelte` and `vue`, all over Zag.

**Maintainer statements.** Verified. In 2022: "we don't plan to support React Native but I imagine that we can make this work easily once we get the modeling of the component correctly". In 2026: "Closing this. We don't have plans to support React Native" ([segunadebayo, zag discussion #116, 2022-06-03 and 2026-03-24](https://github.com/chakra-ui/zag/discussions/116)). On Ark: "I don't believe it's possible since we rely on DOM methods (querySelector, getElementById)" ([ark discussion #2975, 2024-10-13](https://github.com/chakra-ui/ark/discussions/2975)).

**Why it matters here.** Inferred. Zag is the nearest design to ui-sdk's: a framework-neutral definition, adapters that spread props, elements found after render. It shows that this shape alone doesn't give a host seam. Two things tie it to the DOM: the scope is typed in DOM vocabulary, and effects that need an element run inside the machine and look the element up by id. A commenter named the first one in 2023: "we'd have to refactor how the rootNode is found when scope is created… and make the typings more agnostic" (discussion #116). It was not done.

## Base UI

**DOM-only, by choice.** Verified.

- One package, `@base-ui/react`, with `react-dom` as a peer and `@floating-ui/react-dom` as a dependency ([package.json](https://github.com/mui/base-ui/blob/315eba7a3d8a0a53d47fe7b902cb75daa21f6814/packages/react/package.json)). There is no state layer separate from the components: Checkbox is `CheckboxRoot.tsx` and its context.
- The team's position: "we need 'focus'; we can't support React Native **and** provide an amazing React DOM support (our priority). So we could almost keep this issue closed" ([oliviertassinari, issue #2612, opened 2025-09-02, open](https://github.com/mui/base-ui/issues/2612)). Its stated reasons are about adoption and funding, not architecture.
- A user asked for the split Base UI doesn't have: "The interaction layer is combined with state and hidden - think about react-stately for state vs react-aria for interactions and aria support - each layer should be swappable" ([issue #2264, 2025-07-06, open, no reply](https://github.com/mui/base-ui/issues/2264)).

## Tamagui

**The seam: one component source over a universal view, with leaf modules swapped.** Verified.

- Components are forks of Radix, written once: `Checkbox.tsx` opens with "fork of radix" and `Dismissable.tsx` with "forked from radix-ui" ([Checkbox.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/checkbox/src/Checkbox.tsx), [Dismissable.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/dismissable/src/Dismissable.tsx)). They render Tamagui's own `View`, which is a DOM element on web and a React Native view on native.
- Host differences are handled two ways. Inline, with a constant: `isWeb` is `true` in `constants.ts` and `false` in `constants.native.ts`, and 51 source files under `code/ui` read it. `useCheckbox` uses it to add `type`, `data-state`, `onKeyDown` and the hidden form input on web only ([useCheckbox.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/checkbox-headless/src/useCheckbox.tsx)). And by file: 102 `.native.ts(x)` files under `code/`.
- The swapped native files for behavior are stubs:

| Module             | Web       | Native   | Native file says                                        |
| ------------------ | --------- | -------- | ------------------------------------------------------- |
| `FocusScope`       | 598 lines | 8 lines  | returns `props.children`                                |
| `Dismissable`      | 505 lines | 40 lines | "stubs for native - dismissable is a web-only concept"  |
| `RovingFocusGroup` | 429 lines | 34 lines | "noop native doesn't need keyboard accessibility"       |
| `RemoveScroll`     | 13 lines  | 2 lines  | returns `props.children`                                |
| `Tooltip`          | 314 lines | 26 lines | "no output on native for now"; `Content` renders `null` |

Sources: [FocusScope.native.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/focus-scope/src/FocusScope.native.tsx), [Dismissable.native.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/dismissable/src/Dismissable.native.tsx), [RovingFocusGroup.native.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/roving-focus/src/RovingFocusGroup.native.tsx), [Tooltip.native.tsx](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/ui/tooltip/src/Tooltip.native.tsx).

- Positioning is the one place with a real host interface: `@tamagui/floating` depends on both `@floating-ui/react-dom` and `@floating-ui/react-native`, and `Floating.native.tsx` re-exports the second.
- Since version 2 there are four headless packages (`checkbox-headless`, `switch-headless`, `radio-headless`, `tabs-headless`), "Zero dependency on `@tamagui/core`, just hooks", described as "a subset" ([version-two.mdx, lines 430-442](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/tamagui.dev/data/blog/version-two.mdx#L430-L442)). They are host-universal by the same `isWeb` branching, and typed against React Native's `PressableProps`.

**Accessibility props.** Verified. Version 2 "Removed React Native accessibility props in favor of web-standard props": `accessibilityLabel` to `aria-label`, `accessibilityRole` to `role`, `accessibilityState` to `aria-disabled`, `aria-selected`, `aria-checked`, `aria-busy` and `aria-expanded`, `nativeID` to `id`, `focusable` to `tabIndex` ([version-two.mdx, lines 624-637](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/code/tamagui.dev/data/blog/version-two.mdx#L624-L637)). So the direction of travel was from React Native's vocabulary to the web's, with the view translating.

**What was abandoned.** Verified: the React Native accessibility prop names above. Not verified: a plan file in the repository describes version 3 adding `html.*` elements "matching or exceeding React Strict DOM (RSD) conformance" through `@tamagui/dom` ([v3-web-first-master-spec.md](https://github.com/tamagui/tamagui/blob/385dcd1463f91c66545c81d13f567305eb8a83ba/plans/v3-beta/v3-web-first-master-spec.md)). The `code/core/dom` package exists; I did not check what it ships.

**What it cost.** Inferred. One source keeps the hosts in sync for free, which no other project here has. The price is that the native result is the web component minus whatever was stubbed, so behavior that only makes sense on native (the back button, screen reader focus, a hardware keyboard on a tablet) has no home unless someone adds it.

## Headless UI

**DOM-only.** Verified. Two adapters, React and Vue, with no shared core between them. The React package's newer state machines hold elements directly: the listbox machine's state has `optionsElement: HTMLElement | null` and a `Map<string, HTMLElement | null>` of options ([listbox-machine.ts](https://github.com/tailwindlabs/headlessui/blob/eea57cf46fd6767ed1059012f7073b88eb159fba/packages/%40headlessui-react/src/components/listbox/listbox-machine.ts)). The team's statement: "React Native will probably be even more difficult compared to other frameworks. This is because a lot of the code relies on the DOM" ([RobinMalfait, discussion #571, 2021-05-28](https://github.com/tailwindlabs/headlessui/discussions/571)). No later statement was found. The last commit read is from 2026-04-13.

## react-strict-dom: the opposite approach

**The seam: none in the library. The host is made to look like a DOM subset.** Verified.

- Purpose: "a subset of React DOM and Web APIs that can be used to render components on both web and native platforms" ([learn/index.md](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/learn/index.md)). It "relies on React Native and polyfills": `<div>` maps to a native view, `<span>` to `Text`, `input` to `TextInput` ([how native works](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/contribute/02-technicals/02-native.md)).
- Accessibility props are translated in one function. `useNativeProps` turns `aria-label` into `accessibilityLabel`, `aria-hidden` into `accessibilityElementsHidden`, `aria-modal` into `accessibilityViewIsModal`, the checked, disabled, expanded, selected and busy states into `accessibilityState`, and the `aria-value*` set into `accessibilityValue`; `role` passes through ([useNativeProps.js](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/react-strict-dom/src/native/modules/useNativeProps.js)).
- What it rejected, in its own words: "Other approaches that we explored were either based on React Native's API (e.g., React Native for Web) or a another custom API. But they introduced performance regressions on web, implementation and migration complexity for all platforms, and ongoing design costs associated with developing non-standard APIs" ([design goals](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/contribute/02-technicals/01-design-goals.md)).
- Its stated trade-off: "Developers may not be used to an API that is complete on web but partially implemented on native platforms" (same page).

**What is missing on native**, from its compatibility tables ([api/html/index.md](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/api/03-html/index.md), [document](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/api/04-other/03-document.md), [window](https://github.com/facebook/react-strict-dom/blob/f3fbeaa01af5646081e8bcbbdb63c54c777548f3/packages/website/docs/api/04-other/04-window.md)). Verified.

- Elements: `dialog`, `form`, `select`, `option`, `progress`, `svg`, and `input` of type checkbox, radio, date, color and file.
- Attributes: `inert`, `autoFocus`, `aria-activedescendant`, `aria-controls`, `aria-haspopup`, `aria-pressed`, `aria-invalid`, `aria-required`, `aria-readonly`, `aria-orientation`, `aria-owns`, `aria-current`.
- Events: `onClick`, `onFocus`, `onBlur` and `onKeyUp` are listed as unsupported and `onKeyDown` as polyfilled, all under one open issue, which says "most of the events are not fired synchronously and/or at the right time, and the event objects themselves do not match web standards" ([issue #38, opened 2024-02-26, open](https://github.com/facebook/react-strict-dom/issues/38)).
- Globals: `document.activeElement`, `document.elementFromPoint`, `window.matchMedia`, `window.getSelection`.
- Element methods: `click()`, `scrollIntoView()`, `getAttribute()`; `focus()` takes no options.

**What it has that is useful to any design.** Verified in React Native's own docs, not only here: on current React Native a ref to a native component is an element node with a web-compatible read API: `getBoundingClientRect()`, `contains()`, `compareDocumentPosition()`, `parentElement`, `children`, `getRootNode()`, `isConnected`, `focus()` and `blur()` ([Element nodes, React Native 0.88](https://reactnative.dev/docs/element-nodes)). The docs page doesn't say which architecture it needs. The react-strict-dom design page credits "new capabilities coming to React Native such as DOM traversal APIs".

**Why this was ruled out here still holds.** Inferred. This effort already excluded DOM shims. The tables above are the reason in detail: a headless library is made of exactly the parts that are missing (focus events, `inert`, dialog, form controls, relationship attributes). Base UI was asked to adopt it and has not replied (issue #2264).

## One more data point: Floating UI

Not on the ticket's list, added because two projects on it (Tamagui and Base UI) position through it and because it is the cleanest working host interface found. Verified.

- `@floating-ui/core` computes placement with no host code. It takes a `Platform` whose required methods are `getElementRects`, `getClippingRect` and `getDimensions`; `isRTL`, `getOffsetParent` and the rest are optional ([types.ts, lines 25-58](https://github.com/floating-ui/floating-ui/blob/c3042f1f37d96dfadff1d8894daa31e120d89ed4/packages/core/src/types.ts#L25-L58)).
- `@floating-ui/dom` and `@floating-ui/react-native` each implement it. The native one is one file built on `measure`, `measureInWindow` and `Dimensions.get('window')`, with an Android status bar correction ([createPlatform.ts](https://github.com/floating-ui/floating-ui/blob/c3042f1f37d96dfadff1d8894daa31e120d89ed4/packages/react-native/src/createPlatform.ts)).
- The interface is typed in the engine's terms (rectangles, `element: any`) and is async-tolerant (`Promisable`), because native measurement was callback-based.

## How native accessibility props get produced

Three ways were found. Verified, with the React Native facts from [Accessibility, React Native 0.88](https://reactnative.dev/docs/accessibility).

1. **Written by hand in native components** (rn-primitives): `role`, `aria-*` and `accessibilityState`, often both.
2. **Returned by a native behavior hook** (react-native-aria): `role` and `aria-*`, left for React Native to read.
3. **Translated from ARIA in one place** (react-strict-dom's `useNativeProps`; Tamagui's view).

React Native itself now accepts part of ARIA as props: `role`, `aria-label`, `aria-hidden`, `aria-busy`, `aria-checked` (with `"mixed"`), `aria-disabled`, `aria-expanded`, `aria-selected`, the four `aria-value*` props, `aria-labelledby` (Android only), `aria-live` (Android only) and `aria-modal` (iOS only). It documents no `aria-controls`, `aria-activedescendant`, `aria-haspopup`, `aria-describedby`, `aria-pressed`, `aria-orientation`, `aria-invalid` or `aria-required`.

Inferred: state attributes translate; relationship attributes don't. A pattern that depends on a relationship, such as a combobox keeping focus in the input and pointing at the active option with `aria-activedescendant`, has no native target in any project read. react-native-aria and rn-primitives both drop it and move the screen reader's focus instead (`useAccessibilityFocus` in rn-primitives).

## What the evidence says about seam shapes for ui-sdk

Everything in this section is inference from the findings above, set against `contributing/architecture.md` in this repository. For scale: by a grep for DOM globals and element types, 200 of core's 388 non-test source files reference the DOM, including kernel files (`live.ts`, `modality.ts`, `order.ts`, `part.ts`, `events.ts`, `elements.ts`).

### Shared state and api, host-specific slots

- **Closest precedent:** React Stately under React Aria; react-native-aria is its native half built by someone else.
- **For it:** it is the only split with a native implementation in production (gluestack-ui), and it maps onto `definePrimitive` as written: `options`, `state`, `sync`, reasons, controllers and the store are host-free by nature; `slots` (`attrs`, `on`, `press`, `bind`, `live`) are the host's.
- **Against it:** the host half is the larger half. React Aria's behavior hooks are where the work is, and the one native implementation of them is thin. In ui-sdk the `api` is not purely state either: it calls `createPopup`, `elements(context, slot)` and focus helpers, so the line doesn't fall between `api` and `slots`. It falls inside `api`.
- **Lesson:** a host-free layer has to be tested on the native host to stay host-free. React Stately's `typeof document` bug sat in the shared layer until 2026.

### A host interface under the kernel

- **Precedents that hold:** Floating UI's `Platform`; React Aria's `LayoutDelegate`. Both are narrow, typed as rectangles and keys, and sit under an engine that is otherwise pure computation.
- **Precedent that doesn't:** Zag's `Scope`. It is an interface in name, typed as `Document` and `HTMLElement`, so only another DOM can implement it. The maintainers gave reliance on `querySelector` and `getElementById` as the reason React Native isn't possible.
- **The limit case:** react-strict-dom makes the DOM itself the interface, and at 0.0.55 it still lacks the parts a headless library uses most.
- **What this suggests:** an interface works per job, not for the kernel as a whole. ui-sdk already has the right shape in places: `computePlacement` is pure and `position` feeds it, which is Floating UI's split. The same cut is plausible for element order (`elements(slot)` in DOM order, where React Native's element nodes now offer `compareDocumentPosition`), measurement (`getBoundingClientRect` exists on both hosts), focus (`focus()` and `blur()` exist; `document.activeElement` doesn't), right to left and the announcer.
- **Where it stops:** events and attributes. No project abstracts DOM events behind an interface successfully; react-strict-dom's open issue #38 is that attempt. Slots that return HTML attributes and DOM handlers need a native counterpart, not an interface.

### Module swapping

- **It is how every native-reaching project ships two hosts**: `.web.ts` or `.native.ts` files resolved by the bundler (gluestack, rn-primitives, Tamagui), or a `react-native` export condition (`@tamagui/floating`).
- **The granularity decides the outcome:**

| Swapped unit        | Example           | Shared            | Native result                                   |
| ------------------- | ----------------- | ----------------- | ----------------------------------------------- |
| Whole component     | rn-primitives     | Types             | Separate implementation; props diverge per host |
| Whole behavior hook | react-native-aria | State, signatures | Hooks reduced to roles and press                |
| Leaf utility        | Tamagui           | Component source  | Web behavior minus stubbed leaves               |

- **For ui-sdk:** swapping fits the constraint of merging upstream only if the swapped files are few and low in the layer order (platform and the leaf jobs), since every swapped file is a file upstream can change under the fork. Swapping whole components is the rn-primitives outcome, which is a second library with the same names.
- **Risk to carry forward:** Tamagui shows that a stub passes type checks and tests while removing a behavior. If leaves are swapped, the checks have to run on the native host too.

### What others tried and abandoned

| Tried                                                               | By                            | Outcome                                                                                 |
| ------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Spreading DOM behavior props onto React Native Web's views          | react-native-aria, 2021       | Dropped: `View` didn't pass `role` or `tabIndex`, `Pressable` didn't pass key handlers  |
| A first-party native behavior layer over the shared state layer     | React Spectrum                | Never built; pointed to gluestack in 2024; a community scaffold closed unmerged in 2026 |
| A standalone native ARIA hooks library                              | react-native-aria             | Deprecated in 2023, folded into gluestack-ui's own packages                             |
| React Native's `Modal` for overlays                                 | rn-primitives' predecessor    | Dropped for user experience; replaced with a portal and manual positioning              |
| Porting a DOM library by retyping its primitive                     | Community, on Radix, 2023     | Stopped at "800+ errors"                                                                |
| React Native support in a DOM-first machine core                    | Zag                           | "Easily, once the modeling is right" in 2022; closed with no plans in 2026              |
| React Native's accessibility prop names as the universal vocabulary | Tamagui 1                     | Removed in version 2 for `role` and `aria-*`                                            |
| An API based on React Native's, compiled to web                     | Meta, before react-strict-dom | Rejected for web performance and design cost                                            |

### What the decision should take from this

1. **The combination nobody has tried is the one ui-sdk's shape allows:** a shared definition (state, options, reasons, controllers, the pure engines) with a narrow host interface per job underneath, and a second set of slots only where attributes and events differ. React Stately proves the first part, Floating UI the second, and react-native-aria shows what the third looks like when it is done without the first two being wide enough.
2. **Decide the seam by what `api` touches, not by `api` versus `slots`.** The prior art that split cleanly (React Stately) did so because its state layer never held an element. Zag and Headless UI hold elements in their machines and have no path to native.
3. **Treat ARIA as the source vocabulary and translate once.** Three projects converged on that (Tamagui 2, react-strict-dom, React Native's own `aria-*` props). Plan separately for relationship attributes, which don't translate.
4. **Budget for native-only behavior.** The back button, screen reader focus moves and measured positioning were written fresh in every native implementation read. None came from the shared side.
5. **Parity is the unproven part.** Every project that reached native did it by dropping keyboard navigation, focus scope and dismissal layers on native. If ui-sdk keeps them, for hardware keyboards and for the agent and testing layers, there is no prior art to copy and the prototype has to show it.

## Not covered

- Nothing was run. Claims about native behavior come from reading source, not from a simulator.
- Ariakit, Kobalte, Melt and Bits UI were not on the list and were not read.
- Tamagui's `@tamagui/dom` and version 3 plans were noted, not verified.
- The Notion and spreadsheet links in Base UI's issue #2612 were not opened.
- The React Native version in which `aria-*` props and element nodes first shipped was not traced; the pages read are for 0.88.
