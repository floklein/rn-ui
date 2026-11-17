import {
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
  ListboxSeparator,
} from "@ui-sdk/react-native/listbox"
import { Fragment } from "react"
import { StyleSheet, Text, View } from "react-native"

const produce = [
  {
    label: "Fruits",
    items: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "orange", label: "Orange" },
    ],
  },
  {
    label: "Vegetables",
    items: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
      { value: "spinach", label: "Spinach" },
    ],
  },
]

function Example() {
  return (
    <Listbox
      multiple
      defaultValue={["banana"]}
      aria-label="Produce"
      style={styles.list}
    >
      {produce.map((group, index) => (
        <Fragment key={group.label}>
          {index > 0 && <ListboxSeparator style={styles.separator} />}
          <ListboxGroup>
            <ListboxGroupLabel style={styles.groupLabel}>
              {group.label}
            </ListboxGroupLabel>
            {group.items.map((item) => (
              <ListboxItem
                key={item.value}
                value={item.value}
                style={itemStyle}
              >
                <Text style={styles.itemText}>{item.label}</Text>
                <ListboxItemIndicator>
                  <View style={styles.check} />
                </ListboxItemIndicator>
              </ListboxItem>
            ))}
          </ListboxGroup>
        </Fragment>
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
  disabled: { opacity: 0.4 },
  groupLabel: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: "#71717a",
  },
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
  separator: { height: 1, marginVertical: 4, backgroundColor: "#e4e4e7" },
})

export { Example }
