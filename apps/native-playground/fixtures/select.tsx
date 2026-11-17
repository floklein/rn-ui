import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react-native/select"
import { useState } from "react"
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
]

function Options({ name }: { name: string }) {
  return fruits.map((fruit) => (
    <SelectItem
      key={fruit.value}
      testID={`${name}-${fruit.value}`}
      value={fruit.value}
      disabled={fruit.disabled}
      style={(state) => [
        styles.item,
        state.highlighted && styles.highlighted,
        state.disabled && styles.disabled,
      ]}
    >
      <Text>{fruit.label}</Text>
      <SelectItemIndicator style={styles.indicator} />
    </SelectItem>
  ))
}

// Every position the content was laid out at while open: one entry means no
// frame showed it anywhere but against its trigger.
function Fruit({
  name,
  modal,
  multiple,
  searchable,
  onChanges,
}: {
  name: string
  modal?: boolean
  multiple?: boolean
  searchable?: boolean
  onChanges: (change: string) => void
}) {
  const [layouts, setLayouts] = useState<string[]>([])
  const laidOut = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const at = `${Math.round(layout.x)},${Math.round(layout.y)}`
    setLayouts((current) => (current.includes(at) ? current : [...current, at]))
  }
  return (
    <View style={styles.field}>
      <Select<string, boolean>
        modal={modal}
        multiple={multiple}
        placeholder="Pick a fruit"
        onOpenChange={(open, details) => {
          if (open) {
            setLayouts([])
          }
          onChanges(`${name}:${open}:${details.reason}`)
        }}
        onValueChange={(value) =>
          onChanges(`${name}=${[value ?? "none"].flat().join("+")}`)
        }
      >
        <SelectLabel testID={`${name}-label`}>Fruit {name}</SelectLabel>
        <SelectTrigger testID={`${name}-trigger`} style={styles.trigger}>
          <SelectValue testID={`${name}-value`} />
        </SelectTrigger>
        <SelectContent
          testID={`${name}-content`}
          onLayout={laidOut}
          style={styles.content}
        >
          {searchable ? (
            <>
              <SelectInput
                testID={`${name}-input`}
                aria-label="Search fruit"
                style={styles.input}
              />
              <SelectList>
                <Options name={name} />
              </SelectList>
              <SelectEmpty testID={`${name}-empty`}>
                <Text>No fruit found</Text>
              </SelectEmpty>
            </>
          ) : (
            <Options name={name} />
          )}
          <Text testID={`${name}-layouts`}>{layouts.join(" ")}</Text>
        </SelectContent>
      </Select>
    </View>
  )
}

function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const [presses, setPresses] = useState(0)
  const onChanges = (change: string) =>
    setChanges((current) => [...current, change])

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <Pressable
        accessibilityRole="button"
        testID="under"
        onPress={() => setPresses(presses + 1)}
        style={styles.action}
      >
        <Text testID="presses">{presses}</Text>
      </Pressable>
      <View style={styles.row}>
        <Fruit name="modal" onChanges={onChanges} />
        <Fruit name="plain" modal={false} onChanges={onChanges} />
      </View>
      <View style={styles.row}>
        <Fruit name="multi" multiple modal={false} onChanges={onChanges} />
        <Fruit name="search" searchable onChanges={onChanges} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 4 },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  trigger: {
    minWidth: 150,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  content: {
    width: 180,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  item: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  highlighted: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.4 },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#18181b",
  },
  input: {
    minHeight: 40,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#e4e4e7",
  },
})

export { Fixture }
