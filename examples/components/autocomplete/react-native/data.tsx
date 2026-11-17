import { Fragment } from "react"
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  type AutocompleteItemState,
  AutocompleteLabel,
  AutocompleteList,
  type AutocompletePlacementState,
  AutocompleteSeparator,
} from "@ui-sdk/react-native/autocomplete"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const fruitGroups = [
  {
    label: "Tree fruits",
    fruits: ["Apple", "Apricot", "Cherry", "Lemon", "Peach", "Pear"],
  },
  {
    label: "Berries",
    fruits: ["Blackberry", "Blueberry", "Grape", "Strawberry"],
  },
  { label: "Tropical", fruits: ["Avocado", "Banana", "Mango", "Pineapple"] },
]

function Example() {
  return (
    <Autocomplete>
      <View style={styles.field}>
        <AutocompleteLabel style={styles.label}>Fruit</AutocompleteLabel>
        <AutocompleteInput style={styles.input} placeholder="e.g. Peach" />
      </View>
      <AutocompleteContent style={contentStyle}>
        <AutocompleteEmpty>
          <Text style={styles.empty}>No fruits found.</Text>
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {fruitGroups.map((group, index) => (
              <Fragment key={group.label}>
                {index > 0 && (
                  <AutocompleteSeparator style={styles.separator} />
                )}
                <AutocompleteGroup>
                  <AutocompleteGroupLabel style={styles.groupLabel}>
                    {group.label}
                  </AutocompleteGroupLabel>
                  {group.fruits.map((fruit) => (
                    <AutocompleteItem
                      key={fruit}
                      value={fruit}
                      style={itemStyle}
                    >
                      <Text style={styles.itemText}>{fruit}</Text>
                    </AutocompleteItem>
                  ))}
                </AutocompleteGroup>
              </Fragment>
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
  separator: { height: 1, marginVertical: 4, backgroundColor: "#e4e4e7" },
})

export { Example }
