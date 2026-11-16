import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  createConfirm,
} from "@ui-sdk/react-native/alert-dialog"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const all = ["Acme", "Globex", "Initech"]

function Example() {
  const [confirm] = useState(() => createConfirm<{ name: string }>())
  const [projects, setProjects] = useState(all)

  async function remove(name: string) {
    if (await confirm({ name })) {
      setProjects((list) => list.filter((project) => project !== name))
    }
  }

  return (
    <View style={styles.stack}>
      <Pressable
        role="button"
        onPress={() => setProjects(all)}
        style={styles.button}
      >
        <Text>Reset Projects</Text>
      </Pressable>
      <View aria-label="Projects" style={styles.list}>
        {projects.map((name) => (
          <View key={name} style={styles.item}>
            <Text style={styles.name}>{name}</Text>
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
          <Text style={styles.item}>All projects deleted.</Text>
        )}
      </View>
      <AlertDialog controller={confirm.controller}>
        <AlertDialogBackdrop style={styles.backdrop} />
        <AlertDialogContent style={styles.content}>
          {(state) => {
            const { name } = (state.payload ?? {}) as { name?: string }
            return (
              <>
                <View style={styles.stack}>
                  <AlertDialogTitle style={styles.title}>
                    Delete {name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription style={styles.description}>
                    The project and its files will be deleted for everyone on
                    your team.
                  </AlertDialogDescription>
                </View>
                <View style={styles.row}>
                  <AlertDialogClose style={styles.button}>
                    <Text>Cancel</Text>
                  </AlertDialogClose>
                  <AlertDialogClose
                    value="confirm"
                    style={[styles.button, styles.solid]}
                  >
                    <Text style={styles.solidText}>Delete</Text>
                  </AlertDialogClose>
                </View>
              </>
            )
          }}
        </AlertDialogContent>
      </AlertDialog>
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
  list: { borderWidth: 1, borderRadius: 12, borderColor: "#e4e4e7" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  name: { flex: 1, fontSize: 15 },
})

export { Example }
