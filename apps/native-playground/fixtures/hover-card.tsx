import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@ui-sdk/react-native/hover-card"
import { useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Fixture() {
  const [open, setOpen] = useState(false)
  const [changes, setChanges] = useState<string[]>([])
  const [follows, setFollows] = useState(0)
  const [presses, setPresses] = useState(0)
  const placed = useRef("unplaced")
  const [side, setSide] = useState("unplaced")

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          testID="show"
          onPress={() => setOpen(true)}
          style={styles.action}
        >
          <Text>Show card</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="under"
          onPress={() => setPresses(presses + 1)}
          style={styles.action}
        >
          <Text testID="presses">{presses}</Text>
        </Pressable>
      </View>
      <HoverCard
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next)
          setChanges((current) => [...current, `${next}:${details.reason}`])
        }}
      >
        <HoverCardTrigger
          testID="profile-trigger"
          onPress={() => setFollows(follows + 1)}
          style={styles.link}
        >
          <Text style={styles.linkText}>@hollis</Text>
        </HoverCardTrigger>
        <HoverCardContent
          testID="profile-content"
          sideOffset={8}
          onLayout={() => setSide(placed.current)}
          style={(state) => {
            placed.current = state.side ?? "unplaced"
            return styles.card
          }}
        >
          <HoverCardArrow style={styles.arrow} />
          <Text testID="profile-text">Hollis Grant, design engineer.</Text>
        </HoverCardContent>
      </HoverCard>
      <Text testID="follows">{follows}</Text>
      <Text testID="profile-side">{side}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  link: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  linkText: { color: "#2563eb", textDecorationLine: "underline" },
  card: {
    width: 220,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  arrow: { width: 8, height: 8, backgroundColor: "#e4e4e7" },
})

export { Fixture }
