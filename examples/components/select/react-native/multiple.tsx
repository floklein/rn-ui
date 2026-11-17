import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const languages = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
]

function Example() {
  const log = useLog()
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Languages</FieldLabel>
      <Select
        multiple
        defaultValue={["en", "ja"]}
        placeholder="Select languages"
        onValueChange={(value) => log(`value: ${JSON.stringify(value)}`)}
      >
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle}>
            {(state) =>
              state.placeholder
                ? "Select languages"
                : state.labels.length > 2
                  ? `${state.labels[0]} and ${state.labels.length - 1} more`
                  : state.label
            }
          </SelectValue>
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          {languages.map((item) => (
            <SelectItem key={item.value} value={item.value} style={itemStyle}>
              <Text style={styles.itemText}>{item.label}</Text>
              <SelectItemIndicator>
                <View style={styles.check} />
              </SelectItemIndicator>
            </SelectItem>
          ))}
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
  placeholder: { color: "#71717a" },
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
