import { Button, type ButtonState } from "@ui-sdk/react-native/button"
import { StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Button disabled style={buttonStyle}>
      <Text style={styles.label}>Disabled</Text>
    </Button>
  )
}

const buttonStyle = (state: ButtonState) => [
  styles.button,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  disabled: { opacity: 0.5 },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
