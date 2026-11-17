import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"

function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const [presses, setPresses] = useState(0)
  const [layouts, setLayouts] = useState<string[]>([])
  const changed =
    (name: string) => (open: boolean, details: { reason: string }) => {
      if (open) {
        setLayouts([])
      }
      setChanges((current) => [...current, `${name}:${open}:${details.reason}`])
    }
  const laidOut = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const at = `${Math.round(layout.x)},${Math.round(layout.y)}`
    setLayouts((current) => (current.includes(at) ? current : [...current, at]))
  }

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <Pressable
        accessibilityRole="button"
        testID="under"
        onPress={() => setPresses(presses + 1)}
        style={styles.action}
      >
        <Text testID="presses">{presses}</Text>
      </Pressable>
      <View style={styles.row}>
        <Tooltip toggleable onOpenChange={changed("info")}>
          <TooltipTrigger testID="info-trigger" style={styles.icon}>
            <View style={styles.dot} />
          </TooltipTrigger>
          <TooltipContent
            testID="info-content"
            sideOffset={8}
            onLayout={laidOut}
            style={styles.content}
          >
            {(state) => (
              <>
                <TooltipArrow style={styles.arrow} />
                <Text testID="info-text" style={styles.text}>
                  Files in the trash still use storage.
                </Text>
                <Text testID="info-side" style={styles.text}>
                  {state.side ?? "unplaced"}
                </Text>
              </>
            )}
          </TooltipContent>
        </Tooltip>
        <Tooltip onOpenChange={changed("plain")}>
          <TooltipTrigger testID="plain-trigger" style={styles.action}>
            <Text>Export</Text>
          </TooltipTrigger>
          <TooltipContent testID="plain-content" style={styles.content}>
            <Text style={styles.text}>Download as CSV</Text>
          </TooltipContent>
        </Tooltip>
      </View>
      <Text testID="layouts">{layouts.join(" ")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 80,
  },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#f4f4f5",
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#18181b" },
  content: {
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  arrow: { width: 8, height: 8, backgroundColor: "#18181b" },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Fixture }
