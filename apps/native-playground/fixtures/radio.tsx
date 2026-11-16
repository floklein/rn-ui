import {
  createRadioGroupController,
  Radio,
  RadioGroup,
  RadioIndicator,
  type RadioState,
} from "@ui-sdk/react-native/radio"
import { useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

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

const circle = (state: RadioState) => [
  styles.circle,
  state.checked && styles.checked,
  state.disabled && styles.disabled,
]

function Option({
  value,
  label,
  disabled,
  onExit,
}: {
  value: string
  label: string
  disabled?: boolean
  onExit?: (done: () => void) => void
}) {
  return (
    <Radio
      aria-label={label}
      testID={`radio-${value}`}
      value={value}
      disabled={disabled}
      style={circle}
    >
      <RadioIndicator
        testID={`indicator-${value}`}
        onExit={onExit}
        style={styles.dot}
      />
    </Radio>
  )
}

function Fixture() {
  const [lastChange, setLastChange] = useState("none")
  const [phase, setPhase] = useState("shown")
  const finish = useRef<() => void>(undefined)
  const [controller] = useState(() => createRadioGroupController())

  return (
    <View style={styles.fixture}>
      <Text testID="last-change">{lastChange}</Text>
      <Text testID="fading-phase">{phase}</Text>
      <RadioGroup
        aria-label="Size"
        defaultValue="medium"
        controller={controller}
        onValueChange={(value, details) => {
          setLastChange(`${value}:${details.reason}:${details.source}`)
          if (value === "medium") {
            setPhase("shown")
          }
        }}
        style={styles.row}
      >
        <Option value="small" label="Small" />
        <Option
          value="medium"
          label="Medium"
          onExit={(done) => {
            setPhase("exiting")
            finish.current = () => {
              done()
              setPhase("gone")
            }
          }}
        />
        <Option value="large" label="Large" disabled />
      </RadioGroup>
      <RadioGroup
        aria-label="Plan"
        defaultValue="pro"
        readOnly
        onValueChange={(value) => setLastChange(`plan:${value}`)}
        style={styles.row}
      >
        <Option value="free" label="Free" />
        <Option value="pro" label="Pro" />
      </RadioGroup>
      <RadioGroup
        aria-label="Theme"
        defaultValue="light"
        disabled
        style={styles.row}
      >
        <Option value="light" label="Light" />
        <Option value="dark" label="Dark" />
      </RadioGroup>
      <View style={styles.actions}>
        <Action
          label="Set Small"
          testID="set-small"
          onPress={() => controller.setValue("small")}
        />
        <Action
          label="Finish exit"
          testID="fading-finish"
          onPress={() => finish.current?.()}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { borderColor: "#16a34a" },
  disabled: { opacity: 0.5 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#16a34a" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
