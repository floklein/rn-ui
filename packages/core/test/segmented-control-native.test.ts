import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createSegmentedControlController,
  segmentedControl,
  type SegmentedControlOptions,
} from "../src/components/segmented-control/segmented-control"
import { segmentedControlNative } from "../src/components/segmented-control/segmented-control-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"

vi.mock(
  "../src/foundation/kernel/order",
  () => import("../src/foundation/kernel/order.native")
)

afterEach(() => setNativeHost(undefined))

function host() {
  const rendered: Part[] = []
  const focus = vi.fn()
  setNativeHost({
    focus,
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    listen: vi.fn(),
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
  })
  return { rendered, focus }
}

function mount(
  options: SegmentedControlOptions,
  rendered: Part[],
  items: { value: string; disabled?: boolean }[]
) {
  const instance = segmentedControl({
    id: "g",
    ...options,
  } as SegmentedControlOptions & {
    id: string
  })
  instance.part("root", {}, true)
  keep(instance)
  const parts = Object.fromEntries(
    items.map((props) => {
      const item = instance.part("item", props, true)
      rendered.push(item)
      segmentedControlNative.item!(item)
      return [props.value, item]
    })
  )
  return { instance, items: parts }
}

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

describe("a segmented control on the native host", () => {
  test("the controller's focus asks the host to focus the checked item", async () => {
    const { rendered, focus } = host()
    const controller = createSegmentedControlController()
    const { items } = mount({ controller, defaultValue: "b" }, rendered, [
      { value: "a" },
      { value: "b" },
      { value: "c" },
    ])
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(items.b)
  })

  test("with nothing checked, the controller's focus asks for the first enabled item in render order", async () => {
    const { rendered, focus } = host()
    const controller = createSegmentedControlController()
    const { items } = mount({ controller }, rendered, [
      { value: "c" },
      { value: "a", disabled: true },
      { value: "b" },
    ])
    rendered.sort((x, y) => String(x.key).localeCompare(String(y.key)))
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(items.b)
  })

  test("an item that leaves the control is never focused", async () => {
    const { rendered, focus } = host()
    const controller = createSegmentedControlController()
    const instance = segmentedControl({
      id: "g",
      controller,
      defaultValue: "a",
    } as SegmentedControlOptions & { id: string })
    instance.part("root", {}, true)
    keep(instance)
    const item = instance.part("item", { value: "a" }, true)
    rendered.push(item)
    const leave = segmentedControlNative.item!(item)
    leave?.()
    await flush()
    controller.focus()
    expect(focus).not.toHaveBeenCalled()
  })
})
