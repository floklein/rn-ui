import { isDisabled } from "../../foundation/forms/form"
import { nativeElement } from "../../foundation/kernel/native-element"
import { inDocumentOrder } from "../../foundation/kernel/order"
import type { Part } from "../../foundation/kernel/primitive-types"
import type { Twin } from "../../foundation/kernel/twin"
import { createCorrectedEdit } from "../../foundation/text/corrected-edit"
import type * as Mirrored from "./date-input-field"
import type { NativeFieldContext, SegmentProps } from "./date-input-field"
import type * as Native from "./date-input-field.native"
import type { EditableType } from "./date-input-model"

// A mounted segment's stand-in, the same one each time, so the api can find
// the segment focus is in among the others.
const mounted = new WeakMap<Part, HTMLElement>()

function segmentElements(context: { parts(): Iterable<Part> }) {
  const list = []
  for (const part of context.parts()) {
    const el = part.slot === "segment" ? mounted.get(part) : undefined
    if (el) {
      list.push({ el, key: part.key, props: part.props as SegmentProps })
    }
  }
  return inDocumentOrder(list)
}

function insertedText(previous: string, text: string) {
  let start = 0
  while (start < previous.length && previous[start] === text[start]) {
    start++
  }
  let end = 0
  while (
    end < previous.length - start &&
    previous[previous.length - 1 - end] === text[text.length - 1 - end]
  ) {
    end++
  }
  return text.slice(start, text.length - end)
}

function nativeField({
  store,
  textOf,
  segmentElement,
  insert,
  remove,
  pasteText,
  step,
  blur,
}: NativeFieldContext) {
  const edits = new Map<EditableType, ReturnType<typeof createCorrectedEdit>>()
  const editsOf = (type: EditableType) => {
    let edit = edits.get(type)
    if (!edit) {
      edits.set(type, (edit = createCorrectedEdit()))
    }
    return edit
  }
  // Backspace comes before its deletion on iOS, and on Android either side
  // of it, so each deletion pairs with the Backspace that made it. Only an
  // unpaired Backspace in an empty segment goes back.
  let keyFirst = false
  let deletionFirst = false
  const editable = () => !isDisabled(store.get()) && !store.get().readOnly

  return {
    typeText(type: EditableType, text: string) {
      const el = segmentElement(type)
      if (!el || !editable()) {
        return
      }
      const previous = textOf(type)
      let typed = false
      const selection = editsOf(type).edit(previous, text, (next) => {
        typed = true
        const before = store.get()
        const inserted = insertedText(previous, next)
        if (inserted.length < 2 || !pasteText(inserted.trim())) {
          insert(type, el, inserted)
        }
        return store.get() !== before
      })
      if (selection) {
        store.set({ selection: { type, ...selection } })
        return
      }
      store.set({ selection: null })
      if (typed) {
        keyFirst = deletionFirst = false
        return
      }
      deletionFirst = !keyFirst
      keyFirst = false
      remove(type, el, true)
    },
    pressKey(type: EditableType, key: string) {
      const el = segmentElement(type)
      if (key !== "Backspace" || !el || !editable()) {
        return
      }
      if (deletionFirst) {
        deletionFirst = false
      } else if (textOf(type)) {
        keyFirst = true
      } else {
        remove(type, el, true)
      }
    },
    selectText(type: EditableType, selection: { start: number; end: number }) {
      if (
        editsOf(type).select(selection) &&
        store.get().selection?.type === type
      ) {
        store.set({ selection: null })
      }
    },
    leaveText(type: EditableType) {
      if (store.get().selection?.type === type) {
        store.set({ selection: null })
      }
      blur()
    },
    adjust(type: EditableType, direction: 1 | -1) {
      if (editable()) {
        step(type, direction)
      }
    },
    mountSegment(part: Part) {
      // A press around the segments lands on none of them.
      const el = Object.assign(nativeElement(part), {
        isConnected: true,
        contains: () => false,
      })
      mounted.set(part, el)
      return () => mounted.delete(part)
    },
  } satisfies Mirrored.NativeField
}

true satisfies Twin<typeof Mirrored, typeof Native, "nativeField">

export { nativeField, segmentElements }
export type {
  NativeField,
  NativeFieldContext,
  SegmentProps,
} from "./date-input-field"
