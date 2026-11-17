import {
  createNumberInputController,
  NumberInput,
  type NumberInputButtonState,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  type NumberInputOptions,
  NumberInputScrubArea,
} from "@ui-sdk/react-native/number-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<NumberInputOptions["onValueChange"]>
type Commit = NonNullable<NumberInputOptions["onValueCommit"]>

const buttonStyle = (state: NumberInputButtonState) => [
  styles.button,
  state.disabled && styles.disabled,
]

function Fixture() {
  const [amount] = useState(createNumberInputController)
  const [changes, setChanges] = useState<string[]>([])
  const record = (entry: string) => setChanges((current) => [...current, entry])
  const changed: Change = (value, details) =>
    record(`value:${value}:${details.reason}:${details.source}`)
  const committed: Commit = (value, details) =>
    record(`commit:${value}:${details.reason}`)

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.slice(-4).join(" ") || "none"}</Text>
      <NumberInput
        locale="en-US"
        min={-1000}
        max={1000}
        controller={amount}
        onValueChange={changed}
        onValueCommit={committed}
        style={styles.root}
      >
        <NumberInputScrubArea testID="amount-scrub" style={styles.scrub}>
          <Text>Drag to change</Text>
        </NumberInputScrubArea>
        <NumberInputGroup style={styles.group}>
          <NumberInputDecrement
            aria-label="Decrease"
            testID="amount-decrement"
            style={buttonStyle}
          >
            <Text style={styles.sign}>−</Text>
          </NumberInputDecrement>
          <NumberInputControl
            aria-label="Amount"
            testID="amount-control"
            style={styles.control}
          />
          <NumberInputIncrement
            aria-label="Increase"
            testID="amount-increment"
            style={buttonStyle}
          >
            <Text style={styles.sign}>+</Text>
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
      <NumberInput defaultValue={3} max={3} disabled style={styles.root}>
        <NumberInputGroup style={styles.group}>
          <NumberInputDecrement
            aria-label="Decrease locked"
            testID="locked-decrement"
            style={buttonStyle}
          >
            <Text style={styles.sign}>−</Text>
          </NumberInputDecrement>
          <NumberInputControl
            aria-label="Locked"
            testID="locked-control"
            style={styles.control}
          />
          <NumberInputIncrement
            aria-label="Increase locked"
            testID="locked-increment"
            style={buttonStyle}
          >
            <Text style={styles.sign}>+</Text>
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="focus-amount"
          onPress={() => amount.focus()}
          style={styles.action}
        >
          <Text>Focus amount</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="set-amount"
          onPress={() => amount.setValue(250)}
          style={styles.action}
        >
          <Text>Set 250</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  root: { alignSelf: "stretch", gap: 4 },
  scrub: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  group: {
    flexDirection: "row",
    height: 44,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  control: { flex: 1, fontSize: 16, textAlign: "center", color: "#18181b" },
  button: { width: 44, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  sign: { fontSize: 20 },
  actions: { flexDirection: "row", gap: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
