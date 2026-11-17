import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@ui-sdk/react-native/accordion"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"

const items = [
  {
    value: "one",
    label: "Why animate the height?",
    content: "So the content below slides instead of jumping.",
  },
  {
    value: "two",
    label: "Where does the height come from?",
    content:
      "The panel measures its content and hands the size to its style and children.",
  },
  {
    value: "three",
    label: "Does it animate on first render?",
    content: "No. Panels open on mount show at once.",
  },
]

const slide = (height: Animated.Value, toValue: number) =>
  Animated.timing(height, { toValue, duration: 200, useNativeDriver: false })

function Grow({ height, to }: { height: Animated.Value; to?: number }) {
  useEffect(() => {
    if (to !== undefined) {
      slide(height, to).start()
    }
  }, [height, to])
  return null
}

function Item({ item }: { item: (typeof items)[number] }) {
  const [height] = useState(() => new Animated.Value(0))
  return (
    <AccordionItem value={item.value} style={styles.item}>
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
      <AccordionPanel
        render={<Animated.View style={{ height }} />}
        style={styles.panel}
        onExit={(done) => slide(height, 0).start(() => done())}
      >
        {(state) => (
          <View style={styles.content}>
            {state.open && <Grow height={height} to={state.panelHeight} />}
            <Text>{item.content}</Text>
          </View>
        )}
      </AccordionPanel>
    </AccordionItem>
  )
}

function Example() {
  return (
    <Accordion defaultValue={["one"]} style={styles.list}>
      {items.map((item) => (
        <Item key={item.value} item={item} />
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
  panel: { overflow: "hidden" },
  content: { paddingBottom: 16 },
})

export { Example }
