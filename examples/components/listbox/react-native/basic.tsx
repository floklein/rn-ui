import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Listbox,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { StyleSheet, Text, View } from "react-native"

const topics = [
  { value: "comments", label: "Comments" },
  { value: "mentions", label: "Mentions" },
  { value: "reactions", label: "Reactions" },
  { value: "sign-ins", label: "New sign-ins" },
  { value: "billing", label: "Billing" },
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Email me about</FieldLabel>
      <Listbox multiple defaultValue={["mentions"]} style={styles.list}>
        {topics.map((topic) => (
          <ListboxItem key={topic.value} value={topic.value} style={itemStyle}>
            <Text style={styles.itemText}>{topic.label}</Text>
            <ListboxItemIndicator>
              <View style={styles.check} />
            </ListboxItemIndicator>
          </ListboxItem>
        ))}
      </Listbox>
      <FieldDescription style={styles.hint}>
        Press a topic to add it or take it out.
      </FieldDescription>
    </Field>
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
  field: { width: 260, gap: 6 },
  highlighted: { backgroundColor: "#f4f4f5" },
  hint: { fontSize: 13, color: "#71717a" },
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
  label: { fontSize: 14, fontWeight: "500" },
  list: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }
