import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { ScrollView, Text, View } from "react-native"
import {
  createScrollAreaController,
  ScrollArea,
  type ScrollAreaOptions,
  ScrollAreaScrollToEnd,
  type ScrollAreaState,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "../src/scroll-area"
import { Slider, SliderControl, SliderThumb } from "../src/slider"

beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 20 }),
  })
})

const viewport = () => screen.getByTestId("viewport")
const scrolled = ScrollView.prototype.scrollTo as jest.Mock
beforeEach(() => scrolled.mockClear())
const hidden = { includeHiddenElements: true }

// A 100-point viewport over 400 points of content, scrolled to `y`.
async function scrollTo(y: number, content = 400) {
  await fireEvent.scroll(viewport(), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      layoutMeasurement: { width: 100, height: 100 },
      contentSize: { width: 100, height: content },
    },
  })
}

const flat = (style: unknown) =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean))

let area: ScrollAreaState | undefined

function List({
  children,
  ...options
}: ScrollAreaOptions & { children?: React.ReactNode }) {
  return (
    <ScrollArea
      testID="root"
      style={(state) => {
        area = state
        return null
      }}
      {...options}
    >
      <ScrollAreaViewport testID="viewport">
        <ScrollAreaContent>
          <Text>Item</Text>
          {children}
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar testID="scrollbar">
        <ScrollAreaThumb testID="thumb" />
      </ScrollAreaScrollbar>
      <ScrollAreaScrollToEnd testID="to-end">
        <Text>Latest</Text>
      </ScrollAreaScrollToEnd>
    </ScrollArea>
  )
}

const thumb = () => flat(screen.getByTestId("thumb", hidden).props.style)

// Jest's views don't lay out, so the scrollbar reports its length itself,
// once it shows: Testing Library fires nothing at a view that lets touches through.
async function layOutScrollbar(height = 100) {
  await fireEvent(screen.getByTestId("scrollbar", hidden), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 10, height } },
  })
}

describe("ScrollArea", () => {
  test("reports the edges it's at from the scroll position", async () => {
    await render(<List />)
    await scrollTo(0)
    expect(area).toMatchObject({ overflowY: true, atStart: true, atEnd: false })
    await scrollTo(150)
    expect(area).toMatchObject({ atStart: false, atEnd: false })
    await scrollTo(300)
    expect(area).toMatchObject({ atStart: false, atEnd: true })
  })

  test("sizes and moves the thumb from the scroll position", async () => {
    await render(<List />)
    await scrollTo(0)
    await layOutScrollbar()
    expect(thumb()).toMatchObject({
      height: 25,
      transform: [{ translateY: 0 }],
    })
    await scrollTo(150)
    expect(thumb()).toMatchObject({ transform: [{ translateY: 37.5 }] })
  })

  test("hides the scrollbar and its thumb while nothing overflows", async () => {
    await render(<List />)
    await scrollTo(0, 100)
    expect(
      flat(screen.getByTestId("scrollbar", hidden).props.style)
    ).toMatchObject({ display: "none" })
    expect(thumb()).toMatchObject({ display: "none" })
  })

  test("hides the scrollbar from screen readers", async () => {
    await render(<List />)
    await scrollTo(0)
    expect(screen.queryByTestId("scrollbar")).toBeNull()
    expect(screen.getByTestId("scrollbar", hidden)).toBeTruthy()
  })

  test("hides the ScrollView's own indicators only while custom scrollbars are mounted", async () => {
    await render(<List />)
    expect(viewport().props.showsVerticalScrollIndicator).toBe(false)
    await render(
      <ScrollArea>
        <ScrollAreaViewport testID="viewport" />
      </ScrollArea>
    )
    expect(viewport().props.showsVerticalScrollIndicator).toBe(true)
  })

  test("its controller scrolls the ScrollView to either end", async () => {
    const controller = createScrollAreaController()
    await render(<List controller={controller} />)
    await scrollTo(0)
    expect(controller.isAtStart()).toBe(true)
    await act(() => controller.scrollToEnd({ behavior: "instant" }))
    expect(scrolled).toHaveBeenLastCalledWith({ y: 300, animated: false })
    await act(() => controller.scrollToStart())
    expect(scrolled).toHaveBeenLastCalledWith({ y: 0, animated: true })
  })

  test("the app's onScroll reads where the view is now from the controller", async () => {
    const controller = createScrollAreaController()
    const read: boolean[] = []
    await render(
      <ScrollArea controller={controller}>
        <ScrollAreaViewport
          testID="viewport"
          onScroll={() => read.push(controller.isAtEnd())}
        />
      </ScrollArea>
    )
    await scrollTo(0)
    await scrollTo(300)
    expect(read).toEqual([false, true])
  })

  test("dragging the thumb scrolls", async () => {
    await render(<List />)
    await scrollTo(0)
    await layOutScrollbar()
    const scrollbar = screen.getByTestId("scrollbar", hidden)
    await fireEvent(scrollbar, "responderGrant", {
      nativeEvent: { pageX: 5, pageY: 10 },
    })
    await fireEvent(scrollbar, "responderMove", {
      nativeEvent: { pageX: 5, pageY: 25 },
    })
    expect(scrolled).toHaveBeenLastCalledWith({ y: 60, animated: false })
    expect(area?.scrolling).toBe(false)
    await fireEvent(scrollbar, "responderRelease")
  })

  test("a touch on the scrollbar beside the thumb pages toward it", async () => {
    await render(<List />)
    await scrollTo(0)
    await layOutScrollbar()
    await fireEvent(screen.getByTestId("scrollbar", hidden), "responderGrant", {
      nativeEvent: { pageX: 5, pageY: 80 },
    })
    expect(scrolled).toHaveBeenLastCalledWith({ y: 88, animated: true })
  })

  test("with stickToEnd, follows the end as the content grows, until scrolled away", async () => {
    await render(<List stickToEnd />)
    await scrollTo(0, 100)
    await fireEvent(viewport(), "contentSizeChange", 100, 400)
    expect(scrolled).toHaveBeenLastCalledWith({ y: 300, animated: false })
    await scrollTo(300)
    await scrollTo(200)
    expect(area?.sticking).toBe(false)
    scrolled.mockClear()
    await fireEvent(viewport(), "contentSizeChange", 100, 500)
    expect(scrolled).not.toHaveBeenCalled()
  })

  test("the scroll-to-end button scrolls to the end, and is inert there", async () => {
    await render(<List />)
    await scrollTo(0)
    await fireEvent.press(screen.getByText("Latest"))
    expect(scrolled).toHaveBeenLastCalledWith({ y: 300, animated: true })
    await scrollTo(300)
    expect(screen.queryByText("Latest")).toBeNull()
  })

  test("stops its own scrolling for the length of a drag inside it", async () => {
    await render(
      <List>
        <Slider defaultValue={10}>
          <SliderControl testID="control">
            <SliderThumb aria-label="Volume" />
          </SliderControl>
        </Slider>
      </List>
    )
    expect(viewport().props.scrollEnabled).toBe(true)
    const control = screen.getByTestId("control")
    await fireEvent(control, "responderGrant", {
      nativeEvent: { pageX: 30, pageY: 10 },
    })
    expect(viewport().props.scrollEnabled).toBe(false)
    await fireEvent(control, "responderRelease")
    expect(viewport().props.scrollEnabled).toBe(true)
    await fireEvent(control, "responderGrant", {
      nativeEvent: { pageX: 30, pageY: 10 },
    })
    await fireEvent(control, "responderTerminate")
    expect(viewport().props.scrollEnabled).toBe(true)
  })
})
