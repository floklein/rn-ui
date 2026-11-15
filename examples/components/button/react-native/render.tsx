import { Button } from "@ui-sdk/react-native/button"
import { Pressable, StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Example() {
  const log = useLog()

  return (
    <Button
      onPress={async () => {
        await wait(1000)
        log("Couldn't save. Check your connection and try again.")
        throw new Error("Couldn't save")
      }}
      render={(props, state) => (
        <Pressable {...props} style={styles.button}>
          <Text style={styles.label}>
            {state.pending
              ? "Saving…"
              : state.error
                ? "Try Again"
                : "Save Changes"}
          </Text>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
})

export { Example }
