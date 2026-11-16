import {
  Toggle,
  ToggleIcon,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.card}>
      <View style={styles.stack}>
        <Text style={styles.title}>Q3 Roadmap</Text>
        <Text style={styles.hint}>Edited by Hollis Grant</Text>
      </View>
      <Toggle aria-label="Star" style={toggleStyle}>
        {(state) => (
          <ToggleIcon>
            <Text style={[styles.icon, state.pressed && styles.iconPressed]}>
              {state.pressed ? "★" : "☆"}
            </Text>
          </ToggleIcon>
        )}
      </Toggle>
    </View>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.toggle,
  state.pressed && styles.pressed,
]

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
  stack: { gap: 4 },
  title: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 14, color: "#71717a" },
  toggle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  pressed: { backgroundColor: "#fef3c7" },
  icon: { fontSize: 20, color: "#71717a" },
  iconPressed: { color: "#d97706" },
})

export { Example }
