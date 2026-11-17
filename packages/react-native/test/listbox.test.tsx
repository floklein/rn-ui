import { listbox } from "@ui-sdk/core/listbox"
import { nativeHost, setNativeHost } from "@ui-sdk/core/native"
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, Text, View } from "react-native"
import { Field, FieldLabel } from "../src/field"
import {
  createListboxController,
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxProps,
  ListboxSeparator,
} from "../src/listbox"
import { checkCreation, checkDirection, checkPattern } from "../src/testing"

const os = Platform.OS as "ios" | "android"

function Fruit(props: ListboxProps<string, boolean>) {
  return (
    <Listbox<string, boolean> aria-label="Fruit" testID="list" {...props}>
      <ListboxItem value="apple" testID="apple">
        <Text>Apple</Text>
        <ListboxItemIndicator testID="apple-check" />
      </ListboxItem>
      <ListboxItem value="banana" disabled>
        <Text>Banana</Text>
      </ListboxItem>
      <ListboxItem value="cherry" testID="cherry">
        <Text>Cherry</Text>
        <ListboxItemIndicator testID="cherry-check" />
      </ListboxItem>
    </Listbox>
  )
}

const option = (name: string) => screen.getByRole("button", { name })

test("each option is its own button, selected while its value is the listbox's", async () => {
  await render(<Fruit defaultValue="apple" />)
  expect(option("Apple").props.accessibilityState).toMatchObject({
    selected: true,
  })
  expect(option("Cherry").props.accessibilityState).toMatchObject({
    selected: false,
  })
  expect(
    screen.getByTestId("apple-check", { includeHiddenElements: true })
  ).toBeTruthy()
  expect(
    screen.queryByTestId("cherry-check", { includeHiddenElements: true })
  ).toBeNull()
})

test("a press on an option selects it", async () => {
  const onValueChange = jest.fn()
  await render(<Fruit onValueChange={onValueChange} />)
  await fireEvent.press(option("Cherry"))
  expect(onValueChange).toHaveBeenCalledWith(
    "cherry",
    expect.objectContaining({ reason: "item-press" })
  )
  expect(option("Cherry").props.accessibilityState).toMatchObject({
    selected: true,
  })
})

test("with multiple, presses toggle options", async () => {
  const onValueChange = jest.fn()
  await render(
    <Fruit multiple defaultValue={[]} onValueChange={onValueChange} />
  )
  await fireEvent.press(option("Cherry"))
  await fireEvent.press(option("Apple"))
  expect(onValueChange).toHaveBeenLastCalledWith(
    ["cherry", "apple"],
    expect.anything()
  )
  await fireEvent.press(option("Cherry"))
  expect(onValueChange).toHaveBeenLastCalledWith(["apple"], expect.anything())
})

test("a disabled option reads as disabled and a press doesn't choose it", async () => {
  const onValueChange = jest.fn()
  await render(<Fruit onValueChange={onValueChange} />)
  const banana = option("Banana")
  expect(banana.props.accessibilityState).toMatchObject({ disabled: true })
  await fireEvent.press(banana)
  expect(onValueChange).not.toHaveBeenCalled()
})

test("a disabled listbox disables every option", async () => {
  await render(<Fruit disabled />)
  expect(option("Apple").props.accessibilityState).toMatchObject({
    disabled: true,
  })
})

test("a read-only listbox keeps its value", async () => {
  const onValueChange = jest.fn()
  await render(
    <Fruit readOnly defaultValue="apple" onValueChange={onValueChange} />
  )
  await fireEvent.press(option("Cherry"))
  expect(onValueChange).not.toHaveBeenCalled()
})

test("keyboard focus highlights an option in its state", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <Listbox aria-label="Fruit">
      <ListboxItem
        value="apple"
        style={(state) => {
          states.push(state)
          return {}
        }}
      >
        <Text>Apple</Text>
      </ListboxItem>
    </Listbox>
  )
  await fireEvent(option("Apple"), "focus")
  expect(states.at(-1)).toMatchObject({ highlighted: true })
  await fireEvent(option("Apple"), "blur")
  expect(states.at(-1)).toMatchObject({ highlighted: false })
})

test("the root's state holds its orientation and options", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <Fruit
      orientation="horizontal"
      multiple
      style={(state) => {
        states.push(state)
        return {}
      }}
    />
  )
  expect(states.at(-1)).toMatchObject({
    orientation: "horizontal",
    multiple: true,
    disabled: false,
  })
})

test("a controller sets and reads its value", async () => {
  const controller = createListboxController()
  await render(<Fruit controller={controller} />)
  await act(() => controller.setValue("cherry"))
  expect(option("Cherry").props.accessibilityState).toMatchObject({
    selected: true,
  })
  await fireEvent.press(option("Apple"))
  expect(controller.getValue()).toBe("apple")
})

test("data items render their options, groups and separators", async () => {
  await render(
    <Listbox
      aria-label="Produce"
      items={[
        { type: "group", label: "Fruits", items: ["Apple", "Pear"] },
        { type: "separator" },
        { value: "carrot", label: "Carrot" },
      ]}
    />
  )
  expect(option("Apple")).toBeTruthy()
  expect(option("Pear")).toBeTruthy()
  expect(option("Carrot")).toBeTruthy()
  expect(screen.getByText("Fruits")).toBeTruthy()
})

test("a group label stays in the tree and the separator is hidden", async () => {
  await render(
    <Listbox aria-label="Produce">
      <ListboxGroup>
        <ListboxGroupLabel>Fruits</ListboxGroupLabel>
        <ListboxItem value="apple">
          <Text>Apple</Text>
        </ListboxItem>
      </ListboxGroup>
      <ListboxSeparator testID="separator" />
      <ListboxItem value="carrot">
        <Text>Carrot</Text>
      </ListboxItem>
    </Listbox>
  )
  expect(screen.getByText("Fruits")).toBeTruthy()
  expect(
    screen.getByTestId("separator", { includeHiddenElements: true })
  ).not.toBeVisible()
})

test("a press on its Field's label focuses the selected option", async () => {
  const host = nativeHost()!
  const focus = jest.fn()
  setNativeHost({ ...host, focus })
  try {
    await render(
      <Field>
        <FieldLabel testID="label">Fruit</FieldLabel>
        <Fruit aria-label={undefined} defaultValue="cherry" />
      </Field>
    )
    await fireEvent.press(screen.getByTestId("label"))
    expect(focus).toHaveBeenLastCalledWith(
      expect.objectContaining({ slot: "item", key: "cherry" })
    )
  } finally {
    setNativeHost(host)
  }
})

test("passes the listbox pattern", async () => {
  await render(<Fruit />)
  await expect(
    checkPattern(screen.container, "listbox", { os, act })
  ).resolves.toBeUndefined()
})

test("passes the listbox pattern with multiple", async () => {
  await render(<Fruit multiple defaultValue={[]} />)
  await expect(
    checkPattern(screen.container, "listbox", { os, act })
  ).resolves.toBeUndefined()
})

test("passes the direction check", async () => {
  await expect(
    checkDirection(
      async () => {
        await render(<Fruit defaultValue="apple" />)
        return screen.container
      },
      { os, act }
    )
  ).resolves.toBeUndefined()
})

test("is created and destroyed with no host api", () => {
  const props = {
    item: { value: "apple" },
    "item-indicator": { item: "apple" },
    "item-icon": { item: "apple" },
    "group-label": { group: "fruits" },
  }
  expect(() =>
    checkCreation(listbox, { defaultValue: "apple" }, props)
  ).not.toThrow()
  expect(() =>
    checkCreation(listbox, { multiple: true, items: ["apple"] }, props)
  ).not.toThrow()
})

test("renders without a host", async () => {
  await render(
    <View>
      <Fruit defaultValue="apple" />
    </View>
  )
  expect(option("Apple")).toBeTruthy()
})

test("keyboard focus on an option reports it to onHighlight", async () => {
  const onHighlight = jest.fn()
  await render(<Fruit onHighlight={onHighlight} />)
  await fireEvent(option("Cherry"), "focus")
  expect(onHighlight).toHaveBeenLastCalledWith(
    "cherry",
    expect.objectContaining({ index: 2 })
  )
})
