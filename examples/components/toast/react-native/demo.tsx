import {
  createToaster,
  Toast,
  ToastAction,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [toast] = React.useState(() => createToaster())
  React.useEffect(
    () => () => {
      toast.dismiss()
    },
    [toast]
  )

  return (
    <>
      <Pressable
        role="button"
        onPress={() =>
          toast("Event created", {
            description: "Friday, June 12 at 10:00 AM",
            action: { label: "Undo", onAction: () => log("Event removed") },
          })
        }
        style={styles.button}
      >
        <Text>Create Event</Text>
      </Pressable>
      <ToastRegion toaster={toast} style={styles.region}>
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
            <View style={styles.stack}>
              <ToastTitle style={styles.title} />
              <ToastDescription style={styles.description} />
            </View>
            <ToastAction style={styles.action}>
              <Text style={styles.actionText}>Undo</Text>
            </ToastAction>
          </Toast>
        )}
      </ToastRegion>
    </>
  )
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  stack: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "600" },
  description: { fontSize: 13, color: "#71717a" },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  actionText: { color: "#fafafa", fontWeight: "500" },
  close: { paddingHorizontal: 12, paddingVertical: 8 },
})

export { Example }
