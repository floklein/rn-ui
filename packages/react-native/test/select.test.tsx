import { setNativeHost, nativeHost } from "@ui-sdk/core/native"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native"
import { createRef } from "react"
import { type HostInstance, Platform, Text, View } from "react-native"
import { OverlayHost } from "../src/overlays"
import {
  createSelectController,
  Select,
  SelectContent,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectList,
  type SelectProps,
  SelectTrigger,
  SelectValue,
} from "../src/select"
import { checkPattern } from "../src/testing"

const os = Platform.OS as "ios" | "android"

type Rect = [x: number, y: number, width: number, height: number]

const boxes = new Map<string | undefined, Rect>()
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  boxes.clear()
  boxes.set(undefined, [0, 0, 400, 800])
  boxes.set("trigger", [20, 100, 200, 40])
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
afterEach(() => measureInWindow?.mockReset())

function Fruit(props: SelectProps<string, boolean>) {
  return (
    <OverlayHost>
      <Select<string, boolean> placeholder="Pick a fruit" {...props}>
        <SelectLabel>Fruit</SelectLabel>
        <SelectTrigger testID="trigger">
          <SelectValue testID="value" />
        </SelectTrigger>
        <SelectContent testID="content">
          <SelectItem value="apple">
            <Text>Apple</Text>
            <SelectItemIndicator />
          </SelectItem>
          <SelectItem value="banana" disabled>
            <Text>Banana</Text>
          </SelectItem>
          <SelectItem value="cherry">
            <Text>Cherry</Text>
          </SelectItem>
        </SelectContent>
      </Select>
    </OverlayHost>
  )
}

const option = (name: string) =>
  screen.getByRole("button", { name, includeHiddenElements: true })

test("the trigger is a combobox named by the label, with the value as its value", async () => {
  await render(<Fruit defaultValue="cherry" />)
  const trigger = screen.getByTestId("trigger")
  expect(trigger.props.accessibilityRole).toBe("combobox")
  expect(trigger.props.accessibilityLabel).toBe("Fruit")
  expect(trigger.props.accessibilityValue).toEqual({ text: "Cherry" })
  expect(trigger.props.accessibilityState).toMatchObject({ expanded: false })
  expect(screen.getByTestId("value")).toHaveTextContent("Cherry")
})

test("the value shows the placeholder while nothing is selected", async () => {
  await render(<Fruit />)
  expect(screen.getByTestId("value")).toHaveTextContent("Pick a fruit")
})

test("a press on an option selects it, closes the list and shows its label", async () => {
  const onValueChange = jest.fn()
  await render(<Fruit onValueChange={onValueChange} />)
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(screen.getByTestId("trigger").props.accessibilityState).toMatchObject({
    expanded: true,
  })
  await fireEvent.press(option("Cherry"))
  expect(onValueChange).toHaveBeenCalledWith(
    "cherry",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(screen.getByTestId("trigger").props.accessibilityState).toMatchObject({
    expanded: false,
  })
  expect(screen.getByTestId("value")).toHaveTextContent("Cherry")
})

test("each option is its own element, selected while it's the committed value", async () => {
  await render(<Fruit defaultValue="apple" defaultOpen />)
  expect(option("Apple").props.accessibilityState).toMatchObject({
    selected: true,
  })
  expect(option("Cherry").props.accessibilityState).toMatchObject({
    selected: false,
  })
})

test("with multiple, presses toggle options and the list stays open", async () => {
  const onValueChange = jest.fn()
  await render(
    <Fruit multiple defaultValue={[]} onValueChange={onValueChange} />
  )
  await fireEvent.press(screen.getByTestId("trigger"))
  await fireEvent.press(option("Cherry"))
  await fireEvent.press(option("Apple"))
  expect(onValueChange).toHaveBeenLastCalledWith(
    ["cherry", "apple"],
    expect.anything()
  )
  expect(option("Apple").props.accessibilityState).toMatchObject({
    selected: true,
  })
  await fireEvent.press(option("Cherry"))
  expect(onValueChange).toHaveBeenLastCalledWith(["apple"], expect.anything())
  expect(screen.getByTestId("trigger").props.accessibilityState).toMatchObject({
    expanded: true,
  })
  expect(screen.getByTestId("value")).toHaveTextContent("Apple")
})

test("a disabled option reads as disabled and a press doesn't choose it", async () => {
  const onValueChange = jest.fn()
  await render(<Fruit onValueChange={onValueChange} defaultOpen />)
  const banana = option("Banana")
  expect(banana.props.accessibilityState).toMatchObject({ disabled: true })
  await fireEvent.press(banana)
  expect(onValueChange).not.toHaveBeenCalled()
})

test("the label of a value is known before the list has ever opened", async () => {
  await render(<Fruit defaultValue="apple" />)
  expect(screen.getByTestId("value")).toHaveTextContent("Apple")
})

test("a value set before the list ever opened shows its item's label", async () => {
  const controller = createSelectController()
  await render(<Fruit controller={controller} />)
  await act(() => controller.setValue("cherry"))
  expect(screen.getByTestId("value")).toHaveTextContent("Cherry")
  expect(screen.getByTestId("trigger").props.accessibilityValue).toEqual({
    text: "Cherry",
  })
})

test("a labelled trigger cleared with no placeholder sends an empty value", async () => {
  const controller = createSelectController()
  await render(
    <Fruit
      controller={controller}
      placeholder={undefined}
      defaultValue="apple"
    />
  )
  expect(screen.getByTestId("trigger").props.accessibilityValue).toEqual({
    text: "Apple",
  })
  await act(() => controller.clear())
  expect(screen.getByTestId("trigger").props.accessibilityValue).toEqual({
    text: "",
  })
})

test("typing in the search field announces the highlighted option", async () => {
  const host = nativeHost()!
  const announce = jest.fn()
  setNativeHost({ ...host, announce })
  try {
    await render(
      <OverlayHost>
        <Select defaultOpen>
          <SelectTrigger aria-label="Fruit" />
          <SelectContent>
            <SelectInput aria-label="Search fruit" testID="search" />
            <SelectList>
              <SelectItem value="apple">
                <Text>Apple</Text>
              </SelectItem>
              <SelectItem value="cherry">
                <Text>Cherry</Text>
              </SelectItem>
            </SelectList>
          </SelectContent>
        </Select>
      </OverlayHost>
    )
    announce.mockClear()
    await fireEvent.changeText(screen.getByTestId("search"), "ch")
    expect(announce).toHaveBeenCalledWith("Cherry", "polite")
    await fireEvent.changeText(screen.getByTestId("search"), "")
    announce.mockClear()
    await fireEvent(option("Cherry"), "focus")
    expect(announce).not.toHaveBeenCalled()
    await fireEvent(screen.getByTestId("search"), "focus")
    await fireEvent.changeText(screen.getByTestId("search"), "ap")
    expect(announce).toHaveBeenCalledWith("Apple", "polite")
  } finally {
    setNativeHost(host)
  }
})

test("data items render their options", async () => {
  await render(
    <OverlayHost>
      <Select
        defaultOpen
        items={[
          { value: "fr", label: "France" },
          { value: "de", label: "Germany" },
        ]}
      >
        <SelectTrigger aria-label="Country" />
      </Select>
    </OverlayHost>
  )
  expect(option("France")).toBeTruthy()
  expect(option("Germany")).toBeTruthy()
})

test("a controller opens it and reads its value", async () => {
  const controller = createSelectController()
  await render(<Fruit controller={controller} />)
  await act(() => controller.setOpen(true))
  await fireEvent.press(option("Apple"))
  expect(controller.getValue()).toBe("apple")
})

test("passes the combobox pattern", async () => {
  await render(<Fruit />)
  await expect(
    checkPattern(screen.container, "combobox", { os, act })
  ).resolves.toBeUndefined()
})

test("passes the combobox pattern without a Modal", async () => {
  await render(<Fruit modal={false} />)
  await expect(
    checkPattern(screen.container, "combobox", { os, act })
  ).resolves.toBeUndefined()
})

test("passes the listbox pattern on its open list", async () => {
  await render(<Fruit multiple defaultValue={[]} defaultOpen />)
  await expect(
    checkPattern(screen.container, "listbox", { os, act })
  ).resolves.toBeUndefined()
})
