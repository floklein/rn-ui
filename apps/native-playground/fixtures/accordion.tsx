import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  createAccordionController,
} from "@ui-sdk/react-native/accordion"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const items = [
  { value: "shipping", label: "Shipping", answer: "Ships in two days." },
  { value: "returns", label: "Returns", answer: "Return within 30 days." },
]

function Fixture() {
  const [accordion] = useState(createAccordionController)
  const [changes, setChanges] = useState<string[]>([])
  const [completes, setCompletes] = useState<string[]>([])
  const [finish, setFinish] = useState<() => void>()

  return (
    <View style={styles.fixture}>
      <Text testID="accordion-changes">{changes.join(" ") || "none"}</Text>
      <Text testID="accordion-completes">{completes.join(" ") || "none"}</Text>
      <Accordion
        controller={accordion}
        onValueChange={(value, details) =>
          setChanges((current) => [
            ...current,
            [value.join(",") || "-", details.reason, details.source].join(":"),
          ])
        }
        style={styles.list}
      >
        {items.map((item) => (
          <AccordionItem
            key={item.value}
            value={item.value}
            onOpenChangeComplete={(open) =>
              setCompletes((current) => [...current, `${item.value}:${open}`])
            }
            style={styles.item}
          >
            {(state) => (
              <>
                <AccordionHeader>
                  <AccordionTrigger
                    testID={`${item.value}-trigger`}
                    style={styles.trigger}
                  >
                    <Text>{item.label}</Text>
                  </AccordionTrigger>
                </AccordionHeader>
                <Text testID={`${item.value}-index`}>
                  {String(state.index)}
                </Text>
                <AccordionPanel
                  testID={`${item.value}-panel`}
                  onExit={(done) => setFinish(() => done)}
                  style={(panel) => ({
                    height: panel.panelHeight,
                    overflow: "hidden",
                  })}
                >
                  <Text testID={`${item.value}-text`} style={styles.content}>
                    {item.answer}
                  </Text>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        ))}
      </Accordion>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="open-returns"
          onPress={() => accordion.open("returns")}
          style={styles.action}
        >
          <Text>Open returns</Text>
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
  list: { borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 8 },
  item: { borderBottomWidth: 1, borderColor: "#d4d4d8" },
  trigger: { padding: 12 },
  content: { padding: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }
