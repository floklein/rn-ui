import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createTabsController,
  tabs,
  type TabsOptions,
} from "../src/components/tabs/tabs"
import { tabsNative } from "../src/components/tabs/tabs-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"

// What Metro and the native build resolve in their place.
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
    announce: vi.fn(),
    activate: vi.fn(),
    listen: vi.fn(),
    compare: (a, b) => rendered.indexOf(a) - rendered.indexOf(b),
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
    scrollNear: vi.fn(),
    field: vi.fn(),
  })
  return { rendered, focus }
}

function create(options: TabsOptions = {}) {
  const owner = tabs({ id: "t", ...options })
  owner.part("root", {}, true)
  keep(owner)
  return owner
}

// A tab mounted as the adapter mounts it: its part rendered, and the native
// behavior attached while it's mounted.
function mount(
  owner: ReturnType<typeof create>,
  value: string,
  rendered: Part[],
  { at = rendered.length, disabled = false } = {}
) {
  const tab = owner.part("tab", { value, disabled }, true)
  rendered.splice(at, 0, tab)
  const leave = tabsNative.tab!(tab)
  return () => {
    leave?.()
    rendered.splice(rendered.indexOf(tab), 1)
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

describe("tabs on the native host", () => {
  test("with nothing selected, the first enabled tab in render order selects, calling nothing", async () => {
    const { rendered } = host()
    const onValueChange = vi.fn()
    const owner = create({ onValueChange })
    mount(owner, "billing", rendered)
    mount(owner, "profile", rendered, { at: 0, disabled: true })
    mount(owner, "team", rendered, { at: 1 })
    await settle()
    expect(owner.api.getValue()).toBe("team")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a selected tab that leaves selects the first enabled one, as a removal", async () => {
    const { rendered } = host()
    const onValueChange = vi.fn()
    const owner = create({ defaultValue: "billing", onValueChange })
    mount(owner, "profile", rendered)
    const leave = mount(owner, "billing", rendered)
    await settle()
    leave()
    await settle()
    expect(owner.api.getValue()).toBe("profile")
    expect(onValueChange.mock.lastCall?.[1].reason).toBe("item-removed")
  })

  test("the controller's focus asks the host to focus the selected tab", async () => {
    const { rendered, focus } = host()
    const controller = createTabsController()
    const owner = create({ defaultValue: "billing", controller })
    mount(owner, "profile", rendered)
    mount(owner, "billing", rendered)
    await settle()
    controller.focus()
    expect(focus).toHaveBeenCalledTimes(1)
    expect(focus.mock.lastCall?.[0] === rendered[1]).toBe(true)
  })
})
