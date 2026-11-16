import { pageLocale } from "@ui-sdk/core"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react-native/slider"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

function Fixture() {
  const [volume, setVolume] = useState(20)
  const [saved, setSaved] = useState("nothing saved")
  const [balance, setBalance] = useState(50)
  const [balanceKept, setBalanceKept] = useState(50)
  const [scrolled, setScrolled] = useState(0)
  const [level, setLevel] = useState(50)
  const [levelKept, setLevelKept] = useState(50)
  const [lifted, setLifted] = useState(0)
  const [tilt, setTilt] = useState(50)
  const [sliding, setSliding] = useState(false)
  const [raising, setRaising] = useState(false)
  return (
    <View style={styles.fixture}>
      <Text testID="readout">{`Volume ${volume}, ${saved}`}</Text>
      <Text testID="scroll-readout">
        {`Balance ${balance} kept ${balanceKept}, scrolled ${scrolled}; level ${level} kept ${levelKept}, lifted ${lifted}; tilt ${tilt}`}
      </Text>
      <Text testID="locale">{`Locale ${pageLocale()}`}</Text>
      <Slider
        value={volume}
        onValueChange={setVolume}
        onValueCommit={(value, details) =>
          setSaved(`saved ${value} by ${details.reason}`)
        }
        style={styles.slider}
      >
        <SliderControl testID="control" style={styles.control}>
          <SliderTrack testID="track" style={styles.track}>
            <SliderIndicator style={styles.indicator} />
            <SliderThumb aria-label="Volume" style={styles.thumb} />
          </SliderTrack>
        </SliderControl>
      </Slider>
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
        <View style={styles.wide}>
          <Slider
            defaultValue={50}
            onValueChange={setBalance}
            onValueCommit={setBalanceKept}
            style={styles.slider}
          >
            <SliderControl
              testID="balance-control"
              {...dragging(setSliding)}
              style={styles.control}
            >
              <SliderTrack style={styles.track}>
                <SliderIndicator style={styles.indicator} />
                <SliderThumb aria-label="Balance" style={styles.thumb} />
              </SliderTrack>
            </SliderControl>
          </Slider>
        </View>
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
        <View style={styles.tall}>
          <Slider
            orientation="vertical"
            defaultValue={50}
            onValueChange={setLevel}
            onValueCommit={setLevelKept}
            style={styles.vertical}
          >
            <SliderControl
              testID="level-control"
              {...dragging(setRaising)}
              style={styles.column}
            >
              <SliderTrack style={styles.rail}>
                <SliderIndicator style={styles.indicator} />
                <SliderThumb aria-label="Level" style={styles.thumb} />
              </SliderTrack>
            </SliderControl>
          </Slider>
          <Slider defaultValue={50} onValueChange={setTilt}>
            <SliderControl testID="tilt-control" style={styles.short}>
              <SliderTrack style={styles.track}>
                <SliderIndicator style={styles.indicator} />
                <SliderThumb aria-label="Tilt" style={styles.thumb} />
              </SliderTrack>
            </SliderControl>
          </Slider>
        </View>
      </ScrollView>
      <Slider defaultValue={1234.5} max={2000} step={0.5} style={styles.row}>
        <SliderValue testID="amount" aria-hidden={false} />
        <SliderControl style={styles.control}>
          <SliderTrack style={styles.track}>
            <SliderThumb aria-label="Amount" style={styles.thumb} />
          </SliderTrack>
        </SliderControl>
      </Slider>
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
  slider: { width: 240 },
  row: { gap: 4 },
  control: { width: 240, height: 44, justifyContent: "center" },
  track: { height: 4, backgroundColor: "#d4d4d8" },
  indicator: { backgroundColor: "#18181b" },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
  sideways: { height: 60, flexGrow: 0, backgroundColor: "#f4f4f5" },
  wide: { width: 800, paddingHorizontal: 24, justifyContent: "center" },
  upright: { height: 180, flexGrow: 0, backgroundColor: "#f4f4f5" },
  tall: {
    height: 600,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  short: { width: 200, height: 44, justifyContent: "center" },
  vertical: { height: 140 },
  column: { width: 44, height: "100%", alignItems: "center" },
  rail: { width: 4, height: "100%", backgroundColor: "#d4d4d8" },
})

export { Fixture }
