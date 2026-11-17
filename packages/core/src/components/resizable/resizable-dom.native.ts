import type { Twin } from "../../foundation/kernel/twin"
import { createNativeResizableDom } from "./resizable-native"
import type * as Mirrored from "./resizable-dom"
import type * as Native from "./resizable-dom.native"

const resizableDom = createNativeResizableDom

true satisfies Twin<typeof Mirrored, typeof Native, "resizableDom">

export { resizableDom }
