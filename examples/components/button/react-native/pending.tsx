import { Button, type ButtonState } from "@ui-sdk/react-native/button"
import { StyleSheet, Text } from "react-native"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Example() {
  return (
    <Button
      onPress={() => wait(1500)}
      pendingAnnouncement="Saving"
      style={buttonStyle}
    >
      <Text style={styles.label}>Save</Text>
    </Button>
  )
}

const buttonStyle = (state: ButtonState) => [
  styles.button,
  state.pending && styles.pending,
]

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  pending: { opacity: 0.7 },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
