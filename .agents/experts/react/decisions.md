# React expert: decisions

What's already decided about `@ui-sdk/react`, and what's known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: PRs 86 to 92 (2026-10-30, the audit fixes), 158 and 159 (2026-11-01, follow-ups to 89 and 90), and 160 and 161 (2026-11-01, the focus trap fixes), and 175 to 186 (2026-11-02, the pre-launch audit fixes), and 213 (2026-11-03, field control ids on the server), and 214 (2026-11-03, the toast motion fix), and 218 (2026-11-04, the examples and docs review: textarea submitShortcut, token-input custom render, toast swipe from unselectable text, navigation-menu link timing, web shared-element data-slot), and 243 to 249 (2026-11-05, the new components: Label, Segmented Control, Rating, color, Color Picker, image, Image Cropper), and 241 (2026-11-05, date input and time input), and 321 (2026-11-09, `web.css`, the drop-in stylesheet), and 326 (2026-11-09, button attributes before bind), and the Timeline branch (2026-11-10, a timeline of dated events), and the Waterfall branch (2026-11-10, the new component), and the bindRepeat branch (2026-11-11, press-and-hold repeat), and the scroll picker branch (2026-11-11, `bindScrollPicker` and Listbox's `keepInView`), and the button router link branch (2026-11-12, a disabled or pending Button rendered as Next.js's `Link`).

## Settled

- **A handle has no `slot` or `present`.** A custom part renders through `usePart` or `renderElement`; the package's own markup uses the internal `slotIn` and `presentIn`.
- **`render` is the only way to render your own element.** No `as`, no `asChild`.
- **No `useSyncExternalStore`.** Parts subscribe in effects plus a layout-effect check before paint, so store updates can join a transition. A part that mounted during a store change can render one value behind until that check.
- **Instances are kept only at commit** (`unwatched`, `keep`, `release` in the kernel). StrictMode's thrown-away initializer and abandoned transitions never register.
- **`<Activity>` keeps hidden state.** With an element in the page, destroyed once it leaves; without one, once collected (`FinalizationRegistry`).
- **`React.useLayoutEffect` on the server**, no isomorphic shim: React 19 doesn't warn.
- **React 19 only** (`react >=19`). No `forwardRef`, refs are props.
- **Form component dropped.** Don't review or suggest Form; users bring their own form library.
- **CSP nonce**: a page sets it with `<meta property="csp-nonce" nonce="…">`. A tag with no nonce switches injected styles to constructed sheets, and the page declares `@layer ui-sdk;` first. (Chosen for PR 17, 2026-10-28.)
- **Popups flip to the opposite side only**, never to a perpendicular one.
- **`tests/specs/position.spec.ts` runs once per engine**, on `react` in Chromium and `web` elsewhere: the placement math is core's and doesn't depend on the framework.
- **A package `Checkbox` or `Toggle` joins only a package `CheckboxGroup` or `ToggleGroup`**, through the group's own context. A group root built with `createParts` or `usePart` doesn't reach it. This matches Svelte and keeps the group out of a standalone control's bundle.
- **A half-typed date reads `null`.** Writing `null` back leaves its segments, so a controlled value can't empty them; `clear()` does. Same in every framework.

- **`web.css` lets parts inherit the page's font.** `--ui-font-sans` is a token a page opts into on `body`; parts never set `font-family` themselves, except `code` and `kbd`, which use `--ui-font-mono`.
- **`web.css` colors follow the page's `color-scheme` through `light-dark()`.** Builds that rewrite `light-dark()` (Lightning CSS in Next and Vite) read the `--lightningcss-light`/`--lightningcss-dark` defaults `web.css` sets, so they fall back to light unless the build also processes a `color-scheme`.
- **Button-like parts render `type`, `disabled` and `aria-disabled` together until they bind**, and no role, so server HTML is right for a `<button>` and an `<a>`. On an `<a>` or `<span>`, `type` and `disabled` are invalid but inert until then, and a disabled link still navigates before hydration, since only script can stop the click. Before bind they don't write `tabindex`, so a web component's author tabindex survives the first pass (PR 326, 2026-11-09).
- **Timeline's server markup holds the tab stop on the first event**, not the current one, until it hydrates. An earlier item can't know a later item is current, so a claim can't move it there without leaving some lists with no stop; the docs say so.
- **The Timeline feed example doesn't clear its load timeout on unmount.** React 19 ignores the late state update, and the example stays short.
- **`web.css` with Tailwind v4 is imported as `@import "@ui-sdk/core/web.css" layer(components);` after `@import "tailwindcss"`.** Injected behavior styles go first in `<head>`, so `ui-sdk` is always the first layer declared and loses to Tailwind's preflight. A layer order statement can't come before them, and a nested `components.ui-sdk` layer sits above `base` and below `utilities`. Checked in Vite and Nuxt with a dialog mounted.

## Known and open (don't report again, check whether fixed)

- `bindScrollPicker` rebinds on every render when a ref callback isn't stable, which ends a drag in progress. The docs bind in `useLayoutEffect` with `useEffectEvent`; a ref callback needs `useCallback`.
- **`InputClear`, and Command items and group labels, are missing from server HTML** and appear only after mount (seen in PR 321's review, older than it).
- **The `hold-repeat` example drops focus to `<body>` at a bound** (seen in the bindRepeat review, older than it): it sets native `disabled` on the focused button. `aria-disabled` with `bindRepeat`'s `disabled` would keep focus.

- **Hidden popup's later siblings**: the hidden-tree bridge tracks the nodes a portal appends when it mounts, so an element a popup's `render` adds beside it later, or a text or SVG node, stays shown in a hidden `<Activity>`.
- **Api reads in custom parts**: `handle.state` shows the preview, `handle.api` reads committed state.
- **Split `use-primitive.tsx`** (~920 lines) into previews and lifecycle modules.
- **Activity without elements**: a removed instance with no element waits for collection to free its behaviors' listeners.
- **React Compiler bailouts**: `usePrimitive` (`this` in the handle), `usePartState` (memo dependencies), generated parts (hooks in loops), `CalendarGrid`, `SelectValue`.
- **Wide change types**: Tabs' `onValueChange` passes `string | null`, Checkbox's `boolean | "indeterminate"`.
- **Controller on two instances**: no dev warning since controllers attach at commit.
- **Author id in a later Suspense boundary**: an id inside a boundary that hydrates after the parts pointing at it gives a hydration attribute warning. Documented; not fixable while ids are taken at render.
- **Payload types**: a popup content's payload type is asserted by the user, not tied to the controller's type.
- **A Checkbox in its own Field inside a CheckboxGroup** is unnamed in server markup until hydration, as Radio was before PR 13.
- **A popup stays shown when its anchor is clipped by a scroll container.** A marker like `data-anchor-hidden` is a public API and waits on discussion.
- **An anchor moved by the Web Animations API** is followed by positioning's 500ms slow check, not on the next frame.
- **An author value equal to the part's own counts as the part's** on a `direct` attribute: a `SelectTrigger` given the select's own label id loses it when `SelectLabel` unmounts (PR 86). Harmless, since the id dangles then anyway.
- **Tabs with panels before the list** (a bottom tab bar) render the first tab selected and no panel on the server. A panel renders before its tab has props, so it can't tell it's the one shown. It appears once the tabs bind.
- **A controller method called before attach does nothing.** StrictMode's replayed layout effect makes an early call work in development and not in production. A dev-only warning on calls made while unattached on the client is the likely fix.
- **Controller read types** say `boolean` where a read before attach returns `undefined`. Widening them to `T | undefined` is a public API change and waits on discussion.
- **An author id on a control in a Field** (`NumberInputControl id`, `PasswordInputControl id`) isn't in the server HTML's label `for`, nor in a step button rendered before it: they can't read an id that renders after them. Putting the `id` on the `Field` works. It's right once the field binds.
- **A submit shortcut also submits a read-only Textarea.**
- **Holding Enter submits on every key repeat** with a submit shortcut: it doesn't skip `event.repeat`.
- **`submitShortcut="enter"` leaves phones no way to add a line**: a soft keyboard has no Shift+Enter, and the textarea sets no `enterkeyhint`.
- **Date input `SegmentProps`** types its ref for an input or a span, though `render` only takes an input.
- **A controlled Image Cropper keeps its crop when `src` changes.** With `crop` passed, a new image shows the old image's crop until the owner sets `crop` to `undefined`. Same in every framework; undecided whether a new `src` should start a fresh crop.
- **Pure-utility entries are client modules.** `color.ts`, like `date.ts`, builds with `"use client"`, so a Server Component can't call `formatColor` or `parseColor`. Adding them to the build's `--server` list would fix it.
- **Indicator remeasure after cleanup.** `foundation/selection/indicator.ts` queues a microtask `remeasure` that can run after cleanup and observe again with the disconnected `ResizeObserver`, as Tabs did before it was extracted.
- **Timeline items have no name or feed position before hydration.** `aria-labelledby`, `aria-describedby`, `aria-posinset` and `aria-setsize` are live attributes written once the parts bind; pointing at a title id on the server would reference ids that may not exist.

## Revisit

Nothing yet.
