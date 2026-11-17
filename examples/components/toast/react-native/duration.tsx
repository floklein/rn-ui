import {
  createToaster,
  Toast,
  ToastClose,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Example() {
  const [toast] = React.useState(() => createToaster())
  React.useEffect(
    () => () => {
      toast.dismiss()
    },
    [toast]
  )

  return (
    <>
      <View style={styles.row}>
        <Pressable
          role="button"
          onPress={() => toast("Link copied", { duration: 1000 })}
          style={styles.button}
        >
          <Text>1 Second</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast("Changes saved")}
          style={styles.button}
        >
          <Text>5 Seconds</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() =>
            toast("Your session expires in 5 minutes", {
              duration: Infinity,
              dismissible: false,
              cancel: { label: "Got It" },
            })
          }
          style={styles.button}
        >
          <Text>Until Dismissed</Text>
        </Pressable>
      </View>
      <ToastRegion toaster={toast} style={styles.region}>
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
            <ToastTitle style={[styles.title, styles.grow]} />
            {item.cancel && (
              <ToastClose action={item.cancel.onCancel} style={styles.action}>
                <Text style={styles.actionText}>{item.cancel.label}</Text>
              </ToastClose>
            )}
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grow: { flex: 1 },
})

export { Example }
