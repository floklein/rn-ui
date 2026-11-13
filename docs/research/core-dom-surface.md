# What core asks of the DOM

Research for [issue #3](https://github.com/floklein/rn-ui/issues/3), part of the React Native effort mapped in [issue #2](https://github.com/floklein/rn-ui/issues/2). It feeds the decision "Where the host seam sits in core".

- **Audited:** `packages/core/src` at commit `d101ca04`, and `packages/react/src` where it shows what an adapter does for core.
- **Primary source:** the code itself. Every claim cites a file and line. Paths are relative to the repo root unless they start with `foundation/`, `components/` or `page/`, which are under `packages/core/src/`.
- **Verified** means I read the cited lines, or the number came out of the counting script described in [the appendix](#appendix-how-the-counts-were-made). **Inferred** is marked as such; all of it is in [What this says about the seam](#what-this-says-about-the-seam) and in the notes that say "inference".
- Nothing was run except the counting script: no tests, no build.

## The answer in short

1. **A slot declares most of what it needs as data, and that part is already host-neutral in shape.** `attrs`, `state`, `present`, `role`, `focus`, `keys` and `live` are pure functions of state. None of the 254 inline `attrs` functions touches the DOM. The adapter, not core, turns the result into framework props.
2. **Everything imperative is a direct DOM call on an `HTMLElement`.** The kernel hands a slot its element through `bind`, `asleep`, `connect` and the `el` of `on` and `press` handlers, or the api looks it up with `context.element()` and `elements()`. From there the code calls the DOM directly. There is no wrapper between a behavior and the element.
3. **The surface is large and mostly outside the kernel.** Core without `testing/` has 3,547 DOM call sites in 374 files and 109,831 lines: 106 in the kernel, 307 in `platform`, 1,498 in the other 19 foundation folders, 1,584 in components and 51 in `page`.
4. **The kernel's own DOM use is small and almost all in five files.** In production it's 91 call sites: the attribute writer (`live.ts`, 27), input modality (`modality.ts`, 25), document order (`order.ts`, 12), binding (`part.ts`, 10) and the listener helper (`events.ts`, 9). Three more files test `typeof document` to tell a client from a server: `keep.ts`, `watchers.ts` and `modality.ts`.
5. **Only about 6% of the call sites are written inside a slot definition** (204 of 3,547, and 197 of the 1,584 in components). The hooks are where an element enters; the calls live in `<name>-api.ts` files and foundation helpers that the hooks delegate to.
6. **Some capabilities have one owner, others are scattered.** One owner: the top layer (12 call sites, 5 files), inertness and the scroll lock (`popups/modal.ts`, called only from `popups/popup.ts`), dismissal (`platform/layers.ts`), positioning (`platform/position.ts`), presence (`motion/presence.ts`), form participation (`forms/form.ts`), storage, direction (`isRTL`). Scattered: focus calls (294 sites, 86 files), tree walks and queries (774 sites, 150 files), measurement (314 sites, 65 files), observers (44 sites, 29 files), and reads of DOM event objects.
7. **A third of the files are host-free, but they're the small ones.** 125 of 374 files (17,049 lines, 16%) have no DOM call and no DOM type. Whole folders qualify: `color`, `date`, `gauge`, 13 of 15 files in `motion`, 6 of 7 in `number`. In the kernel, 19 of 30 files make no DOM call, among them the store, `derive`, `roles`, `attrs`, `action`, `selects`, `controller` and `change`.
8. **A simple primitive needs little that is DOM-specific; a popup needs the whole platform layer.** Switch's own file has no DOM call. What it needs from the host is: render attributes, deliver a press and two key events, focus an element, and form participation, which is the only part with no native counterpart. Dialog needs the top layer, inertness, a scroll lock, a focus trap built on tab order queries, document-level press and key listeners, CSS-driven presence, and on-screen keyboard tracking.

## The kernel hooks: how a slot reaches an element

A slot is defined with the fields in `SlotFields` (`foundation/kernel/primitive-types.ts:138-208`). `foundation/kernel/part.ts` is the only code that runs them. This table is the whole contract between a slot and its host.

| Hook | Declared | What core does with it | What it assumes about the host |
| --- | --- | --- | --- |
| `attrs(state, ctx)` | `primitive-types.ts:150` | `attrs(part)` returns the map plus `data-slot` and `role` (`part.ts:153-181`). The adapter renders it | The map is "HTML attributes as the DOM sees them. Strings only" (`primitive-types.ts:21-26`). Values include `tabindex`, `hidden`, `disabled`, `type`, `style` as a CSS string, `aria-*`, `data-*` |
| `state`, `present`, `role`, `focus`, `keys`, `selects` | `primitive-types.ts:144-170`, `260-303` | Pure reads (`part.ts:219-229`, `254-255`) | Nothing |
| `live(read)` | `kernel/live.ts:19-46` | On bind and on every change it writes the attributes itself with `applyAttrs` (`live.ts:33-37`) | `setAttribute`, `removeAttribute`, `getAttribute`, `el.style.setProperty`, `el.value` (`live.ts:173-281`) |
| `direct(names)` | `kernel/live.ts:60-111` | Keeps named attributes current on an element a framework rendered (`part.ts:460-462`) | `getAttribute`, `setAttribute`, `removeAttribute` (`live.ts:74-105`) |
| `on: { type: handler }` | `primitive-types.ts:180-185` | `handlers(part)` wraps each handler: skips it when `event.defaultPrevented` or while composing, wakes a sleeping instance (`part.ts:329-354`). The adapter attaches the ones it can, core attaches the rest with `on(el, type, …)` (`part.ts:447-454`) | Keys are `HTMLElementEventMap` (`primitive-types.ts:97`). Handlers get the DOM event and `{ el }` |
| `press(ctx, event?)` | `primitive-types.ts:173-175` | Becomes the `click` handler unless `on.click` exists (`part.ts:345-352`). `press(part)` runs it with no event (`part.ts:376-384`) | A `click`. The event is optional by signature |
| `bind(el, part)` | `primitive-types.ts:191` | Runs once the element is given to `bind()` or `ref()`, after the handlers, `live` and `direct` attach (`part.ts:416-496`, `538-556`) | Documented "Client only, web only" (`primitive-types.ts:187`). Receives a raw `HTMLElement` |
| `asleep(el, part)` | `primitive-types.ts:198-201` | Like `bind`, but runs while the instance sleeps (`part.ts:464-467`) | Raw `HTMLElement` |
| `connect(el)` | `primitive-types.ts:207` | Adapters that keep absent parts call it (`part.ts:563-564`) | Raw `HTMLElement` |
| `context.element(slot, key?)` | `primitive-types.ts:467` | Returns `part.el` when `el.isConnected` (`kernel/primitive.ts:249-260`) | `isConnected` |
| `elements(context, slot)` | `kernel/elements.ts:9-22` | Bound, connected elements sorted into document order (`kernel/order.ts:22-46`) | `isConnected`, `compareDocumentPosition`, `createTreeWalker`, `contains`, `parentNode` |
| `part.el`, `ctx.el` | `primitive-types.ts:102`, `135` | Set by `bind()` (`part.ts:440`), cleared on unbind (`part.ts:491`) | Typed `HTMLElement \| undefined` |

Besides running the hooks, `bind()` itself does four DOM things: it writes a one-rule stylesheet into the element's document through `enforceHidden(el.ownerDocument)` when the slot can render `hidden` (`part.ts:443-445`, `foundation/platform/style.ts:89-129`, `165-171`), adds listeners (`part.ts:452`), observes the element's `id` with a `MutationObserver` when one exists (`part.ts:482-484`, `647-654`), and reads the id with `el.localName`, `el.getAttribute("id")` and `el.id` (`part.ts:686-687`).

### How many slots use each hook

Counted over every `slot(...)` call in core without `testing/` (verified, script):

- 58 `definePrimitive(` call sites and 335 `slot(...)` call sites.
- 288 of the 335 pass an inline object literal (277 in components, 11 in foundation). The other 47 pass the result of one of 12 shared part factories in `foundation/lists`, like `optionGroupPart` and `hiddenInputPart` (`foundation/lists/listbox-parts.ts:236-500`, `foundation/lists/item-icon.ts:137`, `foundation/lists/listbox-search.ts:88`). The table covers the 288.

| Field | Slots declaring it (of 288) | DOM call sites written inside it |
| --- | --- | --- |
| `attrs` | 254 | 0 (12 regex hits, all false: `roving.tabIndex(…)`, `listbox.matches(…)` and the attribute name `contenteditable`) |
| `state` | 235 | 0 |
| `bind` | 170 | 141 |
| `role` | 98 | 0 |
| `on` | 80 | 33 |
| `press` | 66 | 29 |
| `selects` | 51 | 0 |
| `live` | 38 | 0 |
| `present` | 38 | 0 |
| `connect` | 8 | 0 |
| `direct` | 5 | 0 |
| `asleep` | 2 | 1 |

The event types the inline `on` maps name, by number of slots: `keydown` 51, `focusout` 11, `pointerdown` 11, `keyup` 10, `pointerenter` 9, `focusin` 8, `mousedown` 8, `pointermove` 8, `pointerleave` 8, `input` 7, `change` 3, `click` 3, `paste` 1, `wheel` 1, `dblclick` 1. Eight more slots pass `on` as an expression, like `on: trigger.on` (`components/dialog/dialog-parts.ts:67`).

So the declarative event surface of slots is 15 event types, and more than half of the slots with `on` only listen for `keydown`.

## What an adapter does for core

Read from `packages/react/src/use-primitive.tsx` and `packages/core/src/renderer.ts` (verified).

- **It makes and keeps the instance.** React creates the instance inside `unwatched` and calls `keep(instance)` from a layout effect, `release` and `destroy` on the way out (`use-primitive.tsx:184`, `197`, `247-250`). Outside `unwatched`, core keeps an instance as it's made, but only when `typeof document !== "undefined"` (`foundation/kernel/keep.ts:65`).
- **It renders `attrs()`.** `toReactProps` renames 3 attributes and camel-cases 11 more, turns 7 boolean attributes into `true`, and parses the `style` string into an object (`use-primitive.tsx:52-68`, `76-99`, `130-144`).
- **It attaches the handlers it can.** React maps 13 DOM event types to props (`use-primitive.tsx:103-115`) and passes `event.nativeEvent` to core's handler (`use-primitive.tsx:553-565`). It tells core which types it attached through `Host` (`use-primitive.tsx:125-128`, type at `part.ts:24-34`), and core adds a DOM listener for every other type (`part.ts:447-454`). Of the 15 types slots use, React leaves `pointerenter`, `pointerleave`, `change`, `paste` and `wheel` to core. Vue and Solid pass `attaches: "all"` (`packages/vue/src/use-primitive.ts:347`, `packages/solid/src/use-primitive.tsx:531`).
- **It hands core the element.** `ref(part, host)` returns a callback ref (`part.ts:538-556`), which React wraps so a ref swap doesn't unbind (`use-primitive.tsx:520-540`). That call is what runs `live`, `direct`, `asleep` and `bind`.
- **It forwards an author's `id`** with `takeOwnId` (`use-primitive.tsx:551`, `part.ts:696-705`).
- **It renders what only a framework can:** the hidden native `<input>` of a form control (`packages/react/src/switch.tsx:15-18`, `36`) and the portal target of a popup, from core's `portalTarget` (`packages/react/src/popup.tsx:52`, `80`).

`@ui-sdk/core/renderer` is the list of what adapters may import (`packages/core/src/renderer.ts:1-128`). Its kernel part is `attrs`, `bind`, `commit`, `conditional`, `connect`, `directNames`, `followed`, `handlers`, `partState`, `present`, `press`, `ref`, `selectedKeys`, `subscribe`, `takeOwnId`, `touched`, `yieldToAuthor` (`renderer.ts:76-95`), `keep`, `release`, `unwatched` (`renderer.ts:96`), and `applyAttrs`, `markAuthored`, `releaseAttrs` and `on` (`renderer.ts:69-74`).

## Counts per layer

DOM call sites by capability class, on comment-free code (verified, script). "Host-free" is a file with no DOM call site and no DOM type name. "Types" counts references to DOM type names like `HTMLElement` and `KeyboardEvent`.

Column key: **attr** attributes, ARIA and inline style · **evt** events · **focus** · **meas** measurement and positioning · **top** top layer and inertness · **obs** observers · **scroll** · **forms** · **text** text input · **anim** animation · **stor** storage · **glob** globals · **tree** tree walks and queries · **ptr** pointer capture and drag data.

| Layer | Files | Lines | Host-free files (lines) | Types | Sites | attr | evt | focus | meas | top | obs | scroll | forms | text | anim | stor | glob | tree | ptr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kernel` | 30 | 6,963 | 13 (2,109) | 262 | 106 | 28 | 16 | 2 | 0 | 1 | 2 | 0 | 3 | 11 | 0 | 0 | 17 | 26 | 0 |
| `platform` | 15 | 3,232 | 1 (20) | 160 | 307 | 41 | 36 | 12 | 79 | 8 | 3 | 4 | 1 | 4 | 13 | 0 | 48 | 58 | 0 |
| `popups` | 26 | 7,555 | 5 (355) | 284 | 394 | 44 | 47 | 29 | 52 | 26 | 2 | 13 | 6 | 5 | 17 | 0 | 61 | 91 | 1 |
| `lists` | 22 | 6,780 | 6 (966) | 145 | 304 | 29 | 47 | 14 | 49 | 1 | 1 | 24 | 9 | 5 | 3 | 0 | 20 | 101 | 1 |
| `forms` | 9 | 2,076 | 2 (195) | 111 | 150 | 6 | 32 | 8 | 0 | 0 | 1 | 0 | 52 | 3 | 0 | 0 | 12 | 36 | 0 |
| `drag-and-drop` | 8 | 2,683 | 1 (14) | 66 | 143 | 20 | 43 | 1 | 19 | 3 | 0 | 9 | 0 | 0 | 7 | 0 | 24 | 15 | 2 |
| `text` | 12 | 1,430 | 3 (148) | 49 | 130 | 14 | 16 | 3 | 10 | 0 | 0 | 2 | 6 | 28 | 0 | 0 | 20 | 31 | 0 |
| `focus` | 10 | 1,595 | 2 (221) | 58 | 108 | 4 | 11 | 22 | 4 | 3 | 1 | 0 | 4 | 7 | 0 | 0 | 21 | 31 | 0 |
| `direct-manipulation` | 9 | 2,963 | 1 (13) | 81 | 82 | 9 | 42 | 5 | 7 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 9 | 8 | 0 |
| `canvas` | 2 | 858 | 0 | 26 | 51 | 1 | 18 | 0 | 7 | 0 | 0 | 10 | 0 | 0 | 4 | 0 | 5 | 5 | 1 |
| `motion` | 15 | 1,891 | 13 (1,471) | 13 | 42 | 16 | 2 | 2 | 6 | 2 | 1 | 0 | 0 | 0 | 8 | 0 | 4 | 1 | 0 |
| `storage` | 2 | 409 | 1 (13) | 4 | 27 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 13 | 1 | 0 |
| `shortcuts` | 5 | 524 | 2 (69) | 13 | 19 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 1 | 11 | 0 |
| `disclosure` | 2 | 100 | 1 (15) | 4 | 16 | 5 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 4 | 0 |
| `selection` | 6 | 1,102 | 2 (92) | 21 | 15 | 0 | 2 | 1 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 7 | 0 |
| `preferences` | 4 | 902 | 1 (21) | 14 | 12 | 1 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 1 | 0 |
| `number` | 7 | 810 | 6 (728) | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 |
| `image` | 3 | 264 | 2 (19) | 5 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |
| `color` | 9 | 990 | 9 (990) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `date` | 6 | 982 | 6 (982) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `gauge` | 2 | 216 | 2 (216) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| components | 159 | 61,765 | 42 (8,129) | 1,020 | 1,584 | 151 | 331 | 193 | 78 | 25 | 32 | 22 | 120 | 113 | 26 | 2 | 146 | 317 | 28 |
| `page` | 9 | 3,211 | 3 (135) | 26 | 51 | 11 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 2 | 0 | 6 | 29 | 0 |
| entries (`index.ts`, `renderer.ts`) | 2 | 530 | 1 (128) | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| **Core without `testing/`** | **374** | **109,831** | **125 (17,049)** | **2,362** | **3,547** | **381** | **657** | **294** | **314** | **71** | **44** | **84** | **203** | **184** | **80** | **10** | **418** | **774** | **33** |
| `testing/` and `testing.ts` | 14 | 3,697 | 2 (124) | 132 | 301 | 65 | 23 | 50 | 7 | 4 | 0 | 0 | 19 | 12 | 1 | 2 | 6 | 112 | 0 |

The rows from `popups` to `gauge` are the 19 job folders: 1,498 sites together. The kernel row includes `dev.ts` (15 sites), which production builds replace with `dev-stub.ts` through the `#dev` import (`packages/core/package.json`, `imports`).

Summed by tier:

| Tier | Files | Lines | Sites | Share of sites |
| --- | --- | --- | --- | --- |
| Kernel | 30 | 6,963 | 106 | 3% |
| Platform | 15 | 3,232 | 307 | 9% |
| Jobs (19 folders) | 159 | 34,130 | 1,498 | 42% |
| Components (51 folders) | 159 | 61,765 | 1,584 | 45% |
| Page | 9 | 3,211 | 51 | 1% |

## Capability classes: what, where, and whether one module owns it

Each class lists its call sites (core without `testing/`), split kernel / platform / jobs / components / page, then where they concentrate (verified, script and reads).

### Attributes, ARIA and inline style: 381 (28 / 41 / 150 / 151 / 11)

- **Declarative, one owner.** Every slot's attributes come out of `attrs()` (`part.ts:153`) for the adapter, and out of `applyAttrs` for `live` and `direct` (`live.ts:127`, `173-281`). Outside `live.ts`, `applyAttrs` is called twice, by Toast and Trigger Menu, for elements that aren't parts.
- **Imperative, scattered.** 230 `get/set/has/remove/toggleAttribute` calls and 143 inline style writes in 85 files. They are writes a behavior makes on its own: presence writes `data-open`, `data-closed`, `data-starting-style` and `data-ending-style` (`foundation/motion/presence.ts:23-46`, `142-165`), positioning writes `data-side` and CSS variables, Collapsible writes `--collapsible-panel-height` (`components/collapsible/collapsible.ts:308-309`), the popup sets `popover="manual"` and removes `hidden` (`foundation/popups/popup.ts:903-915`).
- CSS variables are how core passes measurements to styles: `el.style.setProperty` appears 60 times in 25 files, 37 of them in components.
- Core also writes stylesheets into the page. `writeStyle(doc, id, css)` adds a `<style>` element or an adopted sheet (`foundation/platform/style.ts:89-129`), and 7 files call it, for the `[hidden]` rule, the popover reset, the scroll lock and others.

### Events: 657 (16 / 36 / 273 / 331 / 1)

- **Slot events have one owner:** `handlers()` and `bind()` in `part.ts`.
- **Everything else is attached by hand.** 149 calls to the `on()` helper (`foundation/kernel/events.ts:4-13`) and 107 raw `addEventListener` calls. 57 of the `on()` calls and 38 of the raw ones target a document or window rather than a part's element: outside presses, Escape and blur (`foundation/platform/layers.ts:267-390`), drags (`foundation/drag-and-drop/pointer.ts`), form resets (`foundation/forms/form.ts:276`), input modality (`foundation/kernel/modality.ts:74-85`).
- **Handlers read the DOM event.** 264 `preventDefault` or `stopPropagation` calls, 166 reads of `target`, `currentTarget` or `relatedTarget`, and `event.key`, `event.repeat`, `clientX`, `pointerType` throughout. `preventDefault` carries meaning in core: an author's handler that calls it skips core's (`part.ts:338`, `347`).
- Core also sends events: 7 `dispatchEvent` calls, 10 `new Event(…)` and 20 `el.click()` calls. A form control announces a change with native `input` and `change` events (`foundation/forms/form.ts:211-230`), and keyboard activation of a link calls `el.click()` (`foundation/platform/button.ts:67-73`).

### Focus: 294 (2 / 12 / 87 / 193 / 0)

- **Scattered, and the largest class by spread in components.** 126 `.focus(` calls on elements in 64 files, 99 reads of `activeElement`, 24 uses of `tabIndex`. A further 38 `.focus(` calls forward to an api or roving-focus method.
- The shared blocks are `foundation/focus/roving-focus.ts` (`el.focus()` then a check of `ownerDocument.activeElement`, `232-233`), `foundation/focus/tabbable.ts` (tab order from selector queries, `18-123`), `foundation/popups/popup.ts` (initial focus, the return chain, the Tab trap, `738-885`, `1271-1420`) and `restoreFocus`/`moveFocus` in `foundation/kernel/modality.ts:188-222`. Components still call `el.focus()` themselves: 193 focus-class sites.
- `.activeElement` is read as a property 75 times in 40 files; the shadow-aware `activeElement()` helper (`foundation/platform/platform.ts:27-33`) is called 16 times.

### Measurement and positioning: 314 (0 / 79 / 157 / 78 / 0)

- **Positioning has one owner:** `position()` and the pure `computePlacement` in `foundation/platform/position.ts:256`, `400`. Popups get it as an option and call it from `attach` (`foundation/popups/popup.ts:920-932`, `foundation/popups/popup-features.ts:12-16`, `foundation/popups/popup-slots.ts:180-195`); Navigation Menu and Trigger Menu call it directly.
- **Measurement is scattered:** 72 `getBoundingClientRect`/`getClientRects` calls in 40 files, 132 `offset*`/`client*` reads, 35 `scrollWidth`/`scrollHeight`, 44 `getComputedStyle`, 13 `innerWidth`/`innerHeight`, 12 `visualViewport`. All of them are synchronous reads; several depend on that, like the forced layout in `foundation/motion/panel.ts:174` and the early reads a dialog makes before it renders (`components/dialog/dialog-api.ts:222-230`).
- The kernel measures nothing.

### The top layer and inertness: 71 (1 / 8 / 36 / 25 / 1)

- **One owner each.** `showPopover`/`hidePopover` appear 12 times in 5 files: `foundation/popups/popup.ts` (`917`, `1225`, `1244`, `1255`, `1459-1460`), `foundation/platform/layers.ts:159-160`, `foundation/platform/bind-layer.ts`, `foundation/drag-and-drop/drag-preview.ts` and `components/toast/toast-api.ts`.
- `inert` is written in 4 files: `foundation/popups/modal.ts:297`, `313` (`applyInert`, under `inertOutside` at `326`), `foundation/motion/presence.ts:159`, `165`, `drag-preview.ts` and `direct-manipulation/swipe-actions.ts`. `inertOutside` and `lockScroll` are called only from `foundation/popups/popup.ts:1072-1073`.
- `CloseWatcher` is used in one place, for Android's back gesture (`foundation/popups/popup.ts:471-493`).
- The count is slightly high: `"popover"` also matches the `presentation` literal (`foundation/popups/create-popup.ts:78`, `561`) and `.inert` a `Map` of that name (`foundation/popups/modal.ts:295-316`).

### Observers: 44 (2 / 3 / 7 / 32 / 0)

- **Scattered.** 29 `MutationObserver` constructions in 22 files, 13 `ResizeObserver` in 11 and 2 `IntersectionObserver`: 44 in 29 files, 32 of them in components.
- The kernel has two `MutationObserver`s: one follows a bound element's `id` (`part.ts:651-652`), one notices moved items in `createOrder` (`foundation/kernel/order.ts:70-79`). Both are skipped when `MutationObserver` is undefined (`part.ts:482`, `order.ts:94`).

### Scrolling: 84 (0 / 4 / 58 / 22 / 0)

- 66 reads or writes of `scrollTop`/`scrollLeft`, 14 `scrollTo`/`scrollBy`, 2 `scrollIntoView`. Concentrated in `foundation/canvas/viewport.ts`, `foundation/drag-and-drop/auto-scroll.ts`, `foundation/lists` (`stick-to-bottom.ts`, `scroll-picker.ts`, `virtualizer.ts`), `foundation/popups/sheet-scroll-snap.ts` and Scroll Area. The page scroll lock is `lockScroll` in `foundation/popups/modal.ts:29`.

### Forms: 203 (3 / 1 / 78 / 120 / 1)

- **One owner:** `foundation/forms/form.ts` (584 lines, 93 call sites), imported by 48 files, 42 of them in components. It covers the hidden native input (`bindHiddenInput`, `363-416`; `bindValueInput`, `422-448`), `ElementInternals` for custom elements (`bindInternals`, `453-460`, and `form-internals.ts`), native validity (`setComponentValidity`, `139-161`; `valueMissingMessage`, `91-107`), implicit submission (`submitImplicitly`, `181-205`), `input` and `change` events (`dispatchChange`, `211-230`), fieldset disabling (`watchFieldsets`, `296-341`) and labels (`labelsOf`, `494-511`).
- 158 of the 203 are references to form control classes like `HTMLInputElement`, as casts, annotations or `instanceof` checks.

### Text input: 184 (11 / 4 / 55 / 113 / 1)

- Selection ranges on inputs (44), composition (54), `beforeinput` and `inputType` (36), `contenteditable` (27), `getSelection`/`Range` (12). Concentrated in Token Input, OTP Input, Password Input, Date Input, Number Input, Autocomplete and `foundation/text/caret.ts`.
- The kernel's share is composition: every key handler skips events an input method owns (`part.ts:338`, `729-734`, `foundation/kernel/events.ts:27-38`).

### Animation: 80 (0 / 13 / 39 / 26 / 2)

- 62 `requestAnimationFrame`/`cancelAnimationFrame` calls, 4 `getAnimations`, 8 `.animate(`.
- **Presence has one owner:** `animateIn` and `animateOut` in `foundation/motion/presence.ts:16`, `155`, called from 21 places in 9 files. It doesn't animate. It sets `data-starting-style` or `data-ending-style`, lets CSS run, and learns when it ends from `el.getAnimations()` and computed durations (`presence.ts:25`, `61-66`, `108-130`).
- The gesture physics (`machine.ts`, `spring.ts`, `velocity.ts`, `rubber-band.ts`, `snap-points.ts`) has no DOM call.

### Storage: 10 (0 / 0 / 8 / 2 / 0)

- **One owner:** `foundation/storage/storage.ts` (`localStorage`, `sessionStorage`, `document.cookie`), plus `components/resizable/resizable-storage.ts`.

### Globals: 418 (17 / 48 / 201 / 146 / 6)

- 171 `ownerDocument`, 92 `document`, 57 `window`, 47 `defaultView`, 11 `navigator`, 7 `CSS.*`, 4 `matchMedia`.
- 29 `typeof document`/`typeof window`/`typeof navigator` guards. They were written for the server, and three of them are in the kernel: whether an instance is kept as it's made (`keep.ts:65`), whether watchers wait for it (`watchers.ts:77`), and whether input tracking installs (`modality.ts:70`). `isBrowser` (`foundation/platform/env.ts:1-2`) is the same test, named 41 times in 13 files.
- Direction is one function: `isRTL(el)` reads `getComputedStyle(el).direction` (`foundation/platform/env.ts:17-19`) and is called 49 times from 32 files. Two other places read the computed direction themselves (`foundation/canvas/viewport.ts`, `foundation/popups/sheet.ts`).

### Tree walks and queries: 774 (26 / 58 / 344 / 317 / 29)

- The largest class, and scattered across 150 files: 129 parent, child and sibling reads, 124 `contains`, 93 `isConnected`, 59 `matches`, 41 `closest`, 21 `querySelector`/`getElementById`, 144 `localName`/`tagName`/`instanceof`, 65 node insertions and removals, 26 `createElement`.
- Much of it asks "is this node inside that one" (`contains`, `closest`) or "what kind of element did the author render" (`el.tagName === "BUTTON"`, `el.matches("a[href]")`, `foundation/platform/button.ts:10-18`). The second kind exists because `render` lets any part be any element.
- The kernel's share is the element registry: `isConnected` in `element()` and `elements()`, and document order in `order.ts`.

### Pointer capture and drag data: 33 (0 / 0 / 5 / 28 / 0)

- 7 pointer capture calls and 26 uses of `dataTransfer`, almost all in File Input and Token Input. Pointer tracking itself is counted under events, in `foundation/drag-and-drop/pointer.ts`.

## Through the hooks, or around them

An element reaches behavior code in three ways (verified, script; core without `testing/` and the entries).

| How the code gets an element | Kernel | Platform | Jobs | Components | Page | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Handed by the kernel: inline slots declaring `bind` | | | 9 | 161 | | 170 slots |
| Looked up from the kernel's registry: `context.element(slot)` | 2 | 0 | 22 | 145 | 0 | 169 |
| … `elements(context, slot)` | 0 | 0 | 7 | 28 | 0 | 35 |
| … `.el` reads (`part.el`, `ctx.el`, entries of `elements()`, a layer's `el`) | 24 | 4 | 70 | 76 | 34 | 208 |
| Found in the DOM: `event.target`, `currentTarget`, `relatedTarget` | 3 | 9 | 64 | 90 | 0 | 166 |
| … `activeElement` | 0 | 11 | 43 | 45 | 0 | 99 |
| … `ownerDocument` | 2 | 13 | 86 | 69 | 1 | 171 |
| … `document` global | 7 | 11 | 44 | 28 | 2 | 92 |
| … `window` global | 4 | 6 | 24 | 22 | 1 | 57 |
| … `closest(` | 1 | 0 | 17 | 19 | 4 | 41 |
| … `document.body`, `documentElement` | 0 | 10 | 26 | 6 | 0 | 42 |
| … `querySelector(All)`, `getElementById` | 0 | 2 | 9 | 9 | 1 | 21 |

What this shows:

- **The hooks are the entry point, not a boundary.** A hook receives a raw `HTMLElement` and almost always passes it on. Of 3,547 call sites, 204 are written inside a slot definition: 141 in `bind`, 33 in `on`, 29 in `press`, 1 in `asleep`. A typical `bind` is one line that delegates, like `bind: (el, { api, store }) => bindInternals(el, { … })` (`foundation/forms/toggle-control.ts:324-338`) or `return api.internal.popup.backdrop(el)` (`components/dialog/dialog-parts.ts:103-106`).
- **Components get elements from the kernel far more than from the page.** `context.element()` is called 145 times in components against 9 `querySelector`/`getElementById` calls. The registry is a real choke point for acquisition.
- **But the code then leaves through the element.** `ownerDocument` (171) and `defaultView` (47) are how code written against one element reaches the document and window; `event.target` (166) and `activeElement` (99) are how it learns about elements the kernel never gave it.
- **Type coupling is everywhere.** `HTML…Element` type names appear 847 times: 41 in the kernel, 45 in platform, 374 in jobs, 381 in components. The public kit exports the same types: `Part.el`, `SlotContext.el`, `bind(el: HTMLElement)` and `PrimitiveContext.element()` (`primitive-types.ts:102`, `135`, `191`, `467`).

## What is already host-free

Verified with the script: a file counts when it has no DOM call site and no DOM type name.

| Measure, core without `testing/` | Files | Lines |
| --- | --- | --- |
| All | 374 | 109,831 |
| No DOM call site | 153 | 24,158 |
| No DOM call site and no DOM type | 125 | 17,049 |
| No DOM call site in the file or anything it imports | 91 | 12,761 |
| … and no DOM type either | 76 | 9,859 |

- **Whole folders:** `foundation/color` (9 files, 990 lines), `foundation/date` (6, 982), `foundation/gauge` (2, 216).
- **Nearly whole:** `foundation/motion` without `presence.ts` and `panel.ts` (13 files, 1,471 lines, including the 583-line gesture `machine.ts`); `foundation/number` without `keys.ts` (6 files, 728 lines).
- **Kernel, no DOM call site (19 of 30 files, 3,679 lines):** `store.ts`, `derive.ts`, `roles.ts`, `selects.ts`, `controller.ts`, `change.ts`, `action.ts`, `attrs.ts`, `bound-keys.ts`, `controlled-lists.ts`, `draft.ts`, `inline-style.ts`, `input-source.ts`, `option-names.ts`, `undo-stack.ts`, `trusted.ts`, `details.ts`, `primitive-types.ts`, `dev-stub.ts`. `details.ts` and `primitive-types.ts` name DOM types (84 and 8 references) but call nothing: each change reason is typed with its DOM event (`foundation/kernel/details.ts:48`).
- **Kernel, with DOM call sites (11 files):** `live.ts` 27, `modality.ts` 25, `dev.ts` 15 (development only), `order.ts` 12, `part.ts` 10, `events.ts` 9, `keep.ts` 2, `watchers.ts` 2, `primitive.ts` 2, `elements.ts` 1, `index.ts` 1.
- **`definePrimitive` itself touches the DOM in one place:** `part.el?.isConnected` in `element()` (`foundation/kernel/primitive.ts:252`, `259`). State, `sync`, `preview`, `follow`, `setOptions` and `destroy` are plain JavaScript (`primitive.ts:149-473`).
- **Pure models inside components:** 42 component files (8,129 lines), like `calendar-model.ts`, `date-input-model.ts`, `otp-input-model.ts`, `token-input-model.ts`, `resizable-layout.ts`, `carousel-layout.ts`, `scroll-area-model.ts`, `pagination-range.ts`, `trigger-match.ts`.
- **Pure parts of DOM-heavy modules:** `computePlacement` (`foundation/platform/position.ts:256`), the layer stack's rules (`foundation/platform/layers.ts:8-51`), the popup presets (`foundation/popups/popup-behavior.ts`), `dismissal.ts`, `selection-model.ts`, `focus/collection.ts`, `lists/listbox-listing.ts`, `text/fuzzy.ts`.
- **Platform is the opposite:** 14 of its 15 files touch the DOM. Only `sides.ts` doesn't.

One more piece of evidence that the declarative half runs without a DOM: core has 209 unit test files in `packages/core/test`, 96 of them start with `@vitest-environment jsdom`, and `tests/README.md:233` says unit tests are "run by vitest in Node, with no browser". The tests for Switch, Button, Tabs, Select and Dialog have no jsdom pragma; `packages/core/test/switch.test.ts:1-40` creates a switch, reads `attrs()` and `partState()` and calls `api.toggle()`. Some bind stand-in objects, like `{ isConnected: true }` (`packages/core/test/primitive-props.test.ts:24`), and `part.ts:481` skips the id observer for "Stand-ins that unit tests bind in Node". I didn't run the tests, so that the 113 files without the pragma pass in plain Node is an inference from the README and the absence of a vitest config in `packages/core`.

## Choke points and scattered calls

| Capability | Where it is decided | Call sites that go around it |
| --- | --- | --- |
| Rendering a slot's attributes | `attrs()` in `part.ts:153`, then the adapter | None. `attrs` is pure in all 254 inline slots |
| Live attribute writes | `applyAttrs` in `live.ts:127` | 230 direct attribute calls in 68 files and 143 style writes, for things that aren't slot attributes |
| Slot events | `handlers()` and `bind()` in `part.ts:329`, `447` | 256 hand-attached listeners (149 `on()`, 107 raw), 95 of them on a document or window |
| Element registry | `part()`, `element()` in `primitive.ts:210-260`; `elements()` in `elements.ts:9` | `event.target` (166), `activeElement` (99), 21 queries |
| Client or server | `typeof document` in `keep.ts:65`, `watchers.ts:77`, `modality.ts:70`; `isBrowser` in `env.ts:1` | 26 more guards across core |
| Input modality and change source | `modality.ts:69-86`, `144-175` | None |
| Top layer | `popup.ts:914-919`, `1240-1258` | 6 calls in 4 other files |
| Inertness and scroll lock | `popups/modal.ts:29`, `264-366` | `inert` in 3 other files |
| Outside press, Escape, blur | `platform/layers.ts:267-390`, `469-488` | None |
| Positioning | `platform/position.ts:400` | None. Two components call the same function directly |
| Presence | `motion/presence.ts:16`, `155` | `motion/panel.ts` for disclosure panels |
| Form participation | `forms/form.ts` | 120 form sites in components, mostly type references |
| Tab order | `focus/tabbable.ts:18-123` | None |
| Direction | `isRTL` in `platform/env.ts:17` | 2 direct reads of the computed direction |
| Storage | `storage/storage.ts` | `resizable-storage.ts` |
| Announcements | `platform/announce.ts`, loaded lazily | None |
| Focus moves | None | 126 `.focus(` calls in 64 files |
| Measurement | None | 314 sites in 65 files |
| Tree questions | None | 774 sites in 150 files |
| Observers | None | 44 in 29 files |

## The first tier

For each component: its own folder, then everything its entry file imports in production, where `#dev` resolves to the stub (verified, script). "Own sites" are DOM call sites in `components/<name>/`. The class columns are for the whole import graph.

| Component | Own files (lines) | Own sites | Graph files (lines) | Graph files with DOM sites | Graph sites | attr | evt | focus | meas | top | obs | scroll | forms | text | anim | glob | tree | ptr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 1 (234) | 1 | 23 (5,419) | 12 | 201 | 19 | 42 | 5 | 0 | 0 | 3 | 0 | 36 | 8 | 2 | 33 | 53 | 0 |
| Switch | 1 (137) | 0 | 23 (5,467) | 11 | 200 | 17 | 40 | 6 | 0 | 0 | 3 | 0 | 40 | 8 | 2 | 33 | 51 | 0 |
| Checkbox | 2 (878) | 13 | 27 (6,945) | 15 | 259 | 50 | 40 | 7 | 2 | 2 | 3 | 0 | 45 | 8 | 9 | 33 | 60 | 0 |
| Radio | 3 (803) | 23 | 28 (6,602) | 17 | 263 | 27 | 52 | 17 | 3 | 2 | 3 | 0 | 40 | 8 | 9 | 49 | 53 | 0 |
| Tabs | 2 (894) | 32 | 34 (7,514) | 20 | 325 | 68 | 32 | 25 | 35 | 5 | 5 | 8 | 7 | 13 | 10 | 51 | 66 | 0 |
| Collapsible | 1 (359) | 4 | 26 (6,169) | 15 | 280 | 62 | 42 | 10 | 6 | 2 | 4 | 0 | 39 | 8 | 10 | 40 | 57 | 0 |
| Accordion | 1 (806) | 6 | 27 (6,640) | 16 | 283 | 62 | 42 | 10 | 6 | 2 | 5 | 0 | 39 | 8 | 10 | 40 | 59 | 0 |
| Select | 4 (2,250) | 40 | 71 (18,587) | 45 | 818 | 95 | 104 | 54 | 80 | 38 | 8 | 5 | 52 | 22 | 18 | 124 | 218 | 0 |
| Dialog | 5 (1,459) | 14 | 59 (13,996) | 35 | 595 | 62 | 67 | 46 | 69 | 34 | 6 | 0 | 11 | 22 | 18 | 100 | 160 | 0 |
| Popover | 1 (487) | 3 | 53 (12,691) | 32 | 551 | 53 | 63 | 41 | 64 | 37 | 6 | 0 | 10 | 21 | 18 | 92 | 146 | 0 |
| Menu | 3 (2,797) | 61 | 62 (16,293) | 41 | 725 | 77 | 129 | 50 | 66 | 37 | 6 | 1 | 10 | 21 | 20 | 128 | 178 | 2 |
| Slider | 3 (1,346) | 15 | 32 (7,695) | 16 | 267 | 19 | 60 | 10 | 2 | 0 | 3 | 0 | 41 | 11 | 4 | 62 | 53 | 2 |
| Input | 1 (499) | 18 | 24 (5,927) | 14 | 247 | 22 | 41 | 13 | 4 | 0 | 6 | 0 | 40 | 11 | 3 | 47 | 60 | 0 |
| Field | 4 (1,186) | 68 | 21 (5,498) | 14 | 246 | 25 | 38 | 5 | 0 | 0 | 8 | 0 | 55 | 8 | 2 | 30 | 75 | 0 |
| **All 14 together** | 32 (14,135) | 298 | 123 (35,140) | 86 | 1,335 | 163 | 223 | 104 | 120 | 46 | 19 | 14 | 92 | 32 | 21 | 183 | 316 | 2 |

Storage is 0 for all 14. Select, Dialog, Popover and Menu also load `foundation/popups/sheet-presentation.ts` with `import()`, which isn't in these numbers; Button, Dialog, Popover, Menu and Field load `foundation/platform/announce.ts` the same way.

How to read it:

- **The graph counts whole files.** A component that imports one function of `forms/form.ts` is charged its 93 sites. A bundler drops what isn't used, so the graph numbers are an upper bound on what a component runs, not what it runs.
- **Own sites are small.** The 14 components have 298 DOM call sites in their own folders, 22% of the 1,335 in their combined graph. Switch has none, Button one, Popover three.
- **Three groups show up.** The form controls (Button, Switch, Checkbox, Radio, Slider, Input, Field) share a graph of about 200 to 270 sites, half of it `forms/form.ts`. The disclosure components (Tabs, Collapsible, Accordion) add panel measurement and roving focus. The popups (Select, Dialog, Popover, Menu) triple the graph by bringing in `popups` and `platform`: every site in the top-layer column and most of the measurement column.
- **The first tier covers more than a third of core's surface:** 1,335 of 3,547 sites, in 123 of 374 files.

## Switch, traced

What a simple primitive asks of the host, read line by line (verified). Switch is `components/switch/switch.ts` on `foundation/forms/toggle-control.ts`.

**Host-free:**

- The definition: options schema, `state`, `controlled`, `sync`, the `agent` surface (`components/switch/switch.ts:84-111`). The file has no DOM call site.
- State and its transitions: `toggleState`, `syncToggle` (`toggle-control.ts:107-136`), `setState` refusing a disabled or read-only control (`toggle-control.ts:195-208`), `toggle`, `getChecked`, `setChecked` (`toggle-control.ts:212-219`).
- The controller and change details (`createController`, `createChange`).
- Every attribute: `role`, `aria-checked`, `aria-readonly`, `aria-required`, `aria-disabled`, `disabled`, `tabindex`, `type`, and the `data-*` state attributes (`toggle-control.ts:261-298`), and the thumb's (`switch.ts:105-108`).
- Public state for render functions (`toggle-control.ts:254-259`).

**Asked of the host, through the kernel:**

| Need | Where | DOM-specific? |
| --- | --- | --- |
| Render a string attribute map on the root and thumb | `attrs()`, `part.ts:153` | The names are HTML's. The values are plain strings |
| Deliver an activation to `press` | `toggle-control.ts:299-304` | Core calls `event?.preventDefault()`, so the event is optional |
| Deliver `keydown` and `keyup` with `key` and `repeat` | `toggle-control.ts:305-323` | Only matters with a hardware keyboard. `isNativeButton(el)` is `instanceof HTMLButtonElement` (`toggle-control.ts:251-252`) |
| Give the root element to `bind` | `toggle-control.ts:324-338` | The body is `bindInternals`, which does nothing unless the web adapter attached `ElementInternals` (`forms/form.ts:453-460`) |
| Focus the root | `element("root")?.focus()`, `toggle-control.ts:220` | Needs a focusable handle |
| Keep the instance while mounted | `keep()`, `keep.ts:129` | The adapter must call it where `document` is undefined (`keep.ts:65`) |

**Asked of the host, with no native counterpart (forms):**

- A second slot, `input`, rendered as a visually hidden native checkbox with `name`, `value`, `form`, `checked`, `required`, `disabled` and an inline `style` string (`toggle-control.ts:342-355`, `forms/form.ts:249-250`).
- `bindHiddenInput` on it: writes `input.checked` and `input.indeterminate` (`forms/form.ts:378-387`), listens for the form's `reset` on the document (`forms/form.ts:276`), for the browser focusing the input (`forms/form.ts:282`) and for a label's click (`forms/form.ts:396-406`), and watches ancestor fieldsets with a `MutationObserver` (`forms/form.ts:296-341`).
- `dispatchChange` after each user change: native `input` and `change` events from the form element (`toggle-control.ts:204-206`, `forms/form.ts:211-230`).
- Enter submits the form: `submitImplicitly(api.form())` walks `form.elements` and calls `requestSubmit()` (`toggle-control.ts:311`, `forms/form.ts:181-205`).
- `required` uses the browser's own message, read from a detached input (`forms/form.ts:91-107`).

**Runs without being asked:** `createChange` calls `trackInput()`, which installs four document listeners and one window listener a microtask later, and returns early when `document` is undefined (`foundation/kernel/input-source.ts:29-30`, `foundation/kernel/modality.ts:69-99`). `sourceOf(event)` then classifies a change by the event's `type` and `pointerType` with property checks, "not `instanceof MouseEvent`", so it "works without a DOM" (`modality.ts:144-175`).

So for Switch, the state, the api, the attributes and the change details need no DOM. The element-level needs are four: attributes, a press, focus, and optional keys. Everything else in its graph is form participation.

## Dialog, traced

What a popup asks of the host (verified). Dialog is `components/dialog/` on `foundation/popups`, with the `dialog` preset: Tab trapped or flowing, `blur: "never"`, `shield`, `focusOnMount`, `closeWatcher`, `blocking` while modal (`foundation/popups/popup-behavior.ts:77-87`). A dialog isn't placed beside its trigger, so it doesn't call `position()` (`foundation/popups/popup-presets.ts:109`).

**Host-free:** the open state machine and its rules (`components/dialog/dialog-api.ts:185-279`), nesting and the stack count (`dialog-api.ts:158-182`), Close actions that keep it open while a Promise runs (`dialog-api.ts:283-328`), the dismissal policy (`dialog-api.ts:86-107`), the controller, every attribute of its six slots (`components/dialog/dialog-parts.ts:60-66`, `97-102`, `130-138`, `182-188`), and the layer stack's ordering rules (`foundation/platform/layers.ts:8-51`).

**Asked of the host:**

| Need | Where | DOM API |
| --- | --- | --- |
| Show content above the page | `popup.ts:903-919` | Removes `hidden`, sets `popover="manual"`, calls `showPopover()`; a `z-index` fallback without the top layer (`popup.ts:933-935`); or the adapter portals into `portalTarget(container)` |
| Show a backdrop just below it | `popup.ts:1240-1258`, `dialog-parts.ts:103-106` | The same, on a second element |
| Enter and exit animation | `popup.ts:936-946`, `motion/presence.ts:16-46`, `155-190` | `data-starting-style`, `data-ending-style`, `getAnimations()`, `getComputedStyle`, `requestAnimationFrame`, `inert` while exiting |
| Make the rest of the page unusable | `popup.ts:1054-1076`, `popups/modal.ts:264-366` | Walks every ancestor's siblings and sets `inert`, sparing live regions found with `querySelectorAll` |
| Lock page scroll | `popup.ts:1072`, `popups/modal.ts:29-137` | Finds the scroller with `getComputedStyle`, measures the scrollbar, writes styles, guards touch moves |
| Trap or route Tab | `popup.ts:1271-1420`, `focus/tabbable.ts:61-66` | `keydown` on the content (`dialog-parts.ts:139-146`), tabbable elements by selector query, `el.focus()` |
| Move focus in on open | `popup.ts:859-885`, `dialog-api.ts:263-275` | `querySelector("[autofocus], [data-autofocus]")`, `isTabbable`, `el.focus()`, after a frame for a pointer open |
| Return focus on close | `popup.ts:738-857` | Remembers `activeElement` at open (`popup.ts:629-631`), then tries candidates by focusing each and checking `activeElement` (`popup.ts:846-850`); the fallback walks the trigger's old neighbours with `nextElementSibling` and `isConnected` (`popup.ts:968-978`, `777-830`) |
| Dismiss on outside press and Escape | `popup.ts:980-1041`, `platform/layers.ts:267-390` | `pointerdown`, `pointerup`, `click` and `keydown` listeners on the window and document, `composedPath()`, `contains`, `getBoundingClientRect()` for backdrop hits (`popup.ts:953-960`, `1000-1003`) |
| Dismiss on the system back gesture | `popup.ts:471-493`, `1169-1182` | `CloseWatcher`, on Android only |
| Close from a form | `popup.ts:1183-1200` | A `submit` listener reading `method="dialog"` and the submitter |
| Stay above the on-screen keyboard | `dialog-parts.ts:161-163`, `platform/keyboard.ts:88-126` | `visualViewport` resize and scroll, written to `--keyboard-inset` |
| Find its parent layer | `popup.ts:981`, `popups/popup-elements.ts:7-48` | `findLayer(trigger)` by `contains`, and a registry of content elements kept by `connect` (`dialog-parts.ts:116`) |
| Keep named elements usable over it | `dialog-api.ts:110-122` | `document.querySelectorAll(selector)` for `persistentElements` |
| Name itself by its title | `dialog-parts.ts:160`, `173-174` | Id references between parts, which `part.ts` rewrites when an author sets an id |
| Trigger shortcut | `dialog-parts.ts:74-79` | A document `keydown` listener in `foundation/shortcuts` |
| Stack styling | `dialog-parts.ts:149-152` | `el.style.setProperty("--dialog-stack", …)` |

Dialog's own folder has 14 DOM call sites. The other 581 in its graph are the popup layer and the platform under it. The same is true of Popover (3 own, 551 in the graph), which is why the architecture says "Every overlay uses the popup layer" (`contributing/architecture.md:138`).

`createPopup` and `createOpenSteps` are the single place an overlay is opened, shown, focused and closed. `createPopup(` is called from 10 component files. `pushLayer` is called only from `popup.ts` and `platform/bind-layer.ts`, and `inertOutside` and `lockScroll` only from `popup.ts`.

## What this says about the seam

This section is inference from the findings above. It lists what the code makes cheap or expensive; it doesn't choose.

1. **The slot contract is three types away from host-neutral.** `Attrs` is "HTML attributes" by comment only: structurally it's `Record<string, string | undefined>` (`primitive-types.ts:21-26`), and every adapter already translates it (`use-primitive.tsx:130-144`). `on` is keyed by `HTMLElementEventMap` (`primitive-types.ts:97`). `bind`, `asleep`, `connect`, `Part.el` and `context.element()` are typed `HTMLElement`. A native adapter can read `attrs`, `state`, `present`, `role`, `focus`, `keys` and `press` today without any core change, since `part.ts`'s read functions take no element (`part.ts:153-255`, `376-384`).
2. **`Host` is an existing seam for events, one field wide.** `bind(part, el, host)` already lets an adapter say which events it attaches (`part.ts:33-34`, `447-454`). With `attaches: "all"`, core adds no listener for a slot's `on`.
3. **`live` and `direct` are a second existing seam, in one function.** Every live attribute write goes through `applyAttrs` (`live.ts:127`). 38 inline slots use `live` and 5 use `direct`.
4. **`bind` is where the two hosts diverge.** 170 inline slots declare it and its body is web-only by its own documentation (`primitive-types.ts:187`). A host that never calls `bind` gets none of: form participation, popup showing, positioning, presence, focus management, drag, observers. A host that does call it must pass something that answers `ownerDocument`, `addEventListener`, `getBoundingClientRect`, `contains`, `focus` and the rest, which is the DOM shim the map rules out.
5. **Below the kernel, a seam means named helpers, not hooks.** The capabilities with one owner (top layer, inertness and scroll lock, dismissal listeners, positioning, presence, form participation, tab order, direction, storage, announcements) are a dozen modules, and components reach them through function calls. The scattered ones (focus calls, measurement, tree questions, observers, DOM event reads) have no owner to put a seam in: 1,584 call sites sit in 104 of the 159 component files.
6. **The kernel's "client" test is a host test in disguise.** `typeof document !== "undefined"` decides whether an instance is kept at creation (`keep.ts:65`), and `trackInput` silently does nothing without `document` (`modality.ts:70`). On a host with no `document`, an adapter has to call `keep()` itself, as React's already does (`use-primitive.tsx:197`), and input modality has no source.
7. **Upstream merges touch the DOM-heavy files most.** The files with the most call sites (`popups/popup.ts` 114, `forms/form.ts` 93) are also foundation files many components import (28 and 48 importers). A seam placed inside them is a change upstream will keep editing around; a seam placed at their exported functions leaves their bodies alone.

## Appendix: how the counts were made

- A Node script read every `.ts` file under `packages/core/src`, replaced comments with spaces (strings and template literals kept), and counted regular-expression matches. The script isn't committed; the rules are below so the counts can be redone.
- A "call site" is one match. Counts are textual: they say how often the code names an API, not how often it runs.
- Layers are by path: `foundation/<folder>`, `components`, `page`, `testing` (the `testing/` folder and `testing.ts`), and the two other entry files.
- The first-tier graph follows value imports and re-exports from `components/<name>/<name>.ts`, skips `import type` and imports whose members are all `type`, resolves `#dev` to `foundation/kernel/dev-stub.ts` and `#name-check` to `foundation/text/name-check-stub.ts`, and lists `import()` targets separately.
- Slot fields were read by finding each `slot(` or `slot<…>(` call whose argument is an object literal and taking the literal's top-level keys.

Rules per class:

| Class | Counted |
| --- | --- |
| Attributes and ARIA | `.setAttribute(`, `.removeAttribute(`, `.getAttribute(`, `.hasAttribute(`, `.toggleAttribute(`; `applyAttrs(`, `releaseAttrs(`, `markAuthored(`; `.style.setProperty(`, `.style.removeProperty(`, `.style.getPropertyValue(`, `.style.x =`, `.style.cssText`, `.style[`; `.dataset`, `.classList`, `.className` |
| Events | `on(` (the kernel helper), `.addEventListener(`, `.removeEventListener(`, `.dispatchEvent(`, `new …Event(`, `.preventDefault(`, `.stopPropagation(`, `.stopImmediatePropagation(`, `.click()`, `.composedPath(` |
| Focus | `.focus(`, `.blur(`, `activeElement`, `.tabIndex`, `.hasFocus(`, `:focus`, `:focus-visible`, `:focus-within` |
| Measurement and positioning | `.getBoundingClientRect(`, `.getClientRects(`, `.offsetWidth/Height/Top/Left/Parent`, `.clientWidth/Height/Top/Left`, `.scrollWidth/Height`, `getComputedStyle(`, `innerWidth`, `innerHeight`, `visualViewport`, `.elementFromPoint(`, `.elementsFromPoint(`, `devicePixelRatio`, `.checkVisibility(`, `DOMRect` |
| Top layer and inertness | `.showPopover(`, `.hidePopover(`, `.togglePopover(`, `.popover`, `"popover"`, `:popover-open`, `.showModal(`, `.inert`, `"inert"`, `[inert]`, `CloseWatcher`, fullscreen calls |
| Observers | `new MutationObserver(`, `new ResizeObserver(`, `new IntersectionObserver(`, `new PerformanceObserver(` |
| Scrolling | `.scrollIntoView(`, `.scrollTo(`, `.scrollBy(`, `.scrollTop`, `.scrollLeft`, `scrollX`, `scrollY`, `scrollingElement` |
| Forms | `ElementInternals`, `attachInternals`, `.setFormValue(`, `.setValidity(`, `.setCustomValidity(`, `.checkValidity(`, `.reportValidity(`, `.validity`, `.validationMessage`, `.willValidate`, `.requestSubmit(`, `FormData`, `HTMLFormElement` and the other form control classes, `.checked =`, `.indeterminate =`, `.files` |
| Text input | `selectionStart`, `selectionEnd`, `selectionDirection`, `.setSelectionRange(`, `.setRangeText(`, `getSelection(`, `createRange(`, `new Range(`, `isComposing`, `compositionstart/end/update`, `beforeinput`, `inputType`, `.execCommand(`, `contentEditable`, `.select()`, `clipboard` |
| Animation | `requestAnimationFrame(`, `cancelAnimationFrame(`, `.getAnimations(`, `.animate(`, `"animationend"` and the other animation and transition event names, `startViewTransition`, `prefers-reduced-motion` |
| Storage | `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `BroadcastChannel` |
| Globals | `document`, `window`, `navigator` as bare identifiers, `ownerDocument`, `defaultView`, `matchMedia(`, `CSS.x`, `customElements`, `history` and `location` members, `typeof document/window/navigator` guards |
| Tree walks and queries | `.querySelector(`, `.querySelectorAll(`, `.getElementById(`, `.closest(`, `.matches(`, `.contains(`, parent, child and sibling properties, `.getRootNode(`, `shadowRoot`, `ShadowRoot`, `.assignedSlot`, `.compareDocumentPosition(`, `createTreeWalker(`, `.isConnected`, `.createElement(`, `.createTextNode(`, node insertion and removal methods, `.textContent`, `.innerText`, `.innerHTML`, `.localName`, `.tagName`, `.nodeType`, `instanceof` a DOM class |
| Pointer capture and drag data | `.setPointerCapture(`, `.releasePointerCapture(`, `.hasPointerCapture(`, `dataTransfer`, `DataTransfer` |

Known noise, found by reading matched lines:

- `.matches(` and `.tabIndex` match api functions of the same name inside 11 `attrs` functions, like `api.internal.roving.tabIndex(state, …)` (`components/tabs/tabs.ts`) and `api.internal.listbox.matches(key, props)` (`components/select/select-parts.ts`).
- `.inert` matches a `Map` named `inert` 5 times (`foundation/popups/modal.ts:295-316`); `"popover"` matches a `presentation` value 3 times.
- `.addEventListener(` matches an `AbortSignal` once (`foundation/popups/popup-steps.ts:148`).
- `.contains(` includes the `contains` callbacks of layers and popup rules (`foundation/platform/layers.ts:206`, `foundation/popups/create-popup.ts:415-417`).
- `.focus(` matched 164 times; the 38 whose receiver is `api`, `roving`, `options`, `controller`, `report` or `internal` are counted apart as forwarding.
- The forms class is mostly type references (158 of 203).
- A file that defines a helper counts the definition as one site.

I judge the noise at a few percent of any class, too small to change an ordering. That judgment is an estimate, not a measurement.

Not covered: how often each call site runs, the DOM use of the five adapters beyond what's cited from React, and `GLOSSARY.md`, which `AGENTS.md` and issue #2 name but which doesn't exist at this commit.
