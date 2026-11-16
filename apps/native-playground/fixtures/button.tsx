import {
  Button,
  type ButtonActionDetails,
  type ButtonState,
} from "@ui-sdk/react-native/button"
import { useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const stateOf = (state: ButtonState) =>
  state.pending ? "pending" : state.error ? "error" : "idle"

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

const buttonStyle = (state: ButtonState) => [
  styles.button,
  (state.disabled || state.pending) && styles.unavailable,
]

function Fixture() {
  const [presses, setPresses] = useState<string[]>([])
  const waiting = useRef<(() => void)[]>([])
  const wait = () =>
    new Promise<void>((resolve) => {
      waiting.current.push(resolve)
    })
  const record =
    (name: string) => (_event: unknown, details: ButtonActionDetails) =>
      setPresses((current) => [...current, `${name}:${details.source}`])

  return (
    <View style={styles.fixture}>
      <Button
        aria-label="Save"
        testID="button-save"
        onPress={(event, details) => {
          record("save")(event, details)
          return wait()
        }}
        render={(props, state) => (
          <View style={styles.row}>
            <Pressable {...props} />
            <Text testID="save-state">{stateOf(state)}</Text>
          </View>
        )}
        style={buttonStyle}
      >
        <Text style={styles.label}>Save</Text>
      </Button>
      <Button
        testID="button-export"
        onPress={(event, details) => {
          record("export")(event, details)
          return wait()
        }}
        style={buttonStyle}
      >
        <Text style={styles.label}>Export</Text>
      </Button>
      <Button
        aria-label="Sync"
        testID="button-sync"
        onPress={(event, details) => {
          record("sync")(event, details)
          return Promise.reject(new Error("offline"))
        }}
        render={(props, state) => (
          <View style={styles.row}>
            <Pressable {...props} />
            <Text testID="sync-state">{stateOf(state)}</Text>
          </View>
        )}
        style={buttonStyle}
      >
        <Text style={styles.label}>Sync</Text>
      </Button>
      <Button
        aria-label="Delete"
        testID="button-delete"
        disabled
        onPress={record("delete")}
        style={buttonStyle}
      >
        <Text style={styles.label}>Delete</Text>
      </Button>
      <Button
        aria-label="Publish"
        testID="button-publish"
        disabled
        focusableWhenDisabled
        onPress={record("publish")}
        style={buttonStyle}
      >
        <Text style={styles.label}>Publish</Text>
      </Button>
      <Button
        aria-label="Share"
        testID="button-share"
        onPress={record("share")}
        style={buttonStyle}
      >
        <Text style={styles.label}>Share</Text>
      </Button>
      <View style={styles.actions}>
        <Action
          label="Finish waiting"
          testID="finish-waiting"
          onPress={() => waiting.current.splice(0).forEach((done) => done())}
        />
      </View>
      <Text testID="presses">{presses.join(" ") || "none"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  unavailable: { opacity: 0.5 },
  label: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
