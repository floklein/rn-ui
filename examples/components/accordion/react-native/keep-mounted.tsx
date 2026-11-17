import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Textarea } from "@ui-sdk/react-native/textarea"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Accordion defaultValue={["reply"]} style={styles.list}>
      <AccordionItem value="reply" style={styles.item}>
        <AccordionHeader>
          <AccordionTrigger style={styles.trigger}>
            {(state) => (
              <>
                <Text style={styles.label}>Reply to this thread</Text>
                <View
                  style={[styles.chevron, state.open && styles.chevronOpen]}
                />
              </>
            )}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel keepMounted style={styles.panel}>
          <Field style={styles.field}>
            <FieldLabel style={styles.fieldLabel}>Message</FieldLabel>
            <Textarea placeholder="Write a reply…" style={styles.textarea} />
          </Field>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="formatting" style={styles.item}>
        <AccordionHeader>
          <AccordionTrigger style={styles.trigger}>
            {(state) => (
              <>
                <Text style={styles.label}>Formatting</Text>
                <View
                  style={[styles.chevron, state.open && styles.chevronOpen]}
                />
              </>
            )}
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel style={styles.panel}>
          <Text>
            Use **bold**, _italics_ and `code`. Links paste as previews.
          </Text>
        </AccordionPanel>
      </AccordionItem>
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
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "500" },
  textarea: {
    minHeight: 80,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    fontSize: 16,
    textAlignVertical: "top",
  },
})

export { Example }
