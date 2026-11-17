import {
  Listbox,
  ListboxItem,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { StyleSheet, Text } from "react-native"

const sizes = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL", disabled: true },
]

function Example() {
  return (
    <Listbox
      orientation="horizontal"
      defaultValue="m"
      aria-label="Size"
      style={styles.row}
    >
      {sizes.map((size) => (
        <ListboxItem
          key={size.value}
          value={size.value}
          disabled={size.disabled}
          style={itemStyle}
        >
          <Text style={styles.itemText}>{size.label}</Text>
        </ListboxItem>
      ))}
    </Listbox>
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
  disabled: { opacity: 0.4 },
  highlighted: { backgroundColor: "#f4f4f5" },
  item: {
    minWidth: 44,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemText: { fontSize: 16 },
  row: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }
