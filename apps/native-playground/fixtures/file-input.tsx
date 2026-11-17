import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  createFileInputController,
  FileInput,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
  type PickedFile,
} from "@ui-sdk/react-native/file-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const picked: PickedFile[] = [
  {
    name: "photo.png",
    size: 120_000,
    type: "image/png",
    uri: "file:///photo.png",
  },
  { name: "notes.txt", size: 300, type: "text/plain", uri: "file:///notes.txt" },
  {
    name: "report.pdf",
    size: 480_000,
    type: "application/pdf",
    uri: "file:///report.pdf",
  },
]

const pick = async () => picked

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Fixture() {
  const [disabled, setDisabled] = useState(false)
  const [value, setValue] = useState("none")
  const [rejected, setRejected] = useState("none")
  const [controller] = useState(createFileInputController)

  return (
    <View style={styles.fixture}>
      <Text testID="file-value">{value}</Text>
      <Text testID="file-rejected">{rejected}</Text>
      <View style={styles.row}>
        <Action
          label={disabled ? "Enable" : "Disable"}
          testID="toggle-disabled"
          onPress={() => setDisabled((current) => !current)}
        />
        <Action
          label="Clear"
          testID="clear"
          onPress={() => controller.clear()}
        />
      </View>
      <Field disabled={disabled} style={styles.field}>
        <FieldLabel style={styles.label}>Attachments</FieldLabel>
        <FileInput
          multiple
          accept="image/*,.pdf"
          pick={pick}
          controller={controller}
          onValueChange={(files, details) =>
            setValue(
              `${files.map((file) => file.name).join(" and ") || "no files"} by ${details.reason}`
            )
          }
          onReject={(files) =>
            setRejected(
              files
                .map(({ file, reasons }) => `${file.name} ${reasons.join(" ")}`)
                .join(", ")
            )
          }
          style={styles.field}
        >
          <FileInputTrigger testID="trigger" style={styles.action}>
            <Text>Browse files</Text>
          </FileInputTrigger>
          <FileInputList aria-label="Attached files" style={styles.list}>
            <FileInputItem style={styles.row}>
              {({ file }) => (
                <>
                  <Text>{file.name}</Text>
                  <FileInputItemRemove style={styles.remove}>
                    <Text aria-hidden>✕</Text>
                  </FileInputItemRemove>
                </>
              )}
            </FileInputItem>
          </FileInputList>
        </FileInput>
      </Field>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 16, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  action: { minHeight: 44, padding: 12, borderWidth: 1, borderRadius: 8 },
  label: { minHeight: 44, lineHeight: 44 },
  field: { gap: 8 },
  list: { gap: 8 },
  remove: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
})

export { Fixture }
