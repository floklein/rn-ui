import {
  createSwitchController,
  Switch,
  SwitchThumb,
  type SwitchProps,
} from "@ui-sdk/react-native/switch"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Demo({ label, ...props }: SwitchProps & { label: string }) {
  return (
    <View style={styles.row}>
      <Switch
        accessibilityLabel={label}
        testID={`switch-${label}`}
        style={(state, interaction) => [
          styles.track,
          state.checked && styles.trackOn,
          state.disabled && styles.disabled,
          interaction.pressed && styles.pressed,
        ]}
        {...props}
      >
        <SwitchThumb
          style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
        />
      </Switch>
      <Text>{label}</Text>
    </View>
  )
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={label}
      onPress={onPress}
      style={styles.action}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  )
}

function SwitchScreen({ log }: { log: (line: string) => void }) {
  const controller = useMemo(createSwitchController, [])
  const [mounted, setMounted] = useState(true)
  const [controlled, setControlled] = useState(false)
  const heard =
    (name: string) =>
    (
      checked: boolean,
      details: { reason: string; source: string; event?: unknown }
    ) =>
      log(
        `${name} onCheckedChange checked=${checked} reason=${details.reason} source=${details.source} event=${String(details.event)}`
      )
  return (
    <>
      {mounted && (
        <Demo
          label="uncontrolled"
          controller={controller}
          onCheckedChange={heard("uncontrolled")}
        />
      )}
      <View style={styles.actions}>
        <Action
          label="toggle()"
          onPress={() => log(`controller.toggle() -> ${controller.toggle()}`)}
        />
        <Action
          label="setChecked(true)"
          onPress={() =>
            log(
              `controller.setChecked(true) -> ${controller.setChecked(true)}`
            )
          }
        />
        <Action
          label="getChecked()"
          onPress={() =>
            log(`controller.getChecked() -> ${controller.getChecked()}`)
          }
        />
        <Action
          label="focus()"
          onPress={() => {
            controller.focus()
            log("controller.focus() called")
          }}
        />
        <Action
          label={mounted ? "unmount" : "mount"}
          onPress={() => setMounted(!mounted)}
        />
      </View>
      <Demo
        label="controlled"
        checked={controlled}
        onCheckedChange={(checked, details) => {
          heard("controlled")(checked, details)
          setControlled(checked)
        }}
      />
      <Text testID="controlled-state">parent state: {String(controlled)}</Text>
      <Demo
        label="cancelled"
        onCheckedChange={(checked, details) => {
          details.cancel()
          heard("cancelled")(checked, details)
          log(`cancelled details.canceled=${details.canceled}`)
        }}
      />
      <Demo
        label="disabled"
        disabled
        defaultChecked
        onCheckedChange={heard("disabled")}
      />
      <Demo
        label="readOnly"
        readOnly
        onCheckedChange={heard("readOnly")}
      />
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  track: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 3,
    backgroundColor: "#d4d4d4",
  },
  trackOn: { backgroundColor: "#16a34a" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  thumbOn: { marginLeft: 24 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#1d4ed8",
  },
  actionText: { color: "#fff", fontSize: 12 },
})

export { Action, SwitchScreen }
