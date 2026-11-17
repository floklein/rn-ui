import { afterEach, expect, test, vi } from "vitest"
import {
  popover,
  type PopoverContentProps,
} from "../src/components/popover/popover"
import { popoverNative } from "../src/components/popover/popover-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import { pressTrigger } from "../src/foundation/popups/popup-native"

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

const unmounts: (() => void)[] = []
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount())
  setNativeHost(undefined)
})

function host() {
  const focused: Part[] = []
  setNativeHost({
    focus: (part) => focused.push(part),
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: () => 0,
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
    scrollNear: vi.fn(),
    seen: vi.fn(),
    listen: () => () => {},
  })
  return focused
}

function mount(props: PopoverContentProps = {}, titled = true) {
  const instance = popover({ id: "p" })
  keep(instance)
  const trigger = instance.part("trigger", {})
  popoverNative.trigger!(trigger)
  let mounted = false
  let unmount: (() => void) | void
  const render = () => {
    if (instance.get().mounted && !mounted) {
      mounted = true
      if (titled) {
        popoverNative.title!(instance.part("title", {}))
      }
      unmount = popoverNative.content!(instance.part("content", props))
    }
  }
  instance.subscribe(render)
  unmounts.push(() => unmount?.())
  return trigger
}

const slots = (parts: Part[]) => parts.map((part) => part.slot)

test("a screen reader's press moves focus to the title", () => {
  const focused = host()
  pressTrigger(mount(), "virtual")
  expect(slots(focused)).toEqual(["title"])
})

test("without a title, focus goes to the content", () => {
  const focused = host()
  pressTrigger(mount({}, false), "virtual")
  expect(slots(focused)).toEqual(["content"])
})

test("a touch focuses the popover itself", () => {
  const focused = host()
  pressTrigger(mount(), "touch")
  expect(slots(focused)).toEqual(["content"])
})

test("initialFocus content and none", () => {
  const focused = host()
  pressTrigger(mount({ initialFocus: "content" }), "virtual")
  expect(slots(focused)).toEqual(["content"])
  unmounts.splice(0).forEach((unmount) => unmount())
  focused.length = 0
  pressTrigger(mount({ initialFocus: "none" }), "virtual")
  expect(slots(focused)).toEqual([])
})
