import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  AutocompleteList,
  AutocompleteTrigger,
} from "@ui-sdk/react-native/autocomplete"
import { useState } from "react"
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"

const fruits = [
  { value: "Apple" },
  { value: "Banana", disabled: true },
  { value: "Cherry" },
  { value: "Grape" },
]

// The readouts sit above the field: the Android keyboard covers what's below
// it, and UiAutomator then reads it empty. `layouts` lists every position the
// content was laid out at while open: one means it never showed elsewhere.
function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const [submitted, setSubmitted] = useState("none")
  const [presses, setPresses] = useState(0)
  const [layouts, setLayouts] = useState<string[]>([])
  const log = (change: string) => setChanges((current) => [...current, change])
  const laidOut = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const at = `${Math.round(layout.x)},${Math.round(layout.y)}`
    setLayouts((current) => (current.includes(at) ? current : [...current, at]))
  }
  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <Text testID="submitted">{submitted}</Text>
      <Text testID="layouts">{layouts.join(" ")}</Text>
      <Pressable
        accessibilityRole="button"
        testID="under"
        onPress={() => setPresses(presses + 1)}
        style={styles.action}
      >
        <Text testID="presses">{presses}</Text>
      </Pressable>
      <Autocomplete
        autoHighlight
        onOpenChange={(open, details) => {
          if (open) {
            setLayouts([])
          }
          log(`${open}:${details.reason}`)
        }}
        onValueChange={(value, details) => log(`=${value}:${details.reason}`)}
        onSubmit={(value) => setSubmitted(value)}
      >
        <AutocompleteLabel testID="label" style={styles.label}>
          Fruit
        </AutocompleteLabel>
        <View style={styles.row}>
          <AutocompleteInput testID="input" style={styles.input} />
          <AutocompleteClear
            testID="clear"
            aria-label="Clear"
            style={styles.button}
          >
            <Text>×</Text>
          </AutocompleteClear>
          <AutocompleteTrigger
            testID="trigger"
            aria-label="Show fruit"
            style={styles.button}
          >
            <Text>▾</Text>
          </AutocompleteTrigger>
        </View>
        <AutocompleteContent
          testID="content"
          onLayout={laidOut}
          style={styles.content}
        >
          <AutocompleteList>
            {fruits.map((fruit) => (
              <AutocompleteItem
                key={fruit.value}
                testID={`item-${fruit.value.toLowerCase()}`}
                value={fruit.value}
                disabled={fruit.disabled}
                style={(state) => [
                  styles.item,
                  state.highlighted && styles.highlighted,
                  state.disabled && styles.disabled,
                ]}
              >
                <Text>{fruit.value}</Text>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
          <AutocompleteEmpty testID="empty">
            <Text>No fruit found</Text>
          </AutocompleteEmpty>
        </AutocompleteContent>
      </Autocomplete>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: { minHeight: 44, textAlignVertical: "center" },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  input: {
    width: 200,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: 200,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  item: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  highlighted: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.4 },
})

export { Fixture }
