import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectItemText,
  SelectList,
  type SelectPlacementState,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const countries = [
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

const popularCountries = [
  {
    type: "group" as const,
    label: "Popular",
    items: [countries[5], countries[11], countries[16]],
  },
]

type Entry = (typeof countries)[number] | (typeof popularCountries)[number]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Country</FieldLabel>
      <Select
        items={countries}
        emptyItems={popularCountries}
        placeholder="Select a country"
        filter="contains"
        announcement={(change) =>
          change.type === "results"
            ? `${change.count} ${change.count === 1 ? "country" : "countries"} found`
            : null
        }
      >
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={contentStyle}>
          <SelectInput
            aria-label="Search countries"
            placeholder="Search countries…"
            style={styles.search}
          />
          <SelectEmpty>
            <Text style={styles.message}>No countries found.</Text>
          </SelectEmpty>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <SelectList>
              {(state) =>
                (state.items as Entry[]).map((entry) =>
                  "items" in entry ? (
                    <SelectGroup key={entry.label}>
                      <SelectGroupLabel style={styles.groupLabel}>
                        {entry.label}
                      </SelectGroupLabel>
                      {entry.items.map((country) => (
                        <CountryItem key={country.value} country={country} />
                      ))}
                    </SelectGroup>
                  ) : (
                    <CountryItem key={entry.value} country={entry} />
                  )
                )
              }
            </SelectList>
          </ScrollView>
        </SelectContent>
      </Select>
    </Field>
  )
}

function CountryItem({
  country,
}: {
  country: { value: string; label: string }
}) {
  return (
    <SelectItem value={country.value} label={country.label} style={itemStyle}>
      <SelectItemText style={styles.itemText} />
      <SelectItemIndicator>
        <View style={styles.check} />
      </SelectItemIndicator>
    </SelectItem>
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

const contentStyle = (state: SelectPlacementState) => [
  styles.content,
  { maxHeight: state.availableHeight },
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
  groupLabel: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: "600",
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
  label: { fontSize: 14, fontWeight: "500" },
  message: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#71717a",
  },
  placeholder: { color: "#71717a" },
  scroll: { flexGrow: 0 },
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
