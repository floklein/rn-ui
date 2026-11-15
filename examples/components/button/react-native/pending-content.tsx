import { Button } from "@ui-sdk/react-native/button"
import { ActivityIndicator, StyleSheet, Text } from "react-native"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Example() {
  return (
    <Button
      onPress={() => wait(1500)}
      pendingAnnouncement="Saving"
      style={styles.button}
    >
      {(state) => (
        <>
          {state.pending && <ActivityIndicator color="#ffffff" />}
          <Text style={styles.label}>Save</Text>
        </>
      )}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
