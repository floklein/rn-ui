import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useMemo, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Action } from "./SwitchScreen"

function DialogScreen({ log }: { log: (line: string) => void }) {
  const controller = useMemo(() => createDialogController(), [])
  const [mounted, setMounted] = useState(true)
  const [dismissible, setDismissible] = useState(true)
  const [controlled, setControlled] = useState(false)
  const cancelNext = useRef(false)
  const [cancelling, setCancelling] = useState(false)
  const armCancel = () => {
    cancelNext.current = !cancelNext.current
    setCancelling(cancelNext.current)
  }
  const options = (
    <View style={styles.actions}>
      <Action
        label={`dismissible: ${dismissible}`}
        onPress={() => setDismissible(!dismissible)}
      />
      <Action label={`cancel next: ${cancelling}`} onPress={armCancel} />
    </View>
  )
  return (
    <>
      {mounted && (
        <Dialog
          controller={controller}
          dismissible={dismissible}
          onOpenChange={(open, details) => {
            log(
              `onOpenChange open=${open} reason=${details.reason} source=${details.source} event=${String(details.event)} returnValue=${String(details.returnValue)}`
            )
            if (cancelNext.current) {
              cancelNext.current = false
              setCancelling(false)
              details.cancel()
              log(`cancelled details.canceled=${details.canceled}`)
            }
          }}
          onOpenChangeComplete={(open) =>
            log(`onOpenChangeComplete open=${open}`)
          }
          onDismissAttempt={(details) =>
            log(`onDismissAttempt reason=${details.reason}`)
          }
        >
          <DialogTrigger
            testID="dialog-trigger"
            style={(state, interaction) => [
              styles.trigger,
              interaction.pressed && styles.pressed,
            ]}
          >
            {(state) => (
              <Text style={styles.triggerText}>
                Open dialog (open: {String(state.open)})
              </Text>
            )}
          </DialogTrigger>
          <DialogBackdrop style={styles.backdrop} />
          <DialogContent testID="dialog-content" style={styles.dialog}>
            {(state) => (
              <>
                <DialogTitle style={styles.title}>Delete project</DialogTitle>
                <DialogDescription>
                  This can't be undone.
                </DialogDescription>
                <Text testID="dialog-state" style={styles.state}>
                  open={String(state.open)} modal={String(state.modal)}{" "}
                  nested={String(state.nested)} pending=
                  {String(state.pending)}
                </Text>
                {options}
                <View style={styles.actions}>
                  <DialogClose testID="close-cancel" value="cancel">
                    <Text style={styles.close}>Cancel</Text>
                  </DialogClose>
                  <DialogClose
                    testID="close-action"
                    value="confirm"
                    action={() =>
                      new Promise<void>((done) => setTimeout(done, 800))
                    }
                  >
                    {(close) => (
                      <Text style={styles.close}>
                        {close.pending ? "Deleting…" : "Delete (action)"}
                      </Text>
                    )}
                  </DialogClose>
                </View>
                <View style={styles.actions}>
                  <Action
                    label="controller.close()"
                    onPress={() =>
                      log(`controller.close() -> ${controller.close()}`)
                    }
                  />
                  <Action
                    label="unmount while open"
                    onPress={() => setMounted(false)}
                  />
                </View>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
      <View style={styles.actions}>
        <Action
          label="controller.open()"
          onPress={() => {
            const result = controller.open()
            log(`controller.open() -> ${String(result)}`)
            result?.then((closed) =>
              log(
                `open() resolved reason=${closed.reason} source=${closed.source} returnValue=${String(closed.returnValue)}`
              )
            )
          }}
        />
        <Action
          label="controller.focus()"
          onPress={() => {
            controller.focus()
            log("controller.focus() called")
          }}
        />
        <Action
          label="isOpen()"
          onPress={() => log(`controller.isOpen() -> ${controller.isOpen()}`)}
        />
        <Action
          label={mounted ? "unmount" : "mount"}
          onPress={() => setMounted(!mounted)}
        />
      </View>
      {options}
      <Text style={styles.heading}>Controlled</Text>
      <Dialog
        open={controlled}
        onOpenChange={(open, details) => {
          log(
            `controlled onOpenChange open=${open} reason=${details.reason} source=${details.source}`
          )
          setControlled(open)
        }}
      >
        <DialogTrigger testID="controlled-trigger" style={styles.trigger}>
          <Text style={styles.triggerText}>
            Open controlled (parent: {String(controlled)})
          </Text>
        </DialogTrigger>
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent style={styles.dialog}>
          <DialogTitle style={styles.title}>Controlled dialog</DialogTitle>
          <DialogClose testID="controlled-close">
            <Text style={styles.close}>Close</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <Text testID="behind">Text behind the dialog</Text>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#111",
    alignSelf: "flex-start",
  },
  triggerText: { color: "#fff" },
  pressed: { opacity: 0.6 },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dialog: {
    marginTop: 140,
    marginHorizontal: 20,
    padding: 16,
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "600" },
  state: { fontSize: 11, fontFamily: "Courier" },
  heading: { fontWeight: "600", marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  close: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#e5e5e5",
  },
})

export { DialogScreen }
