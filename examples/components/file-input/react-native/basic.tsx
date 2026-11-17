import {
  FileInput,
  FileInputDropzone,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
  formatFileSize,
  type PickedFile,
} from "@ui-sdk/react-native/file-input"
import { StyleSheet, Text, View } from "react-native"

const samples: PickedFile[] = [
  {
    name: "report.pdf",
    size: 482_000,
    type: "application/pdf",
    uri: "file:///report.pdf",
  },
  {
    name: "photo.jpg",
    size: 2_400_000,
    type: "image/jpeg",
    uri: "file:///photo.jpg",
  },
  {
    name: "notes.txt",
    size: 1_200,
    type: "text/plain",
    uri: "file:///notes.txt",
  },
]

let picked = 0

async function pick() {
  const sample = samples[picked++ % samples.length]
  return [{ ...sample }]
}

function Example() {
  return (
    <FileInput multiple pick={pick} style={styles.root}>
      <FileInputDropzone style={styles.dropzone}>
        <Text style={styles.title}>Attach files</Text>
        <Text style={styles.hint}>Each press picks a sample file.</Text>
        <FileInputTrigger
          style={({ disabled }, { pressed }) => [
            styles.trigger,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.triggerText}>Browse Files</Text>
        </FileInputTrigger>
      </FileInputDropzone>
      <FileInputList aria-label="Files" style={styles.list}>
        <FileInputItem style={styles.item}>
          {({ file }) => (
            <>
              <View style={styles.text}>
                <Text numberOfLines={1}>{file.name}</Text>
                <Text style={styles.hint}>{formatFileSize(file.size)}</Text>
              </View>
              <FileInputItemRemove style={styles.remove}>
                <Text aria-hidden style={styles.removeText}>
                  ✕
                </Text>
              </FileInputItemRemove>
            </>
          )}
        </FileInputItem>
      </FileInputList>
    </FileInput>
  )
}

const styles = StyleSheet.create({
  root: { alignSelf: "stretch", gap: 12 },
  dropzone: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  title: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: "#71717a" },
  trigger: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  triggerText: { color: "#fafafa", fontWeight: "500" },
  list: { gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingStart: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
  },
  text: { flex: 1, paddingVertical: 8 },
  remove: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { fontSize: 16, color: "#52525b" },
})

export { Example }
