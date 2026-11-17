import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const format = (layout: number[]) => layout.map(Math.round).join(" / ")

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Example() {
  const log = useLog()
  const [layout, setLayout] = useState([30, 70])

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action label="Split Evenly" onPress={() => setLayout([50, 50])} />
        <Action label="Reset" onPress={() => setLayout([30, 70])} />
      </View>
      <Resizable
        layout={layout}
        onLayoutChange={(next, details) => {
          if (format(next) !== format(layout)) {
            log(`${format(next)} (${details.reason})`)
          }
          setLayout(next)
        }}
        style={styles.group}
      >
        <ResizablePanel minSize={20} style={styles.panel}>
          <Text style={styles.title}>Files</Text>
          <Text style={styles.item}>page.tsx</Text>
          <Text style={styles.item}>layout.tsx</Text>
          <Text style={styles.item}>globals.css</Text>
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize files"
          hitSlop={8}
          style={(state) => [styles.handle, state.dragging && styles.dragging]}
        />
        <ResizablePanel minSize={20} style={styles.panel}>
          <Text style={styles.title}>page.tsx</Text>
          <Text style={styles.hint}>Saved just now</Text>
        </ResizablePanel>
      </Resizable>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
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
  item: { fontSize: 14 },
  hint: { color: "#71717a", fontSize: 13 },
  handle: { width: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
})

export { Example }
