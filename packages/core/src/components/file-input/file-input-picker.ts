import type { FileInputValueChangeReason } from "./file-input"
import type { State } from "./file-input-api"

type PickerContext = {
  id: string
  options: () => object
  state: () => State
  receive: (files: File[], reason: FileInputValueChangeReason) => boolean
}

/**
 * Opens the system file picker through the hidden input. Its native twin
 * calls the `pick` function the app passes to the root instead.
 */
function openPicker(
  input: HTMLInputElement | undefined,
  _context: PickerContext
) {
  if (!input) {
    return false
  }
  input.click()
  return true
}

export { openPicker, type PickerContext }
