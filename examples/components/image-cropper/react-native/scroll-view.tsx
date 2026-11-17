import {
  ImageCropper,
  type ImageCropperHandleState,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperSelection,
  ImageCropperViewport,
  type ImageCropperViewportState,
} from "@ui-sdk/react-native/image-cropper"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAADSCAIAAAC0K44BAAAEDUlEQVR42u3ZwVVCURBEwYnmB2SKpuXWJFyZgh/h8Lqn7iEB5nVtYL4lxTZOIAEsCWBJAEsASwJYEsCSAJYAlgSwJIAlgCUBLAlgSQBLAEsCWBLAkgCWAJYEsCSAJYAlASwJYEkASwBLAlgSwJLeCvjrul708agCGGAJYIAlgAGWAJYABlgCGGAJYIAFMMASwABLAAMsASwBDLAEMMASwABLAEsAAywBDLAEMMCV/dwJYICV53a5ZIDVQ3chY4DVRncVY4BVq3eDYYBVS3cDY4DVr7fYMMBaobfVMMDaorfSMMBapLfPMMDapbfMMMACGGApR2+TYYC1UW+NYYAFMMBSmt4OwwALYIClQL0FhgEWwABLAAMsehkGWAADLAEMsAAGGGABDDDAAhhgCWCABTDAAAtggCWAAZYABlgAAwywAAZYAhhgAQwwwGKYXoAFMMASwACLYXoBFsAAS5sMF1wVYAEMsJRmuOOkAGuj4Zp7AiyAAZZyDDcdE2DtMlx2SYC1yHDfGZcC/nxeKKYYrpzNEPv0yDzQcOtmBlqYuxl3b2agJbnYcP1shluSKxkvmc1wS3IZ41WzGXRJ7pC8czPDLcb+g8htvAHG6ALsDUi2GYDRxdhmCgCji7HNRALGFWObiQSMKMNmEwmYTIzNJhWwN8DYZiIBuz7GNhMJ2N0ZNptIwC6OsdmkAnZujG0mErBDM2w2qYBdGWObiQTsvgybTSpgx8XYZiIBOyvDZpMK2E0xtplIwK7JsNmkAnZKjG0mErAjMmw2qYBdEGObiQTsdgybTSpgh2PYbFIBuxrGNhMJ2L0YpjcVsGNhjG4qYJdimN5IwG7EML2pgB0IY3RTAbuO6I0E7C56wLBbHQHYUXSXsfucAthFdNewyxwB2C30gGE3OQKwQ+guY3c4BbArSKmAnUACWBLAkgCWAJYE8KN9PC/PrPN7bNvTx5VnFYs9CPDHGVmScgc/a92SrILBz3K0JCt684Muycod/HBLsnIHP9xirNzND7okK3fwwy3Gyt38oIuxcgc/6JKs3MEPuhgrd/CDLsbKHfygi7FyBz/oYqzcwQ+6GCt3V4Muxug2AKYLY3QjAROFMbqpgEHCGF2AhTG6AGMsdAHGWEt+3AEYY3QBFsboAiyM0QWYZG4BFsboAiyM0QVYGKMLMMncAiyM0QVYJHMLsIokey+AlSfZ6wCsMMxeAWCFYXZtgJXk2T0BlvR6wNeL81RvybMWAr6OyfsFWfWs7wF8ReVF47h61icDvorywJ61H/C1JmI9a9mzzrU4Yj1r+rOO9w59eO/lWQGOeXtv0Ur6n98F4OOe34U9K8DSigCWAJYEsCSAJYAlASwJYEkASwBLAlgSwBLAkgCWBLCkv/ULjeaPVFuk5W0AAAAASUVORK5CYII="

const handles = ["nw", "ne", "se", "sw"] as const

function Example() {
  const [dragging, setDragging] = useState(false)
  const holding = {
    onResponderGrant: () => setDragging(true),
    onResponderRelease: () => setDragging(false),
    onResponderTerminate: () => setDragging(false),
  }

  return (
    <ScrollView scrollEnabled={!dragging} style={styles.page}>
      <Text style={styles.heading}>Cover photo</Text>
      <ImageCropper aria-label="Cover photo" src={photo} aspectRatio={2}>
        <ImageCropperViewport style={viewportStyle}>
          <ImageCropperImage alt="Mountains at sunset" />
          <ImageCropperSelection {...holding} style={styles.selection}>
            {handles.map((position) => (
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
      <Text style={styles.footer}>
        The cover shows at the top of your profile.
      </Text>
    </ScrollView>
  )
}

const viewportStyle = (state: ImageCropperViewportState) => [
  styles.viewport,
  { aspectRatio: state.imageAspectRatio ?? 3 / 2 },
]

const handleStyle = ({ position }: ImageCropperHandleState) => [
  styles.handle,
  position.includes("n") ? { top: -22 } : { bottom: -22 },
  position.includes("w") ? { left: -22 } : { right: -22 },
]

const styles = StyleSheet.create({
  page: { width: 320, height: 240 },
  heading: { fontSize: 17, fontWeight: "600", marginBottom: 8 },
  viewport: { width: "100%", borderRadius: 8, backgroundColor: "#f4f4f5" },
  selection: {
    outlineWidth: 1,
    outlineColor: "#ffffff",
    boxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5)",
  },
  handle: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 12, height: 12, borderRadius: 2, backgroundColor: "#ffffff" },
  footer: { color: "#71717a", fontSize: 13, marginTop: 160 },
})

export { Example }
