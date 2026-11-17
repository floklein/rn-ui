import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  createAccordionController,
} from "@ui-sdk/react-native/accordion"
import { useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"

const items = [
  {
    value: "account",
    label: "Account",
    content: "Your name, email address and profile photo.",
  },
  {
    value: "security",
    label: "Security",
    content: "Your password, passkeys and two-factor authentication.",
  },
  {
    value: "sessions",
    label: "Sessions",
    content: "Devices signed in to your account in the last 30 days.",
  },
]

function Example() {
  const [accordion] = useState(createAccordionController)
  const [value, setValue] = useState(["account"])

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => accordion.open("security")}
        style={styles.button}
      >
        <Text>Review security</Text>
      </Pressable>
      <Accordion
        multiple
        value={value}
        onValueChange={setValue}
        controller={accordion}
        style={styles.list}
      >
        {items.map((item) => (
          <AccordionItem
            key={item.value}
            value={item.value}
            onOpenChange={(open, details) => {
              if (
                open ||
                item.value !== "security" ||
                details.reason !== "trigger-press"
              ) {
                return
              }
              details.cancel()
              Alert.alert("Close the security settings?", undefined, [
                { text: "Cancel", style: "cancel" },
                { text: "Close", onPress: () => accordion.close("security") },
              ])
            }}
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
