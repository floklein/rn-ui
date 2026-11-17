import { afterEach, expect, test, vi } from "vitest"
import {
  autocomplete,
  type AutocompleteOptions,
} from "../src/components/autocomplete/autocomplete"
import {
  autocompleteNative,
  pressAutocompleteTrigger,
  submitAutocomplete,
  typeAutocomplete,
} from "../src/components/autocomplete/autocomplete-native"
import { withSource } from "../src/foundation/kernel/details"
import { keep } from "../src/foundation/kernel/keep"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import type { Part } from "../src/foundation/kernel/primitive-types"
import { press } from "../src/renderer"

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
vi.mock(
  "../src/foundation/forms/form",
  () => import("../src/foundation/forms/form.native")
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

const fruits = ["Apple", "Banana", "Cherry"]

// Mounts the parts a native adapter would: the label, field and trigger at
// once, and the content with its suggestions while it's mounted.
function mount(options: AutocompleteOptions = {}) {
  const instance = autocomplete({ id: "a", ...options })
  keep(instance)
  const rendered: Part[] = []
  const always = {} as Record<"label" | "input" | "trigger", Part>
  for (const slot of ["label", "input", "trigger"] as const) {
    const part = instance.part(slot, {})
    always[slot] = part
    rendered.push(part)
    unmounts.push(autocompleteNative[slot]?.(part) ?? (() => {}))
  }
  let mounted = false
  let cleanups: ((() => void) | void)[] = []
  const parts: Record<string, Part> = {}
  const render = () => {
    if (instance.get().mounted && !mounted) {
      mounted = true
      for (const value of fruits) {
        const part = instance.part("item", { id: value, value, label: value })
        parts[value] = part
        rendered.push(part)
        cleanups.push(autocompleteNative.item!(part))
      }
      const content = instance.part("content", {})
      cleanups.push(autocompleteNative.content!(content))
    } else if (!instance.get().mounted && mounted) {
      mounted = false
      cleanups.forEach((cleanup) => cleanup?.())
      cleanups = []
    }
  }
  instance.subscribe(render)
  render()
  unmounts.push(() => cleanups.forEach((cleanup) => cleanup?.()))
  return { instance, ...always, parts }
}

const slots = (parts: Part[]) =>
  parts.map((part) => (part.slot === "item" ? part.key : part.slot))

test("typing opens the suggestions and keeps focus in the field", () => {
  const { focused } = host()
  const { instance } = mount()
  typeAutocomplete(instance.api, "ch", true)
  expect(instance.get().value).toBe("ch")
  expect(instance.get().open).toBe(true)
  expect(focused).toEqual([])
})

test("typing filters the suggestions", () => {
  host()
  const { instance } = mount()
  typeAutocomplete(instance.api, "an", true)
  expect(
    instance.api.internal.listbox.entries().map((entry) => entry.key)
  ).toEqual(["Banana"])
})

test("the highlight that typing moves is announced", () => {
  const { announced } = host()
  const { instance } = mount({ items: fruits, autoHighlight: true })
  typeAutocomplete(instance.api, "c", true)
  typeAutocomplete(instance.api, "", true)
  typeAutocomplete(instance.api, "b", true)
  expect(instance.get().highlighted).toBe("Banana")
  expect(announced).toContain("Banana")
})

test("with inlineComplete, typing at the end completes the first match and selects the rest", () => {
  host()
  const { instance } = mount({ items: fruits, inlineComplete: true })
  expect(typeAutocomplete(instance.api, "ch", true)).toEqual({
    start: 2,
    end: 6,
  })
  expect(instance.get().value).toBe("cherry")
  expect(instance.get().query).toBe("ch")
})

test("with inlineComplete, deleting doesn't complete", () => {
  host()
  const { instance } = mount({ items: fruits, inlineComplete: true })
  typeAutocomplete(instance.api, "ch", true)
  expect(typeAutocomplete(instance.api, "ch", true)).toBeUndefined()
  expect(typeAutocomplete(instance.api, "c", true)).toBeUndefined()
  expect(instance.get().value).toBe("c")
})

test("typing away from the end doesn't complete", () => {
  host()
  const { instance } = mount({ items: fruits, inlineComplete: true })
  expect(typeAutocomplete(instance.api, "ch", false)).toBeUndefined()
  expect(instance.get().value).toBe("ch")
})

test("a screen reader's press on the trigger moves focus to the first suggestion", () => {
  const { focused } = host()
  const { instance, trigger } = mount()
  pressAutocompleteTrigger(trigger, "virtual")
  expect(instance.get().open).toBe(true)
  expect(instance.get().focusInList).toBe(true)
  expect(slots(focused)).toEqual(["Apple"])
})

test("a touch on the trigger opens the suggestions and leaves focus alone", () => {
  const { focused } = host()
  const { instance, trigger } = mount()
  pressAutocompleteTrigger(trigger, "touch")
  expect(instance.get().open).toBe(true)
  expect(focused).toEqual([])
  pressAutocompleteTrigger(trigger, "touch")
  expect(instance.get().open).toBe(false)
})

test("pressing a suggestion fills the field in and closes the list", () => {
  host()
  const { instance, trigger, parts } = mount()
  pressAutocompleteTrigger(trigger, "touch")
  press(parts.Cherry, parts.Cherry.props)!()
  expect(instance.get().value).toBe("Cherry")
  expect(instance.get().open).toBe(false)
})

test("submitting with a highlighted suggestion chooses it without submitting", () => {
  host()
  const onSubmit = vi.fn()
  const { instance } = mount({ items: fruits, autoHighlight: true, onSubmit })
  typeAutocomplete(instance.api, "b", true)
  submitAutocomplete(instance.api)
  expect(instance.get().value).toBe("Banana")
  expect(instance.get().open).toBe(false)
  expect(onSubmit).not.toHaveBeenCalled()
})

test("with submitOnSelect, submitting a highlighted suggestion submits it", () => {
  host()
  const onSubmit = vi.fn()
  const { instance } = mount({
    items: fruits,
    autoHighlight: true,
    submitOnSelect: true,
    onSubmit,
  })
  typeAutocomplete(instance.api, "b", true)
  submitAutocomplete(instance.api)
  expect(onSubmit).toHaveBeenCalledWith("Banana", expect.anything())
})

test("submitting with nothing highlighted closes the list and submits the text", () => {
  host()
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()
  const { instance } = mount({ onSubmit, onOpenChange })
  typeAutocomplete(instance.api, "kiwi", true)
  submitAutocomplete(instance.api)
  expect(instance.get().open).toBe(false)
  expect(onOpenChange).toHaveBeenLastCalledWith(
    false,
    expect.objectContaining({ reason: "input-commit" })
  )
  expect(onSubmit).toHaveBeenCalledWith("kiwi", expect.anything())
})

test("the controller's focus and the label's press focus the field", () => {
  const { focused } = host()
  const { instance, label } = mount()
  instance.api.focus()
  press(label, label.props)!()
  expect(slots(focused)).toEqual(["input", "input"])
})

test("a disabled autocomplete doesn't take typing", () => {
  host()
  const { instance } = mount({ disabled: true })
  typeAutocomplete(instance.api, "a", true)
  expect(instance.get().value).toBe("")
  expect(instance.get().open).toBe(false)
})

test("a screen reader choosing a suggestion goes back to the field", () => {
  const { focused } = host()
  const { trigger, parts } = mount()
  pressAutocompleteTrigger(trigger, "virtual")
  focused.length = 0
  withSource("virtual", () => press(parts.Cherry, parts.Cherry.props)!())
  expect(slots(focused)).toEqual(["input"])
})

test("a touch choosing a suggestion leaves focus alone", () => {
  const { focused } = host()
  const { trigger, parts } = mount()
  pressAutocompleteTrigger(trigger, "touch")
  withSource("touch", () => press(parts.Cherry, parts.Cherry.props)!())
  expect(focused).toEqual([])
})
