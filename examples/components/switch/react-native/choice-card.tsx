import {
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { StyleSheet, Text, View } from "react-native"

const settings = [
  {
    label: "Public profile",
    description: "Anyone can see your name and photo.",
    defaultChecked: false,
  },
  {
    label: "Show activity status",
    description: "Teammates can see when you're online.",
    defaultChecked: true,
  },
]

function Example() {
  return (
    <View style={styles.list}>
      {settings.map((setting) => (
        <View key={setting.label} style={styles.card}>
          <View style={styles.stack}>
            <Text style={styles.label}>{setting.label}</Text>
            <Text style={styles.hint}>{setting.description}</Text>
          </View>
          <Switch
            aria-label={setting.label}
            aria-description={setting.description}
            defaultChecked={setting.defaultChecked}
            style={trackStyle}
          >
            <SwitchThumb style={thumbStyle} />
          </Switch>
        </View>
      ))}
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
  list: { gap: 12, width: 320 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
  },
  stack: { gap: 4, flex: 1 },
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
