import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { useAsyncOptions } from "@ui-sdk/react-native/async-options"
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectList,
  SelectStatus,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const countryList = [
  { value: "ar", label: "Argentina" },
  { value: "au", label: "Australia" },
  { value: "at", label: "Austria" },
  { value: "be", label: "Belgium" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
  { value: "cl", label: "Chile" },
  { value: "cn", label: "China" },
  { value: "dk", label: "Denmark" },
  { value: "fi", label: "Finland" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "gr", label: "Greece" },
  { value: "in", label: "India" },
  { value: "ie", label: "Ireland" },
  { value: "it", label: "Italy" },
  { value: "jp", label: "Japan" },
  { value: "mx", label: "Mexico" },
  { value: "nl", label: "Netherlands" },
  { value: "no", label: "Norway" },
  { value: "pt", label: "Portugal" },
  { value: "es", label: "Spain" },
  { value: "se", label: "Sweden" },
  { value: "ch", label: "Switzerland" },
]

function searchCountries(
  query: string,
  { signal, page }: { signal: AbortSignal; page: number }
) {
  return new Promise<{ items: typeof countryList; hasMore: boolean }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        const needle = query.trim().toLowerCase()
        const found = countryList.filter((country) =>
          country.label.toLowerCase().includes(needle)
        )
        resolve({
          items: found.slice(page * 6, page * 6 + 6),
          hasMore: found.length > page * 6 + 6,
        })
      }, 400)
      signal.addEventListener("abort", () => {
        clearTimeout(timer)
        reject(signal.reason)
      })
    }
  )
}

function Example() {
  const [query, setQuery] = useState("")
  const results = useAsyncOptions(searchCountries, { immediate: true })
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Country</FieldLabel>
      <Select
        items={results.items}
        filter={false}
        status={results.status}
        query={query}
        onQueryChange={(next) => {
          setQuery(next)
          results.setQuery(next)
        }}
        onLoadMore={results.loadMore}
        placeholder="Select a country"
      >
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          <SelectInput
            aria-label="Search countries"
            placeholder="Search countries…"
            style={styles.search}
          />
          <SelectEmpty>
            {(state) =>
              state.empty && !state.loading ? (
                <Text style={styles.message}>
                  No countries match “{state.query}”.
                </Text>
              ) : null
            }
          </SelectEmpty>
          <SelectList>
            {(state) =>
              (state.items as typeof countryList).map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  style={itemStyle}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                  <SelectItemIndicator>
                    <View style={styles.check} />
                  </SelectItemIndicator>
                </SelectItem>
              ))
            }
          </SelectList>
          <SelectStatus>
            {(state) => (
              <Text style={styles.message}>
                {state.loading
                  ? "Loading…"
                  : state.status === "error"
                    ? "Couldn't load countries."
                    : `${state.count} shown`}
              </Text>
            )}
          </SelectStatus>
          <Pressable style={styles.more} onPress={() => results.loadMore()}>
            <Text style={styles.message}>Load More</Text>
          </Pressable>
        </SelectContent>
      </Select>
    </Field>
  )
}

const triggerStyle = (state: SelectTriggerState) => [
  styles.trigger,
  state.disabled && styles.disabled,
]

const valueStyle = (state: SelectValueState) => [
  styles.value,
  state.placeholder && styles.placeholder,
]

const itemStyle = (
  state: SelectItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
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
  chevron: { fontSize: 12, color: "#71717a" },
  content: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  disabled: { opacity: 0.4 },
  field: { width: 260, gap: 6 },
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
  label: { fontSize: 14, fontWeight: "500" },
  message: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#71717a",
  },
  more: { alignSelf: "flex-start" },
  placeholder: { color: "#71717a" },
  search: {
    margin: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  value: { flex: 1, fontSize: 16 },
})

export { Example }
