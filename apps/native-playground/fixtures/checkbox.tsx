import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  type CheckboxOptions,
  type CheckboxState,
} from "@ui-sdk/react-native/checkbox"
import { useMemo, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<CheckboxOptions["onCheckedChange"]>

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

const box = (state: CheckboxState) => [
  styles.box,
  state.checked !== false && styles.checked,
  state.disabled && styles.disabled,
]

function Mark() {
  return (
    <CheckboxIndicator>
      {(state) => (
        <Text style={styles.mark}>{state.indeterminate ? "–" : "✓"}</Text>
      )}
    </CheckboxIndicator>
  )
}

function Snack({ value, label }: { value: string; label: string }) {
  return (
    <Checkbox
      aria-label={label}
      testID={`checkbox-${value}`}
      value={value}
      style={box}
    >
      <Mark />
    </Checkbox>
  )
}

function Fixture() {
  const [lastChange, setLastChange] = useState("none")
  const [phase, setPhase] = useState("shown")
  const [groupValue, setGroupValue] = useState<string[]>(["tea"])
  const [snacks, setSnacks] = useState<string[]>([])
  const [crisps, setCrisps] = useState(false)
  const finish = useRef<() => void>(undefined)
  const memoized = useMemo(
    () => ({
      chips: <Snack value="chips" label="Chips" />,
      nuts: <Snack value="nuts" label="Nuts" />,
    }),
    []
  )
  const record =
    (name: string): Change =>
    (checked, details) =>
      setLastChange(`${name}:${checked}:${details.reason}:${details.source}`)

  return (
    <View style={styles.fixture}>
      <Checkbox
        aria-label="Terms"
        testID="checkbox-terms"
        onCheckedChange={record("terms")}
        style={box}
      >
        <Mark />
      </Checkbox>
      <Checkbox
        aria-label="Mixed"
        testID="checkbox-mixed"
        defaultChecked="indeterminate"
        onCheckedChange={record("mixed")}
        style={box}
      >
        <Mark />
      </Checkbox>
      <Checkbox
        aria-label="Locked"
        testID="checkbox-locked"
        defaultChecked
        disabled
        style={box}
      >
        <Mark />
      </Checkbox>
      <View style={styles.row}>
        <Checkbox
          aria-label="Fading"
          testID="checkbox-fading"
          defaultChecked
          onCheckedChange={(checked) => checked && setPhase("shown")}
          style={box}
        >
          <CheckboxIndicator
            testID="fading-indicator"
            onExit={(done) => {
              setPhase("exiting")
              finish.current = () => {
                done()
                setPhase("gone")
              }
            }}
          >
            <Text accessibilityLabel="Fading mark" style={styles.mark}>
              ✓
            </Text>
          </CheckboxIndicator>
        </Checkbox>
        <Text testID="fading-phase">{phase}</Text>
        <Action
          label="Finish"
          testID="fading-finish"
          onPress={() => finish.current?.()}
        />
      </View>
      <CheckboxGroup
        aria-label="Drinks"
        testID="group-drinks"
        value={groupValue}
        onValueChange={setGroupValue}
        allValues={["tea", "coffee", "milk"]}
        style={styles.row}
      >
        <Checkbox
          aria-label="All drinks"
          testID="checkbox-all"
          parent
          style={box}
        >
          <Mark />
        </Checkbox>
        <Checkbox
          aria-label="Tea"
          testID="checkbox-tea"
          value="tea"
          style={box}
        >
          <Mark />
        </Checkbox>
        <Checkbox
          aria-label="Coffee"
          testID="checkbox-coffee"
          value="coffee"
          style={box}
        >
          <Mark />
        </Checkbox>
        <Checkbox
          aria-label="Milk"
          testID="checkbox-milk"
          value="milk"
          disabled
          style={box}
        >
          <Mark />
        </Checkbox>
      </CheckboxGroup>
      <Text testID="group-value">{groupValue.join(",") || "none"}</Text>
      <View style={styles.row}>
        <CheckboxGroup
          aria-label="Snacks"
          value={snacks}
          onValueChange={setSnacks}
          style={styles.row}
        >
          {memoized.chips}
          {crisps && <Snack value="crisps" label="Crisps" />}
          {memoized.nuts}
        </CheckboxGroup>
        <Action
          label="Add crisps"
          testID="add-crisps"
          onPress={() => setCrisps(true)}
        />
      </View>
      <Text testID="snacks-value">{snacks.join(",") || "none"}</Text>
      <Text testID="last-change">{lastChange}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 16, alignItems: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  box: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  disabled: { opacity: 0.5 },
  mark: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
})

export { Fixture }
