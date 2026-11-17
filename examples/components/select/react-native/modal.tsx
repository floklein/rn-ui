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
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const statuses = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

const modes = [
  { value: "pointer", label: "Pointer" },
  { value: true, label: "Modal" },
  { value: false, label: "Non-modal" },
] as const

function Example() {
  const [modal, setModal] = useState<boolean | "pointer">("pointer")
  const log = useLog()
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        {modes.map((mode) => (
          <Pressable
            key={mode.label}
            accessibilityRole="button"
            accessibilityState={{ selected: modal === mode.value }}
            style={[styles.button, modal === mode.value && styles.pressed]}
            onPress={() => setModal(mode.value)}
          >
            <Text style={modal === mode.value && styles.pressedText}>
              {mode.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Status</FieldLabel>
        <Select modal={modal} defaultValue="todo">
          <SelectTrigger style={triggerStyle}>
            <SelectValue style={valueStyle} />
            <Text aria-hidden style={styles.chevron}>
              ▾
            </Text>
          </SelectTrigger>
          <SelectContent style={styles.content}>
            {statuses.map((item) => (
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
      <Pressable
        style={styles.button}
        onPress={() => log("Pressed Save Draft")}
      >
        <Text>Save Draft</Text>
      </Pressable>
    </View>
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
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
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
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  pressed: { backgroundColor: "#18181b", borderColor: "#18181b" },
  pressedText: { color: "#fafafa" },
  stack: { gap: 16 },
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
