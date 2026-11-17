import {
  createChange,
  createTransfer,
  definePrimitive,
  type ChangeDetails,
  type TransferDraft,
  type TransferLists,
  type TransferReason,
} from "@ui-sdk/core"
import { bindTransferList, bindTransferItem } from "@ui-sdk/core/native"
import { act, render, screen } from "@testing-library/react-native"
import { Text, View } from "react-native"
import { createParts } from "../src/primitive"

type PackingState = { lists: TransferLists; moving: TransferDraft | null }

type OnListsChange = (
  lists: TransferLists,
  details: ChangeDetails<TransferReason>
) => void

const packing = definePrimitive({
  name: "packing",
  options: { defaultLists: "value", onListsChange: "callback" },
  state: (options: {
    defaultLists: TransferLists
    onListsChange?: OnListsChange
  }): PackingState => ({ lists: options.defaultLists, moving: null }),
  api: (context) => {
    const change = createChange(context)
    return {
      transfer: createTransfer<PackingState>(context, {
        key: "lists",
        draft: "moving",
        set: (value, details) => change("lists", value, details),
      }),
    }
  },
  slots: (slot) => ({
    root: slot<{}, { lists: TransferLists }>({
      state: (state, { api }) => ({ lists: api.transfer.lists(state) }),
    }),
    list: slot<{ value: string }>({
      props: { value: "string" },
      attrs: () => ({ role: "list" }),
    }),
    item: slot<{ value: string }>({
      props: { value: "string" },
      attrs: () => ({ role: "listitem" }),
      on: {
        pointerdown: (event, { api, key }) =>
          api.transfer.pointerdown(event, key),
      },
    }),
  }),
})

const parts = createParts(
  packing,
  { root: View, list: View, item: View },
  {
    list: (part) => bindTransferList(part.api.transfer, part),
    item: (part) => bindTransferItem(part.api.transfer, part),
  }
)

const lists = { closet: ["Jacket", "Boots"], bag: ["Passport"] }

// Jest's views don't lay out: the closet spans x 0 to 100 and the bag 100 to
// 200, each item 40 tall from the top in its list's order.
beforeAll(() => {
  Object.assign(View.prototype, {
    getBoundingClientRect(this: { props: { testID?: string } }) {
      const id = this.props.testID ?? ""
      if (id in lists) {
        const left = id === "closet" ? 0 : 100
        return { left, top: 0, width: 100, height: 200 }
      }
      for (const [list, items] of Object.entries(lists)) {
        const index = items.indexOf(id)
        if (index >= 0) {
          const left = list === "closet" ? 0 : 100
          return { left, top: index * 40, width: 100, height: 40 }
        }
      }
    },
  })
})

function Packing({ onListsChange }: { onListsChange?: OnListsChange }) {
  return (
    <parts.Root defaultLists={lists} onListsChange={onListsChange}>
      {({ lists: shown }: { lists: TransferLists }) =>
        Object.entries(shown).map(([list, items]) => (
          <parts.List key={list} value={list} testID={list}>
            {items.map((item) => (
              <parts.Item key={item} value={item} testID={item}>
                <Text>{item}</Text>
              </parts.Item>
            ))}
          </parts.List>
        ))
      }
    </parts.Root>
  )
}

const touch = (x: number, y: number) => ({
  nativeEvent: { pageX: x, pageY: y, touches: [] },
})

// The list's view takes its items' touches: Testing Library's events would ask the item.
async function drag(...points: [number, number][]) {
  const list = screen.getByTestId("closet")
  const [[x, y], ...rest] = points
  expect(list.props.onStartShouldSetResponder(touch(x, y))).toBe(true)
  await act(() => list.props.onResponderGrant(touch(x, y)))
  for (const [moveX, moveY] of rest) {
    await act(() => list.props.onResponderMove(touch(moveX, moveY)))
  }
  return list
}

describe("Moving between lists by touch", () => {
  test("a touch drag moves an item to another list and commits when it lifts", async () => {
    const onListsChange = jest.fn()
    await render(<Packing onListsChange={onListsChange} />)
    const list = await drag([50, 60], [80, 60], [150, 10])
    expect(onListsChange).not.toHaveBeenCalled()
    await act(() => list.props.onResponderRelease())
    expect(onListsChange).toHaveBeenCalledTimes(1)
    expect(onListsChange).toHaveBeenCalledWith(
      { closet: ["Jacket"], bag: ["Boots", "Passport"] },
      expect.objectContaining({
        reason: "drag",
        source: "touch",
        key: "Boots",
        from: "closet",
        to: "bag",
        index: 0,
      })
    )
  })

  test("a cancelled drag puts the item back and commits nothing", async () => {
    const onListsChange = jest.fn()
    await render(<Packing onListsChange={onListsChange} />)
    const list = await drag([50, 60], [80, 60], [150, 10])
    expect(screen.getByTestId("bag")).toContainElement(
      screen.getByTestId("Boots")
    )
    await act(() => list.props.onResponderTerminate())
    expect(onListsChange).not.toHaveBeenCalled()
    expect(screen.getByTestId("closet")).toContainElement(
      screen.getByTestId("Boots")
    )
  })

  test("the list's view takes its items' touches, so a moved item's new view doesn't end the drag", async () => {
    await render(<Packing />)
    expect(screen.getByTestId("closet").props.pointerEvents).toBe("box-only")
  })

  test("a touch on the list between its items takes nothing", async () => {
    await render(<Packing />)
    const list = screen.getByTestId("closet")
    expect(list.props.onStartShouldSetResponder(touch(50, 150))).toBe(false)
  })
})
