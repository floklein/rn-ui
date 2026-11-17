import { partOf } from "../kernel/native-element"
import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./item-label"
import type * as Native from "./item-label.native"

// A native view's text isn't readable from core, so an item is named by its key.
const itemLabel = (el: HTMLElement) => partOf(el)?.key ?? ""

true satisfies Twin<typeof Mirrored, typeof Native>

export { itemLabel }
