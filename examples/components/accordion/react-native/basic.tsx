import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { StyleSheet, Text, View } from "react-native"

const items = [
  {
    value: "shipping",
    label: "What are your shipping options?",
    content: [
      "We offer standard (5 to 7 days), express (2 to 3 days) and overnight shipping.",
      "Every order ships with tracking, and orders over $50 ship free.",
    ],
  },
  {
    value: "returns",
    label: "What is your return policy?",
    content: [
      "Return any unused item in its original packaging within 30 days. Refunds arrive within 5 to 7 business days.",
    ],
  },
  {
    value: "support",
    label: "How can I reach support?",
    content: [
      "Write to us by email or chat, or call us. We answer within 24 hours on business days.",
    ],
  },
]

function Example() {
  return (
    <Accordion defaultValue={["shipping"]} style={styles.list}>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value} style={styles.item}>
          <AccordionHeader>
            <AccordionTrigger style={styles.trigger}>
              {(state) => (
                <>
                  <Text style={styles.label}>{item.label}</Text>
                  <View
                    style={[styles.chevron, state.open && styles.chevronOpen]}
                  />
                </>
              )}
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel style={styles.panel}>
            {item.content.map((paragraph) => (
              <Text key={paragraph}>{paragraph}</Text>
            ))}
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderColor: "#e4e4e7" },
  item: { borderBottomWidth: 1, borderColor: "#e4e4e7" },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#71717a",
    transform: [{ rotate: "45deg" }],
  },
  chevronOpen: { transform: [{ rotate: "225deg" }] },
  panel: { gap: 8, paddingBottom: 16 },
})

export { Example }
