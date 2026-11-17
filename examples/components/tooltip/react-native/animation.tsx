import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

const fade = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 120, useNativeDriver: true })

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
    <Tooltip
      toggleable
      onOpenChange={(open) => log(open ? "Opening" : "Closing")}
      onOpenChangeComplete={(open) => log(open ? "Open" : "Closed")}
    >
      <TooltipTrigger aria-label="Archive" style={styles.icon}>
        <Text style={styles.glyph}>▤</Text>
      </TooltipTrigger>
      <TooltipContent
        render={<Animated.View style={{ opacity: progress }} />}
        style={styles.content}
        onExit={(done) => fade(progress, 0).start(() => done())}
      >
        <Enter progress={progress} />
        <Text style={styles.text}>Archive</Text>
      </TooltipContent>
    </Tooltip>
  )
}

const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  glyph: { fontSize: 16 },
  content: {
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }
