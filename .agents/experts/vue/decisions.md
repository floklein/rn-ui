# Vue expert: decisions

What's already decided about `@ui-sdk/vue`, and what's known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: PRs 86 to 92 (2026-10-30, the audit fixes), 158 and 159 (2026-11-01, follow-ups to 89 and 90), and 160 and 161 (2026-11-01, the focus trap fixes), and 175 to 186 (2026-11-02, the pre-launch audit fixes), and 213 (2026-11-03, field control ids on the server), and 214 (2026-11-03, the toast motion fix), and 218 (2026-11-04, the examples and docs review: textarea submitShortcut, token-input custom render, toast swipe from unselectable text, navigation-menu link timing, web shared-element data-slot), and 243 to 249 (2026-11-05, the new components: Label, Segmented Control, Rating, color, Color Picker, image, Image Cropper), and 241 (2026-11-05, date input and time input), and the Nuxt module branch (2026-11-05, `@ui-sdk/vue/nuxt`), and 321 (2026-11-09, `web.css`, the drop-in stylesheet), and 326 (2026-11-09, button attributes before bind), and the Timeline branch (2026-11-10, a timeline of dated events), and the Waterfall branch (2026-11-10, the new component), and the bindRepeat branch (2026-11-11, press-and-hold repeat), and the scroll picker branch (2026-11-11, `bindScrollPicker` and Listbox's `keepInView`), and the button router links branch (2026-11-12, `RouterLink` and `NuxtLink` in Button's `#render` slot), and the ticket 78 branch (2026-11-16, the native Toggle: `focusPart` in Toggle's `focus` and native-only kernel files, no change on the web), and the ticket 122 branch (2026-11-16, Checkbox's group on the native order twin: `checkboxNative` replaces `joinCheckboxGroup` in the native-only entry, no change on the web), and the ticket 81 branch (2026-11-16, Rating's `ratingNative` in the native-only entry, no change on the web).

## Settled

- **`@ui-sdk/vue/nuxt` from the workspace needs `pnpm build` first.** Its list of entries is written by the build, and the source module reads the copy in `dist/nuxt`.
- **`render` is the only way to render your own element**; `#render` slots hand over the part's own content as `children`. No `as`.
- **Vue >=3.5** only.
- **Form component dropped.**
- **Router links use the `custom` form**, with `navigate` bound after the part's props, though `NuxtLink custom` gives up its automatic prefetching. Bound directly, the router's own `onClick` runs before the part's and a disabled part still navigates.
- **CSP nonce**: a page sets it with `<meta property="csp-nonce" nonce="…">`. A tag with no nonce switches injected styles to constructed sheets, and the page declares `@layer ui-sdk;` first. (Chosen for PR 17, 2026-10-28.)
- **Popups flip to the opposite side only**, never to a perpendicular one.
- **`tests/specs/position.spec.ts` runs once per engine**, on `react` in Chromium and `web` elsewhere: the placement math is core's and doesn't depend on the framework.
- **A package `Checkbox` or `Toggle` joins only a package `CheckboxGroup` or `ToggleGroup`**, through the group's own context. A group root built with `createParts` or `usePart` doesn't reach it. This matches Svelte and keeps the group out of a standalone control's bundle.
- **A half-typed date reads `null`.** Writing `null` back leaves its segments, so a controlled value can't empty them; `clear()` does. Same in every framework.

- **`web.css` lets parts inherit the page's font.** `--ui-font-sans` is a token a page opts into on `body`; parts never set `font-family` themselves, except `code` and `kbd`, which use `--ui-font-mono`.
- **`web.css` colors follow the page's `color-scheme` through `light-dark()`.** Builds that rewrite `light-dark()` (Lightning CSS in Next and Vite) read the `--lightningcss-light`/`--lightningcss-dark` defaults `web.css` sets, so they fall back to light unless the build also processes a `color-scheme`.
- **Button-like parts render `type`, `disabled` and `aria-disabled` together until they bind**, and no role, so server HTML is right for a `<button>` and an `<a>`. On an `<a>` or `<span>`, `type` and `disabled` are invalid but inert until then, and a disabled link still navigates before hydration, since only script can stop the click. Before bind they don't write `tabindex`, so a web component's author tabindex survives the first pass (PR 326, 2026-11-09).
- **Timeline's server markup holds the tab stop on the first event**, not the current one, until it hydrates. An earlier item can't know a later item is current, so a claim can't move it there without leaving some lists with no stop; the docs say so.
- **Kitchen sinks destructure props in `setup`.** The props never change there, and every kitchen sink does the same.
- **The Timeline feed example doesn't clear its load timeout on unmount.** Writing a ref after unmount does nothing, and the example stays short.
- The Waterfall kitchen-sink fixture destructures props in `setup`; its props never change.

## Known and open (don't report again, check whether fixed)

- Roots that render hidden inputs beside their element (Listbox, Checkbox, Radio, Rating, Segmented Control items) are fragments, so a component ref's `$el` is a text anchor. Binding `bindScrollPicker` takes a wrapper and `querySelector` until the root exposes its element; exposing `$el` needs a maintainer's sign-off.
- **A trigger connected through `controller` renders without `data-slot` on the server** (`controller-target.ts`), so `web.css` leaves it unstyled until hydration. Seen in `select/controller`, `dialog/payload`, `menu/payload`, `popover/payload`, `tooltip/shared` (PR 321).
- **Command groups render `hidden` in server HTML** (`command/demo`), so the list is empty until hydration (older than PR 321).

- **Wide change types**: Tabs' `onValueChange` passes `string | null`, Checkbox's `boolean | "indeterminate"`.
- **Suspense internals**: the deferral reads `instance.suspense`, which Vue's public types leave out.
- **`bind` runs in a render**: `useConnectedPart` calls it there, so a bind must not call lifecycle hooks, `provide` or `useId`.
- **A trigger that switches instances** keeps its old `PartWatch` subscription until it unmounts.
- **Payload types**: a popup content's payload type is asserted by the user, not tied to the controller's type.
- **A Checkbox in its own Field inside a CheckboxGroup** is unnamed in server markup until hydration.
- **A Field with no FieldLabel or no FieldDescription** points its control's `aria-labelledby` or `aria-describedby` at an id that doesn't exist, in server markup until hydration. Most fields have no description, so the dangling `aria-describedby` is the common one. The server can't know which parts will render, and every adapter's server tests check that a label names and a description describes the control before hydration, wherever it renders.
- **`Intl` text Node and browsers word differently** mismatches on hydration: Korean `formatDateRange` defaults in Chrome (`16일~20일` vs `16일 ~ 20일`), ranges in es, ru, da, el, pl, sk and ca in Safari, and every label in the locales Chrome ships no data for (eu, kk, ka, hy, az, my, km, mn). Vue patches the text but keeps the server's `aria-label`s on `h()` parts. Thin spaces in ranges are fixed in `formatDateRange`.
- **A popup stays shown when its anchor is clipped by a scroll container.** A marker like `data-anchor-hidden` is a public API and waits on discussion.
- **An anchor moved by the Web Animations API** is followed by positioning's 500ms slow check, not on the next frame.
- **A radio group with no focusable checked radio at the end of a trap** lets Tab leave it: the trap counts every radio as a stop, where the browser gives the group one.
- **Tabs with panels before the list** (a bottom tab bar) render the first tab selected and no panel on the server. A panel renders before its tab has props, so it can't tell it's the one shown. It appears once the tabs bind.
- **A native `readonly` also lands on the root element** of Switch, Checkbox (`<button>`), RadioGroup and Listbox (`<div>`), where it means nothing. Harmless to assistive technology; an HTML validator flags it on a button.
- **An author id on a control in a Field** (`NumberInputControl id`, `PasswordInputControl id`) isn't in the server HTML's label `for`, nor in a step button rendered before it: they can't read an id that renders after them. Putting the `id` on the `Field` works. It's right once the field binds.
- **A submit shortcut also submits a read-only Textarea.**
- **Holding Enter submits on every key repeat** with a submit shortcut: it doesn't skip `event.repeat`.
- **`submit-shortcut="enter"` leaves phones no way to add a line**: a soft keyboard has no Shift+Enter, and the textarea sets no `enterkeyhint`.
- **Timeline items have no name or feed position before hydration.** `aria-labelledby`, `aria-describedby`, `aria-posinset` and `aria-setsize` are live attributes written once the parts bind; pointing at a title id on the server would reference ids that may not exist.

## Revisit

Nothing yet.
