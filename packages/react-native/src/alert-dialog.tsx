import type { AlertDialogOptions, dialog } from "@ui-sdk/core/dialog"
// From its own module, so an app with only alert dialogs doesn't carry Dialog's presentation.
import { alertDialog } from "@ui-sdk/core/alert-dialog"
import {
  type BackdropPartProps,
  type ContentPartProps,
  dialogParts,
  type RootProps,
  type TriggerPartProps,
} from "./dialog-parts"

// The alert dialog's slots and state are the dialog's. Only its options are narrower.
const parts = dialogParts(alertDialog as unknown as typeof dialog)

/**
 * The props of `AlertDialog`.
 * @experimental
 */
type AlertDialogProps = Omit<AlertDialogOptions, "container"> & {
  children?: React.ReactNode
}

/**
 * A modal dialog that interrupts the user with something important and
 * waits for an answer, like "Delete this file?". It renders its backdrop and
 * content in one `Modal`.
 * @experimental
 */
function AlertDialog(props: AlertDialogProps) {
  return <parts.Root {...(props as RootProps)} />
}

/**
 * The button that opens the alert dialog: a `Pressable` with the button role.
 * @experimental
 */
const AlertDialogTrigger: (
  props: TriggerPartProps
) => React.ReactElement | null = parts.Trigger

/**
 * A `Pressable` behind the content. Pressing it doesn't close the alert
 * dialog: the app hears the attempt in `onDismissAttempt`.
 * @experimental
 */
const AlertDialogBackdrop: (
  props: BackdropPartProps
) => React.ReactElement | null = parts.Backdrop

/**
 * The alert dialog itself, a `View`. Put the title, the description and the
 * buttons that answer it inside. Pass `onExit` to keep it on screen while it
 * animates out.
 * @experimental
 */
const AlertDialogContent: (
  props: ContentPartProps
) => React.ReactElement | null = parts.Content

/**
 * The alert dialog's title, a `Text` with the header role, which names it.
 * Opened with a touch, the screen reader's focus starts here; opened another
 * way, on the first Close part, the least destructive answer.
 * @experimental
 */
const AlertDialogTitle = parts.Title

/**
 * Describes the alert dialog while it's rendered, in a `Text`.
 * @experimental
 */
const AlertDialogDescription = parts.Description

/**
 * A `Pressable` that answers the alert dialog and closes it with its
 * `value`. An `action` runs first, and a Promise it returns keeps it open
 * until it settles.
 * @experimental
 */
const AlertDialogClose = parts.Close

export {
  confirm,
  createAlertDialogController,
  createConfirm,
} from "@ui-sdk/core/alert-dialog"
export type {
  AlertDialogBackdropState,
  AlertDialogCloseActionDetails,
  AlertDialogCloseProps,
  AlertDialogCloseState,
  AlertDialogContentProps,
  AlertDialogContentState,
  AlertDialogController,
  AlertDialogOpenChangeReason,
  AlertDialogOptions,
  AlertDialogPayloadChangeReason,
  AlertDialogPrimitive,
  AlertDialogTriggerProps,
  AlertDialogTriggerState,
  ConfirmEntry,
  ConfirmOptions,
} from "@ui-sdk/core/alert-dialog"

export {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  type AlertDialogProps,
  AlertDialogTitle,
  AlertDialogTrigger,
}
