import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemIndicator,
  type SelectItemState,
  SelectSeparator,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { Fragment } from "react"
import { StyleSheet, Text, View } from "react-native"

const fonts = [
  {
    label: "Sans serif",
    items: [
      { value: "inter", label: "Inter" },
      { value: "geist", label: "Geist" },
    ],
  },
  {
    label: "Serif",
    items: [
      { value: "source-serif", label: "Source Serif" },
      { value: "lora", label: "Lora" },
    ],
  },
  {
    label: "Monospace",
    items: [
      { value: "geist-mono", label: "Geist Mono" },
      { value: "jetbrains-mono", label: "JetBrains Mono" },
    ],
  },
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Font</FieldLabel>
      <Select placeholder="Select a font">
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          {fonts.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 && <SelectSeparator style={styles.separator} />}
              <SelectGroup>
                <SelectGroupLabel style={styles.groupLabel}>
                  {group.label}
                </SelectGroupLabel>
                {group.items.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    style={itemStyle}
                  >
                    <Text style={styles.itemText}>{item.label}</Text>
                    <SelectItemIndicator>
                      <View style={styles.check} />
                    </SelectItemIndicator>
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
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
  placeholder: { color: "#71717a" },
  separator: { height: 1, marginVertical: 4, backgroundColor: "#e4e4e7" },
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
