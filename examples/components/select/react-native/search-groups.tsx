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
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { StyleSheet, Text, View } from "react-native"

const regions = [
  {
    label: "Americas",
    items: [
      { value: "br", label: "Brazil" },
      { value: "ca", label: "Canada" },
      { value: "mx", label: "Mexico" },
    ],
  },
  {
    label: "Europe",
    items: [
      { value: "fr", label: "France" },
      { value: "de", label: "Germany" },
      { value: "es", label: "Spain" },
    ],
  },
  {
    label: "Asia Pacific",
    items: [
      { value: "au", label: "Australia" },
      { value: "jp", label: "Japan" },
      { value: "sg", label: "Singapore" },
    ],
  },
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Country</FieldLabel>
      <Select placeholder="Select a country">
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
            <Text style={styles.message}>No countries found.</Text>
          </SelectEmpty>
          <SelectList>
            {regions.map((group) => (
              <SelectGroup key={group.label}>
                <SelectGroupLabel style={styles.groupLabel}>
                  {group.label}
                </SelectGroupLabel>
                {group.items.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    label={item.label}
                    style={itemStyle}
                  >
                    <SelectItemText style={styles.itemText}>
                      {(state) =>
                        state.segments.map((segment, index) =>
                          segment.match ? (
                            <Text key={index} style={styles.match}>
                              {segment.text}
                            </Text>
                          ) : (
                            segment.text
                          )
                        )
                      }
                    </SelectItemText>
                    <SelectItemIndicator>
                      <View style={styles.check} />
                    </SelectItemIndicator>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectList>
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
  match: { fontWeight: "700" },
  message: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#71717a",
  },
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
