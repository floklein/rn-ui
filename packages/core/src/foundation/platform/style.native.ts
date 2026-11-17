import type { Twin } from "../kernel/twin"
import type * as Mirrored from "./style"
import type * as Native from "./style.native"

// The native host has no page to style: parts take their styles as props.

function setStyle(_el: HTMLElement, _name: string, _value: string) {
  return () => {}
}

function registerUninherited(_names: readonly string[]) {}

function writeStyle(_doc: Document, _id: string, _css: string) {}

function enforceHidden(_doc: Document) {}

function ahead(_work: () => void) {}

function afterPaint(_work: () => void) {
  return () => {}
}

true satisfies Twin<typeof Mirrored, typeof Native>

export {
  afterPaint,
  ahead,
  enforceHidden,
  registerUninherited,
  setStyle,
  writeStyle,
}
