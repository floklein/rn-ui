import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectItemState,
  SelectList,
  SelectTrigger,
  type SelectTriggerState,
  SelectValue,
  type SelectValueState,
} from "@ui-sdk/react-native/select"
import { useRef, useState } from "react"
import { FlatList, StyleSheet, Text } from "react-native"

const manyItems = Array.from({ length: 10_000 }, (_, index) => ({
  value: `item-${index + 1}`,
  label: `Item ${index + 1}`,
}))

const row = 44

function Example() {
  const list = useRef<FlatList<(typeof manyItems)[number]>>(null)
  const [value, setValue] = useState<string | null>(null)
  const selected = manyItems.findIndex((item) => item.value === value)
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Item</FieldLabel>
      <Select
        items={manyItems}
        placeholder="Select an item"
        value={value}
        onValueChange={setValue}
        onHighlight={(value, { index }) => {
          if (index >= 0) {
            list.current?.scrollToIndex({ index, viewPosition: 0.5 })
          }
        }}
      >
        <SelectTrigger style={triggerStyle}>
          <SelectValue style={valueStyle} />
          <Text aria-hidden style={styles.chevron}>
            ▾
          </Text>
        </SelectTrigger>
        <SelectContent style={styles.content}>
          <SelectList>
            {(state) => (
              <FlatList
                ref={list}
                style={styles.virtual}
                data={state.items as typeof manyItems}
                keyExtractor={(item) => item.value}
                initialScrollIndex={Math.max(selected, 0)}
                getItemLayout={(_, index) => ({
                  length: row,
                  offset: row * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <SelectItem
                    value={item.value}
                    label={item.label}
                    index={index}
                    style={(state, interaction) => [
                      itemStyle(state, interaction),
                      { height: row },
                    ]}
                  >
                    <Text style={styles.itemText}>{item.label}</Text>
                  </SelectItem>
                )}
              />
            )}
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
  virtual: { height: 264 },
})

export { Example }
