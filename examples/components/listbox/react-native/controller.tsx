import {
  createListboxController,
  Listbox,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const toppings = [
  { value: "basil", label: "Basil" },
  { value: "cheese", label: "Extra cheese" },
  { value: "mushroom", label: "Mushroom" },
  { value: "olive", label: "Olive" },
  { value: "onion", label: "Onion" },
  { value: "pepper", label: "Pepper" },
]

const list = createListboxController<string, true>()

function Example() {
  const log = useLog()
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => list.selectAll()}>
          <Text>Select All</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => list.clear()}>
          <Text>Clear</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => list.focus()}>
          <Text>Focus</Text>
        </Pressable>
      </View>
      <Listbox
        multiple
        controller={list}
        onValueChange={(value, details) =>
          log(`${value.length} selected (${details.reason})`)
        }
        aria-label="Toppings"
        style={styles.list}
      >
        {toppings.map((topping) => (
          <ListboxItem
            key={topping.value}
            value={topping.value}
            style={itemStyle}
          >
            <Text style={styles.itemText}>{topping.label}</Text>
            <ListboxItemIndicator>
              <View style={styles.check} />
            </ListboxItemIndicator>
          </ListboxItem>
        ))}
      </Listbox>
    </View>
  )
}

const itemStyle = (
  state: ListboxItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.selected && styles.selected,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    marginRight: 4,
    borderColor: "#18181b",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  disabled: { opacity: 0.4 },
  highlighted: { backgroundColor: "#f4f4f5" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemText: { fontSize: 16 },
  list: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  selected: { backgroundColor: "#e4e4e7" },
  stack: { gap: 16 },
})

export { Example }
