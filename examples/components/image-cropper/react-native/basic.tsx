import {
  ImageCropper,
  ImageCropperGrid,
  type ImageCropperHandleState,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperSelection,
  type ImageCropperState,
  ImageCropperViewport,
  type ImageCropperViewportState,
} from "@ui-sdk/react-native/image-cropper"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADSCAIAAAC0K44BAAAEDUlEQVR42u3ZwVVCURBEwYnmB2SKpuXWJFyZgh/h8Lqn7iEB5nVtYL4lxTZOIAEsCWBJAEsASwJYEsCSAJYAlgSwJIAlgCUBLAlgSQBLAEsCWBLAkgCWAJYEsCSAJYAlASwJYEkASwBLAlgSwJLeCvjrul708agCGGAJYIAlgAGWAJYABlgCGGAJYIAFMMASwABLAAMsASwBDLAEMMASwABLAEsAAywBDLAEMMCV/dwJYICV53a5ZIDVQ3chY4DVRncVY4BVq3eDYYBVS3cDY4DVr7fYMMBaobfVMMDaorfSMMBapLfPMMDapbfMMMACGGApR2+TYYC1UW+NYYAFMMBSmt4OwwALYIClQL0FhgEWwABLAAMsehkGWAADLAEMsAAGGGABDDDAAhhgCWCABTDAAAtggCWAAZYABlgAAwywAAZYAhhgAQwwwGKYXoAFMMASwACLYXoBFsAAS5sMF1wVYAEMsJRmuOOkAGuj4Zp7AiyAAZZyDDcdE2DtMlx2SYC1yHDfGZcC/nxeKKYYrpzNEPv0yDzQcOtmBlqYuxl3b2agJbnYcP1shluSKxkvmc1wS3IZ41WzGXRJ7pC8czPDLcb+g8htvAHG6ALsDUi2GYDRxdhmCgCji7HNRALGFWObiQSMKMNmEwmYTIzNJhWwN8DYZiIBuz7GNhMJ2N0ZNptIwC6OsdmkAnZujG0mErBDM2w2qYBdGWObiQTsvgybTSpgx8XYZiIBOyvDZpMK2E0xtplIwK7JsNmkAnZKjG0mErAjMmw2qYBdEGObiQTsdgybTSpgh2PYbFIBuxrGNhMJ2L0YpjcVsGNhjG4qYJdimN5IwG7EML2pgB0IY3RTAbuO6I0E7C56wLBbHQHYUXSXsfucAthFdNewyxwB2C30gGE3OQKwQ+guY3c4BbArSKmAnUACWBLAkgCWAJYE8KN9PC/PrPN7bNvTx5VnFYs9CPDHGVmScgc/a92SrILBz3K0JCt684Muycod/HBLsnIHP9xirNzND7okK3fwwy3Gyt38oIuxcgc/6JKs3MEPuhgrd/CDLsbKHfygi7FyBz/oYqzcwQ+6GCt3V4Muxug2AKYLY3QjAROFMbqpgEHCGF2AhTG6AGMsdAHGWEt+3AEYY3QBFsboAiyM0QWYZG4BFsboAiyM0QVYGKMLMMncAiyM0QVYJHMLsIokey+AlSfZ6wCsMMxeAWCFYXZtgJXk2T0BlvR6wNeL81RvybMWAr6OyfsFWfWs7wF8ReVF47h61icDvorywJ61H/C1JmI9a9mzzrU4Yj1r+rOO9w59eO/lWQGOeXtv0Ur6n98F4OOe34U9K8DSigCWAJYEsCSAJYAlASwJYEkASwBLAlgSwBLAkgCWBLCkv/ULjeaPVFuk5W0AAAAASUVORK5CYII="

const ratios = [
  { label: "Free", value: undefined },
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
]

const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const

function Example() {
  const log = useLog()
  const [ratio, setRatio] = useState<number>()
  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        {ratios.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityState={{ selected: ratio === item.value }}
            onPress={() => setRatio(item.value)}
            style={[styles.button, ratio === item.value && styles.selected]}
          >
            <Text>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <ImageCropper
        aria-label="Photo"
        src={photo}
        aspectRatio={ratio}
        minWidth={64}
        minHeight={64}
        onCropCommit={(crop) =>
          log(`Crop ${crop.width} × ${crop.height} at ${crop.x}, ${crop.y}`)
        }
      >
        <ImageCropperViewport style={viewportStyle}>
          <ImageCropperImage alt="Mountains at sunset" />
          <ImageCropperSelection style={styles.selection}>
            <ImageCropperGrid style={gridStyle}>
              <View style={[styles.line, styles.column, { left: "33.3%" }]} />
              <View style={[styles.line, styles.column, { left: "66.6%" }]} />
              <View style={[styles.line, styles.row, { top: "33.3%" }]} />
              <View style={[styles.line, styles.row, { top: "66.6%" }]} />
            </ImageCropperGrid>
            {handles.map((position) => (
              <ImageCropperHandle
                key={position}
                position={position}
                style={handleStyle}
              >
                <View style={styles.dot} />
              </ImageCropperHandle>
            ))}
          </ImageCropperSelection>
        </ImageCropperViewport>
      </ImageCropper>
    </View>
  )
}

const viewportStyle = (state: ImageCropperViewportState) => [
  styles.viewport,
  { aspectRatio: state.imageAspectRatio ?? 3 / 2 },
]

const gridStyle = (state: ImageCropperState) => ({
  opacity: state.dragging ? 1 : 0,
})

const handleStyle = ({ position }: ImageCropperHandleState) => [
  styles.handle,
  position.includes("n")
    ? { top: -22 }
    : position.includes("s")
      ? { bottom: -22 }
      : { top: "50%" as const, marginTop: -22 },
  position.includes("w")
    ? { left: -22 }
    : position.includes("e")
      ? { right: -22 }
      : { left: "50%" as const, marginLeft: -22 },
]

const styles = StyleSheet.create({
  stack: { width: 320, maxWidth: "100%", gap: 12 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  selected: { backgroundColor: "#e4e4e7" },
  viewport: { width: "100%", borderRadius: 8, backgroundColor: "#f4f4f5" },
  selection: {
    outlineWidth: 1,
    outlineColor: "#ffffff",
    boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5)",
  },
  line: { position: "absolute", backgroundColor: "rgba(255, 255, 255, 0.6)" },
  column: { top: 0, bottom: 0, width: 1 },
  row: { left: 0, right: 0, height: 1 },
  handle: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.4)",
  },
})

export { Example }
