import {
  createSwitchController,
  Switch,
  SwitchThumb,
  type SwitchOptions,
  type SwitchState,
} from "@ui-sdk/react-native/switch"
import { useState, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<SwitchOptions["onCheckedChange"]>

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Thumb() {
  return (
    <SwitchThumb
      style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
    />
  )
}

const track = (state: SwitchState) => [
  styles.track,
  state.checked && styles.checked,
  state.disabled && styles.disabled,
]

function Fixture() {
  const [lastChange, setLastChange] = useState("none")
  const [bluetooth, setBluetooth] = useState(false)
  const [controller] = useState(createSwitchController)
  const [mounted, setMounted] = useState(true)
  const [read, setRead] = useState("")
  const record =
    (name: string): Change =>
    (checked, details) =>
      setLastChange(`${name}:${checked}:${details.reason}:${details.source}`)

  return (
    <View style={styles.fixture}>
      <Row label="Wi-Fi">
        <Switch
          aria-label="Wi-Fi"
          testID="switch-wifi"
          defaultChecked
          onCheckedChange={record("wifi")}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      <Row label="Airplane mode">
        <Switch
          aria-label="Airplane mode"
          testID="switch-airplane"
          onCheckedChange={record("airplane")}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      <Row label="Bluetooth">
        <Switch
          aria-label="Bluetooth"
          testID="switch-bluetooth"
          checked={bluetooth}
          onCheckedChange={(checked, details) => {
            record("bluetooth")(checked, details)
            setBluetooth(checked)
          }}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      <Row label="Hotspot">
        <Switch
          aria-label="Hotspot"
          testID="switch-hotspot"
          onCheckedChange={(checked, details) => {
            details.cancel()
            record("hotspot")(checked, details)
          }}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      <Row label="Roaming">
        <Switch
          aria-label="Roaming"
          testID="switch-roaming"
          defaultChecked
          disabled
          onCheckedChange={record("roaming")}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      <Row label="Data saver">
        <Switch
          aria-label="Data saver"
          testID="switch-data-saver"
          readOnly
          onCheckedChange={record("data-saver")}
          style={track}
        >
          <Thumb />
        </Switch>
      </Row>
      {mounted && (
        <Row label="Night shift">
          <Switch
            aria-label="Night shift"
            testID="switch-night-shift"
            controller={controller}
            onCheckedChange={record("night-shift")}
            style={track}
          >
            <Thumb />
          </Switch>
        </Row>
      )}
      <View style={styles.actions}>
        <Action
          label="Turn Bluetooth off"
          testID="bluetooth-off"
          onPress={() => setBluetooth(false)}
        />
        <Action
          label="Toggle night shift"
          testID="controller-toggle"
          onPress={() => controller.toggle()}
        />
        <Action
          label="Read night shift"
          testID="controller-read"
          onPress={() => setRead(String(controller.getChecked()))}
        />
        <Action
          label="Remove night shift"
          testID="night-shift-remove"
          onPress={() => setMounted(false)}
        />
      </View>
      <Text testID="last-change">{lastChange}</Text>
      <Text testID="night-shift-read">{read || "unread"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 15 },
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
