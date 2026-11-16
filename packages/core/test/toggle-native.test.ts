import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createToggleController,
  createToggleGroupController,
  toggle,
  toggleGroup,
  type ToggleGroupOptions,
  type ToggleOptions,
} from "../src/components/toggle/toggle"
import { toggleNative } from "../src/components/toggle/toggle-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"

// What Metro and the native build resolve in their place.
vi.mock(
  "../src/foundation/focus/focus-part",
  () => import("../src/foundation/focus/focus-part.native")
)
vi.mock(
  "../src/foundation/kernel/order",
  () => import("../src/foundation/kernel/order.native")
)

afterEach(() => setNativeHost(undefined))

// A host whose parts render in the order of `rendered`.
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

function group(options: ToggleGroupOptions = {}) {
  const owner = toggleGroup({ id: "g", ...options })
  owner.part("group", {}, true)
  keep(owner)
  return owner
}

// A toggle in `owner`, mounted as the adapter mounts it: its root part
// rendered, and the native behavior attached.
function mount(
  owner: ReturnType<typeof group>,
  value: string,
  rendered: Part[],
  at = rendered.length,
  options: ToggleOptions = {}
) {
  const instance = toggle({
    id: `t-${value}`,
    value,
    group: () => owner.api,
    ...options,
  })
  const root = instance.part("root", {}, true)
  rendered.splice(at, 0, root)
  const leave = toggleNative.root!(root)
  return {
    instance,
    root,
    leave: () => {
      leave?.()
      rendered.splice(rendered.indexOf(root), 1)
    },
  }
}

const press = (toggled: ReturnType<typeof mount>) =>
  toggled.instance.api.toggle({ reason: "press" })

describe("a toggle group on the native host", () => {
  test("a multiple group lists its pressed toggles in the order they render, not the order they were pressed", () => {
    const { rendered } = host()
    const owner = group({ multiple: true })
    const bold = mount(owner, "bold", rendered)
    mount(owner, "italic", rendered)
    const underline = mount(owner, "underline", rendered)
    press(underline)
    press(bold)
    expect(owner.api.getValue()).toEqual(["bold", "underline"])
  })

  test("a toggle that renders between two others takes its place", () => {
    const { rendered } = host()
    const owner = group({ multiple: true })
    const bold = mount(owner, "bold", rendered)
    const underline = mount(owner, "underline", rendered)
    press(underline)
    const italic = mount(owner, "italic", rendered, 1)
    press(italic)
    press(bold)
    expect(owner.api.getValue()).toEqual(["bold", "italic", "underline"])
  })

  test("the controller's setValue puts values in render order too", () => {
    const { rendered } = host()
    const controller = createToggleGroupController()
    const owner = group({ multiple: true, controller })
    mount(owner, "bold", rendered)
    mount(owner, "italic", rendered)
    controller.setValue(["italic", "bold"])
    expect(owner.api.getValue()).toEqual(["bold", "italic"])
  })

  test("a joined toggle follows the group's value", () => {
    const { rendered } = host()
    const controller = createToggleGroupController()
    const owner = group({ controller })
    const bold = mount(owner, "bold", rendered)
    controller.setValue(["bold"])
    expect(bold.instance.get().pressed).toBe(true)
    controller.setValue([])
    expect(bold.instance.get().pressed).toBe(false)
  })

  test("the controller's toggle refuses a disabled toggle", () => {
    const { rendered } = host()
    const controller = createToggleGroupController()
    const owner = group({ controller })
    mount(owner, "bold", rendered, undefined, { disabled: true })
    expect(controller.toggle("bold")).toBe(false)
    expect(owner.api.getValue()).toEqual([])
  })

  test("the controller's focus asks the host to focus a toggle by its value, or the first", () => {
    const { rendered, focus } = host()
    const controller = createToggleGroupController()
    const owner = group({ controller })
    const bold = mount(owner, "bold", rendered)
    const italic = mount(owner, "italic", rendered)
    controller.focus("italic")
    expect(focus).toHaveBeenLastCalledWith(italic.root)
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(bold.root)
    expect(focus).toHaveBeenCalledTimes(2)
  })

  test("a toggle that unmounts leaves the group", () => {
    const { rendered, focus } = host()
    const controller = createToggleGroupController()
    const owner = group({ multiple: true, controller })
    const bold = mount(owner, "bold", rendered)
    bold.leave()
    controller.focus("bold")
    expect(focus).not.toHaveBeenCalled()
    expect(owner.api.internal.elementOf("bold")).toBeUndefined()
  })
})

describe("a toggle on the native host", () => {
  test("its controller's focus asks the host to focus its root part", () => {
    const { focus } = host()
    const controller = createToggleController()
    const instance = toggle({ id: "t", controller })
    const root = instance.part("root", {}, true)
    keep(instance)
    controller.focus()
    expect(focus).toHaveBeenCalledExactlyOnceWith(root)
  })

  test("outside a group, its native behavior joins nothing", () => {
    host()
    const instance = toggle({ id: "t" })
    const root = instance.part("root", {}, true)
    const leave = toggleNative.root!(root)
    instance.api.toggle({ reason: "press" })
    expect(instance.get().pressed).toBe(true)
    expect(() => leave?.()).not.toThrow()
  })
})
