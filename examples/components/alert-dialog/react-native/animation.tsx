import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react-native/alert-dialog"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"

const fade = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 300, useNativeDriver: true })

function Enter({ progress }: { progress: Animated.Value }) {
  useEffect(() => {
    fade(progress, 1).start()
  }, [progress])
  return null
}

function Example() {
  const [progress] = useState(() => new Animated.Value(0))
  return (
    <AlertDialog>
      <AlertDialogTrigger style={styles.button}>
        <Text>Leave Workspace</Text>
      </AlertDialogTrigger>
      <AlertDialogBackdrop
        render={<Animated.View style={{ opacity: progress }} />}
        style={styles.backdrop}
      />
      <AlertDialogContent
        render={
          <Animated.View
            style={{
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            }}
          />
        }
        style={styles.content}
        onExit={(done) => fade(progress, 0).start(() => done())}
      >
        <Enter progress={progress} />
        <View style={styles.stack}>
          <AlertDialogTitle style={styles.title}>
            Leave this workspace?
          </AlertDialogTitle>
          <AlertDialogDescription style={styles.description}>
            You'll lose access to its projects until someone invites you again.
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
            <Text style={styles.solidText}>Leave</Text>
          </AlertDialogClose>
        </View>
      </AlertDialogContent>
    </AlertDialog>
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
})

export { Example }
