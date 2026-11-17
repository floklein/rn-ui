import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createSliderController,
  slider,
  type SliderOptions,
} from "../src/components/slider/slider"
import { sliderNative } from "../src/components/slider/slider-native"
import {
  type NativeDrag,
  setNativeHost,
} from "../src/foundation/kernel/native-host"
import { keep } from "../src/foundation/kernel/keep"
import { attrs } from "../src/foundation/kernel/part"
import type { Part } from "../src/foundation/kernel/primitive-types"

// What Metro and the native build resolve in their place.
vi.mock(
  "../src/foundation/platform/env",
  () => import("../src/foundation/platform/env.native")
)
vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
vi.mock(import("../src/foundation/text/locale"), async (original) => ({
  ...(await original()),
  bindPageLocale: (_, set) => set("de-DE"),
}))

afterEach(() => setNativeHost(undefined))

// A host whose track spans x 0 to 100, and whose control is wider.
function host({ rtl = false } = {}) {
  const drags = new Map<Part, NativeDrag>()
  const steps = new Map<Part, (direction: 1 | -1) => void>()
  const followed = vi.fn()
  const focus = vi.fn()
  setNativeHost({
    focus,
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: vi.fn(),
    isRTL: () => rtl,
    box: (part) =>
      part.slot === "track"
        ? { left: 0, top: 0, width: 100, height: 100 }
        : { left: -20, top: -20, width: 140, height: 140 },
    follow(part, drag) {
      drags.set(part, drag)
      return () => {
        followed(part)
        drags.delete(part)
      }
    },
    adjustable(part, step) {
      steps.set(part, step)
      return () => steps.delete(part)
    },
    listen: vi.fn(),
    seen: vi.fn(),
  })
  return { drags, steps, followed, focus }
}

function mount(options: SliderOptions = {}, rtl = false) {
  const { drags, steps, focus } = host({ rtl })
  const onValueChange = vi.fn()
  const onValueCommit = vi.fn()
  const instance = slider({
    id: "s",
    onValueChange,
    onValueCommit,
    ...options,
  })
  keep(instance)
  const control = instance.part("control", {}, true)
  const track = instance.part("track", {}, true)
  const thumbs = [0, 1].map((index) =>
    instance.part("thumb-input", { index, id: String(index) }, true)
  )
  const leaveTrack = sliderNative.track!(track)
  const leave = sliderNative.control!(control)
  const unadjust = thumbs.map((thumb) => sliderNative["thumb-input"]!(thumb))
  const drag = () => drags.get(control)!
  const touch = (x: number, target?: Part) => ({ x, y: 50, target })
  return {
    instance,
    thumbs,
    drag,
    touch,
    onValueChange,
    onValueCommit,
    focus,
    leaveTrack,
    leave: () => leave?.(),
    step: (index: number, direction: 1 | -1) =>
      steps.get(thumbs[index])!(direction),
    unadjust,
  }
}

describe("dragging a slider on the native host", () => {
  test("a touch on the track moves the nearest thumb there, and lifting commits once", () => {
    const { instance, drag, touch, onValueCommit } = mount()
    drag().start(touch(30))
    expect(instance.api.getValue()).toBe(30)
    drag().move(touch(45))
    drag().move(touch(60))
    expect(instance.api.getValue()).toBe(60)
    expect(onValueCommit).not.toHaveBeenCalled()
    drag().end()
    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(
      60,
      expect.objectContaining({ reason: "drag", thumb: 0 })
    )
  })

  test("a cancelled responder puts the value back and commits nothing", () => {
    const { instance, drag, touch, onValueCommit } = mount({
      defaultValue: 10,
    })
    drag().start(touch(30))
    drag().move(touch(60))
    drag().cancel()
    expect(instance.api.getValue()).toBe(10)
    expect(instance.get().active).toBeNull()
    drag().end()
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test("unmounting the control mid-drag puts the value back and commits nothing", () => {
    const { instance, drag, touch, leave, onValueCommit } = mount({
      defaultValue: 10,
    })
    drag().start(touch(30))
    leave()
    expect(instance.api.getValue()).toBe(10)
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test("a touch on a thumb keeps its offset, so the thumb doesn't jump", () => {
    const { instance, drag, touch, thumbs } = mount({ defaultValue: 50 })
    drag().start(touch(55, thumbs[0]))
    expect(instance.api.getValue()).toBe(50)
    drag().move(touch(65, thumbs[0]))
    expect(instance.api.getValue()).toBe(60)
  })

  test("positions are measured on the track, and on the control without one", () => {
    const { instance, drag, touch, leaveTrack } = mount()
    drag().start(touch(30))
    drag().end()
    expect(instance.api.getValue()).toBe(30)
    leaveTrack?.()
    drag().start(touch(50))
    drag().end()
    expect(instance.api.getValue()).toBe(50)
    drag().start(touch(-20))
    drag().end()
    expect(instance.api.getValue()).toBe(0)
  })

  test("right to left, the track starts on the right", () => {
    const { instance, drag, touch } = mount({}, true)
    drag().start(touch(20))
    expect(instance.api.getValue()).toBe(80)
  })

  test("a vertical slider grows upward", () => {
    const { instance, drag } = mount({ orientation: "vertical" })
    drag().start({ x: 50, y: 25, target: undefined })
    expect(instance.api.getValue()).toBe(75)
  })

  test("a disabled or read-only slider doesn't take touches", () => {
    expect(mount({ disabled: true }).drag().accepts()).toBe(false)
    expect(mount({ readOnly: true }).drag().accepts()).toBe(false)
    expect(mount().drag().accepts()).toBe(true)
  })

  test("a range's touch moves the nearest of its thumbs", () => {
    const { instance, drag, touch } = mount({ defaultValue: [20, 80] })
    drag().start(touch(70))
    drag().end()
    expect(instance.api.getValue()).toEqual([20, 70])
  })
})

describe("adjusting a slider with a screen reader on the native host", () => {
  test("increment and decrement move the thumb a step and commit", () => {
    const { instance, step, onValueCommit } = mount({
      defaultValue: [20, 80],
      step: 5,
    })
    step(1, 1)
    expect(instance.api.getValue()).toEqual([20, 85])
    step(0, -1)
    expect(instance.api.getValue()).toEqual([15, 85])
    expect(onValueCommit).toHaveBeenLastCalledWith(
      [15, 85],
      expect.objectContaining({ reason: "accessibility-adjust", thumb: 0 })
    )
  })

  test("a thumb stops at its neighbour and at the bounds", () => {
    const { instance, step } = mount({ defaultValue: [50, 51] })
    step(0, 1)
    expect(instance.api.getValue()).toEqual([51, 51])
    step(0, 1)
    expect(instance.api.getValue()).toEqual([51, 51])
  })

  test("a disabled or read-only slider doesn't move", () => {
    const disabled = mount({ defaultValue: 50, disabled: true })
    disabled.step(0, 1)
    expect(disabled.instance.api.getValue()).toBe(50)
    const readOnly = mount({ defaultValue: 50, readOnly: true })
    readOnly.step(0, 1)
    expect(readOnly.instance.api.getValue()).toBe(50)
  })
})

describe("a slider's other native behavior", () => {
  test("the controller focuses a thumb through the host", () => {
    const controller = createSliderController()
    const { focus, thumbs } = mount({ defaultValue: [20, 80], controller })
    controller.focus(1)
    expect(focus).toHaveBeenLastCalledWith(thumbs[1])
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(thumbs[0])
  })

  test("the mounted root formats in the locale the host reports", () => {
    const { instance, thumbs } = mount({
      defaultValue: 1234.5,
      max: 2000,
      step: 0.5,
    })
    expect(attrs(thumbs[0])["aria-valuetext"]).toBe("1,234.5")
    sliderNative.root!(instance.part("root", {}, true))
    expect(attrs(thumbs[0])["aria-valuetext"]).toBe("1.234,5")
  })
})
