import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Log = {
  changes: string[]
  completes: boolean[]
  attempts: string[]
  result: string
}

const empty: Log = { changes: [], completes: [], attempts: [], result: "none" }

function Readouts({ log, at }: { log: Log; at: string }) {
  return (
    <View>
      <Text testID={`${at}changes`}>{log.changes.join(" ") || "none"}</Text>
      <Text testID={`${at}completes`}>{log.completes.join(" ") || "none"}</Text>
      <Text testID={`${at}attempts`}>{log.attempts.join(" ") || "none"}</Text>
      <Text testID={`${at}result`}>{log.result}</Text>
    </View>
  )
}

function Action({
  id,
  label,
  onPress,
}: {
  id: string
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={id}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Fixture() {
  const [controller] = useState(createDialogController)
  const [sibling] = useState(createDialogController)
  const [log, setLog] = useState(empty)
  const [shown, setShown] = useState(true)
  const [refuse, setRefuse] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [controlled, setControlled] = useState(false)
  const add = (change: Partial<Log>) =>
    setLog((current) => ({ ...current, ...change }))

  const content = (
    <>
      <DialogTitle style={styles.title}>Profile</DialogTitle>
      <Readouts log={log} at="inside-" />
      <View style={styles.actions}>
        <DialogClose testID="done" style={styles.action}>
          <Text>Done</Text>
        </DialogClose>
        <DialogClose
          testID="save"
          value="saved"
          action={() => new Promise((done) => setTimeout(done, 800))}
          style={styles.action}
        >
          {(state) => <Text>{state.pending ? "Saving" : "Save"}</Text>}
        </DialogClose>
        <Action
          id="inside-cancel"
          label={cancel ? "Allow changes" : "Cancel changes"}
          onPress={() => setCancel(!cancel)}
        />
        <Action id="remove" label="Remove" onPress={() => setShown(false)} />
        <Action
          id="open-sibling"
          label="Open sibling"
          onPress={() => sibling.open()}
        />
      </View>
    </>
  )

  return (
    <View style={styles.fixture}>
      <Readouts log={log} at="" />
      <View style={styles.actions}>
        <Action
          id="refuse"
          label={refuse ? "Allow dismissal" : "Refuse dismissal"}
          onPress={() => setRefuse(!refuse)}
        />
        <Action
          id="cancel"
          label={cancel ? "Allow changes" : "Cancel changes"}
          onPress={() => setCancel(!cancel)}
        />
        <Action
          id="open-from-code"
          label="Open from code"
          onPress={() =>
            controller
              .open()
              .then(({ reason, source, returnValue }) =>
                add({ result: [reason, source, returnValue].join(":") })
              )
          }
        />
        <Action id="reset" label="Reset" onPress={() => setLog(empty)} />
      </View>
      {shown && (
        <Dialog
          controller={controller}
          dismissible={!refuse}
          onDismissAttempt={({ reason }) =>
            setLog((current) => ({
              ...current,
              attempts: [...current.attempts, reason],
            }))
          }
          onOpenChange={(open, details) => {
            if (cancel) {
              details.cancel()
            }
            setLog((current) => ({
              ...current,
              changes: [
                ...current.changes,
                [open, details.reason, details.source].join(":") +
                  (cancel ? ":canceled" : ""),
              ],
            }))
          }}
          onOpenChangeComplete={(open) =>
            setLog((current) => ({
              ...current,
              completes: [...current.completes, open],
            }))
          }
        >
          <DialogTrigger testID="trigger" style={styles.action}>
            <Text>Edit profile</Text>
          </DialogTrigger>
          <DialogBackdrop style={styles.backdrop} />
          <DialogContent testID="content" style={styles.content}>
            {content}
          </DialogContent>
        </Dialog>
      )}
      <Dialog controller={sibling}>
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent testID="sibling-content" style={styles.content}>
          <DialogTitle style={styles.title}>Sibling</DialogTitle>
          <DialogClose testID="sibling-done" style={styles.action}>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <Dialog open={controlled} onOpenChange={setControlled}>
        <DialogTrigger testID="controlled-trigger" style={styles.action}>
          <Text>Controlled</Text>
        </DialogTrigger>
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent testID="controlled-content" style={styles.content}>
          <DialogTitle style={styles.title}>Controlled</DialogTitle>
          <Action
            id="close-from-state"
            label="Close from state"
            onPress={() => setControlled(false)}
          />
        </DialogContent>
      </Dialog>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginTop: "auto",
    gap: 12,
    padding: 20,
    paddingBottom: 48,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 17, fontWeight: "600" },
})

export { Fixture }
