import { afterEach, describe, expect, test, vi } from "vitest"
import {
  createRatingController,
  rating,
  type RatingOptions,
} from "../src/components/rating/rating"
import { ratingNative } from "../src/components/rating/rating-native"
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
    isRTL: () => false,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
  })
  return { rendered, focus }
}

function mount(options: RatingOptions, rendered: Part[], scores: string[]) {
  const instance = rating({ id: "r", ...options } as RatingOptions & {
    id: string
  })
  instance.part("root", {}, true)
  keep(instance)
  const radios = Object.fromEntries(
    scores.map((value) => {
      const radio = instance.part("radio", { value }, true)
      rendered.push(radio)
      ratingNative.radio!(radio)
      return [value, radio]
    })
  )
  return { instance, radios }
}

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))

describe("a rating on the native host", () => {
  test("the controller's focus asks the host to focus the checked radio", async () => {
    const { rendered, focus } = host()
    const controller = createRatingController()
    const { radios } = mount({ controller, defaultValue: 3 }, rendered, [
      "1",
      "2",
      "3",
      "4",
      "5",
    ])
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(radios["3"])
  })

  test("with no score, the controller's focus asks for the first radio in render order", async () => {
    const { rendered, focus } = host()
    const controller = createRatingController()
    const { radios } = mount({ controller }, rendered, ["2", "1", "3"])
    rendered.sort((a, b) => Number(a.key) - Number(b.key))
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(radios["1"])
  })

  test("a radio that leaves the rating is never focused", async () => {
    const { rendered, focus } = host()
    const controller = createRatingController()
    const instance = rating({
      id: "r",
      controller,
      defaultValue: 2,
    } as RatingOptions & { id: string })
    instance.part("root", {}, true)
    keep(instance)
    const radio = instance.part("radio", { value: "2" }, true)
    rendered.push(radio)
    const leave = ratingNative.radio!(radio)
    leave?.()
    await flush()
    controller.focus()
    expect(focus).not.toHaveBeenCalled()
  })
})
