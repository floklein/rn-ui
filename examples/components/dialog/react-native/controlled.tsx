import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const topics = [
  { label: "Product updates", checked: true },
  { label: "Security alerts", checked: true },
  { label: "Weekly digest", checked: false },
]

function Box({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.box, checked && styles.boxChecked]}>
      <CheckboxIndicator>
        <View style={styles.mark} />
      </CheckboxIndicator>
    </View>
  )
}

function Example() {
  const log = useLog()
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.stack}>
      <Checkbox
        checked={open}
        onCheckedChange={(next) => setOpen(next === true)}
        style={styles.check}
      >
        {(state) => (
          <>
            <Box checked={state.checked === true} />
            <Text>Open</Text>
          </>
        )}
      </Checkbox>
      <Dialog
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next)
          log(`${next ? "Opened" : "Closed"} (${details.reason})`)
        }}
        onOpenChangeComplete={(next) =>
          log(next ? "Finished opening" : "Finished closing")
        }
      >
        <DialogTrigger style={styles.button}>
          <Text>Notification Settings</Text>
        </DialogTrigger>
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent style={styles.content}>
          <View style={styles.stack}>
            <DialogTitle style={styles.title}>
              Notification settings
            </DialogTitle>
            <DialogDescription style={styles.description}>
              Choose what we email you about.
            </DialogDescription>
          </View>
          <View>
            {topics.map((topic) => (
              <Checkbox
                key={topic.label}
                defaultChecked={topic.checked}
                style={styles.check}
              >
                {(state) => (
                  <>
                    <Box checked={state.checked === true} />
                    <Text>{topic.label}</Text>
                  </>
                )}
              </Checkbox>
            ))}
          </View>
          <View style={styles.row}>
            <DialogClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Done</Text>
            </DialogClose>
          </View>
        </DialogContent>
      </Dialog>
    </View>
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
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginTop: "auto",
    marginBottom: "auto",
    marginHorizontal: 24,
    gap: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
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
  mark: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
})

export { Example }
