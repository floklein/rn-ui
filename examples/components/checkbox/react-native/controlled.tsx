import {
  Checkbox,
  CheckboxIndicator,
  type CheckedState,
  createCheckboxController,
} from "@ui-sdk/react-native/checkbox"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [updates] = useState(() => createCheckboxController())
  const [checked, setChecked] = useState<CheckedState>(false)

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => updates.toggle()}
        style={styles.button}
      >
        <Text>Toggle</Text>
      </Pressable>
      <Checkbox
        checked={checked}
        onCheckedChange={(next, details) => {
          setChecked(next)
          log(
            `${next === "indeterminate" ? "Mixed" : next ? "Checked" : "Unchecked"} (${details.reason})`
          )
        }}
        controller={updates}
        style={styles.row}
      >
        {(state) => (
          <>
            <View style={[styles.box, state.checked && styles.boxChecked]}>
              <CheckboxIndicator>
                <Text style={styles.mark}>✓</Text>
              </CheckboxIndicator>
            </View>
            <Text style={styles.label}>Email me about product updates</Text>
          </>
        )}
      </Checkbox>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  mark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  label: { fontSize: 16 },
})

export { Example }
