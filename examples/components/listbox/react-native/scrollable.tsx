import {
  Listbox,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const timezones = Array.from({ length: 27 }, (_, index) => {
  const offset = index - 12
  const label = `UTC${offset < 0 ? "−" : "+"}${String(Math.abs(offset)).padStart(2, "0")}:00`
  return { value: `utc${offset}`, label }
})

function Example() {
  const log = useLog()
  return (
    <ScrollView style={styles.scroll}>
      <Listbox
        defaultValue="utc9"
        onHighlight={(value, details) =>
          value &&
          log(
            `Focused ${timezones[details.index].label} (${details.index + 1} of ${timezones.length})`
          )
        }
        aria-label="Time zone"
        style={styles.list}
      >
        {timezones.map((zone, index) => (
          <ListboxItem
            key={zone.value}
            value={zone.value}
            index={index}
            style={itemStyle}
          >
            <Text style={styles.itemText}>{zone.label}</Text>
            <ListboxItemIndicator>
              <View style={styles.check} />
            </ListboxItemIndicator>
          </ListboxItem>
        ))}
      </Listbox>
    </ScrollView>
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
  scroll: { maxHeight: 280, width: 260 },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }
