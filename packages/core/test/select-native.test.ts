import { afterEach, expect, test, vi } from "vitest"
import { select, type SelectOptions } from "../src/components/select/select"
import {
  pressSelectTrigger,
  selectNative,
} from "../src/components/select/select-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import { createPresence, press } from "../src/renderer"

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
  "../src/foundation/platform/announce",
  () => import("../src/foundation/platform/announce.native")
)

const unmounts: (() => void)[] = []
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount?.())
  setNativeHost(undefined)
})

function host() {
  const focused: Part[] = []
  const rendered: Part[] = []
  const announced: string[] = []
  setNativeHost({
    focus: (part) => focused.push(part),
    field: vi.fn(),
    announce: (text) => announced.push(text),
    activate: vi.fn(),
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
    listen: () => () => {},
    seen: () => undefined,
    scrollNear: vi.fn(),
    screenReader: () => () => {},
  })
  return { focused, rendered, announced }
}

type Item = { value: string; label: string; disabled?: boolean }

const fruits: Item[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "cherry", label: "Cherry" },
]

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

// Mounts the parts a native adapter would: the trigger at once, and the
// content with its items, and a search field when asked, while it's mounted.
function mount(
  options: SelectOptions<any, any> = {},
  {
    rendered = [] as Part[],
    items = fruits,
    searchable = false,
  }: { rendered?: Part[]; items?: Item[]; searchable?: boolean } = {}
) {
  const instance = select({ id: "s", ...options })
  keep(instance)
  const trigger = instance.part("trigger", {})
  rendered.push(trigger)
  unmounts.push(selectNative.trigger!(trigger) ?? (() => {}))
  let mounted = false
  let cleanups: ((() => void) | void)[] = []
  const parts: Record<string, Part> = {}
  let presence: ReturnType<typeof createPresence> | undefined
  const render = () => {
    if (instance.get().mounted && !mounted) {
      mounted = true
      if (searchable) {
        const input = instance.part("input", {})
        rendered.push(input)
        cleanups.push(selectNative.input!(input))
      }
      for (const item of items) {
        const part = instance.part("item", { id: item.value, ...item })
        parts[item.value] = part
        rendered.push(part)
        cleanups.push(selectNative.item!(part))
      }
      const content = instance.part("content", {})
      cleanups.push(selectNative.content!(content))
      presence = createPresence(
        () => {},
        () => content
      )
    } else if (!instance.get().mounted && mounted) {
      mounted = false
      cleanups.forEach((cleanup) => cleanup?.())
      cleanups = []
    }
  }
  instance.subscribe(render)
  render()
  unmounts.push(() => cleanups.forEach((cleanup) => cleanup?.()))
  return { instance, trigger, parts, exit: () => presence?.exit(undefined) }
}

const slots = (parts: Part[]) =>
  parts.map((part) => (part.slot === "item" ? part.key : part.slot))

test("a screen reader's press opens the list on the selected item, highlighted", () => {
  const { focused } = host()
  const { instance, trigger } = mount({ defaultValue: "cherry" })
  pressSelectTrigger(trigger, "virtual")
  expect(instance.get().open).toBe(true)
  expect(instance.get().highlighted).toBe("cherry")
  expect(slots(focused)).toEqual(["cherry"])
})

test("without a value, a screen reader's press focuses the first item that can be chosen", () => {
  const { focused } = host()
  const { trigger } = mount({}, { items: [fruits[1], fruits[2], fruits[0]] })
  pressSelectTrigger(trigger, "virtual")
  expect(slots(focused)).toEqual(["cherry"])
})

test("a touch focuses the list itself", () => {
  const { focused } = host()
  const { trigger } = mount({ defaultValue: "cherry" })
  pressSelectTrigger(trigger, "touch")
  expect(slots(focused)).toEqual(["content"])
})

test("a press on the open trigger closes the list", () => {
  host()
  const { instance, trigger } = mount()
  pressSelectTrigger(trigger, "virtual")
  pressSelectTrigger(trigger, "touch")
  expect(instance.get().open).toBe(false)
})

test("choosing an item returns focus to the trigger", async () => {
  const { focused } = host()
  const { trigger, parts, exit } = mount()
  pressSelectTrigger(trigger, "virtual")
  focused.length = 0
  press(parts.apple, parts.apple.props)!()
  exit()
  await new Promise((done) => setTimeout(done))
  expect(slots(focused)).toEqual(["trigger"])
})

test("a disabled select doesn't open", () => {
  host()
  const { instance, trigger } = mount({ disabled: true })
  pressSelectTrigger(trigger, "touch")
  expect(instance.get().open).toBe(false)
})

test("pressing an item selects it and closes the list", () => {
  host()
  const onValueChange = vi.fn()
  const { instance, trigger, parts } = mount({ onValueChange })
  pressSelectTrigger(trigger, "touch")
  press(parts.cherry, parts.cherry.props)!()
  expect(onValueChange).toHaveBeenCalledWith(
    "cherry",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(instance.get().value).toBe("cherry")
  expect(instance.get().open).toBe(false)
})

test("with multiple, pressing items toggles them and keeps the list open", () => {
  host()
  const { instance, trigger, parts } = mount({ multiple: true })
  pressSelectTrigger(trigger, "touch")
  press(parts.cherry, parts.cherry.props)!()
  press(parts.apple, parts.apple.props)!()
  expect(instance.get().value).toEqual(["cherry", "apple"])
  press(parts.cherry, parts.cherry.props)!()
  expect(instance.get().value).toEqual(["apple"])
  expect(instance.get().open).toBe(true)
})

test("a disabled item can't be chosen", () => {
  host()
  const onValueChange = vi.fn()
  const { instance, trigger, parts } = mount({ onValueChange })
  pressSelectTrigger(trigger, "touch")
  press(parts.banana, parts.banana.props)?.()
  expect(onValueChange).not.toHaveBeenCalled()
  expect(instance.get().open).toBe(true)
})

test("items are known in the order the host renders them", () => {
  const { rendered } = host()
  const { instance, trigger } = mount({}, { rendered })
  pressSelectTrigger(trigger, "touch")
  const [apple] = rendered.splice(1, 1)
  rendered.push(apple)
  expect(
    instance.api.internal.listbox.entries().map((entry) => entry.key)
  ).toEqual(["banana", "cherry", "apple"])
})

test("the selected item's label shows once its item registers", async () => {
  host()
  const { instance, trigger } = mount({ defaultValue: "cherry" })
  pressSelectTrigger(trigger, "touch")
  await flush()
  expect(instance.api.internal.selection.labels()).toEqual(["Cherry"])
})

test("typing in the search field highlights the best match and announces it", async () => {
  const { announced } = host()
  const { instance, trigger } = mount({}, { searchable: true })
  pressSelectTrigger(trigger, "virtual")
  announced.length = 0
  instance.api.setQuery("ch")
  expect(instance.get().highlighted).toBe("cherry")
  expect(announced).toEqual(["Cherry"])
})

test("the highlight that opening sets isn't announced", () => {
  const { announced } = host()
  const { trigger } = mount({ defaultValue: "apple" }, { searchable: true })
  pressSelectTrigger(trigger, "virtual")
  expect(announced).toEqual([])
})

test("with a search field, a screen reader's press focuses the field", () => {
  const { focused } = host()
  const { trigger } = mount({}, { searchable: true })
  pressSelectTrigger(trigger, "virtual")
  expect(slots(focused)).toEqual(["input"])
})

test("the controller's focus asks the host to focus the trigger", () => {
  const { focused } = host()
  const { instance } = mount()
  instance.api.focus()
  expect(slots(focused)).toEqual(["trigger"])
})
