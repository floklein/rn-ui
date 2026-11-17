import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { Pressable, StyleSheet, Text } from "react-native"

const steps = [
  {
    value: "install",
    label: "Install the package",
    content: "Add it with your package manager. It has no dependencies.",
  },
  {
    value: "import",
    label: "Import the parts",
    content: "Import the accordion parts you need from the package.",
  },
  {
    value: "style",
    label: "Style it",
    content: "Every part hands its state to style functions you write.",
  },
]

function Example() {
  return (
    <Accordion multiple defaultValue={["install"]} style={styles.list}>
      {steps.map((step) => (
        <AccordionItem key={step.value} value={step.value} style={styles.item}>
          <AccordionHeader>
            <AccordionTrigger
              render={(props, state) => (
                <Pressable
                  {...props}
                  style={[styles.trigger, state.open && styles.open]}
                />
              )}
            >
              {(state) => (
                <>
                  <Text style={styles.label}>{step.label}</Text>
                  {state.index >= 0 && (
                    <Text style={styles.hint}>Step {state.index + 1}</Text>
                  )}
                </>
              )}
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel style={styles.panel}>
            <Text>{step.content}</Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    overflow: "hidden",
  },
  item: { borderBottomWidth: 1, borderColor: "#e4e4e7" },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  open: { backgroundColor: "#f4f4f5" },
  label: { flex: 1, fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  panel: { padding: 16 },
})

export { Example }
