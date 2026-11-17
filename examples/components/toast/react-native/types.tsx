import {
  createToaster,
  Toast,
  ToastRegion,
  type ToastState,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const colors: Record<ToastState["type"], string> = {
  default: "#a1a1aa",
  success: "#16a34a",
  info: "#2563eb",
  warning: "#d97706",
  error: "#dc2626",
  loading: "#71717a",
}

function upload() {
  return new Promise((resolve) => setTimeout(resolve, 2000))
}

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
          onPress={() => toast("Event created")}
          style={styles.button}
        >
          <Text>Default</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.success("Changes saved")}
          style={styles.button}
        >
          <Text>Success</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.info("A new version is available")}
          style={styles.button}
        >
          <Text>Info</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.warning("Storage is almost full")}
          style={styles.button}
        >
          <Text>Warning</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.error("Couldn't save changes")}
          style={styles.button}
        >
          <Text>Error</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() =>
            toast.promise(upload, {
              loading: "Uploading photos…",
              success: "Photos uploaded",
              error: "Upload failed",
            })
          }
          style={styles.button}
        >
          <Text>Loading</Text>
        </Pressable>
      </View>
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
            {(state) => (
              <>
                <View
                  style={[styles.dot, { backgroundColor: colors[state.type] }]}
                />
                <ToastTitle style={styles.title} />
              </>
            )}
          </Toast>
        )}
      </ToastRegion>
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
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
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 14, fontWeight: "600" },
})

export { Example }
