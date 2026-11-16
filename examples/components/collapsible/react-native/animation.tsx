import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react-native/collapsible"
import { useEffect, useState } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const notes = [
  "Search now matches file contents, not only names.",
  "Shared links remember the folder they were opened from.",
  "Uploads resume after the connection drops.",
]

const slide = (height: Animated.Value, toValue: number) =>
  Animated.timing(height, { toValue, duration: 200, useNativeDriver: false })

function Grow({ height, to }: { height: Animated.Value; to?: number }) {
  useEffect(() => {
    if (to !== undefined) {
      slide(height, to).start()
    }
  }, [height, to])
  return null
}

function Example() {
  const log = useLog()
  const [height] = useState(() => new Animated.Value(0))
  return (
    <Collapsible
      onOpenChangeComplete={(open) =>
        log(open ? "Finished opening" : "Finished closing")
      }
      style={styles.card}
    >
      <CollapsibleTrigger style={styles.trigger}>
        <Text style={styles.title}>Release notes</Text>
        <Text style={styles.hint}>Version 2.4, released October 28</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel
        render={<Animated.View style={{ height }} />}
        style={styles.panel}
        onExit={(done) => slide(height, 0).start(() => done())}
      >
        {(state) => (
          <View style={styles.notes}>
            {state.open && <Grow height={height} to={state.panelHeight} />}
            {notes.map((note) => (
              <Text key={note}>{note}</Text>
            ))}
          </View>
        )}
      </CollapsiblePanel>
    </Collapsible>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12 },
  trigger: { gap: 2, padding: 16 },
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  panel: { overflow: "hidden" },
  notes: { gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
})

export { Example }
