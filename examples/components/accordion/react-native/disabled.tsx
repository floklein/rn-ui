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
    value: "access",
    label: "Can I access my account history?",
    content:
      "Yes. Every order and payment from the last five years is in your account.",
  },
  {
    value: "premium",
    label: "Premium feature information",
    content:
      "Premium includes priority support and early access to new features.",
    disabled: true,
  },
  {
    value: "email",
    label: "How do I update my email address?",
    content:
      "Open Settings, then Account, and change it there. We'll send a confirmation link.",
  },
]

function Example() {
  return (
    <Accordion style={styles.list}>
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          style={styles.item}
        >
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
            <Text>{item.content}</Text>
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
  panel: { paddingBottom: 16 },
})

export { Example }
