import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import {
  createToaster,
  Toast,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const notifications = [
  { title: "Event created", description: "Friday, June 12 at 10:00 AM" },
  { title: "Message sent" },
  {
    title: "Hollis Grant joined",
    description: "They can now edit the Launch plan and see its comments.",
  },
  { title: "Changes saved" },
  { title: "Invoice sent", description: "Inès Moreau · $240.00" },
  { title: "Photos uploaded", description: "12 photos added to Summer trip" },
]

function Example() {
  const [toast] = React.useState(() => createToaster())
  const [expanded, setExpanded] = React.useState(false)
  const count = React.useRef(0)
  React.useEffect(
    () => () => {
      toast.dismiss()
    },
    [toast]
  )

  return (
    <View style={styles.stack}>
      <Checkbox
        checked={expanded}
        onCheckedChange={(next) => setExpanded(next === true)}
        style={styles.row}
      >
        {(state) => (
          <>
            <View style={[styles.box, state.checked && styles.boxChecked]}>
              <CheckboxIndicator>
                <View style={styles.check} />
              </CheckboxIndicator>
            </View>
            <Text>Always expanded</Text>
          </>
        )}
      </Checkbox>
      <Pressable
        role="button"
        onPress={() =>
          toast(notifications[count.current++ % notifications.length])
        }
        style={styles.button}
      >
        <Text>Add Toast</Text>
      </Pressable>
      <ToastRegion
        toaster={toast}
        maxVisible={4}
        expanded={expanded}
        style={styles.region}
      >
        {() => (
          <Toast
            style={(state) => [
              styles.toast,
              !state.expanded && state.index > 0 && styles.behind,
              {
                zIndex: -state.index,
                transform: [
                  { translateX: state.swipeX },
                  { translateY: state.swipeY },
                  { scale: state.expanded ? 1 : 1 - state.index * 0.05 },
                ],
              },
            ]}
          >
            <View style={styles.texts}>
              <ToastTitle style={styles.title} />
              <ToastDescription style={styles.description} />
            </View>
          </Toast>
        )}
      </ToastRegion>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  region: { flexDirection: "column-reverse", gap: 8, padding: 16 },
  toast: {
    width: 320,
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  behind: { marginBottom: -60, opacity: 0.9 },
  texts: { gap: 2 },
  title: { fontSize: 14, fontWeight: "600" },
  description: { fontSize: 13, color: "#71717a" },
})

export { Example }
