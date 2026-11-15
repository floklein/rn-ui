import { Button } from "@ui-sdk/react-native/button"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()

  return (
    <Button
      onPress={() => log("Pressed")}
      style={(_state, { pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>Button</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  pressed: { opacity: 0.8 },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
