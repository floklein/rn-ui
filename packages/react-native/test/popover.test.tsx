import { act, cleanup, render, screen } from "@testing-library/react-native"
import { createRef } from "react"
import {
  type HostInstance,
  I18nManager,
  Keyboard,
  Text,
  View,
} from "react-native"
import { OverlayHost } from "../src/overlays"
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../src/popover"

type Rect = [x: number, y: number, width: number, height: number]

// Window boxes by test ID; the host's view has none. Jest's views share one
// measureInWindow mock.
const boxes = new Map<string | undefined, Rect>()
let measureInWindow: jest.Mock | undefined
beforeEach(async () => {
  boxes.clear()
  boxes.set(undefined, [0, 0, 400, 800])
  boxes.set("trigger", [100, 100, 80, 40])
  boxes.set("content", [0, 0, 200, 100])
  boxes.set("arrow", [0, 0, 12, 6])
  const ref = createRef<HostInstance>()
  await render(<View ref={ref} />)
  cleanup()
  measureInWindow = ref.current!.measureInWindow as unknown as jest.Mock
  measureInWindow.mockImplementation(function (
    this: { props: { testID?: string } },
    onSuccess: (...rect: Rect) => void
  ) {
    onSuccess(...(boxes.get(this.props.testID) ?? [0, 0, 0, 0]))
  })
})
afterEach(() => measureInWindow?.mockReset())

const states: Record<string, unknown>[] = []
const arrows: Record<string, unknown>[] = []
afterEach(() => {
  states.length = 0
  arrows.length = 0
})

function Example(props: React.ComponentProps<typeof Popover>) {
  return (
    <OverlayHost>
      <Popover {...props}>
        <PopoverTrigger testID="trigger">
          <Text>Share</Text>
        </PopoverTrigger>
        <PopoverContent
          testID="content"
          style={(state) => {
            states.push(state)
            return { padding: 8 }
          }}
        >
          <PopoverArrow
            testID="arrow"
            style={(state) => {
              arrows.push(state)
              return {}
            }}
          />
          <PopoverTitle>Share</PopoverTitle>
          <PopoverClose>
            <Text>Done</Text>
          </PopoverClose>
        </PopoverContent>
      </Popover>
    </OverlayHost>
  )
}

const flat = (testID: string) =>
  Object.assign(
    {},
    ...[
      screen.getByTestId(testID, { includeHiddenElements: true }).props.style,
    ].flat(9)
  )

test("the content and arrow get the placement as state before the first frame", async () => {
  await render(<Example defaultOpen />)
  expect(states.at(-1)).toMatchObject({
    open: true,
    side: "bottom",
    align: "center",
    anchorWidth: 80,
    anchorHeight: 40,
    availableWidth: 384,
    availableHeight: 648,
    transformOrigin: "100px 0px",
    arrowOffset: 100,
  })
  expect(arrows.at(-1)).toMatchObject({
    open: true,
    side: "bottom",
    align: "center",
    arrowClamped: false,
  })
  expect(flat("content")).toMatchObject({
    position: "absolute",
    left: 40,
    top: 144,
  })
  expect(flat("arrow")).toMatchObject({ position: "absolute", left: 94 })
})

test("places against the host it renders in, less the insets", async () => {
  boxes.set(undefined, [0, 20, 400, 800])
  await render(
    <OverlayHost insets={{ top: 40, bottom: 30 }}>
      <Popover defaultOpen>
        <PopoverTrigger testID="trigger">
          <Text>Share</Text>
        </PopoverTrigger>
        <PopoverContent
          testID="content"
          style={(state) => {
            states.push(state)
            return {}
          }}
        >
          <PopoverTitle>Share</PopoverTitle>
        </PopoverContent>
      </Popover>
    </OverlayHost>
  )
  expect(flat("content")).toMatchObject({ top: 124 })
  expect(states.at(-1)).toMatchObject({ availableHeight: 800 - 30 - 8 - 124 })
})

test("follows the anchor while open, writing only what changed", async () => {
  jest.useFakeTimers()
  try {
    await render(<Example defaultOpen />)
    const renders = states.length
    await act(() => jest.advanceTimersByTime(1000))
    expect(states.length).toBe(renders)
    boxes.set("trigger", [100, 60, 80, 40])
    await act(() => jest.advanceTimersByTime(1000))
    expect(flat("content")).toMatchObject({ top: 104 })
  } finally {
    jest.useRealTimers()
  }
})

test("right to left, the content is placed from the left edge with end", async () => {
  const rtl = jest.replaceProperty(I18nManager, "isRTL", true)
  try {
    await render(<Example defaultOpen />)
    const style = flat("content")
    expect(style).toMatchObject({ end: 40, top: 144 })
    expect(style.left).toBeUndefined()
    cleanup()
  } finally {
    rtl.restore()
  }
})

test("a closed popover measures nothing", async () => {
  jest.useFakeTimers()
  try {
    await render(<Example />)
    measureInWindow!.mockClear()
    await act(() => jest.advanceTimersByTime(2000))
    expect(measureInWindow).not.toHaveBeenCalled()
  } finally {
    jest.useRealTimers()
  }
})

test("the keyboard and the bottom inset are excluded once", async () => {
  const metrics = jest
    .spyOn(Keyboard, "metrics")
    .mockReturnValue({ screenX: 0, screenY: 500, width: 400, height: 300 })
  try {
    await render(
      <OverlayHost insets={{ bottom: 30 }}>
        <Popover defaultOpen>
          <PopoverTrigger testID="trigger">
            <Text>Share</Text>
          </PopoverTrigger>
          <PopoverContent
            testID="content"
            style={(state) => {
              states.push(state)
              return {}
            }}
          >
            <PopoverTitle>Share</PopoverTitle>
          </PopoverContent>
        </Popover>
      </OverlayHost>
    )
    expect(states.at(-1)).toMatchObject({ availableHeight: 500 - 8 - 144 })
    cleanup()
  } finally {
    metrics.mockRestore()
  }
})

test("a modal popover renders in a Modal, placed against the trigger outside it", async () => {
  await render(<Example defaultOpen modal />)
  const content = screen.getByTestId("content", { includeHiddenElements: true })
  let modal = false
  for (let at = content.parent; at; at = at.parent) {
    modal ||= at.type === "Modal"
  }
  expect(modal).toBe(true)
  expect(states.at(-1)).toMatchObject({ side: "bottom", anchorWidth: 80 })
})
