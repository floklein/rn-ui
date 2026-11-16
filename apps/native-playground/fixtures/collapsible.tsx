import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  createCollapsibleController,
} from "@ui-sdk/react-native/collapsible"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Report({
  size,
  onSize,
}: {
  size?: number
  onSize: (size?: number) => void
}) {
  useEffect(() => onSize(size), [size, onSize])
  return null
}

function Fixture() {
  const [collapsible] = useState(createCollapsibleController)
  const [changes, setChanges] = useState<string[]>([])
  const [completes, setCompletes] = useState<boolean[]>([])
  const [size, setSize] = useState<number>()
  const [finish, setFinish] = useState<() => void>()

  return (
    <View style={styles.fixture}>
      <Text testID="collapsible-changes">{changes.join(" ") || "none"}</Text>
      <Text testID="collapsible-completes">
        {completes.join(" ") || "none"}
      </Text>
      <Text testID="panel-size">
        {size === undefined ? "unmeasured" : String(Math.round(size))}
      </Text>
      <Collapsible
        controller={collapsible}
        onOpenChange={(open, details) =>
          setChanges((current) => [
            ...current,
            [open, details.reason, details.source].join(":"),
          ])
        }
        onOpenChangeComplete={(open) =>
          setCompletes((current) => [...current, open])
        }
        style={styles.card}
      >
        <CollapsibleTrigger testID="trigger" style={styles.trigger}>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel
          testID="panel"
          onExit={(done) => setFinish(() => done)}
          style={(state) => ({ height: state.panelHeight, overflow: "hidden" })}
        >
          {(state) => (
            <View style={styles.content}>
              <Report size={state.panelHeight} onSize={setSize} />
              <Text testID="panel-text">Linen shirt</Text>
              <Text>Canvas tote</Text>
            </View>
          )}
        </CollapsiblePanel>
      </Collapsible>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="toggle"
          onPress={() => collapsible.toggle()}
          style={styles.action}
        >
          <Text>Toggle</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="finish-exit"
          onPress={() => finish?.()}
          style={styles.action}
        >
          <Text>Finish exit</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  card: { borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 8 },
  trigger: { padding: 12 },
  content: { gap: 8, padding: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
