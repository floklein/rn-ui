import { OverlayHost } from "@ui-sdk/react-native/overlays"
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { useState } from "react"
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

// Every position the content was laid out at while open: one entry means no
// frame showed it anywhere but beside its trigger.
function Placed({
  name,
  modal,
  onChanges,
}: {
  name: string
  modal?: boolean
  onChanges: (change: string) => void
}) {
  const [layouts, setLayouts] = useState<string[]>([])
  const laidOut = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const at = `${Math.round(layout.x)},${Math.round(layout.y)}`
    setLayouts((current) => (current.includes(at) ? current : [...current, at]))
  }
  return (
    <Popover
      modal={modal}
      onOpenChange={(open, details) => {
        if (open) {
          setLayouts([])
        }
        onChanges(`${name}:${open}:${details.reason}`)
      }}
    >
      <PopoverTrigger testID={`${name}-trigger`} style={styles.action}>
        <Text>Open {name}</Text>
      </PopoverTrigger>
      <PopoverContent
        testID={`${name}-content`}
        sideOffset={8}
        onLayout={laidOut}
        style={styles.content}
      >
        {(state) => (
          <>
            <PopoverArrow style={styles.arrow} />
            <PopoverTitle style={styles.title}>Popover {name}</PopoverTitle>
            <Text testID={`${name}-side`}>{state.side ?? "unplaced"}</Text>
            <Text testID={`${name}-layouts`}>{layouts.join(" ")}</Text>
            <PopoverClose testID={`${name}-close`} style={styles.action}>
              <Text>Close</Text>
            </PopoverClose>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const [presses, setPresses] = useState(0)
  const [appModal, setAppModal] = useState<"translucent" | "opaque">()
  const onChanges = (change: string) =>
    setChanges((current) => [...current, change])

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          testID="under"
          onPress={() => setPresses(presses + 1)}
          style={styles.action}
        >
          <Text testID="presses">{presses}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="app-modal-translucent"
          onPress={() => setAppModal("translucent")}
          style={styles.action}
        >
          <Text>Modal, translucent</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="app-modal-opaque"
          onPress={() => setAppModal("opaque")}
          style={styles.action}
        >
          <Text>Modal, opaque</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        <Placed name="plain" onChanges={onChanges} />
        <Placed name="modal" modal onChanges={onChanges} />
      </View>
      <ScrollView
        testID="scroller"
        style={styles.scroller}
        contentContainerStyle={styles.scrolled}
      >
        <Placed name="scrolling" onChanges={onChanges} />
      </ScrollView>
      <Modal
        visible={!!appModal}
        transparent
        statusBarTranslucent={appModal === "translucent"}
        onRequestClose={() => setAppModal(undefined)}
      >
        <OverlayHost>
          <View style={styles.sheet}>
            <Pressable
              accessibilityRole="button"
              testID="app-modal-close"
              onPress={() => setAppModal(undefined)}
              style={styles.action}
            >
              <Text>Close modal</Text>
            </Pressable>
            <Placed name="inner" onChanges={onChanges} />
          </View>
        </OverlayHost>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  content: {
    width: 220,
    gap: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  arrow: { width: 10, height: 10, backgroundColor: "#d4d4d8" },
  title: { fontSize: 16, fontWeight: "600" },
  scroller: { height: 200, borderWidth: 1, borderColor: "#e4e4e7" },
  scrolled: { paddingTop: 40, paddingBottom: 400, alignItems: "center" },
  sheet: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: "#fafafa",
  },
})

export { Fixture }
