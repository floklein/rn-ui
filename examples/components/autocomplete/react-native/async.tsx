import { useAsyncOptions } from "@ui-sdk/react-native/async-options"
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
  AutocompleteStatus,
} from "@ui-sdk/react-native/autocomplete"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const cities = [
  "Amsterdam",
  "Athens",
  "Barcelona",
  "Berlin",
  "Boston",
  "Brussels",
  "Buenos Aires",
  "Cairo",
  "Chicago",
  "Copenhagen",
  "Dublin",
  "Lisbon",
  "London",
  "Los Angeles",
  "Madrid",
  "Paris",
  "Prague",
  "Rome",
  "Seoul",
  "Tokyo",
]

function searchCities(query: string, { signal }: { signal: AbortSignal }) {
  return new Promise<string[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.trim().toLowerCase()
      resolve(cities.filter((city) => city.toLowerCase().startsWith(needle)))
    }, 300)
    signal.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

function Example() {
  const results = useAsyncOptions(searchCities, { debounce: 200 })
  return (
    <Autocomplete
      items={results.items}
      filter={false}
      status={results.status}
      onValueChange={(value) => results.setQuery(value)}
      onLoadMore={results.loadMore}
    >
      <View style={styles.field}>
        <AutocompleteLabel style={styles.label}>City</AutocompleteLabel>
        <AutocompleteInput style={styles.input} placeholder="e.g. Paris" />
      </View>
      <AutocompleteContent style={contentStyle}>
        <AutocompleteStatus>
          {(state) => (
            <Text style={styles.empty}>
              {state.loading
                ? "Searching…"
                : state.count
                  ? `${state.count} ${state.count === 1 ? "city" : "cities"}`
                  : ""}
            </Text>
          )}
        </AutocompleteStatus>
        <AutocompleteEmpty>
          {(state) =>
            state.empty && !state.loading ? (
              <Text style={styles.empty}>
                No cities start with “{state.query}”.
              </Text>
            ) : null
          }
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {(state) =>
              (state.items as string[]).map((city) => (
                <AutocompleteItem key={city} value={city} style={itemStyle}>
                  <Text style={styles.itemText}>{city}</Text>
                </AutocompleteItem>
              ))
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
