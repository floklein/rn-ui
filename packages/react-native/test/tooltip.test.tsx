import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, type HostInstance, Text, View } from "react-native"
import { layerInput } from "../src/native-host"
import { OverlayHost } from "../src/overlays"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipProps,
} from "../src/tooltip"

type Rect = [x: number, y: number, width: number, height: number]

// Jest's views share one measureInWindow mock: boxes by test ID, and the
// host's view, which has none, fills the window.
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  const boxes = new Map<string | undefined, Rect>([
    [undefined, [0, 0, 400, 800]],
    ["trigger", [100, 300, 40, 40]],
    ["content", [0, 0, 120, 30]],
  ])
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  screen.unmount()
  measureInWindow = ref.current!.measureInWindow as unknown as jest.Mock
  measureInWindow.mockImplementation(function (
    this: { props: { testID?: string } },
    onSuccess: (...rect: Rect) => void
  ) {
    onSuccess(...(boxes.get(this.props.testID) ?? [0, 0, 0, 0]))
  })
})
afterEach(() => measureInWindow?.mockReset())

function Example(props: TooltipProps) {
  return (
    <OverlayHost>
      <Tooltip {...props}>
        <TooltipTrigger testID="trigger" aria-label="About storage">
          <Text>i</Text>
        </TooltipTrigger>
        <TooltipContent testID="content">
          <Text>Files in the trash still use storage.</Text>
        </TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
}

const tip = "Files in the trash still use storage."

test("a press leaves a tooltip closed", async () => {
  await render(<Example />)
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(screen.queryByText(tip)).toBeNull()
})

test("a press opens a toggleable tooltip, and the next one closes it", async () => {
  await render(<Example toggleable />)
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(screen.getByText(tip)).toBeOnTheScreen()
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(screen.queryByText(tip)).toBeNull()
})

test("a long press opens nothing", async () => {
  await render(<Example toggleable />)
  await fireEvent(screen.getByTestId("trigger"), "longPress")
  expect(screen.queryByText(tip)).toBeNull()
})

test("names a trigger that has no name of its own, and describes any other", async () => {
  await render(
    <OverlayHost>
      <Tooltip>
        <TooltipTrigger testID="icon">
          <View />
        </TooltipTrigger>
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger testID="text">
          <Text>Export</Text>
        </TooltipTrigger>
        <TooltipContent>
          <Text>Download as CSV</Text>
        </TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
  expect(screen.getByTestId("icon").props.accessibilityLabel).toBe(
    "Add to library"
  )
  expect(screen.getByTestId("text").props.accessibilityLabel).toBeUndefined()
  expect(screen.getByTestId("text").props.accessibilityHint).toBe(
    "Download as CSV"
  )
})

test('type="label" names a trigger that has a name', async () => {
  await render(
    <OverlayHost>
      <Tooltip type="label">
        <TooltipTrigger testID="trigger">
          <Text>Quarterly report.pdf</Text>
        </TooltipTrigger>
        <TooltipContent>Quarterly report, final.pdf</TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
  expect(screen.getByTestId("trigger").props.accessibilityLabel).toBe(
    "Quarterly report, final.pdf"
  )
})

const pointerAt = (pointerType: string) => ({
  nativeEvent: { pointerType, clientX: 0, clientY: 0 },
})

test("a mouse resting on the trigger opens it after the delay, and leaving closes it", async () => {
  jest.useFakeTimers({ doNotFake: ["performance"] })
  // Long after another test's tooltip closed, so the group isn't warm.
  const { now } = performance
  performance.now = () => 1e15
  try {
    await render(<Example delay={300} />)
    await fireEvent(
      screen.getByTestId("trigger"),
      "pointerEnter",
      pointerAt("mouse")
    )
    await act(() => jest.advanceTimersByTime(299))
    expect(screen.queryByText(tip)).toBeNull()
    await act(() => jest.advanceTimersByTime(1))
    expect(screen.getByText(tip)).toBeOnTheScreen()
    await fireEvent(
      screen.getByTestId("trigger"),
      "pointerLeave",
      pointerAt("mouse")
    )
    await act(() => jest.advanceTimersByTime(100))
    expect(screen.queryByText(tip)).toBeNull()
  } finally {
    performance.now = now
    jest.useRealTimers()
  }
})

test("a mouse crossing from the trigger to the content within the close delay keeps it open", async () => {
  jest.useFakeTimers({ doNotFake: ["performance"] })
  const { now } = performance
  performance.now = () => 1e15
  try {
    await render(<Example delay={0} closeDelay={0} />)
    const mouse = pointerAt("mouse")
    await fireEvent(screen.getByTestId("trigger"), "pointerEnter", mouse)
    expect(screen.getByText(tip)).toBeOnTheScreen()
    await fireEvent(screen.getByTestId("trigger"), "pointerLeave", mouse)
    await act(() => jest.advanceTimersByTime(99))
    await fireEvent(screen.getByTestId("content"), "pointerEnter", mouse)
    await act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText(tip)).toBeOnTheScreen()
    await fireEvent(screen.getByTestId("content"), "pointerLeave", mouse)
    await act(() => jest.advanceTimersByTime(99))
    expect(screen.getByText(tip)).toBeOnTheScreen()
    await act(() => jest.advanceTimersByTime(1))
    expect(screen.queryByText(tip)).toBeNull()
  } finally {
    performance.now = now
    jest.useRealTimers()
  }
})

test("a touch's pointer events open nothing", async () => {
  jest.useFakeTimers()
  try {
    await render(<Example />)
    await fireEvent(
      screen.getByTestId("trigger"),
      "pointerEnter",
      pointerAt("touch")
    )
    await act(() => jest.runOnlyPendingTimers())
    expect(screen.queryByText(tip)).toBeNull()
  } finally {
    jest.useRealTimers()
  }
})

test("a press that opens a toggleable tooltip announces its text", async () => {
  const announce = jest.spyOn(
    AccessibilityInfo,
    "announceForAccessibilityWithOptions"
  )
  try {
    await render(<Example toggleable />)
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(announce).toHaveBeenCalledWith(tip, { queue: true })
    announce.mockClear()
    await fireEvent.press(screen.getByTestId("trigger"))
    expect(announce).not.toHaveBeenCalled()
  } finally {
    announce.mockRestore()
  }
})

test("Android back closes an open tooltip", async () => {
  await render(<Example defaultOpen />)
  expect(screen.getByText(tip)).toBeOnTheScreen()
  await act(() => {
    layerInput()?.back()
  })
  expect(screen.queryByText(tip)).toBeNull()
})

test("its content keeps the exit going until onExit's done", async () => {
  let done: (() => void) | undefined
  const states: Record<string, unknown>[] = []
  await render(
    <OverlayHost>
      <Tooltip toggleable>
        <TooltipTrigger testID="trigger" aria-label="Info" />
        <TooltipContent
          onExit={(end) => {
            done = end
          }}
          style={(state) => {
            states.push(state)
            return {}
          }}
        >
          <Text>Saved</Text>
        </TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
  await fireEvent.press(screen.getByTestId("trigger"))
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(states.at(-1)).toMatchObject({ open: false, endingStyle: true })
  expect(
    screen.getByText("Saved", { includeHiddenElements: true })
  ).toBeTruthy()
  await act(() => done!())
  expect(
    screen.queryByText("Saved", { includeHiddenElements: true })
  ).toBeNull()
})

type Node = {
  props: Record<string, any>
  parent: Node | null
}

// React Native's touches bubble to the root, which fireEvent doesn't do.
async function touch(testID: string) {
  const path: Node[] = []
  for (
    let at = screen.getByTestId(testID) as unknown as Node | null;
    at;
    at = at.parent
  ) {
    path.push(at)
  }
  const nativeEvent = { pageX: 10, pageY: 10 }
  await act(() => {
    for (const at of path) {
      at.props.onTouchStart?.({ nativeEvent })
    }
    for (const at of path) {
      at.props.onTouchEnd?.({ nativeEvent })
    }
  })
}

test("a press outside closes a toggleable tooltip, and a press on its trigger doesn't count as outside", async () => {
  await render(
    <OverlayHost>
      <View testID="screen">
        <Example toggleable />
      </View>
    </OverlayHost>
  )
  await touch("trigger")
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(screen.getByText(tip)).toBeOnTheScreen()
  await touch("screen")
  expect(screen.queryByText(tip)).toBeNull()
})

test("while one is open, the next opens at once, and says so in its state", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <OverlayHost>
      {["bold", "italic"].map((name) => (
        <Tooltip key={name} toggleable>
          <TooltipTrigger testID={name} aria-label={name} />
          <TooltipContent
            style={(state) => {
              states.push({ name, ...state })
              return {}
            }}
          >
            <Text>{name}</Text>
          </TooltipContent>
        </Tooltip>
      ))}
    </OverlayHost>
  )
  await fireEvent.press(screen.getByTestId("bold"))
  await fireEvent.press(screen.getByTestId("italic"))
  expect(screen.queryByText("bold")).toBeNull()
  expect(screen.getByText("italic")).toBeOnTheScreen()
  expect(
    states.filter((state) => state.name === "italic").at(-1)
  ).toMatchObject({ instant: true })
})

test("opens on top of its trigger by default", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <OverlayHost>
      <Tooltip defaultOpen>
        <TooltipTrigger testID="trigger" aria-label="Info" />
        <TooltipContent
          testID="content"
          style={(state) => {
            states.push(state)
            return {}
          }}
        >
          <Text>Tip</Text>
        </TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
  expect(states.at(-1)).toMatchObject({ side: "top", align: "center" })
  expect(
    Object.assign({}, ...[screen.getByTestId("content").props.style].flat(9))
  ).toMatchObject({ left: 60, top: 266 })
})

test("the escape gesture on its text closes it and takes the screen reader to its trigger", async () => {
  const focus = jest.mocked(AccessibilityInfo.sendAccessibilityEvent)
  focus.mockClear()
  await render(<Example defaultOpen />)
  await act(() => screen.getByTestId("content").props.onAccessibilityEscape())
  expect(screen.queryByText(tip)).toBeNull()
  expect(focus.mock.lastCall?.[1]).toBe("focus")
  expect(
    (focus.mock.lastCall?.[0] as unknown as { props: { testID: string } }).props
      .testID
  ).toBe("trigger")
})

test("a mouse over the trigger sets interaction.hovered, and a finger doesn't", async () => {
  const hovered: boolean[] = []
  await render(
    <OverlayHost>
      <Tooltip>
        <TooltipTrigger
          testID="trigger"
          aria-label="Info"
          style={(_, interaction) => {
            hovered.push(interaction.hovered)
            return {}
          }}
        />
        <TooltipContent>
          <Text>Tip</Text>
        </TooltipContent>
      </Tooltip>
    </OverlayHost>
  )
  await fireEvent(
    screen.getByTestId("trigger"),
    "pointerEnter",
    pointerAt("touch")
  )
  expect(hovered.at(-1)).toBe(false)
  await fireEvent(
    screen.getByTestId("trigger"),
    "pointerEnter",
    pointerAt("mouse")
  )
  expect(hovered.at(-1)).toBe(true)
  await fireEvent(
    screen.getByTestId("trigger"),
    "pointerLeave",
    pointerAt("mouse")
  )
  expect(hovered.at(-1)).toBe(false)
})
