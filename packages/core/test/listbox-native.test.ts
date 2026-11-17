import { afterEach, expect, test, vi } from "vitest"
import {
  listbox,
  type ListboxOptions,
} from "../src/components/listbox/listbox-root"
import {
  focusListboxItem,
  listboxNative,
} from "../src/components/listbox/listbox-root-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import { press } from "../src/renderer"

vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
vi.mock(
  "../src/foundation/kernel/order",
  () => import("../src/foundation/kernel/order.native")
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
    seen: () => undefined,
    scrollNear: vi.fn(),
    screenReader: () => () => {},
  })
  return { focused, rendered }
}

type Item = { value: string; label: string; disabled?: boolean }

const fruits: Item[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "cherry", label: "Cherry" },
]

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

// Mounts the parts a native adapter would: the root and its options, in the
// order given.
function mount(
  options: ListboxOptions<any, any> = {},
  { rendered = [] as Part[], items = fruits } = {}
) {
  const instance = listbox({ id: "l", ...options })
  keep(instance)
  const parts: Record<string, Part> = {}
  for (const item of items) {
    const part = instance.part("item", { id: item.value, ...item })
    parts[item.value] = part
    rendered.push(part)
    const unbind = listboxNative.item!(part)
    unmounts.push(() => unbind?.())
  }
  return { instance, parts }
}

const keys = (parts: Part[]) => parts.map((part) => part.key)

test("pressing an option selects it", () => {
  host()
  const onValueChange = vi.fn()
  const { instance, parts } = mount({ onValueChange })
  press(parts.cherry, parts.cherry.props)!()
  expect(onValueChange).toHaveBeenCalledWith(
    "cherry",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(instance.get().value).toBe("cherry")
})

test("with multiple, presses toggle options", () => {
  host()
  const { instance, parts } = mount({ multiple: true })
  press(parts.cherry, parts.cherry.props)!()
  press(parts.apple, parts.apple.props)!()
  expect(instance.get().value).toEqual(["cherry", "apple"])
  press(parts.cherry, parts.cherry.props)!()
  expect(instance.get().value).toEqual(["apple"])
})

test("a disabled option can't be chosen", () => {
  host()
  const onValueChange = vi.fn()
  const { parts } = mount({ onValueChange })
  press(parts.banana, parts.banana.props)?.()
  expect(onValueChange).not.toHaveBeenCalled()
})

test("options are known in the order the host renders them", () => {
  const { rendered } = host()
  const { instance } = mount({}, { rendered })
  const [apple] = rendered.splice(0, 1)
  rendered.push(apple)
  expect(
    instance.api.internal.listbox.entries().map((entry) => entry.key)
  ).toEqual(["banana", "cherry", "apple"])
})

test("the controller's focus asks the host to focus the selected option", async () => {
  const { focused } = host()
  const { instance } = mount({ defaultValue: "cherry" })
  await flush()
  instance.api.focus()
  expect(keys(focused)).toEqual(["cherry"])
})

test("without a value, the controller's focus goes to the first option that can be chosen", async () => {
  const { focused } = host()
  const { instance } = mount({}, { items: [fruits[1], fruits[2], fruits[0]] })
  await flush()
  instance.api.focus()
  expect(keys(focused)).toEqual(["cherry"])
})

test("keyboard focus on an option highlights it and keeps the tab stop, and leaving clears the highlight", async () => {
  const { focused } = host()
  const { instance, parts } = mount({ defaultValue: "cherry" })
  await flush()
  focusListboxItem(parts.apple, true)
  expect(instance.get().highlighted).toBe("apple")
  focusListboxItem(parts.apple, false)
  focusListboxItem(parts.cherry, true)
  focusListboxItem(parts.cherry, false)
  expect(instance.get().highlighted).toBe(null)
  focused.length = 0
  instance.api.focus()
  expect(keys(focused)).toEqual(["cherry"])
})

test("leaving an option that isn't highlighted keeps the highlight", async () => {
  host()
  const { instance, parts } = mount()
  await flush()
  focusListboxItem(parts.cherry, true)
  focusListboxItem(parts.apple, false)
  expect(instance.get().highlighted).toBe("cherry")
})

test("the selected option's label is known once it registers", async () => {
  host()
  const { instance } = mount({ defaultValue: "cherry" })
  await flush()
  expect(instance.api.internal.selection.labels()).toEqual(["Cherry"])
})

test("a group label names its group while it's mounted", async () => {
  host()
  const instance = listbox({ id: "l" })
  keep(instance)
  const label = instance.part("group-label", { id: "g", group: "g" })
  const unbind = listboxNative["group-label"]!(label)
  await flush()
  expect(instance.get().groupLabels).toEqual(["g"])
  unbind?.()
  await flush()
  expect(instance.get().groupLabels).toEqual([])
})
