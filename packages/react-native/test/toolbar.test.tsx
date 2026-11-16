import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  AccessibilityInfo,
  Text,
  type TextInputInstance,
  type HostInstance,
} from "react-native"
import { Toggle, ToggleGroup } from "../src/toggle"
import {
  createToolbarController,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
} from "../src/toolbar"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => {
  sendAccessibilityEvent.mockClear()
  jest.clearAllMocks()
})

const buttonNamed = (name: string) => screen.getByRole("button", { name })
const toggleNamed = (name: string) => screen.getByRole("togglebutton", { name })

describe("Toolbar", () => {
  test("its buttons are buttons of their own in a toolbar container, pressed with a touch", async () => {
    const onPress = jest.fn()
    await render(
      <Toolbar aria-label="Formatting" testID="toolbar">
        <ToolbarButton onPress={onPress}>
          <Text>Bold</Text>
        </ToolbarButton>
        <ToolbarButton>
          <Text>Italic</Text>
        </ToolbarButton>
      </Toolbar>
    )
    const toolbar = screen.getByTestId("toolbar")
    expect(toolbar.props.accessibilityRole).toBe("toolbar")
    expect(toolbar.props.collapsable).toBe(false)
    expect(screen.getAllByRole("button")).toHaveLength(2)
    await fireEvent.press(buttonNamed("Bold"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test("a disabled button, one in a disabled group, and every item of a disabled toolbar ignore a press", async () => {
    const onPress = jest.fn()
    const { rerender } = await render(
      <Toolbar aria-label="Edit">
        <ToolbarButton onPress={onPress}>
          <Text>Cut</Text>
        </ToolbarButton>
        <ToolbarButton disabled onPress={onPress}>
          <Text>Copy</Text>
        </ToolbarButton>
        <ToolbarGroup disabled aria-label="History">
          <ToolbarButton onPress={onPress}>
            <Text>Undo</Text>
          </ToolbarButton>
          <Toggle aria-label="Track changes" />
        </ToolbarGroup>
      </Toolbar>
    )
    expect(buttonNamed("Cut")).not.toBeDisabled()
    for (const name of ["Copy", "Undo"]) {
      expect(buttonNamed(name)).toBeDisabled()
      await fireEvent.press(buttonNamed(name))
    }
    expect(toggleNamed("Track changes")).toBeDisabled()
    expect(onPress).not.toHaveBeenCalled()
    await rerender(
      <Toolbar aria-label="Edit" disabled>
        <ToolbarButton onPress={onPress}>
          <Text>Cut</Text>
        </ToolbarButton>
        <Toggle aria-label="Bold" />
      </Toolbar>
    )
    expect(buttonNamed("Cut")).toBeDisabled()
    expect(toggleNamed("Bold")).toBeDisabled()
    await fireEvent.press(buttonNamed("Cut"))
    expect(onPress).not.toHaveBeenCalled()
  })

  test("its controller's focus requests accessibility focus on the first enabled item in render order", async () => {
    const controller = createToolbarController()
    const refs = {
      bold: createRef<HostInstance>(),
      link: createRef<HostInstance>(),
    }
    await render(
      <Toolbar aria-label="Formatting" controller={controller}>
        <ToolbarButton disabled>
          <Text>Undo</Text>
        </ToolbarButton>
        <Toggle aria-label="Bold" ref={refs.bold} />
        <ToolbarButton ref={refs.link}>
          <Text>Link</Text>
        </ToolbarButton>
      </Toolbar>
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    expect(
      sendAccessibilityEvent.mock.lastCall?.[0] === refs.bold.current
    ).toBe(true)
  })

  test("toggles in a toggle group join the toolbar, and keep their group's value", async () => {
    const controller = createToolbarController()
    const ref = createRef<HostInstance>()
    const onValueChange = jest.fn()
    await render(
      <Toolbar aria-label="Paragraph" controller={controller}>
        <ToggleGroup
          aria-label="Alignment"
          defaultValue={["left"]}
          onValueChange={onValueChange}
        >
          <Toggle value="left" aria-label="Align left" ref={ref} />
          <Toggle value="right" aria-label="Align right" />
        </ToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton>
          <Text>Clear</Text>
        </ToolbarButton>
      </Toolbar>
    )
    await fireEvent.press(toggleNamed("Align right"))
    expect(onValueChange.mock.lastCall?.[0]).toEqual(["right"])
    await act(() => controller.focus())
    expect(sendAccessibilityEvent.mock.lastCall?.[0] === ref.current).toBe(true)
  })

  test("a link has the link role and is disabled in a disabled group", async () => {
    const onPress = jest.fn()
    await render(
      <Toolbar aria-label="Pull request">
        <ToolbarLink onPress={onPress}>
          <Text>Files</Text>
        </ToolbarLink>
        <ToolbarGroup disabled>
          <ToolbarLink onPress={onPress}>
            <Text>Checks</Text>
          </ToolbarLink>
        </ToolbarGroup>
      </Toolbar>
    )
    await fireEvent.press(screen.getByRole("link", { name: "Files" }))
    await fireEvent.press(screen.getByRole("link", { name: "Checks" }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "Checks" })).toBeDisabled()
  })

  test("a disabled text field can't be edited, and the controller's focus starts editing an enabled one", async () => {
    const controller = createToolbarController()
    const ref = createRef<TextInputInstance>()
    const { rerender } = await render(
      <Toolbar aria-label="Text" controller={controller}>
        <ToolbarInput aria-label="Find" testID="find" ref={ref} />
      </Toolbar>
    )
    const field = () => screen.getByTestId("find")
    expect(field().props.editable).toBe(true)
    expect(field().props.accessibilityState).toMatchObject({ disabled: false })
    await act(() => controller.focus())
    expect(ref.current!.focus).toHaveBeenCalledTimes(1)
    await rerender(
      <Toolbar aria-label="Text" controller={controller}>
        <ToolbarInput aria-label="Find" testID="find" disabled />
      </Toolbar>
    )
    expect(field().props.editable).toBe(false)
    expect(field().props.accessibilityState).toMatchObject({ disabled: true })
  })

  test("a read-only text field can't be edited, and a disabled one stays so whatever readOnly says", async () => {
    await render(
      <Toolbar aria-label="Text">
        <ToolbarInput aria-label="Find" testID="find" readOnly />
        <ToolbarInput
          aria-label="Replace"
          testID="replace"
          disabled
          readOnly={false}
        />
      </Toolbar>
    )
    for (const id of ["find", "replace"]) {
      const field = screen.getByTestId(id)
      expect(field.props.editable).toBe(false)
      expect(field.props.readOnly).toBeUndefined()
      expect(field.props.accessibilityState).toMatchObject({ disabled: true })
    }
  })

  test("style functions get the state: a separator runs across the toolbar", async () => {
    await render(
      <Toolbar aria-label="Canvas" orientation="vertical">
        <ToolbarButton
          testID="button"
          style={(state) => ({
            opacity: state.orientation === "vertical" ? 1 : 0,
          })}
        >
          <Text>Delete</Text>
        </ToolbarButton>
        <ToolbarSeparator
          testID="separator"
          style={(state) => ({
            width: state.orientation === "horizontal" ? 10 : 1,
          })}
        />
      </Toolbar>
    )
    expect(screen.getByTestId("button")).toHaveStyle({ opacity: 1 })
    expect(screen.getByTestId("separator")).toHaveStyle({ width: 10 })
    expect(
      screen.getByTestId("separator").props.accessibilityRole
    ).toBeUndefined()
  })
})
