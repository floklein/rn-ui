import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import { StyleSheet, Text, View } from "react-native"

const messages = [
  { from: "Hollis Grant", subject: "Launch checklist for Thursday" },
  { from: "Inès Moreau", subject: "Updated pricing page copy" },
  { from: "Kofi Mensah", subject: "Design review notes" },
  { from: "Wren Takahashi", subject: "Q4 roadmap draft" },
  { from: "Tomasz Wójcik", subject: "Re: Staging deploy failed" },
  { from: "Hollis Grant", subject: "Invoices for October" },
  { from: "Inès Moreau", subject: "Customer interview recordings" },
  { from: "Kofi Mensah", subject: "New icons for the dashboard" },
  { from: "Wren Takahashi", subject: "Offsite agenda" },
  { from: "Tomasz Wójcik", subject: "Database migration plan" },
]

function Example() {
  return (
    <ScrollArea style={styles.area}>
      <ScrollAreaViewport aria-label="Inbox">
        <ScrollAreaContent>
          {messages.map((message) => (
            <View key={message.subject} style={styles.message}>
              <Text style={styles.from}>{message.from}</Text>
              <Text style={styles.hint}>{message.subject}</Text>
            </View>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  area: {
    width: 280,
    height: 260,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  message: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d4d4d8",
    gap: 2,
  },
  from: { fontSize: 14, fontWeight: "600" },
  hint: { color: "#71717a", fontSize: 13 },
})

export { Example }
