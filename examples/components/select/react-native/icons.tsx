import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  type SelectItemState,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  SelectValueIcon,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { StyleSheet, Text, View } from "react-native"

const alignments = [
  { value: "start", label: "Start", glyph: "⇤", mirror: true },
  { value: "center", label: "Center", glyph: "↔", mirror: false },
  { value: "end", label: "End", glyph: "⇥", mirror: true },
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Text alignment</FieldLabel>
      <Select defaultValue="start">
        <SelectTrigger style={triggerStyle}>
          <SelectValueIcon />
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          {alignments.map((item) => (
            <SelectItem key={item.value} value={item.value} style={itemStyle}>
              <View style={styles.row}>
                <SelectItemIcon mirror={item.mirror}>
                  <Text style={styles.icon}>{item.glyph}</Text>
                </SelectItemIcon>
                <Text style={styles.itemText}>{item.label}</Text>
              </View>
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
  icon: { fontSize: 16, width: 20, textAlign: "center" },
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
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
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
