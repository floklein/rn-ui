import {
  ImageCropper,
  type ImageCropperHandleState,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
  type ImageCrop,
} from "@ui-sdk/react-native/image-cropper"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADSCAIAAAC0K44BAAAEDUlEQVR42u3ZwVVCURBEwYnmB2SKpuXWJFyZgh/h8Lqn7iEB5nVtYL4lxTZOIAEsCWBJAEsASwJYEsCSAJYAlgSwJIAlgCUBLAlgSQBLAEsCWBLAkgCWAJYEsCSAJYAlASwJYEkASwBLAlgSwJLeCvjrul708agCGGAJYIAlgAGWAJYABlgCGGAJYIAFMMASwABLAAMsASwBDLAEMMASwABLAEsAAywBDLAEMMCV/dwJYICV53a5ZIDVQ3chY4DVRncVY4BVq3eDYYBVS3cDY4DVr7fYMMBaobfVMMDaorfSMMBapLfPMMDapbfMMMACGGApR2+TYYC1UW+NYYAFMMBSmt4OwwALYIClQL0FhgEWwABLAAMsehkGWAADLAEMsAAGGGABDDDAAhhgCWCABTDAAAtggCWAAZYABlgAAwywAAZYAhhgAQwwwGKYXoAFMMASwACLYXoBFsAAS5sMF1wVYAEMsJRmuOOkAGuj4Zp7AiyAAZZyDDcdE2DtMlx2SYC1yHDfGZcC/nxeKKYYrpzNEPv0yDzQcOtmBlqYuxl3b2agJbnYcP1shluSKxkvmc1wS3IZ41WzGXRJ7pC8czPDLcb+g8htvAHG6ALsDUi2GYDRxdhmCgCji7HNRALGFWObiQSMKMNmEwmYTIzNJhWwN8DYZiIBuz7GNhMJ2N0ZNptIwC6OsdmkAnZujG0mErBDM2w2qYBdGWObiQTsvgybTSpgx8XYZiIBOyvDZpMK2E0xtplIwK7JsNmkAnZKjG0mErAjMmw2qYBdEGObiQTsdgybTSpgh2PYbFIBuxrGNhMJ2L0YpjcVsGNhjG4qYJdimN5IwG7EML2pgB0IY3RTAbuO6I0E7C56wLBbHQHYUXSXsfucAthFdNewyxwB2C30gGE3OQKwQ+guY3c4BbArSKmAnUACWBLAkgCWAJYE8KN9PC/PrPN7bNvTx5VnFYs9CPDHGVmScgc/a92SrILBz3K0JCt684Muycod/HBLsnIHP9xirNzND7okK3fwwy3Gyt38oIuxcgc/6JKs3MEPuhgrd/CDLsbKHfygi7FyBz/oYqzcwQ+6GCt3V4Muxug2AKYLY3QjAROFMbqpgEHCGF2AhTG6AGMsdAHGWEt+3AEYY3QBFsboAiyM0QWYZG4BFsboAiyM0QVYGKMLMMncAiyM0QVYJHMLsIokey+AlSfZ6wCsMMxeAWCFYXZtgJXk2T0BlvR6wNeL81RvybMWAr6OyfsFWfWs7wF8ReVF47h61icDvorywJ61H/C1JmI9a9mzzrU4Yj1r+rOO9w59eO/lWQGOeXtv0Ur6n98F4OOe34U9K8DSigCWAJYEsCSAJYAlASwJYEkASwBLAlgSwBLAkgCWBLCkv/ULjeaPVFuk5W0AAAAASUVORK5CYII="

const corners = ["nw", "se"] as const

const describe = (crop: Required<ImageCrop> | undefined) =>
  crop ? `${crop.width}x${crop.height} at ${crop.x},${crop.y}` : "none"

function Fixture() {
  const [frame, setFrame] = useState<Required<ImageCrop>>()
  const [saved, setSaved] = useState("nothing saved")
  const [cover, setCover] = useState<Required<ImageCrop>>()
  const [kept, setKept] = useState<Required<ImageCrop>>()
  const [lifted, setLifted] = useState(0)
  const [cropping, setCropping] = useState(false)
  const holding = {
    onResponderGrant: () => setCropping(true),
    onResponderRelease: () => setCropping(false),
    onResponderTerminate: () => setCropping(false),
  }
  return (
    <View style={styles.fixture}>
      <Text testID="readout">{`Frame ${describe(frame)}, ${saved}`}</Text>
      <Text testID="scroll-readout">
        {`Cover ${describe(cover)} kept ${describe(kept)}, lifted ${lifted}`}
      </Text>
      <ImageCropper
        aria-label="Avatar"
        src={photo}
        mode="frame"
        aspectRatio={1}
        shape="circle"
        maxZoom={4}
        onCropChange={setFrame}
        onCropCommit={(crop, details) =>
          setSaved(`saved ${crop.width} by ${details.reason}`)
        }
        style={styles.row}
      >
        <ImageCropperViewport testID="frame" style={styles.frame}>
          <ImageCropperImage alt="Hills" />
          <ImageCropperSelection
            aria-label="Avatar crop"
            style={styles.circle}
          />
        </ImageCropperViewport>
        <ImageCropperZoom testID="zoom" style={styles.zoom} />
      </ImageCropper>
      <ScrollView
        scrollEnabled={!cropping}
        testID="upright"
        onScroll={(event) =>
          setLifted(Math.round(event.nativeEvent.contentOffset.y))
        }
        scrollEventThrottle={16}
        style={styles.upright}
      >
        <View style={styles.tall}>
          <ImageCropper
            aria-label="Cover"
            src={photo}
            minWidth={40}
            minHeight={40}
            onCropChange={setCover}
            onCropCommit={setKept}
          >
            <ImageCropperViewport style={styles.box}>
              <ImageCropperImage alt="Hills" />
              <ImageCropperSelection
                testID="cover"
                aria-label="Cover crop"
                {...holding}
                style={styles.selection}
              >
                {corners.map((position) => (
                  <ImageCropperHandle
                    key={position}
                    position={position}
                    {...holding}
                    style={handleStyle}
                  >
                    <View style={styles.dot} />
                  </ImageCropperHandle>
                ))}
              </ImageCropperSelection>
            </ImageCropperViewport>
          </ImageCropper>
        </View>
      </ScrollView>
    </View>
  )
}

const handleStyle = ({ position }: ImageCropperHandleState) => [
  styles.handle,
  position === "nw" ? { top: -22, left: -22 } : { bottom: -22, right: -22 },
]

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  frame: { width: 160, height: 160, padding: 16, backgroundColor: "#0a0a0a" },
  circle: { borderRadius: 9999, borderWidth: 1, borderColor: "#ffffff" },
  zoom: { flex: 1, height: 44, backgroundColor: "#e4e4e7" },
  upright: { height: 300, flexGrow: 0, backgroundColor: "#f4f4f5" },
  tall: { height: 900, paddingVertical: 24, paddingHorizontal: 20 },
  box: { width: 280, height: 184, backgroundColor: "#d4d4d8" },
  selection: { borderWidth: 1, borderColor: "#ffffff" },
  handle: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 12, height: 12, backgroundColor: "#ffffff" },
})

export { Fixture }
