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
        <Text style={styles.label}>Product updates</Text>
        <Switch aria-label="Product updates" style={trackStyle}>
          <SwitchThumb style={thumbStyle} />
        </Switch>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Security alerts</Text>
        <Switch
          aria-label="Security alerts"
          defaultChecked
          disabled
          style={trackStyle}
        >
          <SwitchThumb style={thumbStyle} />
        </Switch>
      </View>
    </View>
  )
}

const trackStyle = (state: SwitchState) => [
  styles.track,
  state.checked && styles.checked,
  state.disabled && styles.disabled,
]

const thumbStyle = (state: SwitchState) => [
  styles.thumb,
  state.checked && styles.thumbOn,
]

const styles = StyleSheet.create({
  stack: { gap: 16 },
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
  disabled: { opacity: 0.5 },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 20 }] },
})

export { Example }
