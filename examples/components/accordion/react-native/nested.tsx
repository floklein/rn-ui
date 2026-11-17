import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { StyleSheet, Text, View } from "react-native"

const sections: {
  value: string
  label: string
  content?: string
  topics?: { value: string; label: string; content: string }[]
}[] = [
  {
    value: "profile",
    label: "Profile",
    content: "Your name, photo and the email address people see.",
  },
  {
    value: "notifications",
    label: "Notifications",
    topics: [
      {
        value: "email",
        label: "Email",
        content: "A weekly digest, and mentions as they happen.",
      },
      {
        value: "push",
        label: "Push",
        content: "Direct messages and replies to your comments.",
      },
    ],
  },
  {
    value: "billing",
    label: "Billing",
    topics: [
      {
        value: "payment",
        label: "Payment methods",
        content: "A Visa card ending in 4242, used for every renewal.",
      },
      {
        value: "invoices",
        label: "Invoices",
        content: "Download a PDF of any invoice from the last two years.",
      },
    ],
  },
]

function Trigger({ label, nested }: { label: string; nested?: boolean }) {
  return (
    <AccordionHeader>
      <AccordionTrigger style={styles.trigger}>
        {(state) => (
          <>
            <Text style={nested ? styles.topic : styles.label}>{label}</Text>
            <View style={[styles.chevron, state.open && styles.chevronOpen]} />
          </>
        )}
      </AccordionTrigger>
    </AccordionHeader>
  )
}

function Example() {
  return (
    <Accordion defaultValue={["notifications"]} style={styles.list}>
      {sections.map((section) => (
        <AccordionItem
          key={section.value}
          value={section.value}
          style={styles.item}
        >
          <Trigger label={section.label} />
          <AccordionPanel style={styles.panel}>
            {section.topics ? (
              <Accordion multiple style={styles.nested}>
                {section.topics.map((topic) => (
                  <AccordionItem key={topic.value} value={topic.value}>
                    <Trigger label={topic.label} nested />
                    <AccordionPanel style={styles.panel}>
                      <Text>{topic.content}</Text>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Text>{section.content}</Text>
            )}
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderColor: "#e4e4e7" },
  item: { borderBottomWidth: 1, borderColor: "#e4e4e7" },
  nested: { paddingLeft: 16 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
  topic: { flex: 1, fontSize: 14 },
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
