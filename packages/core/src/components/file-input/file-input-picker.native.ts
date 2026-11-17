import { warn } from "#dev"
import type { FileLike } from "../../foundation/forms/files"
import type { Twin } from "../../foundation/kernel/twin"
import type * as Mirrored from "./file-input-picker"
import type { PickerContext } from "./file-input-picker"
import type * as Native from "./file-input-picker.native"

type Pick = (options: {
  accept: string[]
  multiple: boolean
}) =>
  | PromiseLike<readonly FileLike[] | null | undefined>
  | readonly FileLike[]
  | null
  | undefined

// A canceled picker returns no files, and reports nothing, as the web's does.
function openPicker(
  _input: HTMLInputElement | undefined,
  { id, options, state, receive }: PickerContext
) {
  const { pick } = options() as { pick?: Pick }
  if (!pick) {
    warn("has no `pick`, so its trigger opens nothing.", {
      component: "file-input",
      id,
    })
    return false
  }
  const { accept, multiple } = state()
  void Promise.resolve(
    pick({ accept: accept ? accept.split(",") : [], multiple })
  ).then((files) => {
    if (files?.length) {
      // Its files carry a `File`'s name, type and size, all the checks read.
      receive([...files] as File[], "picker")
    }
  })
  return true
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { openPicker }
export type { PickerContext } from "./file-input-picker"
