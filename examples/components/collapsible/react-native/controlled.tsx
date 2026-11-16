import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  createCollapsibleController,
} from "@ui-sdk/react-native/collapsible"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const recoveryCodes = ["7KQ2-M9XD", "P4TR-8HZC", "W3NB-6JUE", "C5YF-2LSA"]

function Example() {
  const log = useLog()
  const [collapsible] = useState(createCollapsibleController)
  const [open, setOpen] = useState(false)

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => collapsible.toggle()}
        style={styles.button}
      >
        <Text>Toggle</Text>
      </Pressable>
      <Collapsible
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next)
          log(`${next ? "Opened" : "Closed"} (${details.reason})`)
        }}
        controller={collapsible}
        style={styles.card}
      >
        <CollapsibleTrigger style={styles.trigger}>
          <Text style={styles.title}>Recovery codes</Text>
          <Text style={styles.hint}>Each code signs you in once</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel style={styles.panel}>
          {recoveryCodes.map((code) => (
            <Text key={code} style={styles.code}>
              {code}
            </Text>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => collapsible.close()}
            style={styles.button}
          >
            <Text>Done</Text>
          </Pressable>
        </CollapsiblePanel>
      </Collapsible>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  card: { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12 },
  trigger: { gap: 2, padding: 16 },
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  panel: { gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  code: { fontFamily: "Menlo" },
})

export { Example }
