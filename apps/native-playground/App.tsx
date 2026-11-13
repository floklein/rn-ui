import { switchPrimitive } from "@ui-sdk/core/switch"
import { useSyncExternalStore } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const playgroundSwitch = switchPrimitive({ id: "playground-switch" })

function App() {
  const checked = useSyncExternalStore(
    playgroundSwitch.subscribe,
    playgroundSwitch.api.getChecked
  )
  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked }}
        onPress={() => playgroundSwitch.api.toggle({ reason: "press" })}
        style={[styles.switch, checked && styles.switchChecked]}
      >
        <Text style={styles.label}>checked: {String(checked)}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  switch: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#e5e5e5",
  },
  switchChecked: {
    backgroundColor: "#bbf7d0",
  },
  label: {
    fontSize: 20,
  },
})

export { App }
