import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  type AutocompleteItemState,
  AutocompleteItemText,
  AutocompleteList,
  type AutocompletePlacementState,
} from "@ui-sdk/react-native/autocomplete"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const recent = ["react hooks", "tailwind grid", "web components", "vue v-model"]

const topics = [
  ...recent,
  "react server components",
  "tailwind colors",
  "vue router",
]

const recentSearches = [
  { type: "group" as const, label: "Recent searches", items: recent },
]

function Example() {
  return (
    <Autocomplete
      items={topics}
      emptyItems={recentSearches}
      openOnFocus
      announcement={(change) =>
        change.type === "results"
          ? `${change.count} ${change.count === 1 ? "topic" : "topics"}`
          : null
      }
    >
      <AutocompleteInput
        aria-label="Search docs"
        placeholder="Search docs…"
        returnKeyType="search"
        style={[styles.input, styles.field]}
      />
      <AutocompleteContent style={contentStyle}>
        <AutocompleteEmpty>
          <Text style={styles.empty}>No topics found.</Text>
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {(state) =>
              (state.items as (string | (typeof recentSearches)[number])[]).map(
                (entry) =>
                  typeof entry === "string" ? (
                    <AutocompleteItem
                      key={entry}
                      value={entry}
                      style={itemStyle}
                    >
                      <AutocompleteItemText style={styles.itemText} />
                    </AutocompleteItem>
                  ) : (
                    <AutocompleteGroup key={entry.label}>
                      <AutocompleteGroupLabel style={styles.groupLabel}>
                        {entry.label}
                      </AutocompleteGroupLabel>
                      {entry.items.map((topic) => (
                        <AutocompleteItem
                          key={topic}
                          value={topic}
                          style={itemStyle}
                        >
                          <AutocompleteItemText style={styles.itemText} />
                        </AutocompleteItem>
                      ))}
                    </AutocompleteGroup>
                  )
              )
            }
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
  groupLabel: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  highlighted: { backgroundColor: "#f4f4f5" },
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
