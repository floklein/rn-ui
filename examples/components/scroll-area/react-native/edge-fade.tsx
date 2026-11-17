import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  type ScrollAreaState,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text, View } from "react-native"

const notes = [
  {
    version: "v1.12.0",
    date: "Oct 28",
    text: "Scroll areas follow streamed content and stop when you scroll up.",
  },
  {
    version: "v1.11.2",
    date: "Oct 14",
    text: "Focus returns to the right trigger when a nested dialog closes.",
  },
  {
    version: "v1.11.1",
    date: "Oct 2",
    text: "Date pickers keep the selected month when the locale changes.",
  },
  {
    version: "v1.11.0",
    date: "Sep 23",
    text: "Menus open on Arrow Down and skip disabled items while typing.",
  },
  {
    version: "v1.10.3",
    date: "Sep 9",
    text: "Toasts pause their timers while the window is in the background.",
  },
  {
    version: "v1.10.2",
    date: "Aug 27",
    text: "Sliders snap to the nearest step when dragged past either end.",
  },
  {
    version: "v1.10.1",
    date: "Aug 18",
    text: "Tooltips wait for a short delay before moving to a new trigger.",
  },
  {
    version: "v1.10.0",
    date: "Aug 5",
    text: "Comboboxes can load their options while you type.",
  },
]

function Example() {
  return (
    <ScrollArea style={styles.area}>
      {(state: ScrollAreaState) => (
        <>
          <ScrollAreaViewport aria-label="Release notes">
            <ScrollAreaContent style={styles.content}>
              {notes.map((note) => (
                <View key={note.version} style={styles.note}>
                  <Text role="heading" style={styles.heading}>
                    {note.version} <Text style={styles.hint}>{note.date}</Text>
                  </Text>
                  <Text style={styles.text}>{note.text}</Text>
                </View>
              ))}
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <View
            pointerEvents="none"
            style={[styles.fade, styles.top, state.atStart && styles.hidden]}
          />
          <View
            pointerEvents="none"
            style={[styles.fade, styles.bottom, state.atEnd && styles.hidden]}
          />
          <ScrollAreaScrollbar style={styles.scrollbar}>
            <ScrollAreaThumb style={styles.thumb} />
          </ScrollAreaScrollbar>
        </>
      )}
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  area: {
    width: 280,
    height: 300,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  content: { padding: 16, gap: 16 },
  note: { gap: 4 },
  heading: { fontSize: 15, fontWeight: "600" },
  hint: { color: "#71717a", fontWeight: "400" },
  text: { fontSize: 14, lineHeight: 20 },
  fade: {
    position: "absolute",
    start: 0,
    end: 0,
    height: 32,
    experimental_backgroundImage:
      "linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0))",
  },
  top: { top: 0 },
  bottom: { bottom: 0, transform: [{ scaleY: -1 }] },
  hidden: { opacity: 0 },
  scrollbar: { width: 10, padding: 2 },
  thumb: { width: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }
