import { afterEach, expect, test, vi } from "vitest"
import {
  datePicker,
  type DatePickerOptions,
} from "../src/components/date-picker/date-picker"
import { datePickerNative } from "../src/components/date-picker/date-picker-native"
import { withSource } from "../src/foundation/kernel/details"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import { press } from "../src/foundation/kernel/part"
import type { Part } from "../src/foundation/kernel/primitive-types"

vi.mock(
  "../src/foundation/platform/layers",
  () => import("../src/foundation/platform/layers.native")
)
vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
vi.mock(
  "../src/foundation/motion/exit",
  () => import("../src/foundation/motion/exit.native")
)
vi.mock(
  "../src/foundation/kernel/order",
  () => import("../src/foundation/kernel/order.native")
)
vi.mock(
  "../src/foundation/text/locale",
  () => import("../src/foundation/text/locale.native")
)

const unmounts: (() => void)[] = []
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount())
  setNativeHost(undefined)
})

function host() {
  const focused: Part[] = []
  const rendered: Part[] = []
  setNativeHost({
    focus: (part) => focused.push(part),
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
    listen: () => () => {},
  })
  return { focused, rendered }
}

const days = ["2026-10-15", "2026-10-16", "2026-10-17"]

function mount(options: DatePickerOptions, rendered: Part[]) {
  const instance = datePicker({ id: "d", today: "2026-10-01", ...options })
  keep(instance)
  const run = (slot: string, part: Part) => {
    rendered.push(part)
    const cleanup = datePickerNative[slot]?.(part)
    if (cleanup) {
      unmounts.push(cleanup)
    }
    return part
  }
  run("root", instance.part("root", {}))
  const input = run("input", instance.part("input", { id: "start" }))
  const trigger = run("trigger", instance.part("trigger", {}))
  let shown = false
  instance.subscribe(() => {
    if (instance.get().mounted && !shown) {
      shown = true
      for (const value of days) {
        run("day", instance.part("day", { value, offset: 0 }))
      }
      run("content", instance.part("content", {}))
    }
  })
  return { instance, input, trigger }
}

test("a screen reader's press on the trigger opens it on the selected day", () => {
  const { focused, rendered } = host()
  const { instance, trigger } = mount({ defaultValue: "2026-10-16" }, rendered)
  withSource("virtual", press(trigger)!)
  expect(instance.get().open).toBe(true)
  expect(focused.at(-1)?.slot).toBe("day")
  expect(focused.at(-1)?.key).toBe("2026-10-16")
})

test("picking a day closes it", () => {
  const { rendered } = host()
  const onValueChange = vi.fn()
  const { instance, trigger } = mount({ onValueChange }, rendered)
  withSource("virtual", press(trigger)!)
  const day = instance.part("day", { value: "2026-10-17", offset: 0 })
  withSource("virtual", press(day)!)
  expect(onValueChange).toHaveBeenLastCalledWith(
    "2026-10-17",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(instance.get().open).toBe(false)
})

test("Clear focuses the input", () => {
  const { focused, rendered } = host()
  const { instance, input } = mount({ defaultValue: "2026-10-16" }, rendered)
  press(instance.part("clear", {}))!()
  expect(instance.get().value).toBe(null)
  expect(focused.at(-1)).toBe(input)
})
