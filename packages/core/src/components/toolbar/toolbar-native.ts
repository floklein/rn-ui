import { nativeElement } from "../../foundation/kernel/native-element"
import type { NativeBehavior } from "../../foundation/kernel/native-host"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { ToolbarApi } from "./toolbar"

const join = (part: Part<any, ToolbarApi>) =>
  part.api.internal.join(part, nativeElement(part))

/**
 * Toolbar's behavior on the native host. While a button, link or text field
 * is mounted it joins the toolbar, as its `bind` does on the DOM host, so the
 * toolbar knows its items in render order, keeps its stop on an enabled one
 * and its controller can focus it.
 * @experimental
 */
const toolbarNative: NativeBehavior<ToolbarApi> = {
  button: join,
  link: join,
  input: join,
}

export { toolbarNative }
