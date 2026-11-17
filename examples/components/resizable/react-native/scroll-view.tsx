import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import { useState } from "react"
import { ScrollView, StyleSheet, Text } from "react-native"

const messages = ["Inès Moreau", "Kofi Mensah", "Wren Takahashi"]

function Example() {
  const [dragging, setDragging] = useState(false)

  return (
    <ScrollView scrollEnabled={!dragging} style={styles.page}>
      <Text style={styles.heading}>Inbox</Text>
      <Resizable orientation="vertical" style={styles.group}>
        <ResizablePanel defaultSize={40} minSize={20} style={styles.panel}>
          {messages.map((name) => (
            <Text key={name} style={styles.item}>
              {name}
            </Text>
          ))}
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize messages"
          hitSlop={8}
          onResponderGrant={() => setDragging(true)}
          onResponderRelease={() => setDragging(false)}
          onResponderTerminate={() => setDragging(false)}
          style={(state) => [styles.handle, state.dragging && styles.dragging]}
        />
        <ResizablePanel minSize={20} style={styles.panel}>
          <Text style={styles.title}>Can we move the review to Friday?</Text>
          <Text style={styles.hint}>From Inès Moreau</Text>
        </ResizablePanel>
      </Resizable>
      <Text style={styles.footer}>
        Archived conversations stay for 30 days.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { width: 320, height: 240 },
  heading: { fontSize: 17, fontWeight: "600", marginBottom: 8 },
  group: {
    height: 360,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  panel: { padding: 12, gap: 4 },
  title: { fontSize: 15, fontWeight: "600" },
  item: { fontSize: 14 },
  hint: { color: "#71717a", fontSize: 13 },
  handle: { height: 1, backgroundColor: "#d4d4d8" },
  dragging: { backgroundColor: "#18181b" },
  footer: { color: "#71717a", fontSize: 13, marginTop: 8 },
})

export { Example }
