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
    value: "notifications",
    label: "Notification settings",
    content: "Choose what we email you about, and how often.",
  },
  {
    value: "privacy",
    label: "Privacy and security",
    content: "Turn on two-factor authentication and review signed-in devices.",
  },
  {
    value: "billing",
    label: "Billing and subscription",
    content: "Update your payment method and download past invoices.",
  },
]

function Example() {
  return (
    <Accordion multiple defaultValue={["notifications"]} style={styles.list}>
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
