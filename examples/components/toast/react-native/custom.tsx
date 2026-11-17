import {
  createToaster,
  Toast,
  ToastAction,
  ToastClose,
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
          toast({
            title: "Hollis Grant",
            description: "Can you review the draft?",
            data: { initials: "HG" },
            action: {
              label: "Reply",
              onAction: () => log("Replying to Hollis Grant"),
            },
          })
        }
        style={styles.button}
      >
        <Text>New Message</Text>
      </Pressable>
      <ToastRegion toaster={toast} aria-label="Messages" style={styles.region}>
        {(item) => (
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
            <View style={styles.media} aria-hidden>
              <Text style={styles.initials}>
                {(item.data as { initials: string }).initials}
              </Text>
            </View>
            <View style={styles.stack}>
              <ToastTitle style={styles.title} />
              <ToastDescription style={styles.description} />
            </View>
            <ToastAction style={styles.action}>
              <Text style={styles.actionText}>Reply</Text>
            </ToastAction>
            <ToastClose aria-label="Close" style={styles.close}>
              <Text aria-hidden>✕</Text>
            </ToastClose>
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
  media: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  initials: { fontSize: 13, fontWeight: "600" },
})

export { Example }
