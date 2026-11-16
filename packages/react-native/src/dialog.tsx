import { dialog } from "@ui-sdk/core/dialog"
import {
  type BackdropPartProps,
  type ContentPartProps,
  type DialogParts,
  dialogParts,
  type RootProps,
  type TriggerPartProps,
} from "./dialog-parts"

const parts = dialogParts(dialog)

/**
 * The props of `Dialog`.
 * @experimental
 */
type DialogProps = RootProps

/**
 * A window over the screen that asks for the user's attention. Put its
 * trigger, backdrop and content inside. A modal dialog renders its backdrop
 * and content in one `Modal`, which hides the rest of the screen from screen
 * readers; a non-modal one renders them where they are.
 * @experimental
 */
const Dialog: (props: DialogProps) => React.ReactElement = parts.Root

/**
 * The button that opens the dialog: a `Pressable` with the button role.
 * @experimental
 */
const DialogTrigger: (props: TriggerPartProps) => React.ReactElement | null =
  parts.Trigger

/**
 * A `Pressable` behind the content, which a press on closes the dialog with
 * the `"outside-press"` reason, unless `closeOnOutsidePress` or
 * `dismissible` says otherwise.
 * @experimental
 */
const DialogBackdrop: (props: BackdropPartProps) => React.ReactElement | null =
  parts.Backdrop

/**
 * The dialog itself, a `View`. VoiceOver's escape gesture on it closes the
 * dialog with the `"escape-key"` reason. Pass `onExit` to keep it on screen
 * while it animates out.
 * @experimental
 */
const DialogContent: (props: ContentPartProps) => React.ReactElement | null =
  parts.Content

/**
 * The dialog's title, a `Text` with the header role, which names the dialog
 * and takes the screen reader's focus when it opens.
 * @experimental
 */
const DialogTitle: DialogParts["Title"] = parts.Title

/**
 * Describes the dialog while it's rendered, in a `Text`.
 * @experimental
 */
const DialogDescription: DialogParts["Description"] = parts.Description

/**
 * A `Pressable` that closes the dialog. An `action` runs first, and a
 * Promise it returns keeps the dialog open until it settles.
 * @experimental
 */
const DialogClose: DialogParts["Close"] = parts.Close

export { createDialogController } from "@ui-sdk/core/dialog"
export type {
  DialogApi,
  DialogBackdropState,
  DialogCloseActionDetails,
  DialogCloseProps,
  DialogCloseState,
  DialogContentProps,
  DialogContentState,
  DialogController,
  DialogDismissAttemptDetails,
  DialogDismissReason,
  DialogFinalFocus,
  DialogInitialFocus,
  DialogOpenChangeDetails,
  DialogOpenChangeReason,
  DialogOptions,
  DialogPayloadChangeReason,
  DialogPrimitive,
  DialogSharedOptions,
  DialogTriggerProps,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
}
