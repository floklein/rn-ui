import { afterEach, describe, expect, test, vi } from "vitest"
import {
  numberInput,
  type NumberInputOptions,
} from "../src/components/number-input/number-input"
import { numberInputNative } from "../src/components/number-input/number-input-native"
import {
  type NativeDrag,
  setNativeHost,
} from "../src/foundation/kernel/native-host"
import { keep } from "../src/foundation/kernel/keep"
import type { Part } from "../src/foundation/kernel/primitive-types"

vi.mock(
  "../src/foundation/platform/env",
  () => import("../src/foundation/platform/env.native")
)
vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
vi.mock(
  "../src/components/number-input/number-input-field",
  () => import("../src/components/number-input/number-input-field.native")
)
vi.mock(import("../src/foundation/text/locale"), async (original) => ({
  ...(await original()),
  bindPageLocale: (_, set) => set("de-DE"),
}))

afterEach(() => {
  setNativeHost(undefined)
  vi.useRealTimers()
})

function host() {
  const drags = new Map<Part, NativeDrag>()
  const focus = vi.fn()
  setNativeHost({
    focus,
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: vi.fn(),
    isRTL: () => false,
    box: vi.fn(),
    follow(part, drag) {
      drags.set(part, drag)
      return () => drags.delete(part)
    },
    adjustable: vi.fn(),
    listen: vi.fn(),
    seen: vi.fn(),
  })
  return { drags, focus }
}

function mount(options: NumberInputOptions = {}) {
  const changes = vi.fn()
  const commits = vi.fn()
  const instance = numberInput({
    id: "n",
    onValueChange: (value, details) => changes(value, details.reason),
    onValueCommit: (value, details) => commits(value, details.reason),
    ...options,
  })
  keep(instance)
  const { api } = instance
  return { instance, api, changes, commits, state: () => instance.get() }
}

describe("a native number input's typing", () => {
  test("takes text that can become a number", () => {
    const { api, state, changes } = mount({ locale: "en-US" })
    api.internal.typeText("1")
    api.internal.selectText({ start: 1, end: 1 })
    api.internal.typeText("12")
    expect(state().text).toBe("12")
    expect(state().value).toBe(12)
    expect(state().selection).toBeNull()
    expect(changes).toHaveBeenLastCalledWith(12, "input-change")
  })

  test("puts a refused edit back, with the selection it had", () => {
    const { api, state, changes } = mount({ locale: "en-US", defaultValue: 12 })
    api.internal.selectText({ start: 1, end: 1 })
    api.internal.typeText("1a2")
    expect(state().text).toBe("12")
    expect(state().value).toBe(12)
    expect(state().selection).toEqual({ start: 1, end: 1 })
    expect(changes).not.toHaveBeenCalled()
  })

  test("keeps a refused edit's selection past the refused text's caret, and drops it at the next one", () => {
    const { api, state } = mount({ locale: "en-US", defaultValue: 12 })
    api.internal.selectText({ start: 0, end: 2 })
    api.internal.typeText("x")
    expect(state().selection).toEqual({ start: 0, end: 2 })
    api.internal.selectText({ start: 1, end: 1 })
    expect(state().selection).toEqual({ start: 0, end: 2 })
    api.internal.selectText({ start: 0, end: 0 })
    expect(state().selection).toBeNull()
  })

  test("refuses a minus without negatives, and a second decimal separator", () => {
    const { api, state } = mount({ locale: "en-US", min: 0, step: 0.1 })
    api.internal.typeText("-")
    expect(state().text).toBe("")
    expect(state().selection).toEqual({ start: 0, end: 0 })
    api.internal.typeText("1.5")
    api.internal.selectText({ start: 3, end: 3 })
    api.internal.typeText("1.5.")
    expect(state().text).toBe("1.5")
    expect(state().selection).toEqual({ start: 3, end: 3 })
  })

  test("reads the locale's separators", () => {
    const { api, state } = mount({ locale: "de-DE", step: 0.01 })
    api.internal.typeText("1,5")
    expect(state().value).toBe(1.5)
    api.internal.selectText({ start: 3, end: 3 })
    api.internal.typeText("1,5,")
    expect(state().text).toBe("1,5")
  })

  test("always takes a deletion", () => {
    const { api, state } = mount({ locale: "en-US", defaultValue: -1 })
    api.internal.typeText("-")
    expect(state().text).toBe("-")
    expect(state().selection).toBeNull()
  })

  test("finds the refused insertion without a selection report", () => {
    const { api, state } = mount({ locale: "en-US", defaultValue: 123 })
    api.internal.typeText("12x3")
    expect(state().text).toBe("123")
    expect(state().selection).toEqual({ start: 2, end: 2 })
  })

  test("commits on blur, clamped and formatted", () => {
    const { api, state, commits } = mount({ locale: "en-US", max: 10 })
    api.internal.focusText(true)
    api.internal.typeText("12")
    api.internal.focusText(false)
    expect(state().value).toBe(10)
    expect(state().text).toBe("10")
    expect(commits).toHaveBeenCalledWith(10, "input-commit")
  })
})

describe("a native number input's buttons", () => {
  test("a press steps on press in and commits on press out", () => {
    const { api, state, changes, commits } = mount({ defaultValue: 1 })
    api.internal.pressStep(1)
    expect(state().value).toBe(2)
    expect(changes).toHaveBeenCalledWith(2, "increment-press")
    expect(commits).not.toHaveBeenCalled()
    api.internal.activateStep(1)
    api.internal.releaseStep()
    expect(state().value).toBe(2)
    expect(commits).toHaveBeenCalledWith(2, "increment-press")
  })

  test("a press that slid off doesn't swallow the next activation", async () => {
    const { api, state } = mount({ defaultValue: 1 })
    api.internal.pressStep(1)
    api.internal.releaseStep()
    await Promise.resolve()
    api.internal.activateStep(1)
    expect(state().value).toBe(3)
  })

  test("a held press repeats until released", () => {
    vi.useFakeTimers()
    const { api, state } = mount({ defaultValue: 0 })
    api.internal.pressStep(-1)
    vi.advanceTimersByTime(400 + 60 * 2 + 30)
    expect(state().value).toBe(-4)
    api.internal.releaseStep()
    vi.advanceTimersByTime(600)
    expect(state().value).toBe(-4)
  })

  test("a held press stops at the bound", () => {
    vi.useFakeTimers()
    const { api, state } = mount({ defaultValue: 8, max: 10 })
    api.internal.pressStep(1)
    vi.advanceTimersByTime(2000)
    expect(state().value).toBe(10)
  })

  test("a screen reader's press, with no press in, steps once and commits", () => {
    const { api, state, commits } = mount({ defaultValue: 5 })
    api.internal.activateStep(-1)
    expect(state().value).toBe(4)
    expect(commits).toHaveBeenCalledWith(4, "decrement-press")
  })

  test("a read-only field doesn't step", () => {
    const { api, state } = mount({ defaultValue: 5, readOnly: true })
    api.internal.pressStep(1)
    api.internal.releaseStep()
    api.internal.activateStep(1)
    expect(state().value).toBe(5)
  })
})

describe("a native number input's scrub area", () => {
  test("a drag steps by distance and commits once on lift", () => {
    const { drags } = host()
    const { instance, state, commits } = mount({ defaultValue: 0 })
    const area = instance.part("scrub-area", { pixelsPerStep: 4 }, true)
    numberInputNative["scrub-area"]!(area)
    const drag = drags.get(area)!
    expect(drag.accepts()).toBe(true)
    drag.start({ x: 10, y: 0, target: area })
    expect(state().scrubbing).toBe(true)
    drag.move({ x: 19, y: 0, target: area })
    expect(state().value).toBe(2)
    drag.move({ x: 22, y: 0, target: area })
    expect(state().value).toBe(3)
    expect(commits).not.toHaveBeenCalled()
    drag.end()
    expect(state().scrubbing).toBe(false)
    expect(commits).toHaveBeenCalledWith(3, "scrub")
  })

  test("vertical scrubs go up", () => {
    const { drags } = host()
    const { instance, state } = mount({ defaultValue: 0 })
    const area = instance.part("scrub-area", { orientation: "vertical" }, true)
    numberInputNative["scrub-area"]!(area)
    const drag = drags.get(area)!
    drag.start({ x: 0, y: 50, target: area })
    drag.move({ x: 0, y: 40, target: area })
    expect(state().value).toBe(5)
  })

  test("a tap focuses the field", () => {
    const { drags, focus } = host()
    const { instance } = mount()
    const control = instance.part("control", {}, true)
    const area = instance.part("scrub-area", {}, true)
    numberInputNative["scrub-area"]!(area)
    const drag = drags.get(area)!
    drag.start({ x: 0, y: 0, target: area })
    drag.end()
    expect(focus).toHaveBeenCalledWith(control)
  })

  test("a disabled field takes no scrub", () => {
    const { drags } = host()
    const { instance } = mount({ disabled: true })
    const area = instance.part("scrub-area", {}, true)
    numberInputNative["scrub-area"]!(area)
    expect(drags.get(area)!.accepts()).toBe(false)
  })
})

describe("a native number input's root", () => {
  test("formats in the device's locale", () => {
    host()
    const { instance, state } = mount({ defaultValue: 1234.5, step: 0.1 })
    numberInputNative.root!(instance.part("root", {}, true))
    expect(state().text).toBe("1.234,5")
  })
})
