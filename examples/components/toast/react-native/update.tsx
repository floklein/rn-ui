import {
  createToaster,
  Toast,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [toast] = React.useState(() => createToaster())
  const timer = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  )
  React.useEffect(
    () => () => {
      clearInterval(timer.current)
      toast.dismiss()
    },
    [toast]
  )

  function upload() {
    clearInterval(timer.current)
    const id = toast.loading("Uploading report.pdf… 0%", { id: "upload" })
    let progress = 0
    timer.current = setInterval(() => {
      progress += 20
      const done = progress >= 100
      const open = toast.update(
        id,
        done
          ? { title: "Report uploaded", type: "success" }
          : { title: `Uploading report.pdf… ${progress}%` }
      )
      if (!open) {
        log("Upload canceled")
      }
      if (done || !open) {
        clearInterval(timer.current)
      }
    }, 700)
  }

  return (
    <>
      <View style={styles.row}>
        <Pressable role="button" onPress={upload} style={styles.button}>
          <Text>Upload Report</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.dismiss("upload")}
          style={styles.button}
        >
          <Text>Cancel Upload</Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={() => toast.dismiss()}
          style={styles.button}
        >
          <Text>Dismiss All</Text>
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
                  style={[
                    styles.dot,
                    state.type === "success" && styles.success,
                  ]}
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
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#a1a1aa" },
  success: { backgroundColor: "#16a34a" },
  title: { fontSize: 14, fontWeight: "600" },
})

export { Example }
