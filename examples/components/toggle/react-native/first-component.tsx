import { Toggle, type ToggleState } from "@ui-sdk/react-native/toggle"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Toggle style={toggleStyle}>
      {(state) => (
        <Text style={[styles.label, state.pressed && styles.labelPressed]}>
          Bookmark
        </Text>
      )}
    </Toggle>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.toggle,
  state.pressed && styles.pressed,
]

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  pressed: { backgroundColor: "#18181b", borderColor: "#18181b" },
  label: { fontSize: 16, fontWeight: "500", color: "#18181b" },
  labelPressed: { color: "#ffffff" },
})

export { Example }
