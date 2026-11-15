import {
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <View style={styles.stack}>
        <Text style={styles.label}>Encrypt backups</Text>
        <Text style={styles.hint}>Your organization manages this setting.</Text>
      </View>
      <Switch
        aria-label="Encrypt backups"
        aria-description="Your organization manages this setting."
        defaultChecked
        readOnly
        style={trackStyle}
      >
        <SwitchThumb style={thumbStyle} />
      </Switch>
    </View>
  )
}

const trackStyle = (state: SwitchState) => [
  styles.track,
  state.checked && styles.checked,
]

const thumbStyle = (state: SwitchState) => [
  styles.thumb,
  state.checked && styles.thumbOn,
]

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  stack: { gap: 4, flexShrink: 1 },
  label: { fontSize: 16 },
  hint: { fontSize: 14, color: "#71717a" },
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
