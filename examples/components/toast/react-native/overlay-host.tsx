import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  type ConfirmOptions,
  createConfirm,
} from "@ui-sdk/react-native/alert-dialog"
import { createOverlays, OverlayHost } from "@ui-sdk/react-native/overlays"
import { createToaster, Toast, ToastTitle } from "@ui-sdk/react-native/toast"
import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const all = ["Acme", "Globex", "Initech"]

function Example() {
  const [overlays] = React.useState(() => createOverlays())
  const [toast] = React.useState(() => createToaster({ overlays }))
  const [confirm] = React.useState(() => createConfirm({ overlays }))
  const [projects, setProjects] = React.useState(all)
  React.useEffect(
    () => () => {
      toast.dismiss()
    },
    [toast]
  )

  async function remove(name: string) {
    const confirmed = await confirm({
      title: `Delete ${name}?`,
      description:
        "The project and its files will be deleted for everyone on your team.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    })
    if (!confirmed) {
      return
    }
    setProjects((list) => list.filter((project) => project !== name))
    toast.success(`${name} deleted`, { priority: "assertive" })
  }

  return (
    <OverlayHost
      overlays={overlays}
      toast={{
        style: styles.region,
        children: () => (
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
            <View style={styles.dot} />
            <ToastTitle style={styles.title} />
          </Toast>
        ),
      }}
    >
      <View style={styles.stack}>
        <Pressable
          role="button"
          onPress={() => setProjects(all)}
          style={styles.button}
        >
          <Text>Reset Projects</Text>
        </Pressable>
        <View role="list" aria-label="Projects" style={styles.list}>
          {projects.map((name) => (
            <View key={name} style={styles.row}>
              <Text>{name}</Text>
              <Pressable
                role="button"
                aria-label={`Delete ${name}`}
                onPress={() => remove(name)}
                style={styles.button}
              >
                <Text>Delete</Text>
              </Pressable>
            </View>
          ))}
          {projects.length === 0 && (
            <View style={styles.row}>
              <Text>All projects deleted.</Text>
            </View>
          )}
        </View>
      </View>
      <AlertDialog controller={confirm.controller}>
        <AlertDialogBackdrop style={styles.backdrop} />
        <AlertDialogContent style={styles.content}>
          {(state) => {
            const question = (state.payload ?? {}) as ConfirmOptions
            return (
              <>
                <View style={styles.texts}>
                  <AlertDialogTitle style={styles.dialogTitle}>
                    {question.title}
                  </AlertDialogTitle>
                  <AlertDialogDescription style={styles.description}>
                    {question.description}
                  </AlertDialogDescription>
                </View>
                <View style={styles.answers}>
                  <AlertDialogClose style={styles.button}>
                    <Text>{question.cancelLabel}</Text>
                  </AlertDialogClose>
                  <AlertDialogClose
                    value="confirm"
                    style={[styles.button, styles.solid]}
                  >
                    <Text style={styles.solidText}>
                      {question.confirmLabel}
                    </Text>
                  </AlertDialogClose>
                </View>
              </>
            )
          }}
        </AlertDialogContent>
      </AlertDialog>
    </OverlayHost>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
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
  list: { borderWidth: 1, borderRadius: 12, borderColor: "#e4e4e7" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginVertical: "auto",
    marginHorizontal: 24,
    gap: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  texts: { gap: 6 },
  dialogTitle: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  answers: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
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
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
  title: { fontSize: 14, fontWeight: "600" },
})

export { Example }
