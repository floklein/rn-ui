import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"

const faq = [
  {
    value: "returns",
    question: "What is your return policy?",
    answer:
      "Return any unused item within 30 days. Once it reaches us, your refund is on its way.",
  },
  {
    value: "refunds",
    question: "How long do refunds take?",
    answer:
      "Refunds reach your card within 5 to 7 business days after we receive the item.",
  },
  {
    value: "shipping",
    question: "Do you ship internationally?",
    answer:
      "We ship to 40 countries. Duties are included in the price at checkout.",
  },
  {
    value: "tracking",
    question: "How do I track my order?",
    answer:
      "Every shipping email has a tracking link. You'll also find it under Orders.",
  },
  {
    value: "exchange",
    question: "Can I exchange an item for another size?",
    answer:
      "Yes. Start a return, choose Exchange and pick the new size. Shipping is free.",
  },
  {
    value: "gift",
    question: "Can I send an order as a gift?",
    answer:
      "Add a gift note at checkout and we'll leave the prices off the packing slip.",
  },
]

function matches(question: (typeof faq)[number], query: string) {
  const search = query.trim().toLowerCase()
  return (
    !search ||
    question.question.toLowerCase().includes(search) ||
    question.answer.toLowerCase().includes(search)
  )
}

function highlight(text: string, query: string) {
  const search = query.trim().toLowerCase()
  if (!search) {
    return [{ text, match: false }]
  }
  const parts: { text: string; match: boolean }[] = []
  let start = 0
  for (let index = text.toLowerCase().indexOf(search); index !== -1;) {
    if (index > start) {
      parts.push({ text: text.slice(start, index), match: false })
    }
    parts.push({ text: text.slice(index, index + search.length), match: true })
    start = index + search.length
    index = text.toLowerCase().indexOf(search, start)
  }
  if (start < text.length) {
    parts.push({ text: text.slice(start), match: false })
  }
  return parts
}

function Highlight({
  text,
  query,
  style,
}: {
  text: string
  query: string
  style?: React.ComponentProps<typeof Text>["style"]
}) {
  return (
    <Text style={style}>
      {highlight(text, query).map((part, index) =>
        part.match ? (
          <Text key={index} style={styles.mark}>
            {part.text}
          </Text>
        ) : (
          part.text
        )
      )}
    </Text>
  )
}

function Example() {
  const [query, setQuery] = useState("")
  const [value, setValue] = useState<string[]>([])
  const results = faq.filter((question) => matches(question, query))

  return (
    <View style={styles.stack}>
      <TextInput
        accessibilityLabel="Search questions"
        placeholder="Search questions…"
        value={query}
        onChangeText={(next) => {
          setQuery(next)
          setValue(
            next.trim()
              ? faq
                  .filter((question) => matches(question, next))
                  .map((question) => question.value)
              : []
          )
        }}
        style={styles.input}
      />
      <Accordion
        multiple
        value={value}
        onValueChange={setValue}
        style={styles.list}
      >
        {results.map((question) => (
          <AccordionItem
            key={question.value}
            value={question.value}
            style={styles.item}
          >
            <AccordionHeader>
              <AccordionTrigger style={styles.trigger}>
                {(state) => (
                  <>
                    <Highlight
                      text={question.question}
                      query={query}
                      style={styles.label}
                    />
                    <View
                      style={[styles.chevron, state.open && styles.chevronOpen]}
                    />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel style={styles.panel}>
              <Highlight text={question.answer} query={query} />
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      {results.length === 0 && (
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          No questions match “{query}”.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
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
  mark: { backgroundColor: "#fef08a" },
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
  hint: { fontSize: 14, color: "#71717a" },
})

export { Example }
