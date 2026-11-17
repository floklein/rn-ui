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

function Action({
  id,
  label,
  onPress,
}: {
  id: string
  label: string
  onPress?: () => void
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

function Panel({
  name,
  title,
  onChanges,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "onOpenChange"> & {
  name: string
  title: string
  onChanges: (change: string) => void
}) {
  return (
    <Dialog
      {...props}
      onOpenChange={(open, details) =>
        onChanges(`${name}:${open}:${details.reason}`)
      }
    >
      <DialogTrigger testID={`${name}-trigger`} style={styles.action}>
        <Text>Open {title}</Text>
      </DialogTrigger>
      {props.modal !== false && <DialogBackdrop style={styles.backdrop} />}
      <DialogContent
        testID={`${name}-content`}
        style={props.modal === false ? styles.panel : styles.content}
      >
        <DialogTitle style={styles.title}>{title}</DialogTitle>
        <Text testID={`${name}-body`}>Inside {title}</Text>
        {props.children}
        <DialogClose testID={`${name}-close`} style={styles.action}>
          <Text>Close {title}</Text>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function Fixture() {
  const [sibling] = useState(createDialogController)
  const [presses, setPresses] = useState(0)
  const [changes, setChanges] = useState<string[]>([])
  const onChanges = (change: string) =>
    setChanges((current) => [...current, change])

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <Text testID="presses">{presses}</Text>
      <View style={styles.actions}>
        <Action
          id="under"
          label="Under"
          onPress={() => setPresses((count) => count + 1)}
        />
        <Action
          id="reset"
          label="Reset"
          onPress={() => {
            setChanges([])
            setPresses(0)
          }}
        />
      </View>
      <View style={styles.actions}>
        <Panel
          name="notes"
          title="Notes"
          modal={false}
          closeOnOutsidePress
          onChanges={onChanges}
        />
        <Panel name="tips" title="Tips" modal={false} onChanges={onChanges} />
        <Panel name="profile" title="Profile" onChanges={onChanges}>
          <View style={styles.actions}>
            <Panel
              name="nested"
              title="Nested"
              modal={false}
              onChanges={onChanges}
            />
            <Panel name="confirm" title="Confirm" onChanges={onChanges} />
            <Action
              id="open-sibling"
              label="Open sibling"
              onPress={() => sibling.open()}
            />
          </View>
        </Panel>
      </View>
      <Panel
        name="sibling"
        title="Sibling"
        controller={sibling}
        onChanges={onChanges}
      />
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
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#3f3f46" },
  content: {
    marginTop: "auto",
    gap: 12,
    padding: 20,
    paddingBottom: 48,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  panel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 32,
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 17, fontWeight: "600" },
})

export { Fixture }
