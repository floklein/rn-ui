import { afterEach, expect, test, vi } from "vitest"
import { drawer, type DrawerOptions } from "../src/components/drawer/drawer"
import { drawerNative } from "../src/components/drawer/drawer-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import {
  nativeSheet,
  type NativeSheetSpring,
} from "../src/foundation/popups/native-sheet"

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
  "../src/foundation/popups/sheet",
  () => import("../src/foundation/popups/sheet.native")
)
vi.mock(
  "../src/foundation/platform/env",
  () => import("../src/foundation/platform/env.native")
)

vi.stubGlobal("requestAnimationFrame", (run: () => void) => setTimeout(run))
vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id))

const unmounts: (() => void)[] = []
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount())
  setNativeHost(undefined)
})

function host() {
  const steps = new Map<Part, (direction: 1 | -1) => void>()
  setNativeHost({
    focus: vi.fn(),
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: () => 0,
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    scrollNear: vi.fn(),
    screenReader: vi.fn(),
    adjustable(part, step) {
      steps.set(part, step)
      return () => steps.delete(part)
    },
    listen: () => () => {},
    seen: vi.fn(),
  })
  return steps
}

// A view on a 800px tall screen whose content is 600px tall. Settles land
// when `land` runs.
function view(api: object, reducedMotion = false) {
  const moves: number[] = []
  const settles: NativeSheetSpring[] = []
  let pending: (() => void) | undefined
  let laidOut = false
  nativeSheet(api).view = {
    measure: () => (laidOut ? { container: 800, content: 600 } : undefined),
    move: (extent) => moves.push(extent),
    ranges: vi.fn(),
    reducedMotion: () => reducedMotion,
    settle(spring, done) {
      settles.push(spring)
      pending = done
    },
  }
  return {
    moves,
    settles,
    layout() {
      laidOut = true
      nativeSheet(api).input?.layout()
    },
    land() {
      const done = pending
      pending = undefined
      done?.()
    },
  }
}

function mount(options: DrawerOptions = {}, reducedMotion = false) {
  const steps = host()
  const instance = drawer({ id: "d", ...options })
  keep(instance)
  const motion = view(instance.api, reducedMotion)
  let unmount: (() => void) | void
  let content: Part | undefined
  const render = () => {
    if (instance.get().mounted && !content) {
      content = instance.part("content", {})
      drawerNative.title!(instance.part("title", {}))
      unmount = drawerNative.content!(content)
    }
  }
  instance.subscribe(render)
  render()
  unmounts.push(() => unmount?.())
  const input = () => nativeSheet(instance.api).input!
  return { instance, motion, input, steps }
}

// A finger from `from` to `to` on a bottom sheet, lifted at `velocity` px/ms.
function swipe(
  input: ReturnType<ReturnType<typeof mount>["input"]>,
  from: number,
  to: number,
  velocity = 0
) {
  input.down(200, from, null)
  const claims = []
  for (let step = 1; step <= 10; step++) {
    claims.push(input.move(200, from + ((to - from) * step) / 10))
  }
  input.up({ x: 0, y: velocity })
  return claims
}

test("an open waits for the layout, then rises to its snap point and rests there", () => {
  const snaps: unknown[] = []
  const { instance, motion } = mount({
    snapPoints: [0.25, 0.5],
    onSnapPointChange: (point) => snaps.push(point),
  })
  instance.api.open()
  expect(motion.settles).toEqual([])
  motion.layout()
  expect(motion.settles).toMatchObject([{ from: 0, to: 200 }])
  motion.land()
  expect(instance.get().snapPoint).toBe(0.25)
  expect(snaps).toEqual([])
})

test("the value follows a drag, and a release settles on the snap point the shared physics pick", () => {
  const { instance, motion, input } = mount({ snapPoints: [0.25, 0.5] })
  instance.api.open()
  motion.layout()
  motion.land()
  motion.moves.length = 0
  const claims = swipe(input(), 700, 500, -1.5)
  expect(claims).toContain("claim")
  expect(motion.moves.at(-1)).toBeGreaterThan(300)
  expect(motion.settles.at(-1)).toMatchObject({ to: 400 })
  const settle = motion.settles.at(-1)!
  expect(settle.extentAt(16) - settle.extentAt(0)).toBeGreaterThan(5)
  expect(settle.extentAt(settle.duration)).toBeCloseTo(400, 0)
  expect(instance.get().dragging).toBe(false)
  motion.land()
  expect(instance.get().snapPoint).toBe(0.5)
})

test("a swipe toward the edge dismisses with the swipe reason, and the close plays to 0", () => {
  const reasons: string[] = []
  const { instance, motion, input } = mount({
    onOpenChange: (open, details) => reasons.push(`${open} ${details.reason}`),
  })
  instance.api.open()
  motion.layout()
  motion.land()
  swipe(input(), 300, 600, 2)
  expect(reasons).toEqual(["true imperative", "false swipe"])
  expect(motion.settles.at(-1)).toMatchObject({ to: 0 })
})

test("a drag across the axis is the page's", () => {
  const { instance, motion, input } = mount()
  instance.api.open()
  motion.layout()
  motion.land()
  input().down(100, 400, null)
  expect(input().move(160, 402)).toBe("release")
  expect(instance.get().open).toBe(true)
})

test("a scroll view away from its start keeps the touch while the drawer is at its largest", () => {
  const { instance, motion, input } = mount()
  instance.api.open()
  motion.layout()
  motion.land()
  const area = { position: 120, max: 500, scrollTo: vi.fn() }
  expect(input().down(200, 400, area)).toBe(false)
})

test("at its start the drawer takes the touch: pushing up scrolls the content, pulling down moves the drawer", () => {
  const { instance, motion, input } = mount()
  instance.api.open()
  motion.layout()
  motion.land()
  const area = { position: 0, max: 500, scrollTo: vi.fn() }
  expect(input().down(200, 400, area)).toBe(true)
  input().move(200, 380)
  input().move(200, 300)
  expect(area.scrollTo).toHaveBeenLastCalledWith(80)
  input().move(200, 450)
  expect(area.scrollTo).toHaveBeenLastCalledWith(0)
  expect(motion.moves.at(-1)).toBeLessThan(600)
  input().up({ x: 0, y: 0 })
  expect(instance.get().open).toBe(true)
})

test("the handle steps through the snap points on a screen reader's increment and decrement", () => {
  const { instance, motion, steps } = mount({ snapPoints: [0.25, 0.5] })
  instance.api.open()
  motion.layout()
  motion.land()
  const handle = instance.part("handle", {})
  const stop = drawerNative.handle!(handle)
  steps.get(handle)!(1)
  expect(instance.get().snapPoint).toBe(0.5)
  steps.get(handle)!(-1)
  expect(instance.get().snapPoint).toBe(0.25)
  stop?.()
})

test("a touch the scroll view keeps stops the content coasting from the last one", async () => {
  const { instance, motion, input } = mount()
  instance.api.open()
  motion.layout()
  motion.land()
  const area = { position: 0, max: 500, scrollTo: vi.fn() }
  input().down(200, 400, area)
  input().move(200, 380)
  input().move(200, 300)
  input().up({ x: 0, y: -3 })
  await new Promise((done) => setTimeout(done, 20))
  const coasted = area.scrollTo.mock.lastCall![0]
  expect(input().down(200, 400, { ...area, position: coasted })).toBe(false)
  const calls = area.scrollTo.mock.calls.length
  await new Promise((done) => setTimeout(done, 50))
  expect(area.scrollTo.mock.calls.length).toBe(calls)
})

test("with reduced motion an open and a close fade, and a snap eases without overshoot", () => {
  const { instance, motion } = mount({ snapPoints: [0.25, 0.5] }, true)
  instance.api.open()
  motion.layout()
  expect(motion.settles[0]).toMatchObject({ from: 0, to: 200, fade: "in" })
  motion.land()
  instance.api.setSnapPoint(0.5)
  const snap = motion.settles[1]
  expect(snap).toMatchObject({ from: 200, to: 400, fade: undefined })
  for (let elapsed = 0; elapsed <= snap.duration; elapsed += 10) {
    expect(snap.extentAt(elapsed)).toBeLessThanOrEqual(400)
  }
  motion.land()
  instance.api.close()
  expect(motion.settles[2]).toMatchObject({ from: 400, to: 0, fade: "out" })
})
