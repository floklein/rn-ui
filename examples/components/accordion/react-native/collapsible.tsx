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
    value: "overview",
    label: "Overview",
    content: "A summary of the project, its goals and its owners.",
  },
  {
    value: "timeline",
    label: "Timeline",
    content: "Kickoff in March, beta in June and launch in September.",
  },
  {
    value: "budget",
    label: "Budget",
    content: "Approved for two engineers and one designer for six months.",
  },
]

function Example() {
  return (
    <Accordion
      collapsible={false}
      defaultValue={["overview"]}
      style={styles.list}
    >
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
