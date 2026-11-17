import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Text, View } from "react-native"
import {
  createResizableController,
  Resizable,
  ResizableHandle,
  type ResizableOptions,
  ResizablePanel,
} from "../src/resizable"
import { ScrollArea, ScrollAreaViewport } from "../src/scroll-area"

// Jest's views don't lay out: every panel is 100 points wide, so two share 200.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 50 }),
  })
})

const flat = (style: unknown) =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean))

function Editor(options: ResizableOptions) {
  return (
    <Resizable testID="root" {...options}>
      <ResizablePanel id="files" testID="files" minSize={20}>
        <Text>Files</Text>
      </ResizablePanel>
      <ResizableHandle aria-label="Resize files" testID="handle" />
      <ResizablePanel id="code" testID="code">
        <Text>Code</Text>
      </ResizablePanel>
    </Resizable>
  )
}

const handle = () => screen.getByLabelText("Resize files")
const at = (x: number, y = 10) => ({ nativeEvent: { pageX: x, pageY: y } })

async function laidOut(element: React.ReactElement) {
  await render(element)
  await act(async () => {})
}

describe("Resizable", () => {
  test("a handle is one adjustable element with its panel's size", async () => {
    await laidOut(<Editor />)
    expect(handle().props.accessibilityRole).toBe("adjustable")
    expect(handle().props.accessible).toBe(true)
    expect(handle().props.accessibilityValue).toEqual({
      min: 20,
      max: 100,
      now: 50,
      text: "50%",
    })
  })

  test("panels share the group's length by their sizes", async () => {
    await laidOut(<Editor defaultLayout={[30, 70]} />)
    expect(flat(screen.getByTestId("root").props.style)).toMatchObject({
      flexDirection: "row",
    })
    expect(flat(screen.getByTestId("files").props.style)).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "30%",
    })
    expect(flat(screen.getByTestId("code").props.style)).toMatchObject({
      flexBasis: "70%",
    })
  })

  test("a touch drag moves the handle and commits once when it lifts", async () => {
    const onLayoutChange = jest.fn()
    const onLayoutCommit = jest.fn()
    await laidOut(
      <Editor onLayoutChange={onLayoutChange} onLayoutCommit={onLayoutCommit} />
    )
    const target = screen.getByTestId("handle")
    expect(target.props.onStartShouldSetResponder()).toBe(true)
    await fireEvent(target, "responderGrant", at(100))
    await fireEvent(target, "responderMove", at(120))
    await fireEvent(target, "responderMove", at(140))
    expect(handle().props.accessibilityValue.now).toBe(70)
    expect(onLayoutChange).toHaveBeenLastCalledWith(
      [70, 30],
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    expect(onLayoutCommit).not.toHaveBeenCalled()
    await fireEvent(target, "responderRelease", at(140))
    expect(onLayoutCommit).toHaveBeenCalledTimes(1)
    expect(onLayoutCommit).toHaveBeenCalledWith(
      [70, 30],
      expect.objectContaining({ reason: "drag" })
    )
    expect(flat(screen.getByTestId("files").props.style).flexBasis).toBe("70%")
  })

  test("a screen reader's increment and decrement move it a step and commit", async () => {
    const onLayoutCommit = jest.fn()
    await laidOut(<Editor step={5} onLayoutCommit={onLayoutCommit} />)
    await fireEvent(handle(), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(handle().props.accessibilityValue.now).toBe(55)
    expect(onLayoutCommit).toHaveBeenLastCalledWith(
      [55, 45],
      expect.objectContaining({ reason: "step-key", source: "virtual" })
    )
    await fireEvent(handle(), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    })
    expect(handle().props.accessibilityValue.now).toBe(50)
    expect(onLayoutCommit).toHaveBeenCalledTimes(2)
  })

  test("a drag a scroll view takes puts the layout back and commits nothing", async () => {
    const onLayoutCommit = jest.fn()
    await laidOut(<Editor onLayoutCommit={onLayoutCommit} />)
    const target = screen.getByTestId("handle")
    await fireEvent(target, "responderGrant", at(100))
    await fireEvent(target, "responderMove", at(140))
    await fireEvent(target, "responderTerminate", at(140))
    expect(handle().props.accessibilityValue.now).toBe(50)
    expect(onLayoutCommit).not.toHaveBeenCalled()
  })

  test("a vertical group stacks its panels and follows the touch down", async () => {
    await laidOut(<Editor orientation="vertical" />)
    expect(flat(screen.getByTestId("root").props.style).flexDirection).toBe(
      "column"
    )
    const target = screen.getByTestId("handle")
    await fireEvent(target, "responderGrant", at(0, 50))
    await fireEvent(target, "responderMove", at(0, 60))
    await fireEvent(target, "responderRelease", at(0, 60))
    expect(handle().props.accessibilityValue.now).toBe(60)
  })

  test("a disabled handle takes no touch and no adjustment", async () => {
    await laidOut(
      <Resizable>
        <ResizablePanel />
        <ResizableHandle aria-label="Resize files" testID="handle" disabled />
        <ResizablePanel />
      </Resizable>
    )
    expect(
      screen.getByTestId("handle").props.onStartShouldSetResponder()
    ).toBe(false)
    expect(handle().props.accessibilityState).toEqual({ disabled: true })
    await fireEvent(handle(), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    expect(handle().props.accessibilityValue.now).toBe(50)
  })

  test("a panel collapsed to nothing leaves the screen reader's reach", async () => {
    const controller = createResizableController()
    await laidOut(
      <Resizable controller={controller}>
        <ResizablePanel testID="files" collapsible minSize={20}>
          <Text>Files</Text>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize files" />
        <ResizablePanel />
      </Resizable>
    )
    await act(async () => {
      controller.collapse(0)
    })
    const files = screen.getByTestId("files", { includeHiddenElements: true })
    expect(flat(files.props.style).flexBasis).toBe("0%")
    expect(screen.queryByText("Files")).toBeNull()
  })

  test("a drag inside a Scroll Area holds its viewport still", async () => {
    await render(
      <ScrollArea>
        <ScrollAreaViewport testID="viewport" horizontal>
          <Editor />
        </ScrollAreaViewport>
      </ScrollArea>
    )
    await act(async () => {})
    const target = screen.getByTestId("handle")
    await fireEvent(target, "responderGrant", at(100))
    expect(screen.getByTestId("viewport").props.scrollEnabled).toBe(false)
    await fireEvent(target, "responderRelease", at(100))
    expect(screen.getByTestId("viewport").props.scrollEnabled).toBe(true)
  })

  test("a disabled group takes no touch", async () => {
    await laidOut(<Editor disabled />)
    expect(
      screen.getByTestId("handle").props.onStartShouldSetResponder()
    ).toBe(false)
  })
})
