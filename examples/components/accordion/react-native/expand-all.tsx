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

const weeks = [
  {
    value: "week-1",
    label: "Week 1: Foundations",
    content:
      "Set up your editor, meet the command line and write your first script.",
  },
  {
    value: "week-2",
    label: "Week 2: Data and types",
    content:
      "Strings, numbers, lists and objects, and how to tell them apart when a program runs.",
  },
  {
    value: "week-3",
    label: "Week 3: Control flow",
    content:
      "Conditions, loops and functions. The project this week is a small text adventure.",
  },
  {
    value: "week-4",
    label: "Week 4: Working with files",
    content:
      "Read and write files, parse CSV and JSON, and handle the errors that come with them.",
  },
  {
    value: "week-5",
    label: "Week 5: Final project",
    content:
      "Build a tool you'll use yourself, then present it to the group in a five-minute demo.",
  },
]

function Example() {
  const [syllabus] = useState(createAccordionController)
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => syllabus.openAll()}
          style={styles.button}
        >
          <Text>Expand all</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => syllabus.closeAll()}
          style={styles.button}
        >
          <Text>Collapse all</Text>
        </Pressable>
      </View>
      <Accordion multiple controller={syllabus} style={styles.list}>
        {weeks.map((week) => (
          <AccordionItem
            key={week.value}
            value={week.value}
            style={styles.item}
          >
            <AccordionHeader>
              <AccordionTrigger style={styles.trigger}>
                {(state) => (
                  <>
                    <Text style={styles.label}>{week.label}</Text>
                    <View
                      style={[styles.chevron, state.open && styles.chevronOpen]}
                    />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel style={styles.panel}>
              <Text>{week.content}</Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
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
