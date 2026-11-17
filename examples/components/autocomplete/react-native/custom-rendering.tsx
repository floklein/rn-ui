import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  type AutocompleteItemState,
  AutocompleteLabel,
  AutocompleteList,
  type AutocompletePlacementState,
} from "@ui-sdk/react-native/autocomplete"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const pages = [
  { title: "Installation", section: "Getting started" },
  { title: "Styling", section: "Guides" },
  { title: "Animation", section: "Guides" },
  { title: "Accessibility", section: "Guides" },
  { title: "Testing", section: "Guides" },
  { title: "Controllers", section: "Reference" },
]

function Example() {
  return (
    <Autocomplete>
      <View style={styles.field}>
        <AutocompleteLabel style={styles.label}>Jump to</AutocompleteLabel>
        <AutocompleteInput style={styles.input} placeholder="e.g. Styling" />
      </View>
      <AutocompleteContent style={contentStyle}>
        <AutocompleteEmpty>
          <Text style={styles.empty}>No sections found.</Text>
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {pages.map((page) => (
              <AutocompleteItem
                key={page.title}
                value={page.title}
                label={page.title}
                style={itemStyle}
              >
                <Text style={styles.itemText}>{page.title}</Text>
                <Text aria-hidden style={styles.hint}>
                  {page.section}
                </Text>
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
  hint: { fontSize: 13, color: "#71717a" },
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
})

export { Example }
