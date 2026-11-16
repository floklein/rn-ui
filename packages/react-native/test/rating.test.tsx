import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native"
import {
  createRatingController,
  Rating,
  RatingItem,
  type RatingItemState,
} from "../src/rating"

const sendAccessibilityEvent = jest.mocked(
  AccessibilityInfo.sendAccessibilityEvent
)

afterEach(() => sendAccessibilityEvent.mockClear())

const radio = (name: string) => screen.getByRole("radio", { name })
const checkedOf = (name: string) =>
  radio(name).props.accessibilityState?.checked

describe("Rating", () => {
  test("a press on a star checks it, from a touch and with no event", async () => {
    const onValueChange = jest.fn()
    await render(<Rating aria-label="Rating" onValueChange={onValueChange} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
    expect(checkedOf("3 stars")).toBe(false)
    await fireEvent.press(radio("3 stars"))
    expect(checkedOf("3 stars")).toBe(true)
    const [value, details] = onValueChange.mock.calls[0]
    expect(value).toBe(3)
    expect(details).toMatchObject({ reason: "item-press", source: "touch" })
    expect(details.event).toBeUndefined()
  })

  test("each star hands its children how full the score makes it", async () => {
    const seen: Record<number, RatingItemState> = {}
    await render(
      <Rating aria-label="Rating" defaultValue={2} max={3}>
        <RatingItem>
          {(state) => {
            seen[state.index] = state
            return null
          }}
        </RatingItem>
      </Rating>
    )
    expect(seen[1]).toMatchObject({ fill: 1, checked: false })
    expect(seen[2]).toMatchObject({ fill: 1, checked: true })
    expect(seen[3]).toMatchObject({ fill: 0, checked: false })
    await fireEvent.press(radio("3 stars"))
    expect(seen[3]).toMatchObject({ fill: 1, checked: true })
  })

  test("with half stars, each half is its own radio over its half of the star", async () => {
    await render(<Rating aria-label="Rating" step={0.5} max={2} />)
    expect(
      screen.getAllByRole("radio").map((node) => node.props.accessibilityLabel)
    ).toEqual(["0.5 stars", "1 star", "1.5 stars", "2 stars"])
    expect(StyleSheet.flatten(radio("1.5 stars").props.style)).toMatchObject({
      position: "absolute",
      start: "0%",
      width: "50%",
    })
    expect(StyleSheet.flatten(radio("2 stars").props.style)).toMatchObject({
      start: "50%",
      width: "50%",
    })
  })

  test("a press on the checked star clears a deselectable rating, and only that one", async () => {
    await render(<Rating aria-label="Rating" defaultValue={4} deselectable />)
    await fireEvent.press(radio("4 stars"))
    expect(checkedOf("4 stars")).toBe(false)
    await render(<Rating aria-label="Rating" defaultValue={4} />)
    await fireEvent.press(radio("4 stars"))
    expect(checkedOf("4 stars")).toBe(true)
  })

  test("a change can be cancelled, and a controlled rating shows what its parent passes", async () => {
    const { rerender } = await render(
      <Rating
        aria-label="Rating"
        onValueChange={(_value, details) => details.cancel()}
      />
    )
    await fireEvent.press(radio("2 stars"))
    expect(checkedOf("2 stars")).toBe(false)
    await rerender(<Rating aria-label="Rating" value={1} />)
    await fireEvent.press(radio("2 stars"))
    expect(checkedOf("1 star")).toBe(true)
    await rerender(<Rating aria-label="Rating" value={5} />)
    expect(checkedOf("5 stars")).toBe(true)
  })

  test("getValueLabel names each star's radio", async () => {
    await render(
      <Rating
        aria-label="Rating"
        max={2}
        getValueLabel={(value, max) => `${value} of ${max}`}
      />
    )
    expect(radio("2 of 2")).toBeTruthy()
  })

  test("a disabled rating ignores a press", async () => {
    const onValueChange = jest.fn()
    await render(
      <Rating aria-label="Rating" disabled onValueChange={onValueChange} />
    )
    await fireEvent.press(radio("2 stars"))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(radio("2 stars")).toBeDisabled()
  })

  test("a read-only rating is one image, named by its score, whose radios no one reaches", async () => {
    const onValueChange = jest.fn()
    await render(
      <Rating
        testID="rating"
        readOnly
        defaultValue={4.2}
        onValueChange={onValueChange}
      />
    )
    const root = screen.getByTestId("rating")
    expect(root.props).toMatchObject(
      Platform.OS === "ios" ? { accessible: true } : { collapsable: false }
    )
    expect(root.props).toMatchObject({
      accessibilityRole: "image",
      accessibilityLabel: "4.2 stars",
    })
    expect(screen.queryAllByRole("radio")).toHaveLength(0)
    const star = screen.getByLabelText("5 stars", {
      includeHiddenElements: true,
    })
    expect(star.props).toMatchObject({ accessible: false, focusable: false })
    await fireEvent.press(star)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("its controller's focus requests accessibility focus on the checked star", async () => {
    const controller = createRatingController()
    await render(
      <Rating aria-label="Rating" defaultValue={3} controller={controller}>
        <RatingItem>
          <View />
        </RatingItem>
      </Rating>
    )
    await act(() => controller.focus())
    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1)
    const [view, event] = sendAccessibilityEvent.mock.calls[0]
    expect(event).toBe("focus")
    expect((view as unknown as { props: object }).props).toMatchObject({
      accessibilityLabel: "3 stars",
    })
  })
})
