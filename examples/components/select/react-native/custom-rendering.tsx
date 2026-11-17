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
import { Pressable, StyleSheet, Text, View } from "react-native"

const members = [
  { value: "hollis", name: "Hollis Grant", email: "hollis@example.com" },
  { value: "ines", name: "Inès Moreau", email: "ines@example.com" },
  { value: "kofi", name: "Kofi Mensah", email: "kofi@example.com" },
  { value: "wren", name: "Wren Takahashi", email: "wren@example.com" },
]

function Example() {
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Reviewer</FieldLabel>
      <Select defaultValue="hollis">
        <SelectTrigger
          render={(props) => (
            <Pressable {...props}>
              {props.children}
              <Text aria-hidden style={styles.chevron}>
                ▾
              </Text>
            </Pressable>
          )}
          style={triggerStyle}
        >
          <SelectValue
            render={(props, state) => (
              <View style={[styles.row, styles.grow]}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {state.label.slice(0, 1)}
                  </Text>
                </View>
                <Text {...props} />
              </View>
            )}
            style={valueStyle}
          />
        </SelectTrigger>
        <SelectContent style={styles.content}>
          {members.map((member) => (
            <SelectItem
              key={member.value}
              value={member.value}
              label={member.name}
              disabled={member.value === "wren"}
              style={itemStyle}
            >
              {(state) => (
                <>
                  <View style={styles.row}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {member.name.slice(0, 1)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.itemText}>{member.name}</Text>
                      <Text style={styles.hint}>
                        {state.disabled ? "Out of office" : member.email}
                      </Text>
                    </View>
                  </View>
                  <SelectItemIndicator
                    keepMounted
                    render={(props, indicator) => (
                      <View {...props}>
                        {indicator.selected && <View style={styles.check} />}
                      </View>
                    )}
                  />
                </>
              )}
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
  badge: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e4e4e7",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
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
  grow: { flex: 1 },
  highlighted: { backgroundColor: "#f4f4f5" },
  hint: { fontSize: 13, color: "#71717a" },
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
