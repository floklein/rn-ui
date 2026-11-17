import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteItemIcon,
  type AutocompleteItemState,
  AutocompleteList,
  type AutocompletePlacementState,
} from "@ui-sdk/react-native/autocomplete"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const mailSearches = [
  { value: "Starred", icon: "★" },
  { value: "Drafts", icon: "✎" },
  { value: "Replies", icon: "↩", mirror: true },
  { value: "Attachments", icon: "⎘" },
  { value: "Archived", icon: "▤" },
  { value: "Scheduled", icon: "◷" },
]

function Example() {
  return (
    <Autocomplete>
      <AutocompleteInput
        aria-label="Search mail"
        placeholder="Search mail…"
        style={[styles.input, styles.field]}
      />
      <AutocompleteContent style={contentStyle}>
        <AutocompleteEmpty>
          <Text style={styles.empty}>No searches found.</Text>
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {mailSearches.map((search) => (
              <AutocompleteItem
                key={search.value}
                value={search.value}
                style={(state, interaction) => [
                  ...itemStyle(state, interaction),
                  styles.row,
                ]}
              >
                <AutocompleteItemIcon mirror={search.mirror}>
                  <Text style={styles.icon}>{search.icon}</Text>
                </AutocompleteItemIcon>
                <Text style={styles.itemText}>{search.value}</Text>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
        </ScrollView>
      </AutocompleteContent>
    </Autocomplete>
  )
}

const itemStyle = (
  state: AutocompleteItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.disabled && styles.disabled,
]

const contentStyle = (state: AutocompletePlacementState) => [
  styles.content,
  { maxHeight: Math.min(280, state.availableHeight ?? 280) },
]

const styles = StyleSheet.create({
  content: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  disabled: { opacity: 0.4 },
  empty: { padding: 10, fontSize: 14, color: "#71717a" },
  field: { width: 260, gap: 6 },
  highlighted: { backgroundColor: "#f4f4f5" },
  icon: { fontSize: 16, color: "#52525b" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#18181b",
  },
  item: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8 },
  itemText: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
})

export { Example }
