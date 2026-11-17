import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import { AccessibilityInfo, type HostInstance, Text, View } from "react-native"
import {
  createHoverCardController,
  HoverCard,
  HoverCardContent,
  type HoverCardProps,
  HoverCardTrigger,
} from "../src/hover-card"
import { layerInput } from "../src/native-host"
import { OverlayHost } from "../src/overlays"

type Rect = [x: number, y: number, width: number, height: number]

// Jest's views share one measureInWindow mock: boxes by test ID, and the
// host's view, which has none, fills the window.
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  const boxes = new Map<string | undefined, Rect>([
    [undefined, [0, 0, 400, 800]],
    ["trigger", [100, 300, 60, 20]],
    ["content", [0, 0, 200, 100]],
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

const bio = "Design engineer on the payments team."

function Example({
  onPress,
  ...props
}: HoverCardProps & { onPress?: () => void }) {
  return (
    <OverlayHost>
      <View testID="screen">
        <HoverCard {...props}>
          <HoverCardTrigger testID="trigger" onPress={onPress}>
            <Text>@hollis</Text>
          </HoverCardTrigger>
          <HoverCardContent testID="content">
            <Text>{bio}</Text>
          </HoverCardContent>
        </HoverCard>
      </View>
    </OverlayHost>
  )
}

const pointerAt = (pointerType: string) => ({
  nativeEvent: { pointerType, clientX: 0, clientY: 0 },
})

const pointer = (testID: string, type: "pointerEnter" | "pointerLeave") =>
  fireEvent(screen.getByTestId(testID), type, pointerAt("mouse"))

type Node = {
  parent: Node | null
  props: Record<string, ((event: object) => void) | undefined>
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

async function withTimers(run: () => Promise<void>) {
  jest.useFakeTimers()
  try {
    await run()
  } finally {
    jest.useRealTimers()
  }
}

test("its trigger is a link, whose press runs the app's handler and leaves the card closed", async () => {
  const onPress = jest.fn()
  await render(<Example onPress={onPress} />)
  expect(screen.getByRole("link", { name: "@hollis" })).toBeOnTheScreen()
  await fireEvent.press(screen.getByTestId("trigger"))
  expect(onPress).toHaveBeenCalledTimes(1)
  expect(screen.queryByText(bio)).toBeNull()
})

test("a mouse resting on the trigger opens it after the delay, and leaving closes it after the close delay", () =>
  withTimers(async () => {
    await render(<Example delay={300} closeDelay={200} />)
    await pointer("trigger", "pointerEnter")
    await act(() => jest.advanceTimersByTime(299))
    expect(screen.queryByText(bio)).toBeNull()
    await act(() => jest.advanceTimersByTime(1))
    expect(screen.getByText(bio)).toBeOnTheScreen()
    await pointer("trigger", "pointerLeave")
    await act(() => jest.advanceTimersByTime(199))
    expect(screen.getByText(bio)).toBeOnTheScreen()
    await act(() => jest.advanceTimersByTime(1))
    expect(screen.queryByText(bio)).toBeNull()
  }))

test("a pointer that reaches the card within the close delay keeps it open, until it leaves the card", () =>
  withTimers(async () => {
    await render(<Example />)
    await pointer("trigger", "pointerEnter")
    await act(() => jest.advanceTimersByTime(600))
    await pointer("trigger", "pointerLeave")
    await act(() => jest.advanceTimersByTime(250))
    await pointer("content", "pointerEnter")
    await act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText(bio)).toBeOnTheScreen()
    await pointer("content", "pointerLeave")
    await act(() => jest.advanceTimersByTime(300))
    expect(screen.queryByText(bio)).toBeNull()
  }))

test("a close delay under 100 ms still leaves the pointer 100 ms to reach the card", () =>
  withTimers(async () => {
    await render(<Example delay={0} closeDelay={0} />)
    await pointer("trigger", "pointerEnter")
    await act(() => jest.advanceTimersByTime(0))
    await pointer("trigger", "pointerLeave")
    await act(() => jest.advanceTimersByTime(99))
    await pointer("content", "pointerEnter")
    await act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText(bio)).toBeOnTheScreen()
    await pointer("content", "pointerLeave")
    await act(() => jest.advanceTimersByTime(99))
    expect(screen.getByText(bio)).toBeOnTheScreen()
    await act(() => jest.advanceTimersByTime(1))
    expect(screen.queryByText(bio)).toBeNull()
  }))

test("a touch's pointer events open nothing", () =>
  withTimers(async () => {
    await render(<Example />)
    await fireEvent(
      screen.getByTestId("trigger"),
      "pointerEnter",
      pointerAt("touch")
    )
    await act(() => jest.runOnlyPendingTimers())
    expect(screen.queryByText(bio)).toBeNull()
  }))

test("a disabled card stays closed under the pointer", () =>
  withTimers(async () => {
    await render(<Example disabled />)
    await pointer("trigger", "pointerEnter")
    await act(() => jest.runOnlyPendingTimers())
    expect(screen.queryByText(bio)).toBeNull()
  }))

test("Android back closes an open card", async () => {
  await render(<Example defaultOpen />)
  await act(() => {
    layerInput()?.back()
  })
  expect(screen.queryByText(bio)).toBeNull()
})

test("the escape gesture on the card closes it", async () => {
  await render(<Example defaultOpen />)
  await act(() => screen.getByTestId("content").props.onAccessibilityEscape())
  expect(screen.queryByText(bio)).toBeNull()
})

test("a press outside closes it, and a press on its link doesn't count as outside", async () => {
  await render(<Example defaultOpen />)
  await touch("trigger")
  expect(screen.getByText(bio)).toBeOnTheScreen()
  await touch("screen")
  expect(screen.queryByText(bio)).toBeNull()
})

test("closing a card the screen reader never entered leaves its focus alone", async () => {
  const focus = jest.mocked(AccessibilityInfo.sendAccessibilityEvent)
  await render(<Example defaultOpen />)
  focus.mockClear()
  await touch("screen")
  expect(screen.queryByText(bio)).toBeNull()
  expect(focus).not.toHaveBeenCalled()
})

test("the escape gesture on the card takes the screen reader back to its link", async () => {
  const focus = jest.mocked(AccessibilityInfo.sendAccessibilityEvent)
  await render(<Example defaultOpen />)
  focus.mockClear()
  await act(() => screen.getByTestId("content").props.onAccessibilityEscape())
  expect(
    (focus.mock.lastCall?.[0] as unknown as { props: { testID: string } })
      ?.props.testID
  ).toBe("trigger")
})

test("opens below its trigger, centered, by default", async () => {
  const states: Record<string, unknown>[] = []
  await render(
    <OverlayHost>
      <HoverCard defaultOpen>
        <HoverCardTrigger testID="trigger">
          <Text>@hollis</Text>
        </HoverCardTrigger>
        <HoverCardContent
          testID="content"
          style={(state) => {
            states.push(state)
            return {}
          }}
        >
          <Text>{bio}</Text>
        </HoverCardContent>
      </HoverCard>
    </OverlayHost>
  )
  expect(states.at(-1)).toMatchObject({
    open: true,
    side: "bottom",
    align: "center",
  })
  expect(
    Object.assign({}, ...[screen.getByTestId("content").props.style].flat(9))
  ).toMatchObject({ left: 30, top: 324 })
})

test("links connected by a controller share one card, each with its payload", () =>
  withTimers(async () => {
    const profile = createHoverCardController<string>()
    await render(
      <OverlayHost>
        {["hollis", "ines"].map((name) => (
          <HoverCardTrigger
            key={name}
            testID={name}
            controller={profile}
            payload={name}
          >
            <Text>@{name}</Text>
          </HoverCardTrigger>
        ))}
        <HoverCard controller={profile}>
          <HoverCardContent<string>>
            {(state) => <Text>Profile of {state.payload}</Text>}
          </HoverCardContent>
        </HoverCard>
      </OverlayHost>
    )
    expect(screen.getAllByRole("link")).toHaveLength(2)
    await pointer("ines", "pointerEnter")
    await act(() => jest.advanceTimersByTime(600))
    expect(screen.getByText("Profile of ines")).toBeOnTheScreen()
    await pointer("ines", "pointerLeave")
    await pointer("hollis", "pointerEnter")
    expect(screen.getByText("Profile of hollis")).toBeOnTheScreen()
  }))
