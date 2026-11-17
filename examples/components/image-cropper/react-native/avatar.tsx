import {
  ImageCropper,
  ImageCropperImage,
  ImageCropperRotate,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
  type ImageCropperZoomState,
} from "@ui-sdk/react-native/image-cropper"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADSCAIAAAC0K44BAAAEDUlEQVR42u3ZwVVCURBEwYnmB2SKpuXWJFyZgh/h8Lqn7iEB5nVtYL4lxTZOIAEsCWBJAEsASwJYEsCSAJYAlgSwJIAlgCUBLAlgSQBLAEsCWBLAkgCWAJYEsCSAJYAlASwJYEkASwBLAlgSwJLeCvjrul708agCGGAJYIAlgAGWAJYABlgCGGAJYIAFMMASwABLAAMsASwBDLAEMMASwABLAEsAAywBDLAEMMCV/dwJYICV53a5ZIDVQ3chY4DVRncVY4BVq3eDYYBVS3cDY4DVr7fYMMBaobfVMMDaorfSMMBapLfPMMDapbfMMMACGGApR2+TYYC1UW+NYYAFMMBSmt4OwwALYIClQL0FhgEWwABLAAMsehkGWAADLAEMsAAGGGABDDDAAhhgCWCABTDAAAtggCWAAZYABlgAAwywAAZYAhhgAQwwwGKYXoAFMMASwACLYXoBFsAAS5sMF1wVYAEMsJRmuOOkAGuj4Zp7AiyAAZZyDDcdE2DtMlx2SYC1yHDfGZcC/nxeKKYYrpzNEPv0yDzQcOtmBlqYuxl3b2agJbnYcP1shluSKxkvmc1wS3IZ41WzGXRJ7pC8czPDLcb+g8htvAHG6ALsDUi2GYDRxdhmCgCji7HNRALGFWObiQSMKMNmEwmYTIzNJhWwN8DYZiIBuz7GNhMJ2N0ZNptIwC6OsdmkAnZujG0mErBDM2w2qYBdGWObiQTsvgybTSpgx8XYZiIBOyvDZpMK2E0xtplIwK7JsNmkAnZKjG0mErAjMmw2qYBdEGObiQTsdgybTSpgh2PYbFIBuxrGNhMJ2L0YpjcVsGNhjG4qYJdimN5IwG7EML2pgB0IY3RTAbuO6I0E7C56wLBbHQHYUXSXsfucAthFdNewyxwB2C30gGE3OQKwQ+guY3c4BbArSKmAnUACWBLAkgCWAJYE8KN9PC/PrPN7bNvTx5VnFYs9CPDHGVmScgc/a92SrILBz3K0JCt684Muycod/HBLsnIHP9xirNzND7okK3fwwy3Gyt38oIuxcgc/6JKs3MEPuhgrd/CDLsbKHfygi7FyBz/oYqzcwQ+6GCt3V4Muxug2AKYLY3QjAROFMbqpgEHCGF2AhTG6AGMsdAHGWEt+3AEYY3QBFsboAiyM0QWYZG4BFsboAiyM0QVYGKMLMMncAiyM0QVYJHMLsIokey+AlSfZ6wCsMMxeAWCFYXZtgJXk2T0BlvR6wNeL81RvybMWAr6OyfsFWfWs7wF8ReVF47h61icDvorywJ61H/C1JmI9a9mzzrU4Yj1r+rOO9w59eO/lWQGOeXtv0Ur6n98F4OOe34U9K8DSigCWAJYEsCSAJYAlASwJYEkASwBLAlgSwBLAkgCWBLCkv/ULjeaPVFuk5W0AAAAASUVORK5CYII="

function Example() {
  const log = useLog()
  return (
    <ImageCropper
      aria-label="Profile photo"
      src={photo}
      mode="frame"
      aspectRatio={1}
      shape="circle"
      maxZoom={4}
      onCropCommit={(crop, details) =>
        log(`Avatar ${crop.width} × ${crop.height} by ${details.reason}`)
      }
      style={styles.cropper}
    >
      <ImageCropperViewport style={styles.viewport}>
        <ImageCropperImage alt="Mountains at sunset" />
        <ImageCropperSelection style={styles.selection} />
      </ImageCropperViewport>
      <View style={styles.row}>
        <ImageCropperZoom style={styles.zoom}>
          {(state: ImageCropperZoomState) => (
            <>
              <View style={styles.track} />
              <View
                style={[styles.thumb, { start: `${state.zoomPosition}%` }]}
              />
            </>
          )}
        </ImageCropperZoom>
        <ImageCropperRotate style={styles.button}>
          <Text>Rotate</Text>
        </ImageCropperRotate>
      </View>
    </ImageCropper>
  )
}

const styles = StyleSheet.create({
  cropper: { width: 288, maxWidth: "100%", gap: 12 },
  viewport: {
    aspectRatio: 1,
    padding: 24,
    borderRadius: 8,
    backgroundColor: "#0a0a0a",
  },
  selection: {
    borderRadius: 9999,
    outlineWidth: 1,
    outlineColor: "#ffffff",
    boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  zoom: { flex: 1, height: 44, justifyContent: "center" },
  track: { height: 4, borderRadius: 2, backgroundColor: "#d4d4d8" },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    marginStart: -10,
    borderRadius: 10,
    backgroundColor: "#18181b",
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
})

export { Example }
