import { describe, expect, test, vi } from "vitest"
import {
  createChange,
  createReorder,
  createTransfer,
  definePrimitive,
  type ChangeDetails,
  type ReorderDraft,
  type TransferDraft,
  type TransferLists,
} from "../src/index"

type RankingState = { value: string[]; moving: ReorderDraft | null }

const ranking = definePrimitive({
  name: "ranking",
  options: { defaultValue: "list", onValueChange: "callback" },
  state: (options: {
    defaultValue: string[]
    onValueChange?: (value: string[], details: ChangeDetails<string>) => void
  }): RankingState => ({ value: options.defaultValue, moving: null }),
  api: (context) => {
    const change = createChange(context)
    return {
      reorder: createReorder<RankingState>(context, {
        slot: "item",
        key: "value",
        draft: "moving",
        set: (value, details) => change("value", value, details),
        createAutoScroll: false,
      }),
    }
  },
  slots: (slot) => ({ item: slot<{ value: string }>({}) }),
})

type PackingState = { lists: TransferLists; moving: TransferDraft | null }

const packing = definePrimitive({
  name: "packing",
  options: { defaultLists: "value", onListsChange: "callback" },
  state: (options: {
    defaultLists: TransferLists
    onListsChange?: (lists: TransferLists) => void
  }): PackingState => ({ lists: options.defaultLists, moving: null }),
  api: (context) => {
    const change = createChange(context)
    return {
      transfer: createTransfer<PackingState>(context, {
        key: "lists",
        draft: "moving",
        set: (value, details) => change("lists", value, details),
        createAutoScroll: false,
      }),
    }
  },
  slots: (slot) => ({ item: slot<{ value: string }>({}) }),
})

// No items are bound, so every point places the moving item first.
function rankingOf(onValueChange = vi.fn()) {
  const instance = ranking({
    id: "r",
    defaultValue: ["a", "b", "c"],
    onValueChange,
  })
  return { instance, reorder: instance.api.reorder, onValueChange }
}

describe("a drag that doesn't start with pointerdown", () => {
  test("moves the item and commits once when it ends, with its event", () => {
    const { instance, reorder, onValueChange } = rankingOf()
    const handle = reorder.drag("c")!
    handle.move(10, 10)
    expect(instance.get().moving).toMatchObject({ key: "c", pointer: true })
    const up = new Event("pointerup")
    handle.end(false, up)
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0][0]).toEqual(["c", "a", "b"])
    expect(onValueChange.mock.calls[0][1]).toMatchObject({
      reason: "drag",
      event: up,
    })
  })

  test("ended as canceled, puts the item back and commits nothing", () => {
    const { instance, reorder, onValueChange } = rankingOf()
    const handle = reorder.drag("c")!
    handle.move(10, 10)
    handle.end(true)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(instance.get()).toMatchObject({
      value: ["a", "b", "c"],
      moving: null,
    })
  })

  test("its handle does nothing once its drag is over, even when another item is picked up", () => {
    const { instance, reorder, onValueChange } = rankingOf()
    const handle = reorder.drag("c")!
    reorder.cancel()
    reorder.grab("b")
    handle.move(10, 10)
    handle.end(false)
    expect(instance.get().moving).toMatchObject({
      key: "b",
      order: ["a", "b", "c"],
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("destroying the list mid-drag puts the item back and commits nothing", () => {
    const { instance, reorder, onValueChange } = rankingOf()
    const handle = reorder.drag("c")!
    handle.move(10, 10)
    instance.destroy()
    expect(instance.get().moving).toBeNull()
    handle.end(false)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test("a transfer's handle does nothing once its drag is over", () => {
    const onListsChange = vi.fn()
    const instance = packing({
      id: "p",
      defaultLists: { closet: ["boots"], bag: ["passport"] },
      onListsChange,
    })
    const handle = instance.api.transfer.drag("boots")!
    instance.api.transfer.cancel()
    instance.api.transfer.grab("passport")
    handle.end(false)
    expect(instance.get().moving).toMatchObject({ key: "passport" })
    expect(onListsChange).not.toHaveBeenCalled()
  })
})
