import { isDrag } from "../../foundation/drag-and-drop/pointer"
import { isDisabled } from "../../foundation/forms/form"
import { withSource } from "../../foundation/kernel/details"
import { changeSource } from "../../foundation/kernel/input-source"
import type { Twin } from "../../foundation/kernel/twin"
import { isPartialNumber } from "../../foundation/number/parse"
import { createCorrectedEdit } from "../../foundation/text/corrected-edit"
import { localeOf } from "../../foundation/text/locale"
import type * as Mirrored from "./number-input-field"
import type { NativeFieldContext } from "./number-input-field"
import type * as Native from "./number-input-field.native"

// The web's `bindRepeatPresses` timing.
const repeatDelay = 400
const repeatEvery = 60

function nativeField({
  store,
  type,
  commitText,
  stepBy,
  canStep,
  commit,
  focus,
}: NativeFieldContext) {
  const edits = createCorrectedEdit()
  let repeat: ReturnType<typeof setTimeout> | undefined
  // A press in already stepped, so the press that follows it doesn't.
  let pressedIn = false

  const isLocked = () => isDisabled(store.get()) || store.get().readOnly
  const reasonOf = (direction: number) =>
    direction > 0 ? "increment-press" : "decrement-press"

  return {
    typeText(text: string) {
      const state = store.get()
      const selection = edits.edit(state.text, text, (next) =>
        isPartialNumber(next, localeOf(state), state.format, {
          allowNegative: state.min < 0,
        })
      )
      if (selection) {
        store.set({ selection })
        return
      }
      store.set({ selection: null })
      type(text)
    },
    selectText(selection: { start: number; end: number }) {
      if (edits.select(selection) && store.get().selection) {
        store.set({ selection: null })
      }
    },
    focusText(focused: boolean) {
      if (!focused) {
        store.set({ selection: null })
        commitText()
      }
    },
    pressStep(direction: 1 | -1) {
      clearTimeout(repeat)
      pressedIn = true
      const reason = reasonOf(direction)
      if (isLocked() || !stepBy(direction, "step", reason)) {
        return
      }
      // The steps a held press repeats are the press's own.
      const source = changeSource(reason)
      const again = (delay: number) => {
        repeat = setTimeout(() => {
          if (
            withSource(source, () => stepBy(direction, "step", reason)) &&
            canStep(direction)
          ) {
            again(repeatEvery)
          }
        }, delay)
      }
      if (canStep(direction)) {
        again(repeatDelay)
      }
    },
    releaseStep() {
      clearTimeout(repeat)
      commit()
      // The press that follows a release comes in the same task, or never
      // when the touch slid off.
      queueMicrotask(() => {
        pressedIn = false
      })
    },
    activateStep(direction: 1 | -1) {
      if (pressedIn) {
        pressedIn = false
        return
      }
      if (!isLocked()) {
        stepBy(direction, "step", reasonOf(direction))
        commit()
      }
    },
    setPlatform(platform: "ios" | "android") {
      store.set({ platform })
    },
    scrubDrag(props) {
      let from = { x: 0, y: 0 }
      let last = from
      let distance = 0
      let dragged = false
      return {
        accepts: () => !isLocked(),
        claims: (dx, dy) =>
          props().orientation === "vertical" ? isDrag(0, dy) : isDrag(dx, 0),
        start(touch) {
          from = last = touch
          distance = 0
          dragged = false
          store.set({ scrubbing: true })
        },
        move(touch) {
          const { orientation, pixelsPerStep } = props()
          const size = pixelsPerStep && pixelsPerStep > 0 ? pixelsPerStep : 2
          dragged ||= isDrag(touch.x - from.x, touch.y - from.y)
          distance +=
            orientation === "vertical" ? last.y - touch.y : touch.x - last.x
          last = touch
          const steps = Math.trunc(distance / size)
          if (steps !== 0) {
            distance -= steps * size
            stepBy(steps, "step", "scrub")
          }
        },
        end() {
          store.set({ scrubbing: false })
          commit()
          if (!dragged) {
            focus()
          }
        },
        cancel() {
          store.set({ scrubbing: false })
          commit()
        },
      }
    },
  } satisfies Mirrored.NativeField
}

true satisfies Twin<typeof Mirrored, typeof Native, "nativeField">

export { nativeField }
export type { NativeField, NativeFieldContext } from "./number-input-field"
