import { afterEach, expect, test, vi } from "vitest"
import { dialog, type DialogOptions } from "../src/components/dialog/dialog"
import { dialogNative } from "../src/components/dialog/dialog-native"
import { keep } from "../src/foundation/kernel/keep"
import {
  type NativeInput,
  setNativeHost,
} from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import { createPresence } from "../src/foundation/motion/presence-native"

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
  let input: NativeInput | undefined
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
    listen(next) {
      input = next
      return () => (input = undefined)
    },
  })
  return { focused, input: () => input }
}

// Mounts the parts an open dialog renders, as the adapter does.
function mount(options: DialogOptions = {}) {
  const instance = dialog({ id: "d", ...options })
  keep(instance)
  const trigger = instance.part("trigger", {})
  dialogNative.trigger!(trigger)
  let content: Part | undefined
  let unmount: (() => void) | void
  const presence = createPresence(
    () => {},
    () => content!
  )
  const render = () => {
    if (instance.get().mounted && !content) {
      content = instance.part("content", {})
      const title = instance.part("title", {})
      dialogNative.title!(title)
      unmount = dialogNative.content!(content)
    }
  }
  instance.subscribe(render)
  render()
  unmounts.push(() => unmount?.())
  return {
    instance,
    trigger,
    exit: (onExit?: (done: () => void) => void) => presence.exit(onExit),
  }
}

test("the content holds a closing dialog mounted until its exit ends", () => {
  host()
  const completed: boolean[] = []
  const { instance, exit } = mount({
    onOpenChangeComplete: (open) => completed.push(open),
  })
  instance.api.open()
  instance.api.close()
  expect(instance.get().mounted).toBe(true)
  let done = () => {}
  exit((end) => (done = end))
  expect(instance.get().mounted).toBe(true)
  done()
  expect(instance.get().mounted).toBe(false)
  expect(completed).toEqual([true, false])
})

test("reopening before the exit ends keeps it mounted", () => {
  host()
  const { instance, exit } = mount()
  instance.api.open()
  instance.api.close()
  let done = () => {}
  exit((end) => (done = end))
  instance.api.open()
  done()
  expect(instance.get().mounted).toBe(true)
})

test("opening pushes a layer the host's input reaches and focuses the title, and focus returns once the exit ends", async () => {
  const { focused, input } = host()
  const { instance, exit } = mount()
  instance.api.open()
  expect(focused.map((part) => part.slot)).toEqual(["title"])
  expect(input()?.back()).toBe(true)
  expect(instance.get().open).toBe(false)
  exit()
  await new Promise((done) => setTimeout(done))
  expect(focused.map((part) => part.slot)).toEqual(["title", "trigger"])
})

test("the controller's focus asks the host to focus the trigger", () => {
  const { focused } = host()
  const { instance, trigger } = mount()
  instance.api.focus()
  expect(focused).toEqual([trigger])
})
