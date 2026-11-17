import type { ConfirmEntry, ConfirmOptions } from "@ui-sdk/core/dialog"
import {
  type OverlayEntry,
  type Overlays,
  overlays as sharedOverlays,
} from "@ui-sdk/core/overlays"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./alert-dialog"
import { RootHost, type RootHostProps } from "./overlay-host"

const noEntries: readonly OverlayEntry[] = []

/**
 * Props for `OverlayHost`.
 * @experimental
 */
type OverlayHostProps = RootHostProps & {
  /**
   * The registry it renders.
   * @defaultValue the shared `overlays`, which `confirm()` opens into
   */
  overlays?: Overlays
}

/**
 * Where non-modal popups and what `confirm()` opens render, above the app
 * it wraps. Wrap the app in one, near the root. Modal popups need none: each
 * `Modal` carries its own host.
 * @experimental
 */
function OverlayHost({
  overlays = sharedOverlays,
  children,
  ...props
}: OverlayHostProps) {
  const entries = React.useSyncExternalStore(
    overlays.subscribe,
    overlays.entries,
    () => noEntries
  )
  React.useLayoutEffect(() => overlays.attachHost(), [overlays])
  return (
    <RootHost {...props}>
      {children}
      {entries.map(
        (entry) =>
          entry.type === "confirm" && (
            <HostedConfirm key={entry.id} entry={entry.data as ConfirmEntry} />
          )
      )}
    </RootHost>
  )
}

function HostedConfirm({ entry }: { entry: ConfirmEntry }) {
  // The alert dialog attached the controller in its layout effect, so it can open now.
  React.useEffect(() => {
    entry.open()
  }, [entry])
  const question = (entry.payload ?? {}) as Partial<ConfirmOptions>
  return (
    <AlertDialog
      controller={entry.controller}
      onOpenChangeComplete={(open) => !open && entry.done()}
    >
      <AlertDialogBackdrop style={styles.backdrop} />
      <AlertDialogContent style={styles.content}>
        <AlertDialogTitle style={styles.title}>
          {question.title}
        </AlertDialogTitle>
        {question.description && (
          <AlertDialogDescription>
            {question.description}
          </AlertDialogDescription>
        )}
        <View style={styles.answers}>
          <AlertDialogClose style={styles.answer}>
            <Text>{question.cancelLabel ?? "Cancel"}</Text>
          </AlertDialogClose>
          <AlertDialogClose value="confirm" style={styles.answer}>
            <Text>{question.confirmLabel ?? "Continue"}</Text>
          </AlertDialogClose>
        </View>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Native has no user-agent styles, so the dialog the host renders brings the
// least it needs to be read: a card on a dimmed screen.
const styles = StyleSheet.create({
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginVertical: "auto",
    marginHorizontal: 24,
    gap: 12,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 17, fontWeight: "600" },
  answers: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  answer: { paddingHorizontal: 12, paddingVertical: 8 },
})

export { createOverlays, overlays } from "@ui-sdk/core/overlays"
export type { OverlayEntry, Overlays } from "@ui-sdk/core/overlays"

export { OverlayHost, type OverlayHostProps }
