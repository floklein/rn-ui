import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Airplane mode</Text>
      <Switch
        aria-label="Airplane mode"
        style={(state) => [styles.track, state.checked && styles.checked]}
      >
        <SwitchThumb
          style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
        />
      </Switch>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16 },
  track: {
    width: 52,
    height: 32,
    padding: 2,
    borderRadius: 16,
    backgroundColor: "#d4d4d8",
  },
  checked: { backgroundColor: "#16a34a" },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 20 }] },
})

export { Example }
