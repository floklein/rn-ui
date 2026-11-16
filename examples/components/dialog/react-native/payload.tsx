import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

type Invoice = {
  id: string
  customer: string
  amount: string
  status: "Paid" | "Due"
}

const invoices: Invoice[] = [
  { id: "INV-001", customer: "Acme", amount: "$250.00", status: "Paid" },
  { id: "INV-002", customer: "Globex", amount: "$150.00", status: "Due" },
  { id: "INV-003", customer: "Initech", amount: "$350.00", status: "Due" },
]

function Example() {
  const [reminder] = useState(() => createDialogController<Invoice, "send">())
  const log = useLog()

  async function remindFromCode() {
    const { reason, returnValue } = await reminder.open({
      payload: invoices[2],
    })
    log(
      returnValue === "send" ? "Reminder sent from code" : `Closed (${reason})`
    )
  }

  return (
    <View style={styles.stack}>
      <Pressable role="button" onPress={remindFromCode} style={styles.button}>
        <Text>Open from Code</Text>
      </Pressable>
      <View style={styles.list}>
        {invoices.map((invoice) => (
          <View key={invoice.id} style={styles.item}>
            <Text style={styles.name}>{invoice.customer}</Text>
            <Text style={styles.description}>
              {invoice.amount} · {invoice.status}
            </Text>
            <DialogTrigger
              controller={reminder}
              payload={invoice}
              disabled={invoice.status === "Paid"}
              aria-label={`Remind ${invoice.customer}`}
              style={styles.button}
            >
              <Text>Remind</Text>
            </DialogTrigger>
          </View>
        ))}
      </View>
      <Dialog
        controller={reminder}
        onOpenChange={(open, details) => {
          if (!open && details.returnValue === "send") {
            log("Reminder sent")
          }
        }}
      >
        <DialogBackdrop style={styles.backdrop} />
        <DialogContent style={styles.content}>
          {(state) => {
            const invoice = state.payload as Invoice | undefined
            return (
              <>
                <View style={styles.stack}>
                  <DialogTitle style={styles.title}>
                    Remind {invoice?.customer}
                  </DialogTitle>
                  <DialogDescription style={styles.description}>
                    {invoice?.id} for {invoice?.amount} is due. We'll email the
                    billing contact.
                  </DialogDescription>
                </View>
                <View style={styles.row}>
                  <DialogClose style={styles.button}>
                    <Text>Cancel</Text>
                  </DialogClose>
                  <DialogClose
                    value="send"
                    style={[styles.button, styles.solid]}
                  >
                    <Text style={styles.solidText}>Send reminder</Text>
                  </DialogClose>
                </View>
              </>
            )
          }}
        </DialogContent>
      </Dialog>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginTop: "auto",
    marginBottom: "auto",
    marginHorizontal: 24,
    gap: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  list: { borderWidth: 1, borderRadius: 12, borderColor: "#e4e4e7" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  name: { flex: 1, fontSize: 15 },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }
