import { nativeElement } from "../../foundation/kernel/native-element"
import {
  type NativeBehavior,
  nativeHost,
} from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import { bindPageLocale } from "../../foundation/text/locale"
import type { NumberInputScrubAreaProps } from "./number-input"
import type { NumberInputApi, State } from "./number-input-api"

type NumberInputPart = Part<State, NumberInputApi>

/**
 * Number Input's behavior on the native host, as its `bind` and pointer
 * handlers do on the DOM host: the root reads the locale it formats in, and
 * a scrub area follows touch drags.
 * @experimental
 */
const numberInputNative: NativeBehavior<NumberInputApi> = {
  root: (part: NumberInputPart) =>
    bindPageLocale(nativeElement(part), (pageLocale) =>
      part.store.set({ pageLocale })
    ),
  "scrub-area": (part: NumberInputPart) =>
    nativeHost()?.follow(
      part,
      part.api.internal.scrubDrag(
        () => part.props as Omit<NumberInputScrubAreaProps, "controller">
      )
    ),
}

export { numberInputNative }
