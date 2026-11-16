import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createRadioGroupController,
  radioGroup,
  type RadioGroupOptions,
} from "../src/components/radio/radio"
import { radioNative } from "../src/components/radio/radio-native"
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
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
  })
  return { rendered, focus }
}

function mount(
  options: RadioGroupOptions,
  rendered: Part[],
  radios: { value: string; disabled?: boolean }[]
) {
  const instance = radioGroup({ id: "g", ...options } as RadioGroupOptions & {
    id: string
  })
  instance.part("group", {}, true)
  keep(instance)
  const parts = Object.fromEntries(
    radios.map((props) => {
      const radio = instance.part("root", props, true)
      rendered.push(radio)
      radioNative.root!(radio)
      return [props.value, radio]
    })
  )
  return { instance, radios: parts }
}

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

describe("a radio group on the native host", () => {
  test("the controller's focus asks the host to focus the checked radio", async () => {
    const { rendered, focus } = host()
    const controller = createRadioGroupController()
    const { radios } = mount({ controller, defaultValue: "b" }, rendered, [
      { value: "a" },
      { value: "b" },
      { value: "c" },
    ])
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(radios.b)
  })

  test("with nothing checked, the controller's focus asks for the first enabled radio in render order", async () => {
    const { rendered, focus } = host()
    const controller = createRadioGroupController()
    const { radios } = mount({ controller }, rendered, [
      { value: "c" },
      { value: "a", disabled: true },
      { value: "b" },
    ])
    rendered.sort((x, y) => String(x.key).localeCompare(String(y.key)))
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(radios.b)
  })

  test("a radio that leaves the group is never focused", async () => {
    const { rendered, focus } = host()
    const controller = createRadioGroupController()
    const instance = radioGroup({
      id: "g",
      controller,
      defaultValue: "a",
    } as RadioGroupOptions & { id: string })
    instance.part("group", {}, true)
    keep(instance)
    const radio = instance.part("root", { value: "a" }, true)
    rendered.push(radio)
    const leave = radioNative.root!(radio)
    leave?.()
    await flush()
    controller.focus()
    expect(focus).not.toHaveBeenCalled()
  })
})
