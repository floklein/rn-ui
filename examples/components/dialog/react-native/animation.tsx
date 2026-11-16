import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const fade = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 300, useNativeDriver: true })

function Enter({ progress }: { progress: Animated.Value }) {
  useEffect(() => {
    fade(progress, 1).start()
  }, [progress])
  return null
}

function Example() {
  const log = useLog()
  const [progress] = useState(() => new Animated.Value(0))
  return (
    <Dialog
      onOpenChangeComplete={(open) =>
        log(open ? "Finished opening" : "Finished closing")
      }
    >
      <DialogTrigger style={styles.button}>
        <Text>Slide In</Text>
      </DialogTrigger>
      <DialogBackdrop
        render={<Animated.View style={{ opacity: progress }} />}
        style={styles.backdrop}
      />
      <DialogContent
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
          <DialogTitle style={styles.title}>Slide and fade</DialogTitle>
          <DialogDescription style={styles.description}>
            300ms in and out. Focus returns as soon as it starts closing.
          </DialogDescription>
        </View>
        <View style={styles.row}>
          <DialogClose style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Close</Text>
          </DialogClose>
        </View>
      </DialogContent>
    </Dialog>
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
