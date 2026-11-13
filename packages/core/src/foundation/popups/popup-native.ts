// PROTOTYPE (issue #14). A popup's behavior on the native host, for a
// primitive built on `createPopup`. It does what `popup.bind` does on the DOM
// host, as far as the native host has it: the layer, dismissal from the
// host's input, the flags parts set as they mount, and focus in and back.
import { flagWhileBound, settleFlag } from "../kernel/bound-keys"
import { withSource, type ChangeSource } from "../kernel/details"
import {
  partIn,
  type NativeBehavior,
  type NativeHost,
} from "../kernel/native-host"
import type { Part } from "../kernel/primitive-types"
import { activeLayers, pushLayer, type Layer } from "../platform/layers"
import type { createPopup, PopupState } from "./create-popup"
import { modalTriple, type PopupCloseReason } from "./popup"
import { bindTrigger } from "./popup-slots"

type PopupInternal = ReturnType<typeof createPopup>["internal"]

type PopupInstance = { api: { internal: PopupInternal } }

function popupNative({
  focusSlot = () => "content",
}: {
  // The slot that takes focus on open, when it isn't the content.
  focusSlot?: (internal: PopupInternal) => string
} = {}) {
  function focusIn(internal: PopupInternal, host: NativeHost) {
    if (internal.contentProps().initialFocus === "none") {
      return
    }
    const part = partIn(internal.parts(), focusSlot(internal))
    if (part) {
      host.focus(part)
    }
  }

  // The chain starts at the trigger: what had focus before can't be known.
  function focusBack(internal: PopupInternal, host: NativeHost) {
    if (internal.contentProps().finalFocus === "none") {
      return
    }
    const part = partIn(
      internal.parts(),
      internal.triggerSlot,
      internal.store.get().trigger
    )
    if (part) {
      host.focus(part)
    }
  }

  const behavior: NativeBehavior<PopupInstance> = {
    attach(instance, host) {
      const { internal } = instance.api
      const { store, popup, rules } = internal
      let hide: (() => void) | undefined

      // Through the same request a sheet's swipe makes, so the component's
      // dismissal rules decide, with the source named here: no event says it.
      const dismiss =
        (reason: PopupCloseReason, source: ChangeSource) => () => {
          withSource(source, () => popup.requestClose(reason))
        }

      function show() {
        const own: Layer & { onBack: () => void } = {
          parent: rules?.parent?.() ?? activeLayers().at(-1),
          active: () => store.get().open,
          modal: modalTriple(store.get().modal).consumeOutsidePress,
          contains: () => false,
          component: internal.label,
          onBack: dismiss("back", "touch"),
          onEscape: dismiss("escape-key", "virtual"),
          onOutsidePress: dismiss("outside-press", "touch"),
        }
        const pop = pushLayer(own)
        const cleanup = rules?.onShow?.(own)
        hide = () => {
          hide = undefined
          cleanup?.()
          pop()
        }
        focusIn(internal, host)
      }

      let wasOpen = false
      const sync = () => {
        const { open } = store.get()
        if (open === wasOpen) {
          return
        }
        wasOpen = open
        if (open) {
          show()
        } else {
          hide?.()
          focusBack(internal, host)
        }
      }
      sync()
      const unsubscribe = store.subscribe(sync)
      return () => {
        unsubscribe()
        hide?.()
      }
    },
    slots: {
      trigger: (part: Part<PopupState>) => bindTrigger(part.store, part.key),
      title: (part: Part<PopupState>) =>
        flagWhileBound(part.store, "titled", { now: true }),
      description: (part: Part<PopupState>) =>
        flagWhileBound(part.store, "described", { now: true }),
      // Content that mounts as the popup opens takes focus once it's there.
      content(part: Part<PopupState, PopupInstance["api"]>, host) {
        settleFlag(part.store, "titled")
        if (part.store.get().open) {
          focusIn(part.api.internal, host)
        }
      },
    },
  }
  return behavior
}

export { popupNative }
