import {
  createChange,
  createReorder,
  createTransfer,
  definePrimitive,
  type ChangeDetails,
  type ReorderDraft,
  type ReorderReason,
  type TransferDraft,
  type TransferLists,
  type TransferReason,
} from "@ui-sdk/core"
import {
  bindReorderItem,
  bindTransferItem,
  bindTransferList,
} from "@ui-sdk/core/native"
import { createParts } from "@ui-sdk/react-native/primitive"
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

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
    }),
    item: slot<{ value: string }, { dragging: boolean }>({
      props: { value: "string" },
      state: (state, part) => ({
        dragging: part.api.reorder.dragging(state, part.key),
      }),
      on: {
        pointerdown: (event, { api, key }) =>
          api.reorder.pointerdown(event, key),
      },
    }),
  }),
})

const rankingParts = createParts(
  ranking,
  { root: View, item: View },
  { item: (part) => bindReorderItem(part.api.reorder, part) }
)

type PackingState = { lists: TransferLists; moving: TransferDraft | null }

const packing = definePrimitive({
  name: "packing",
  options: { defaultLists: "value", onListsChange: "callback" },
  state: (options: {
    defaultLists: TransferLists
    onListsChange?: (
      lists: TransferLists,
      details: ChangeDetails<TransferReason>
    ) => void
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
    list: slot<{ value: string }>({ props: { value: "string" } }),
    item: slot<{ value: string }, { dragging: boolean }>({
      props: { value: "string" },
      state: (state, part) => ({
        dragging: part.api.transfer.dragging(state, part.key),
      }),
      on: {
        pointerdown: (event, { api, key }) =>
          api.transfer.pointerdown(event, key),
      },
    }),
  }),
})

const packingParts = createParts(
  packing,
  { root: View, list: View, item: View },
  {
    list: (part) => bindTransferList(part.api.transfer, part),
    item: (part) => bindTransferItem(part.api.transfer, part),
  }
)

const itemStyle = ({ dragging }: { dragging: boolean }) => [
  styles.item,
  dragging && styles.dragging,
]

function Ranking({
  name,
  items,
  onValueChange,
  onDraggingChange,
}: {
  name: string
  items: string[]
  onValueChange: (value: string[]) => void
  onDraggingChange?: (dragging: boolean) => void
}) {
  return (
    <rankingParts.Root defaultValue={items} onValueChange={onValueChange}>
      {({ order }: { order: string[] }) =>
        order.map((item) => (
          <rankingParts.Item
            key={item}
            value={item}
            testID={`${name}-${item.replace(" ", "-")}`}
            onResponderGrant={() => onDraggingChange?.(true)}
            onResponderRelease={() => onDraggingChange?.(false)}
            onResponderTerminate={() => onDraggingChange?.(false)}
            style={itemStyle}
          >
            <Text>{item}</Text>
          </rankingParts.Item>
        ))
      }
    </rankingParts.Root>
  )
}

const seasons = ["Spring", "Summer", "Autumn", "Winter"]
const tasks = ["Plan", "Draft", "Review", "Edit", "Test", "Ship"]
const rows = Array.from({ length: 12 }, (_, index) => `Row ${index + 1}`)

function Fixture() {
  const [order, setOrder] = useState(seasons)
  const [lists, setLists] = useState<TransferLists>({
    closet: ["Jacket", "Boots", "Scarf"],
    bag: ["Passport", "Charger"],
  })
  const [plain, setPlain] = useState(tasks)
  const [dragging, setDragging] = useState(false)
  const [plainTop, setPlainTop] = useState(0)
  const [area, setArea] = useState(rows)
  const [areaTop, setAreaTop] = useState(0)
  return (
    <View style={styles.fixture}>
      <Text testID="order-readout" style={styles.readout}>
        {`Order ${order.join(" ")}`}
      </Text>
      <Text testID="lists-readout" style={styles.readout}>
        {`Closet ${lists.closet.join(" ")}; Bag ${lists.bag.join(" ")}`}
      </Text>
      <Text testID="plain-readout" style={styles.readout}>
        {`Plain ${plain.join(" ")}, scrolled ${plainTop}`}
      </Text>
      <Text testID="area-readout" style={styles.readout}>
        {`Area Row 1 at ${area.indexOf("Row 1") + 1}, top ${areaTop}`}
      </Text>
      <View style={styles.row}>
        <View style={styles.column}>
          <Ranking name="season" items={seasons} onValueChange={setOrder} />
        </View>
        <packingParts.Root
          defaultLists={lists}
          onListsChange={setLists}
          style={styles.lists}
        >
          {({ lists: shown }: { lists: TransferLists }) =>
            Object.entries(shown).map(([list, items]) => (
              <packingParts.List
                key={list}
                value={list}
                testID={list}
                style={styles.list}
              >
                {items.map((item) => (
                  <packingParts.Item
                    key={item}
                    value={item}
                    testID={`pack-${item}`}
                    style={itemStyle}
                  >
                    <Text>{item}</Text>
                  </packingParts.Item>
                ))}
              </packingParts.List>
            ))
          }
        </packingParts.Root>
      </View>
      <View style={styles.row}>
        <ScrollView
          testID="plain"
          scrollEnabled={!dragging}
          onScroll={(event) =>
            setPlainTop(Math.round(event.nativeEvent.contentOffset.y))
          }
          scrollEventThrottle={16}
          style={styles.scroller}
          contentContainerStyle={styles.beside}
        >
          <Ranking
            name="task"
            items={tasks}
            onValueChange={setPlain}
            onDraggingChange={setDragging}
          />
        </ScrollView>
        <ScrollArea style={styles.scroller}>
          <ScrollAreaViewport
            testID="area"
            onScroll={(event) =>
              setAreaTop(Math.round(event.nativeEvent.contentOffset.y))
            }
          >
            <ScrollAreaContent>
              <Ranking name="row" items={rows} onValueChange={setArea} />
            </ScrollAreaContent>
          </ScrollAreaViewport>
        </ScrollArea>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 8, padding: 16, width: "100%" },
  readout: { fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  column: { flex: 1 },
  lists: { flex: 2, flexDirection: "row", gap: 8 },
  list: {
    flex: 1,
    minHeight: 150,
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  item: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  dragging: { backgroundColor: "#bfdbfe" },
  beside: { paddingEnd: 24 },
  scroller: {
    flex: 1,
    height: 160,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
})

export { Fixture }
