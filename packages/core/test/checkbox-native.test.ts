import { afterEach, describe, expect, test, vi } from "vitest"
import {
  checkbox,
  checkboxGroup,
  createCheckboxGroupController,
  type CheckboxGroupOptions,
  type CheckboxOptions,
} from "../src/components/checkbox/checkbox"
import { checkboxNative } from "../src/components/checkbox/checkbox-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"

vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
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
    announce: vi.fn(),
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
  })
  return { rendered, focus }
}

function group(options: CheckboxGroupOptions = {}) {
  const owner = checkboxGroup({ id: "g", ...options })
  owner.part("group", {}, true)
  keep(owner)
  return owner
}

function mount(
  owner: ReturnType<typeof group>,
  value: string,
  rendered: Part[],
  at = rendered.length,
  options: CheckboxOptions = {}
) {
  const instance = checkbox({
    id: `c-${value}`,
    value,
    group: () => owner.api,
    ...options,
  } as CheckboxOptions & { id: string })
  const root = instance.part("root", {}, true)
  rendered.splice(at, 0, root)
  checkboxNative.root!(root)
  return { instance, root }
}

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

describe("a checkbox group on the native host", () => {
  test("a checkbox that renders between two others takes its place in the value", async () => {
    const { rendered } = host()
    const owner = group()
    const tea = mount(owner, "tea", rendered)
    const milk = mount(owner, "milk", rendered)
    await flush()
    milk.instance.api.toggle()
    const coffee = mount(owner, "coffee", rendered, 1)
    await flush()
    coffee.instance.api.toggle()
    tea.instance.api.toggle()
    expect(owner.api.getValue()).toEqual(["tea", "coffee", "milk"])
  })

  test("the controller's focus asks the host to focus the first enabled checkbox in render order", async () => {
    const { rendered, focus } = host()
    const controller = createCheckboxGroupController()
    const owner = group({ controller })
    mount(owner, "coffee", rendered)
    const tea = mount(owner, "tea", rendered, 0)
    mount(owner, "milk", rendered, 0, { disabled: true })
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(tea.root)
  })
})
