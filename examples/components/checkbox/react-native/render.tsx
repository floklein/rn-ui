import { Checkbox } from "@ui-sdk/react-native/checkbox"
import { Pressable, StyleSheet, Text, View } from "react-native"

const topics = [
  { value: "design", label: "Design", checked: true },
  { value: "engineering", label: "Engineering", checked: false },
  { value: "marketing", label: "Marketing", checked: false },
  { value: "sales", label: "Sales", checked: false },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Topics you follow</Text>
      <View style={styles.row}>
        {topics.map((topic) => (
          <Checkbox
            key={topic.value}
            value={topic.value}
            defaultChecked={topic.checked}
            render={(props, state) => (
              <Pressable
                {...props}
                style={[styles.chip, state.checked && styles.chipChecked]}
              >
                <Text style={state.checked && styles.chipText}>
                  {state.checked ? "✓" : "+"} {topic.label}
                </Text>
              </Pressable>
            )}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  heading: { fontSize: 17, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  chipChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  chipText: { color: "#ffffff" },
})

export { Example }
