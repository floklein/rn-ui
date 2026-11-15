import {
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Text style={styles.label}>Small</Text>
        <Switch
          aria-label="Small"
          style={(state) => [trackStyle(state), styles.trackSmall]}
        >
          <SwitchThumb
            style={(state) => [
              styles.thumb,
              styles.thumbSmall,
              state.checked && styles.thumbSmallOn,
            ]}
          />
        </Switch>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Default</Text>
        <Switch aria-label="Default" style={trackStyle}>
          <SwitchThumb
            style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
          />
        </Switch>
      </View>
    </View>
  )
}

const trackStyle = (state: SwitchState) => [
  styles.track,
  state.checked && styles.checked,
]

const styles = StyleSheet.create({
  stack: { gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16, width: 64 },
  track: {
    width: 52,
    height: 32,
    padding: 2,
    borderRadius: 16,
    backgroundColor: "#d4d4d8",
  },
  trackSmall: { width: 36, height: 20, borderRadius: 10 },
  checked: { backgroundColor: "#16a34a" },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 20 }] },
  thumbSmall: { width: 16, height: 16, borderRadius: 8 },
  thumbSmallOn: { transform: [{ translateX: 16 }] },
})

export { Example }
