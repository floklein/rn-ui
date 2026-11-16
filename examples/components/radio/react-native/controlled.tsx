import {
  createRadioGroupController,
  Radio,
  RadioGroup,
  RadioIndicator,
} from "@ui-sdk/react-native/radio"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

type Plan = "starter" | "pro" | "team"

const plans: { value: Plan; label: string }[] = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

function Example() {
  const log = useLog()
  const [planGroup] = useState(() => createRadioGroupController<Plan>())
  const [value, setValue] = useState<Plan | null>("pro")

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => planGroup.setValue("team")}
          style={styles.button}
        >
          <Text>Choose Team</Text>
        </Pressable>
      </View>
      <Text style={styles.heading}>Plan</Text>
      <RadioGroup
        aria-label="Plan"
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          log(
            `${plans.find((plan) => plan.value === next)?.label ?? "None"} (${details.reason})`
          )
        }}
        controller={planGroup}
        style={styles.stack}
      >
        {plans.map((plan) => (
          <Radio key={plan.value} value={plan.value} style={styles.row}>
            {(state) => (
              <>
                <View
                  style={[styles.circle, state.checked && styles.circleChecked]}
                >
                  <RadioIndicator style={styles.dot} />
                </View>
                <Text style={styles.label}>{plan.label}</Text>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  heading: { fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  circleChecked: { borderColor: "#16a34a" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
  label: { fontSize: 16 },
})

export { Example }
