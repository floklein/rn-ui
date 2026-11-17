import { afterEach, describe, expect, test, vi } from "vitest"
import {
  calendar,
  type CalendarOptions,
  createCalendarController,
} from "../src/components/calendar/calendar"
import { calendarNative } from "../src/components/calendar/calendar-native"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import { partState, press } from "../src/foundation/kernel/part"
import type { Part } from "../src/foundation/kernel/primitive-types"

vi.mock(
  "../src/foundation/kernel/order",
  () => import("../src/foundation/kernel/order.native")
)
vi.mock(
  "../src/foundation/text/locale",
  () => import("../src/foundation/text/locale.native")
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
    seen: vi.fn(),
  })
  return { rendered, focus }
}

function mount(options: CalendarOptions, rendered: Part[]) {
  const instance = calendar({ id: "c", ...options } as CalendarOptions & {
    id: string
  })
  const root = instance.part("root", {}, true)
  calendarNative.root!(root)
  keep(instance)
  const mounted = new Map<string, () => void>()
  const days = new Map<string, Part>()
  function render() {
    const grid = instance.part("grid", { offset: 0 }, true)
    const { weeks } = partState(grid, { offset: 0 }) as {
      weeks: { date: string; hidden: boolean }[][]
    }
    const dates = weeks.flat().filter((cell) => !cell.hidden)
    for (const [date, leave] of mounted) {
      if (!dates.some((cell) => cell.date === date)) {
        leave()
        mounted.delete(date)
        days.delete(date)
      }
    }
    for (const { date } of dates) {
      const day = instance.part("day", { value: date, offset: 0 }, true)
      if (!mounted.has(date)) {
        days.set(date, day)
        rendered.push(day)
        mounted.set(date, calendarNative.day!(day) ?? (() => {}))
      }
    }
  }
  render()
  return { instance, days, render }
}

const flush = () =>
  new Promise((resolve) => queueMicrotask(() => resolve(undefined)))
const tick = () => new Promise((resolve) => setTimeout(resolve))

describe("a calendar on the native host", () => {
  test("names are in the device's locale from the first render", () => {
    host()
    const resolved = Intl.DateTimeFormat.prototype.resolvedOptions
    const device = vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockImplementation(function (this: Intl.DateTimeFormat) {
        return { ...resolved.call(this), locale: "de-DE" }
      })
    const instance = calendar({
      id: "c",
      defaultMonth: "2026-10",
    } as CalendarOptions & { id: string })
    const heading = partState(instance.part("heading", {}, true), {})
    device.mockRestore()
    expect((heading as { label: string }).label).toBe("Oktober 2026")
  })

  test("the root reads today and the device's locale as it mounts", () => {
    host()
    const { instance } = mount({ defaultMonth: "2026-10" }, [])
    const state = instance.get() as { today: string | null; pageLocale: string }
    expect(state.today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(state.pageLocale).toBe(
      Intl.DateTimeFormat().resolvedOptions().locale
    )
  })

  test("the controller's focus asks the host to focus the selected day", async () => {
    const { rendered, focus } = host()
    const controller = createCalendarController()
    const { days } = mount(
      { controller, defaultValue: "2026-10-16", today: "2026-10-01" },
      rendered
    )
    await flush()
    controller.focus()
    expect(focus).toHaveBeenLastCalledWith(days.get("2026-10-16"))
  })

  test("the controller focuses a date of another month once its day renders", async () => {
    const { rendered, focus } = host()
    const controller = createCalendarController()
    const { instance, days, render } = mount(
      { controller, defaultMonth: "2026-10", today: "2026-10-01" },
      rendered
    )
    await flush()
    controller.focus("2026-12-24")
    expect(instance.get().month).toBe("2026-12")
    render()
    await tick()
    expect(focus).toHaveBeenCalledTimes(1)
    expect(focus).toHaveBeenLastCalledWith(days.get("2026-12-24"))
    expect(instance.get().focused).toBe("2026-12-24")
  })

  test("pressing a day of the next month selects it, turns the month and focuses its day", async () => {
    const { rendered, focus } = host()
    const onValueChange = vi.fn()
    const { instance, days, render } = mount(
      { defaultMonth: "2026-09", today: "2026-09-01", onValueChange },
      rendered
    )
    await flush()
    press(days.get("2026-10-01")!)!()
    expect(onValueChange).toHaveBeenLastCalledWith(
      "2026-10-01",
      expect.objectContaining({ reason: "item-press" })
    )
    expect(instance.get().month).toBe("2026-10")
    render()
    await tick()
    expect(focus).toHaveBeenLastCalledWith(days.get("2026-10-01"))
  })
})
