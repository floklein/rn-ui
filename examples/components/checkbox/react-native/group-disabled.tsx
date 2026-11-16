import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
} from "@ui-sdk/react-native/checkbox"
import { StyleSheet, Text, View } from "react-native"

const backups = [
  { value: "photos", label: "Photos" },
  { value: "documents", label: "Documents" },
  { value: "messages", label: "Messages" },
]

const folders = [
  { value: "desktop", label: "Desktop", disabled: true },
  { value: "projects", label: "Projects", disabled: false },
  { value: "downloads", label: "Downloads", disabled: false },
]

function Example() {
  return (
    <View style={styles.sections}>
      <View style={styles.stack}>
        <Text style={styles.heading}>Backups</Text>
        <Text style={styles.hint}>Managed by your organization.</Text>
        <CheckboxGroup
          aria-label="Backups"
          defaultValue={["photos", "documents"]}
          disabled
          style={(state) => [styles.stack, state.disabled && styles.disabled]}
        >
          {backups.map((item) => (
            <Checkbox key={item.value} value={item.value} style={styles.row}>
              {(state) => (
                <>
                  <View
                    style={[styles.box, state.checked && styles.boxChecked]}
                  >
                    <CheckboxIndicator>
                      <Text style={styles.mark}>✓</Text>
                    </CheckboxIndicator>
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                </>
              )}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </View>
      <View style={styles.stack}>
        <Text style={styles.heading}>Sync folders</Text>
        <CheckboxGroup
          aria-label="Sync folders"
          defaultValue={["desktop"]}
          allValues={folders.map((item) => item.value)}
          style={styles.stack}
        >
          <Checkbox parent aria-label="Select all" style={styles.row}>
            {(state) => (
              <>
                <View style={[styles.box, state.checked && styles.boxChecked]}>
                  <CheckboxIndicator>
                    <Text style={styles.mark}>
                      {state.indeterminate ? "–" : "✓"}
                    </Text>
                  </CheckboxIndicator>
                </View>
                <Text style={styles.label}>Select all</Text>
              </>
            )}
          </Checkbox>
          <View style={styles.nested}>
            {folders.map((item) => (
              <Checkbox
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                style={styles.row}
              >
                {(state) => (
                  <>
                    <View
                      style={[styles.box, state.checked && styles.boxChecked]}
                    >
                      <CheckboxIndicator>
                        <Text style={styles.mark}>✓</Text>
                      </CheckboxIndicator>
                    </View>
                    <Text style={styles.label}>{item.label}</Text>
                  </>
                )}
              </Checkbox>
            ))}
          </View>
        </CheckboxGroup>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sections: { gap: 24 },
  stack: { gap: 12 },
  nested: { gap: 12, paddingStart: 34 },
  heading: { fontSize: 17, fontWeight: "600" },
  hint: { fontSize: 14, color: "#71717a" },
  disabled: { opacity: 0.5 },
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
