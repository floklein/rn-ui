import { note, warn } from "#dev"
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

// Pickers refuse a second call while one is open, so a press during a pick
// opens nothing. A canceled pick reports nothing, as the web's does.
const picking = new WeakSet<object>()

function openPicker(
  _input: HTMLInputElement | undefined,
  { id, options, state, receive }: PickerContext
) {
  const { pick } = options() as { pick?: Pick }
  const from = { component: "file-input", id }
  if (!pick) {
    warn("has no `pick`, so its trigger opens nothing.", from)
    return false
  }
  if (picking.has(receive)) {
    return false
  }
  picking.add(receive)
  const { accept, multiple } = state()
  new Promise<Awaited<ReturnType<Pick>>>((resolve) =>
    resolve(pick({ accept: accept ? accept.split(",") : [], multiple }))
  )
    .then(
      (files) => {
        if (files?.length) {
          // Its files carry a `File`'s name, type and size, all the checks read.
          receive([...files] as File[], "picker")
        }
      },
      (error) => note("`pick` failed, so no files were added.", from, error)
    )
    .finally(() => picking.delete(receive))
  return true
}

true satisfies Twin<typeof Mirrored, typeof Native>

export { openPicker }
export type { PickerContext } from "./file-input-picker"
