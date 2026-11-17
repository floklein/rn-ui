import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  createListboxController,
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
  ListboxSeparator,
} from "@ui-sdk/react-native/listbox"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "cherry", label: "Cherry" },
]

const controller = createListboxController<string, true>()

const itemStyle = (state: ListboxItemState) => [
  styles.item,
  state.selected && styles.selected,
  state.highlighted && styles.highlighted,
  state.disabled && styles.disabled,
]

function Options({ name }: { name: string }) {
  return fruits.map((fruit) => (
    <ListboxItem
      key={fruit.value}
      testID={`${name}-${fruit.value}`}
      value={fruit.value}
      disabled={fruit.disabled}
      style={itemStyle}
    >
      <Text>{fruit.label}</Text>
      <ListboxItemIndicator style={styles.indicator} />
    </ListboxItem>
  ))
}

function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const log = (change: string) => setChanges((current) => [...current, change])
  const [single, setSingle] = useState<string | null>(null)
  return (
    <View style={styles.screen}>
      <Field style={styles.field}>
        <FieldLabel testID="single-label" style={styles.label}>
          Fruit
        </FieldLabel>
        <Listbox
          testID="single"
          value={single}
          onValueChange={(value, details) => {
            setSingle(value)
            log(`single=${value}:${details.reason}`)
          }}
          style={styles.list}
        >
          <Options name="single" />
        </Listbox>
      </Field>
      <Listbox
        testID="multi"
        aria-label="Toppings"
        multiple
        controller={controller}
        defaultValue={["cherry"]}
        onValueChange={(value) => log(`multi=${value.join("+")}`)}
        style={styles.list}
      >
        <ListboxGroup>
          <ListboxGroupLabel testID="multi-group">Fruits</ListboxGroupLabel>
          <Options name="multi" />
        </ListboxGroup>
        <ListboxSeparator testID="multi-separator" style={styles.separator} />
        <ListboxItem testID="multi-nuts" value="nuts" style={itemStyle}>
          <Text>Nuts</Text>
        </ListboxItem>
      </Listbox>
      <Pressable
        testID="select-all"
        accessibilityRole="button"
        onPress={() => controller.selectAll()}
        style={styles.button}
      >
        <Text>Select all</Text>
      </Pressable>
      {changes.length > 0 && <Text testID="changes">{changes.join(" ")}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  button: { padding: 10, borderWidth: 1, borderRadius: 8, minHeight: 44 },
  disabled: { opacity: 0.4 },
  field: { gap: 6 },
  highlighted: { borderColor: "#2563eb" },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111",
  },
  label: { minHeight: 44 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  list: { borderWidth: 1, borderRadius: 8, borderColor: "#d4d4d8" },
  screen: { padding: 16, gap: 12 },
  selected: { backgroundColor: "#f4f4f5" },
  separator: { height: 1, backgroundColor: "#e4e4e7" },
})

export { Fixture }
