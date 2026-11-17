import {
  SegmentedControl,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import {
  createToaster,
  Toast,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const sides = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
]

const aligns = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
]

type Side = "top" | "bottom"
type Align = "start" | "center" | "end"

function Example() {
  const [toast] = React.useState(() => createToaster())
  const [side, setSide] = React.useState<Side>("bottom")
  const [align, setAlign] = React.useState<Align>("end")
  React.useEffect(
    () => () => {
      toast.dismiss()
    },
    [toast]
  )

  return (
    <View style={styles.stack}>
      <SegmentedControl
        aria-label="Side"
        value={side}
        onValueChange={(next) => next && setSide(next as Side)}
        style={styles.control}
      >
        {sides.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={(state) => [styles.item, state.selected && styles.selected]}
          >
            <Text>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <SegmentedControl
        aria-label="Align"
        value={align}
        onValueChange={(next) => next && setAlign(next as Align)}
        style={styles.control}
      >
        {aligns.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={(state) => [styles.item, state.selected && styles.selected]}
          >
            <Text>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Pressable
        role="button"
        onPress={() =>
          toast("Event created", { description: "Friday, June 12 at 10:00 AM" })
        }
        style={styles.button}
      >
        <Text>Create Event</Text>
      </Pressable>
      <ToastRegion
        toaster={toast}
        side={side}
        align={align}
        style={styles.region}
      >
        {() => (
          <Toast
            style={(state) => [
              styles.toast,
              {
                transform: [
                  { translateX: state.swipeX },
                  { translateY: state.swipeY },
                ],
              },
            ]}
          >
            <ToastTitle style={styles.title} />
            <ToastDescription style={styles.description} />
          </Toast>
        )}
      </ToastRegion>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  control: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 2,
    borderRadius: 8,
    backgroundColor: "#f4f4f5",
  },
  item: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  selected: { backgroundColor: "#ffffff" },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  region: { gap: 8, padding: 16 },
  toast: {
    width: 320,
    maxWidth: "100%",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 14, fontWeight: "600" },
  description: { fontSize: 13, color: "#71717a" },
})

export { Example }
