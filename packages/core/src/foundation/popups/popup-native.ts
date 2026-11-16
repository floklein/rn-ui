import { flagWhileBound, settleFlag } from "../kernel/bound-keys"
import { type ChangeSource, withSource } from "../kernel/details"
import { type NativeBehavior, nativeHost } from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import { endExit, holdExit, onSettled } from "../motion/presence-native"
import {
  activeLayers,
  layerCount,
  openedSince,
  pushLayer,
} from "../platform/layers"
import type { Layer } from "../platform/layers.native"
import type { createPopup } from "./create-popup"
import {
  initialFocusPlan,
  modalTriple,
  type PopupCloseReason,
  type PopupOpener,
} from "./popup"
import { resolveBehavior } from "./popup-behavior"
import { bindTrigger } from "./popup-slots"

type PopupApi = { internal: ReturnType<typeof createPopup>["internal"] }

/** Where focus goes on open, from the opener: `"auto"`, the popup itself, or nowhere. */
type FocusPlan = ReturnType<typeof initialFocusPlan>

const openerBySource: Partial<Record<ChangeSource, PopupOpener>> = {
  touch: "touch",
  virtual: "keyboard",
}

/**
 * Presses a popup's trigger from the native host, with the opener its source
 * stands for, as the DOM host reads it from the event.
 * @experimental
 */
function pressTrigger(part: Part<any, PopupApi>, source: ChangeSource) {
  withSource(source, () =>
    part.api.internal.press?.press(
      part.key,
      part.props,
      undefined,
      openerBySource[source] ?? "imperative"
    )
  )
}

function partIn(internal: PopupApi["internal"], slot: string, key?: string) {
  let first: Part | undefined
  for (const part of internal.parts()) {
    if (part.slot !== slot) {
      continue
    }
    if (key === undefined || part.key === key) {
      return part
    }
    first ??= part
  }
  return first
}

/**
 * What `popup.bind` orchestrates on the DOM host, for the native host: the
 * layer, back, escape and outside press from the host's input, the flags
 * the title, description and trigger set, focus on open and its return on
 * close, and the content held mounted until its exit ends. `focus` picks the
 * part focus goes to on open; `escape` restates a popup's own Escape rule,
 * with whether the gesture reached its content.
 */
function popupNative<Api extends PopupApi>({
  focus,
  escape,
}: {
  focus?: (api: Api, plan: FocusPlan) => Part | undefined
  escape?: (api: Api, inside: boolean) => void
} = {}) {
  const behavior: NativeBehavior<Api> = {
    trigger: (part) => bindTrigger(part.store, part.key),
    title: (part) => flagWhileBound(part.store, "titled", { now: true }),
    description: (part) =>
      flagWhileBound(part.store, "described", { now: true }),
    content(part) {
      const { api, store } = part
      const { internal } = api
      const host = () => nativeHost()
      const rules = resolveBehavior(internal.preset.behavior, {})
      settleFlag(store, "titled")
      const release = holdExit(store)
      onSettled(part, (shown) => {
        if (!shown) {
          endExit(store)
        }
      })

      const dismiss = (reason: PopupCloseReason, source: ChangeSource) =>
        withSource(source, () => internal.popup.requestClose(reason))

      function focusIn() {
        const opener = internal.popup.opener()
        const plan =
          opener === "initial" && rules.focusOnMount
            ? "auto"
            : initialFocusPlan(opener)
        if (
          !rules.movesFocus ||
          plan === "none" ||
          internal.contentProps().initialFocus === "none"
        ) {
          return
        }
        host()?.focus(focus?.(api, plan) ?? part)
      }

      // The chain starts at the trigger: what had focus before can't be known.
      function focusBack(order: number) {
        const mode = internal.popup.closeFocus()
        if (!mode || internal.contentProps().finalFocus === "none") {
          return
        }
        const trigger = () =>
          partIn(
            internal,
            internal.triggerSlot,
            store.get().trigger ?? undefined
          )
        const run = () => {
          const target = trigger()
          if (target) {
            host()?.focus(target)
          }
        }
        if (mode === "unless-moved") {
          queueMicrotask(() => !openedSince(order) && run())
        } else {
          run()
        }
      }

      let hide: (() => void) | undefined
      function show() {
        const modal =
          internal.rules?.modal?.() ?? modalTriple(store.get().modal)
        const layer: Layer = {
          parent: internal.rules?.parent?.() ?? activeLayers().at(-1),
          active: () => store.get().open,
          exiting: () => !store.get().open && store.get().mounted,
          modal: modal.consumeOutsidePress,
          shield: rules.shield,
          component: internal.label,
          id: part.id,
          contains: () => false,
          onBack: () => dismiss("back", "touch"),
          onEscapeGesture: (within) =>
            withSource("virtual", () =>
              escape
                ? escape(api, within === api)
                : internal.popup.requestClose("escape-key")
            ),
          onBackdropPress: () => dismiss("outside-press", "touch"),
        }
        const pop = pushLayer(layer)
        const cleanup = internal.rules?.onShow?.(layer)
        hide = () => {
          hide = undefined
          cleanup?.()
          pop()
        }
        focusIn()
      }

      let open = false
      const sync = () => {
        if (store.get().open === open) {
          return
        }
        open = store.get().open
        if (open) {
          return show()
        }
        const order = layerCount()
        hide?.()
        focusBack(order)
      }
      sync()
      const unsubscribe = store.subscribe(sync)
      return () => {
        unsubscribe()
        hide?.()
        release()
      }
    },
  }
  return behavior
}

export { type FocusPlan, partIn, popupNative, pressTrigger }
