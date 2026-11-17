import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const scale = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 150, useNativeDriver: true })

function Enter({ progress }: { progress: Animated.Value }) {
  useEffect(() => {
    scale(progress, 1).start()
  }, [progress])
  return null
}

function Example() {
  const log = useLog()
  const [progress] = useState(() => new Animated.Value(0))
  return (
    <Popover
      onOpenChange={(open) => log(open ? "Opening" : "Closing")}
      onOpenChangeComplete={(open) => log(open ? "Open" : "Closed")}
    >
      <PopoverTrigger style={styles.button}>
        <Text>What's New</Text>
      </PopoverTrigger>
      <PopoverContent
        render={
          <Animated.View
            style={{ opacity: progress, transform: [{ scale: progress }] }}
          />
        }
        style={(state) => [
          styles.content,
          { transformOrigin: state.transformOrigin },
        ]}
        onExit={(done) => scale(progress, 0).start(() => done())}
      >
        <Enter progress={progress} />
        <PopoverTitle style={styles.title}>What's new</PopoverTitle>
        <PopoverDescription style={styles.description}>
          Comments now support threads and reactions.
        </PopoverDescription>
        <View style={styles.row}>
          <PopoverClose style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Got It</Text>
          </PopoverClose>
        </View>
      </PopoverContent>
    </Popover>
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
  content: {
    width: 260,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end" },
})

export { Example }
