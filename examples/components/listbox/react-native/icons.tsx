import {
  Listbox,
  ListboxItem,
  ListboxItemIcon,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { StyleSheet, Text, View } from "react-native"

const views = [
  { value: "inbox", label: "Inbox", glyph: "✉", mirror: false },
  { value: "starred", label: "Starred", glyph: "★", mirror: false },
  { value: "drafts", label: "Drafts", glyph: "✎", mirror: false },
  { value: "archive", label: "Archive", glyph: "▤", mirror: false },
  { value: "next", label: "Next page", glyph: "→", mirror: true },
]

function Example() {
  return (
    <Listbox defaultValue="inbox" aria-label="Mailbox" style={styles.list}>
      {views.map((view) => (
        <ListboxItem key={view.value} value={view.value} style={itemStyle}>
          <View style={styles.row}>
            <ListboxItemIcon mirror={view.mirror}>
              <Text style={styles.icon}>{view.glyph}</Text>
            </ListboxItemIcon>
            <Text style={styles.itemText}>{view.label}</Text>
          </View>
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
  icon: { fontSize: 16, width: 20, textAlign: "center" },
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
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }
