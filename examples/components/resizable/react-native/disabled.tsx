import {
  Resizable,
  ResizableHandle,
  type ResizableHandleState,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  const [locked, setLocked] = useState(false)

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Text style={styles.label}>Lock layout</Text>
        <Switch
          aria-label="Lock layout"
          checked={locked}
          onCheckedChange={setLocked}
          style={(state) => [styles.track, state.checked && styles.checked]}
        >
          <SwitchThumb
            style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
          />
        </Switch>
      </View>
      <Resizable disabled={locked} style={styles.group}>
        <ResizablePanel minSize={15} style={styles.panel}>
          <Text style={styles.title}>Pinned</Text>
          <Text style={styles.hint}>2 notes</Text>
        </ResizablePanel>
        <ResizableHandle
          disabled
          aria-label="Resize pinned"
          hitSlop={8}
          style={handleStyle}
        />
        <ResizablePanel minSize={15} style={styles.panel}>
          <Text style={styles.title}>Inbox</Text>
          <Text style={styles.hint}>3 unread</Text>
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize inbox"
          hitSlop={8}
          style={handleStyle}
        />
        <ResizablePanel minSize={15} style={styles.panel}>
          <Text style={styles.title}>Archive</Text>
          <Text style={styles.hint}>128 messages</Text>
        </ResizablePanel>
      </Resizable>
    </View>
  )
}

const handleStyle = (state: ResizableHandleState) => [
  styles.handle,
  state.dragging && styles.dragging,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
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
  thumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffffff" },
  thumbOn: { transform: [{ translateX: 20 }] },
  group: {
    width: 320,
    height: 200,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  panel: { padding: 12, gap: 4 },
  title: { fontSize: 15, fontWeight: "600" },
  hint: { color: "#71717a", fontSize: 13 },
  handle: { width: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
  disabled: { backgroundColor: "#f4f4f5" },
})

export { Example }
