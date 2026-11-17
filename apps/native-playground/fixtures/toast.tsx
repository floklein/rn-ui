import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import {
  createToaster,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react-native/toast"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

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
  const [placed] = useState(() => createToaster())
  const [dismissed, setDismissed] = useState<string[]>([])
  const onDismiss = ({ reason }: { reason: string }) =>
    setDismissed((current) => [...current, reason])
  useEffect(
    () => () => {
      placed.dismiss()
      toast.dismiss()
    },
    [placed]
  )
  const fire = () =>
    toast({ title: "Draft saved", duration: Infinity, onDismiss })
  const firePlaced = () =>
    placed({
      title: "Message archived",
      duration: Infinity,
      action: { label: "Undo", onAction: () => {} },
      onDismiss,
    })

  return (
    <View style={styles.fixture}>
      <Text testID="dismissed">{dismissed.join(" ") || "none"}</Text>
      <View style={styles.actions}>
        <Action id="fire" label="Fire toast" onPress={fire} />
        <Action id="fire-placed" label="Fire placed" onPress={firePlaced} />
        <Action
          id="reset"
          label="Reset"
          onPress={() => {
            placed.dismiss()
            toast.dismiss()
            setDismissed([])
          }}
        />
      </View>
      <Dialog>
        <DialogTrigger testID="profile-trigger" style={styles.action}>
          <Text>Open Profile</Text>
        </DialogTrigger>
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent testID="profile-content" style={styles.content}>
          <DialogTitle style={styles.title}>Profile</DialogTitle>
          <Action id="profile-fire" label="Save draft" onPress={fire} />
          <DialogClose testID="profile-close" style={styles.action}>
            <Text>Close Profile</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <ToastRegion toaster={placed} side="top" align="center">
        {() => (
          <Toast
            testID="placed-toast"
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
            <ToastTitle testID="placed-title" style={styles.grow} />
            <ToastAction testID="placed-action" style={styles.action} />
            <ToastClose testID="placed-close" style={styles.action}>
              <Text>Close</Text>
            </ToastClose>
          </Toast>
        )}
      </ToastRegion>
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
  title: { fontSize: 17, fontWeight: "600" },
  toast: {
    width: 340,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginTop: 64,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  grow: { flex: 1 },
})

export { Fixture }
