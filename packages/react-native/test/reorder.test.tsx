import {
  createChange,
  createReorder,
  definePrimitive,
  type ChangeDetails,
  type ReorderDraft,
  type ReorderReason,
} from "@ui-sdk/core"
import { bindReorderItem } from "@ui-sdk/core/native"
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Pressable, ScrollView, Text, View } from "react-native"
import { createParts } from "../src/primitive"
import { ScrollArea, ScrollAreaViewport } from "../src/scroll-area"

type RankingState = { value: string[]; moving: ReorderDraft | null }

const ranking = definePrimitive({
  name: "ranking",
  options: { defaultValue: "list", onValueChange: "callback" },
  state: (options: {
    defaultValue: string[]
    onValueChange?: (
      value: string[],
      details: ChangeDetails<ReorderReason>
    ) => void
  }): RankingState => ({ value: options.defaultValue, moving: null }),
  api: (context) => {
    const change = createChange(context)
    return {
      reorder: createReorder<RankingState>(context, {
        slot: "item",
        key: "value",
        draft: "moving",
        set: (value, details) => change("value", value, details),
      }),
    }
  },
  slots: (slot) => ({
    root: slot<{}, { order: string[] }>({
      state: (state, { api }) => ({ order: api.reorder.order(state) }),
      attrs: () => ({ role: "list" }),
    }),
    item: slot<{ value: string }, { dragging: boolean }>({
      props: { value: "string" },
      state: (state, part) => ({
        dragging: part.api.reorder.dragging(state, part.key),
      }),
      attrs: () => ({ role: "listitem" }),
      on: {
        pointerdown: (event, { api, key }) =>
          api.reorder.pointerdown(event, key),
      },
    }),
  }),
})

const parts = createParts(
  ranking,
  { root: View, item: View },
  { item: (part) => bindReorderItem(part.api.reorder, part) }
)

const seasons = ["Spring", "Summer", "Autumn", "Winter"]

// Jest's views don't lay out: each item is 40 tall, stacked from the top.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect(this: { props: { testID?: string } }) {
      const index = seasons.indexOf(this.props.testID ?? "")
      return { left: 0, top: index * 40, width: 100, height: 40 }
    },
  })
  Object.assign(ScrollView.prototype, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  })
})

function Seasons(props: {
  onValueChange?: (
    value: string[],
    details: ChangeDetails<ReorderReason>
  ) => void
}) {
  return (
    <parts.Root defaultValue={seasons} {...props}>
      {({ order }: { order: string[] }) =>
        order.map((season) => (
          <parts.Item key={season} value={season} testID={season}>
            <Text>{season}</Text>
          </parts.Item>
        ))
      }
    </parts.Root>
  )
}

const at = (y: number) => ({ nativeEvent: { pageX: 50, pageY: y } })

async function drag(season: string, ...ys: number[]) {
  const item = screen.getByTestId(season)
  const [first, ...rest] = ys
  expect(item.props.onStartShouldSetResponder(at(first))).toBe(true)
  await fireEvent(item, "responderGrant", at(first))
  for (const y of rest) {
    await fireEvent(item, "responderMove", at(y))
  }
  return item
}

const shown = () =>
  screen.getAllByRole("text").map((text) => text.props.children)

describe("Reordering by touch", () => {
  test("a touch drag moves an item and commits once when it lifts", async () => {
    const onValueChange = jest.fn()
    await render(<Seasons onValueChange={onValueChange} />)
    const item = await drag("Spring", 20, 30, 70, 110)
    expect(shown()).toEqual(["Summer", "Autumn", "Spring", "Winter"])
    expect(onValueChange).not.toHaveBeenCalled()
    await fireEvent(item, "responderRelease")
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(
      ["Summer", "Autumn", "Spring", "Winter"],
      expect.objectContaining({ reason: "drag", source: "touch" })
    )
    expect(shown()).toEqual(["Summer", "Autumn", "Spring", "Winter"])
  })

  test("a cancelled drag puts the item back and commits nothing", async () => {
    const onValueChange = jest.fn()
    await render(<Seasons onValueChange={onValueChange} />)
    const item = await drag("Spring", 20, 70, 110)
    expect(shown()).not.toEqual(seasons)
    await fireEvent(item, "responderTerminate")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(shown()).toEqual(seasons)
  })

  test("a drag cut short by unmounting commits nothing", async () => {
    const onValueChange = jest.fn()
    await render(<Seasons onValueChange={onValueChange} />)
    await drag("Spring", 20, 70, 110)
    expect(shown()).not.toEqual(seasons)
    await screen.rerender(<View />)
    await screen.rerender(<Seasons onValueChange={onValueChange} />)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(shown()).toEqual(seasons)
  })

  test("a touch that barely moves picks nothing up", async () => {
    const onValueChange = jest.fn()
    await render(<Seasons onValueChange={onValueChange} />)
    const item = await drag("Spring", 20, 22)
    await fireEvent(item, "responderRelease")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("the dragged item's state says it's dragging", async () => {
    const styles: boolean[] = []
    await render(
      <parts.Root defaultValue={seasons}>
        {({ order }: { order: string[] }) =>
          order.map((season) => (
            <parts.Item
              key={season}
              value={season}
              testID={season}
              style={({ dragging }: { dragging: boolean }) => {
                if (season === "Spring") {
                  styles.push(dragging)
                }
                return {}
              }}
            >
              <Text>{season}</Text>
            </parts.Item>
          ))
        }
      </parts.Root>
    )
    await drag("Spring", 20, 70)
    expect(styles.at(-1)).toBe(true)
  })

  test("inside a Scroll Area, a drag near its edge scrolls it until it lifts", async () => {
    const scrolled = ScrollView.prototype.scrollTo as jest.Mock
    scrolled.mockClear()
    await render(
      <ScrollArea>
        <ScrollAreaViewport testID="viewport">
          <Seasons />
        </ScrollAreaViewport>
      </ScrollArea>
    )
    await fireEvent.scroll(screen.getByTestId("viewport"), {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        layoutMeasurement: { width: 100, height: 100 },
        contentSize: { width: 100, height: 400 },
      },
    })
    const item = await drag("Spring", 20, 60, 100)
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(scrolled).toHaveBeenCalledWith({ y: 18, animated: false })
    const steps = scrolled.mock.calls.length
    await fireEvent(item, "responderRelease")
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(scrolled).toHaveBeenCalledTimes(steps)
  })

  test("a drag in the middle of a Scroll Area scrolls nothing", async () => {
    const scrolled = ScrollView.prototype.scrollTo as jest.Mock
    scrolled.mockClear()
    await render(
      <ScrollArea>
        <ScrollAreaViewport testID="viewport">
          <Seasons />
        </ScrollAreaViewport>
      </ScrollArea>
    )
    await fireEvent.scroll(screen.getByTestId("viewport"), {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        layoutMeasurement: { width: 100, height: 100 },
        contentSize: { width: 100, height: 400 },
      },
    })
    await drag("Spring", 20, 40, 50)
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(scrolled).not.toHaveBeenCalled()
  })

  test("a pressable item, which never gets the drag, warns in development", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    const pressable = createParts(
      ranking,
      { root: View, item: Pressable },
      { item: (part) => bindReorderItem(part.api.reorder, part) }
    )
    await render(
      <pressable.Root defaultValue={seasons}>
        <pressable.Item value="Spring">
          <Text>Spring</Text>
        </pressable.Item>
      </pressable.Root>
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("follows touch drags, but it's pressable")
    )
  })
})
