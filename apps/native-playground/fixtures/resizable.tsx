import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
} from "@ui-sdk/react-native/resizable"
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const round = (layout: number[]) => Math.round(layout[0])

function Fixture() {
  const [files, setFiles] = useState(50)
  const [saved, setSaved] = useState("nothing saved")
  const [split, setSplit] = useState(50)
  const [splitKept, setSplitKept] = useState(50)
  const [scrolled, setScrolled] = useState(0)
  const [stack, setStack] = useState(50)
  const [stackKept, setStackKept] = useState(50)
  const [lifted, setLifted] = useState(0)
  const [area, setArea] = useState(50)
  const [moved, setMoved] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [raising, setRaising] = useState(false)
  return (
    <View style={styles.fixture}>
      <Text testID="readout">{`Files ${files}, ${saved}`}</Text>
      <Text testID="scroll-readout">
        {`Split ${split} kept ${splitKept}, scrolled ${scrolled}; stack ${stack} kept ${stackKept}, lifted ${lifted}; area ${area}, moved ${moved}`}
      </Text>
      <Resizable
        onLayoutChange={(layout) => setFiles(round(layout))}
        onLayoutCommit={(layout, details) =>
          setSaved(`saved ${round(layout)} by ${details.reason}`)
        }
        style={styles.row}
      >
        <ResizablePanel testID="files" minSize={20} style={styles.panel}>
          <Text>Files</Text>
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize files"
          style={styles.columnHandle}
        />
        <ResizablePanel testID="code" style={styles.panel}>
          <Text>Code</Text>
        </ResizablePanel>
      </Resizable>
      <ScrollView
        horizontal
        scrollEnabled={!sliding}
        testID="sideways"
        onScroll={(event) =>
          setScrolled(Math.round(event.nativeEvent.contentOffset.x))
        }
        scrollEventThrottle={16}
        style={styles.sideways}
      >
        <Resizable
          onLayoutChange={(layout) => setSplit(round(layout))}
          onLayoutCommit={(layout) => setSplitKept(round(layout))}
          style={styles.wide}
        >
          <ResizablePanel testID="left" style={styles.panel}>
            <Text>Left</Text>
          </ResizablePanel>
          <ResizableHandle
            aria-label="Resize left"
            {...dragging(setSliding)}
            style={styles.columnHandle}
          />
          <ResizablePanel style={styles.panel}>
            <Text>Right</Text>
          </ResizablePanel>
        </Resizable>
      </ScrollView>
      <ScrollView
        scrollEnabled={!raising}
        testID="upright"
        onScroll={(event) =>
          setLifted(Math.round(event.nativeEvent.contentOffset.y))
        }
        scrollEventThrottle={16}
        style={styles.upright}
      >
        <Resizable
          orientation="vertical"
          onLayoutChange={(layout) => setStack(round(layout))}
          onLayoutCommit={(layout) => setStackKept(round(layout))}
          style={styles.tall}
        >
          <ResizablePanel testID="top" style={styles.panel}>
            <Text>Top</Text>
          </ResizablePanel>
          <ResizableHandle
            aria-label="Resize top"
            {...dragging(setRaising)}
            style={styles.rowHandle}
          />
          <ResizablePanel style={styles.panel}>
            <Text>Bottom</Text>
          </ResizablePanel>
        </Resizable>
      </ScrollView>
      <ScrollArea style={styles.area}>
        <ScrollAreaViewport
          horizontal
          testID="area"
          onScroll={(event) =>
            setMoved(Math.round(event.nativeEvent.contentOffset.x))
          }
          scrollEventThrottle={16}
        >
          <ScrollAreaContent>
            <Resizable
              onLayoutChange={(layout) => setArea(round(layout))}
              style={styles.wide}
            >
              <ResizablePanel testID="inbox" style={styles.panel}>
                <Text>Inbox</Text>
              </ResizablePanel>
              <ResizableHandle
                aria-label="Resize inbox"
                style={styles.columnHandle}
              />
              <ResizablePanel style={styles.panel}>
                <Text>Message</Text>
              </ResizablePanel>
            </Resizable>
          </ScrollAreaContent>
        </ScrollAreaViewport>
      </ScrollArea>
    </View>
  )
}

const dragging = (set: (dragging: boolean) => void) => ({
  onResponderGrant: () => set(true),
  onResponderRelease: () => set(false),
  onResponderTerminate: () => set(false),
})

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { height: 80, borderWidth: 1, borderColor: "#d4d4d8" },
  panel: { padding: 8 },
  columnHandle: { width: 44, backgroundColor: "#d4d4d8" },
  rowHandle: { height: 44, backgroundColor: "#d4d4d8" },
  sideways: { height: 80, flexGrow: 0, backgroundColor: "#f4f4f5" },
  wide: { width: 600, height: 80 },
  upright: { height: 160, flexGrow: 0, backgroundColor: "#f4f4f5" },
  tall: { height: 240 },
  area: { height: 80, backgroundColor: "#f4f4f5" },
})

export { Fixture }
