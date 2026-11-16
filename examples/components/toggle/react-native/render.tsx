import { Toggle, ToggleIcon } from "@ui-sdk/react-native/toggle"
import { Pressable, StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Toggle
      aria-label="Favorite"
      render={(props, state) => (
        <Pressable {...props} style={styles.toggle}>
          <ToggleIcon>
            <Text style={[styles.heart, state.pressed && styles.filled]}>
              {state.pressed ? "♥" : "♡"}
            </Text>
          </ToggleIcon>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  toggle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  heart: { fontSize: 22, color: "#71717a" },
  filled: { color: "#e11d48" },
})

export { Example }
