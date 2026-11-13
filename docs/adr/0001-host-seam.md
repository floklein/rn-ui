---
status: accepted
---

# One primitive definition for both hosts, with native behavior written beside it

ui-sdk's core was written for the DOM: a slot's `bind` receives an element, and about 3,500 call sites reach the DOM from there. This fork adds a native host and keeps merging upstream, so an edit inside a file upstream owns is a future merge conflict. We decided that both hosts share one primitive definition per component, and that the native host gets its behavior from new files in core that upstream never edits, instead of from a host-neutral rewrite of core or from a second set of native primitives.

## The decision

- **Shared.** A primitive's options, state, `sync`, api, controller, change details and reasons, its slots' declarative fields (`attrs`, `state`, `present`, `role`, `focus`, `keys`, and what `live` and `direct` produce), and the pure engines. The store, the open steps, the dismissal rules and every rule that doesn't read the DOM run unchanged on both hosts.
- **Never run on the native host.** `bind`, `asleep`, `connect`, the `on` handlers and the DOM writers. The native adapter reads the declarative fields, translates the attribute map to React Native accessibility props in one place, and delivers `press`.
- **Native behavior files.** What `bind` orchestrates on the DOM host is restated for the native host in files beside the component or the job, written against a small host interface the adapter implements. Core never imports `react-native`. They also restate the decisions that read the DOM: where focus goes, Dialog's Escape rule, the layer stack. A restatement must behave as the rule it mirrors.
- **Twins.** A host capability that shared code reaches without `bind` (focusing a part, announcements, direction, storage, the input source) gets a twin: a `.native.ts` file with the same exports. Each twin asserts at compile time that its values and exported types match its module's, and declares any type it widens.
- **Input.** Native input reaches shared logic through the api only. A decision that sits inside an `on` handler moves into an api method the first time the native host needs it. On the native host a change's details carry no `event`.

## What may change inside files upstream owns

- Types, import lines, and additive entries: an item in a list, an export, a manifest entry, an export condition, a JSDoc label.
- A one-call reroute of a focus call through the module that owns focusing a part, made at the smallest shared helper.
- Three changes to the popup files: handing the unmount on close to presence (`popup.ts`), an accessor for a close's focus mode (`popup.ts`), and the opener passed by the caller (`popup-features.ts`).

Anything else, and any other change to the logic of `popup.ts` or `form.ts`, is a new decision.

## Considered options

- **A host-neutral core**, where `bind` receives a handle both hosts implement. Rejected: it rewrites the files upstream edits most, and the handle would have to answer for the whole DOM.
- **Native primitives sharing only the public API**, as rn-primitives does with Radix. Rejected: two implementations of every state rule, which is where native ports of other libraries lost behavior.
- **A twin for every owning module.** Tried in the prototype: for a popup the calls to those modules sit inside `bind`, so the twins were never reached.

## Consequences

- The native host has a second implementation of orchestration and of the DOM-bound decisions. An upstream change to a mirrored rule doesn't conflict and doesn't reach the native host.
- So one registry maps each twin, native behavior file and reroute to the upstream files it mirrors and the upstream commit it was last reviewed against. A check at each upstream merge lists what changed since, and the commit advances only after someone has reviewed those files.
- A slot whose native behavior is missing does nothing, silently. So a check derived from the slot declarations lists every slot that declares a hook the native adapter never calls, and fails until the registry marks each as covered by a named file or as needing nothing, with the reason.
- The reroutes run to a few dozen across all components.

The prototype that tested this is on the `prototype/host-seam` branch, in `docs/prototypes/host-seam.md`.
