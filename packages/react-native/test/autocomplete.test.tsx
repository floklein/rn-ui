import { nativeHost, setNativeHost } from "@ui-sdk/core/native"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native"
import { createRef } from "react"
import { type HostInstance, Platform, Text, View } from "react-native"
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  type AutocompleteProps,
  AutocompleteTrigger,
  createAutocompleteController,
} from "../src/autocomplete"
import { autocomplete } from "@ui-sdk/core/autocomplete"
import { OverlayHost } from "../src/overlays"
import { checkCreation, checkDirection, checkPattern } from "../src/testing"

const os = Platform.OS as "ios" | "android"

type Rect = [x: number, y: number, width: number, height: number]

const boxes = new Map<string | undefined, Rect>()
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  boxes.clear()
  boxes.set(undefined, [0, 0, 400, 800])
  boxes.set("input", [20, 100, 200, 40])
  boxes.set("content", [0, 0, 200, 160])
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  measureInWindow = ref.current!.measureInWindow as unknown as jest.Mock
  await cleanup()
  measureInWindow.mockImplementation(function (
    this: { props: { testID?: string } },
    onSuccess: (...rect: Rect) => void
  ) {
    onSuccess(...(boxes.get(this.props.testID) ?? [0, 0, 0, 0]))
  })
})
afterEach(() => {
  measureInWindow?.mockReset()
  jest.clearAllMocks()
})
// Typing leaves core's result count announcement pending for 500 ms; let it
// fire here, not in the next file the worker runs once this one is torn down.
afterAll(() => new Promise((done) => setTimeout(done, 600)))

function Fruit(props: AutocompleteProps) {
  return (
    <OverlayHost>
      <Autocomplete {...props}>
        <AutocompleteLabel>Fruit</AutocompleteLabel>
        <AutocompleteInput testID="input" />
        <AutocompleteTrigger testID="trigger" aria-label="Show fruit" />
        <AutocompleteContent testID="content">
          <AutocompleteItem value="Apple">
            <Text>Apple</Text>
          </AutocompleteItem>
          <AutocompleteItem value="Banana" disabled>
            <Text>Banana</Text>
          </AutocompleteItem>
          <AutocompleteItem value="Cherry">
            <Text>Cherry</Text>
          </AutocompleteItem>
          <AutocompleteEmpty testID="empty">
            <Text>No fruit</Text>
          </AutocompleteEmpty>
        </AutocompleteContent>
      </Autocomplete>
    </OverlayHost>
  )
}

const option = (name: string) =>
  screen.getByRole("button", { name, includeHiddenElements: true })
const input = () => screen.getByTestId("input")

test("the field is a combobox named by the label, collapsed", async () => {
  await render(<Fruit />)
  expect(input().props.accessibilityRole).toBe("combobox")
  expect(input().props.accessibilityLabel).toBe("Fruit")
  expect(input().props.accessibilityState).toMatchObject({ expanded: false })
})

test("typing filters the suggestions and opens them", async () => {
  const onValueChange = jest.fn()
  await render(<Fruit onValueChange={onValueChange} />)
  await fireEvent.changeText(input(), "ch")
  expect(onValueChange).toHaveBeenCalledWith(
    "ch",
    expect.objectContaining({ reason: "input-change", source: "keyboard" })
  )
  expect(input().props.value).toBe("ch")
  expect(input().props.accessibilityState).toMatchObject({ expanded: true })
  expect(option("Cherry")).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Apple" })).toBeNull()
})

test("nothing matching shows the empty part", async () => {
  await render(<Fruit />)
  await fireEvent.changeText(input(), "kiwi")
  expect(screen.getByTestId("empty")).toHaveTextContent("No fruit")
})

test("pressing a suggestion fills the field in and closes the list", async () => {
  await render(<Fruit />)
  await fireEvent.press(screen.getByTestId("trigger"))
  await fireEvent.press(option("Cherry"))
  expect(input().props.value).toBe("Cherry")
  expect(input().props.accessibilityState).toMatchObject({ expanded: false })
})

test("the return key chooses the highlighted suggestion, then submits the text", async () => {
  const onSubmit = jest.fn()
  await render(<Fruit autoHighlight onSubmit={onSubmit} />)
  await fireEvent.changeText(input(), "ap")
  expect(option("Apple").props.accessibilityState).toMatchObject({
    selected: true,
  })
  await fireEvent(input(), "submitEditing")
  expect(input().props.value).toBe("Apple")
  expect(onSubmit).not.toHaveBeenCalled()
  await fireEvent(input(), "submitEditing")
  expect(onSubmit).toHaveBeenCalledWith("Apple", expect.anything())
})

test("the return key keeps the keyboard up", async () => {
  await render(<Fruit />)
  expect(input().props.submitBehavior).toBe("submit")
})

test("typing announces the highlighted suggestion", async () => {
  const host = nativeHost()!
  const announce = jest.fn()
  setNativeHost({ ...host, announce })
  try {
    await render(<Fruit autoHighlight />)
    await fireEvent.changeText(input(), "c")
    announce.mockClear()
    await fireEvent.changeText(input(), "ch")
    await fireEvent.changeText(input(), "a")
    expect(announce).toHaveBeenCalledWith("Apple", "polite")
  } finally {
    setNativeHost(host)
  }
})

test("inline completion selects the completed rest of the text", async () => {
  await render(
    <OverlayHost>
      <Autocomplete inlineComplete items={["Apple", "Cherry"]}>
        <AutocompleteInput testID="input" aria-label="Fruit" />
      </Autocomplete>
    </OverlayHost>
  )
  await fireEvent.changeText(input(), "ch")
  expect(input().props.value).toBe("cherry")
  expect(input().props.selection).toEqual({ start: 2, end: 6 })
  await fireEvent(input(), "selectionChange", {
    nativeEvent: { selection: { start: 6, end: 6 } },
  })
  expect(input().props.selection).toBeUndefined()
})

test("inline completion goes on as typing replaces the selected rest, though iOS never reports the selection it was given", async () => {
  await render(
    <OverlayHost>
      <Autocomplete inlineComplete items={["Apple", "Cherry"]}>
        <AutocompleteInput testID="input" aria-label="Fruit" />
      </Autocomplete>
    </OverlayHost>
  )
  await fireEvent.changeText(input(), "c")
  await fireEvent(input(), "selectionChange", {
    nativeEvent: { selection: { start: 1, end: 1 } },
  })
  await fireEvent.changeText(input(), "ch")
  expect(input().props.value).toBe("cherry")
  expect(input().props.selection).toEqual({ start: 2, end: 6 })
})

test("data items render their suggestions", async () => {
  await render(
    <OverlayHost>
      <Autocomplete items={["France", "Germany"]} defaultOpen>
        <AutocompleteInput aria-label="Country" />
      </Autocomplete>
    </OverlayHost>
  )
  expect(option("France")).toBeTruthy()
  expect(option("Germany")).toBeTruthy()
})

test("a disabled autocomplete can't be edited", async () => {
  await render(<Fruit disabled />)
  expect(input().props.editable).toBe(false)
  expect(input().props.accessibilityState).toMatchObject({ disabled: true })
})

test("a controller sets the text and opens the list", async () => {
  const controller = createAutocompleteController()
  await render(<Fruit controller={controller} />)
  await act(() => controller.setValue("Apple"))
  expect(input().props.value).toBe("Apple")
  await act(() => controller.setOpen(true))
  expect(input().props.accessibilityState).toMatchObject({ expanded: true })
})

test("the list is placed below the field, lined up with its start", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <OverlayHost>
      <Autocomplete defaultOpen>
        <AutocompleteInput testID="input" aria-label="Fruit" />
        <AutocompleteContent
          testID="content"
          style={(state) => {
            states.push(state)
            return {}
          }}
        >
          <AutocompleteItem value="Apple">
            <Text>Apple</Text>
          </AutocompleteItem>
        </AutocompleteContent>
      </Autocomplete>
    </OverlayHost>
  )
  expect(states.at(-1)).toMatchObject({
    side: "bottom",
    align: "start",
    anchorWidth: 200,
    anchorHeight: 40,
  })
})

test("passes the combobox pattern", async () => {
  await render(<Fruit />)
  await expect(
    checkPattern(screen.container, "combobox", { os, act })
  ).resolves.toBeUndefined()
})

test("TalkBack's expand and collapse open and close the suggestions", async () => {
  await render(<Fruit />)
  const perform = (actionName: string) =>
    fireEvent(input(), "accessibilityAction", { nativeEvent: { actionName } })
  await perform("expand")
  expect(input().props.accessibilityState).toMatchObject({ expanded: true })
  await perform("collapse")
  expect(input().props.accessibilityState).toMatchObject({ expanded: false })
})

test("passes the direction check", async () => {
  await expect(
    checkDirection(
      async () => {
        await cleanup()
        await render(<Fruit defaultOpen />)
        return screen.container
      },
      { os, act }
    )
  ).resolves.toBeUndefined()
})

test("is created and destroyed with no host api", () => {
  expect(() =>
    checkCreation(
      autocomplete,
      { items: ["Apple"], defaultOpen: true },
      { "group-label": { group: "fruit" } }
    )
  ).not.toThrow()
})
