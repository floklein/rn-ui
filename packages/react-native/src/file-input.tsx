import type {
  ChangeDetails,
  ChangeOptions,
  CommitDetails,
  Part,
} from "@ui-sdk/core"
import {
  createFileInputController as createController,
  fileInput,
  type FileInputOptions as CoreOptions,
  type FileInputState as CoreState,
  type FileInputItemState as CoreItemState,
  type FileInputItemRemoveState,
  type FileInputValueChangeReason,
  type FileLike,
  type FileRejection,
} from "@ui-sdk/core/file-input"
import { nativeHost } from "@ui-sdk/core/native"
import { fileKey, press } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, View } from "react-native"
import { carry } from "./carried-context"
import { useControllerEntry, useControllerTarget } from "./controller-target"
import { FieldContext, useFieldControl } from "./field-context"
import { plainText, useText } from "./names"
import { renderElement } from "./render-element"
import {
  HandleScope,
  useHandle,
  useNearest,
  usePart,
  usePressedPart,
  usePrimitive,
  type PartProps,
} from "./use-primitive"

/**
 * A file `pick` returns: its name, MIME type and size, which the checks
 * read, and the `uri` to read or upload it from.
 * @experimental
 */
type PickedFile = FileLike & {
  /** Where the file is, like a `file://` or `content://` URI from the picker. */
  uri: string
}

/**
 * What `pick` receives, to set up the picker it opens.
 * @experimental
 */
type FileInputPickOptions = {
  /** The `accept` tokens, lowercase: MIME types, wildcards and extensions. Empty for any file. */
  accept: string[]
  /** Whether more than one file can be chosen. */
  multiple: boolean
}

/**
 * What a change did, beside the new value.
 * @experimental
 */
type FileInputChange = {
  /** Why it changed. */
  reason: FileInputValueChangeReason
  /** The files that joined the value. */
  added: PickedFile[]
  /** The files that left the value, including the one a new file replaces without `multiple`. */
  removed: PickedFile[]
  /** The files that didn't pass the checks, each with its reasons. */
  rejected: FileRejection<PickedFile>[]
}

/**
 * What `onValueChange` receives after the files: the reason, and what the change added, removed and rejected.
 * @experimental
 */
type FileInputValueChangeDetails = ChangeDetails<FileInputValueChangeReason> &
  Omit<FileInputChange, "reason">

/**
 * Options for every write method on a controller.
 * @experimental
 */
type FileInputChangeOptions = ChangeOptions<FileInputValueChangeReason>

/**
 * Adds, removes and reads files, and opens the picker, from outside the file input. Pass it as the `controller` option.
 * @experimental
 */
type FileInputController = {
  /** The files it holds. */
  getValue: () => readonly PickedFile[]
  /** Replaces the files, without checking them. Returns false when canceled. */
  setValue: (
    files: readonly PickedFile[],
    options?: FileInputChangeOptions
  ) => boolean
  /** Runs files through the checks and adds the accepted ones. Returns false when disabled or canceled. */
  addFiles: (
    files: readonly PickedFile[],
    options?: FileInputChangeOptions
  ) => boolean
  /** Removes one file. Returns false when it isn't there, or the change is canceled. */
  removeFile: (file: PickedFile, options?: FileInputChangeOptions) => boolean
  /** Removes every file. */
  clear: (options?: FileInputChangeOptions) => boolean
  /** Calls `pick`. Returns false when disabled or without `pick`. */
  open: () => boolean
  /** Moves focus to the trigger. */
  focus: () => void
  /** Whether files are being dragged over a drop zone. Always false on native. */
  isDragging: () => boolean
}

/**
 * Creates a controller to pass as the `controller` option.
 * @experimental
 */
const createFileInputController =
  createController as unknown as () => FileInputController

/**
 * The options `FileInput` takes, with `pick` in place of the web's hidden input.
 * @experimental
 */
type FileInputOptions = Omit<
  CoreOptions,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "onReject"
  | "validate"
  | "announcement"
  | "controller"
  | "directory"
  | "capture"
  | "name"
  | "form"
> & {
  /**
   * Opens the app's document or photo picker and returns the files chosen,
   * or none when canceled. Its options carry `accept` and `multiple`.
   */
  pick?: (
    options: FileInputPickOptions
  ) =>
    | PromiseLike<readonly PickedFile[] | null | undefined>
    | readonly PickedFile[]
    | null
    | undefined
  /** The files, to control the file input. */
  value?: PickedFile[]
  /**
   * The files at first, when uncontrolled.
   * @defaultValue []
   */
  defaultValue?: PickedFile[]
  /** Runs when files are added or removed, with what changed in the details. `details.cancel()` stops it. */
  onValueChange?: (
    value: PickedFile[],
    details: FileInputValueChangeDetails
  ) => void
  /** Runs when files fail the checks, after `onValueChange`, with every reason each failed. */
  onReject?: (
    rejected: FileRejection<PickedFile>[],
    details: CommitDetails<FileInputValueChangeReason>
  ) => void
  /** A check of your own. Return a reason, like `"duplicate"`, to reject the file, or nothing to accept it. */
  validate?: (file: PickedFile) => string | null | undefined | void
  /**
   * What screen readers hear after a change. Return null for nothing.
   * @defaultValue "2 files accepted. 1 file rejected.", or "photo.png removed."
   */
  announcement?: (change: FileInputChange) => string | null | undefined
  /** Adds and removes files from anywhere. Create one with `createFileInputController()`. */
  controller?: FileInputController
}

/**
 * What `render` functions and state-based styles receive.
 * @experimental
 */
type FileInputState = Omit<CoreState, "value"> & {
  /** The files it holds. */
  value: readonly PickedFile[]
}

/**
 * The state the item hands `render` functions and state-based styles.
 * @experimental
 */
type FileInputItemState = Omit<CoreItemState, "file"> & {
  /** The file this item shows. */
  file: PickedFile
}

/**
 * The props of an item and its remove button.
 * @experimental
 */
type FileInputItemProps = {
  /** The file it shows. The list passes it to the items it renders. */
  file: PickedFile
}

type ViewProps<State> = Omit<PartProps<typeof View, State>, "children"> & {
  children?: React.ReactNode | ((state: State) => React.ReactNode)
}
type PressableProps<State> = PartProps<typeof Pressable, State>

const FileContext = carry(
  "FileInputFile",
  React.createContext<PickedFile | null>(null)
)

function useItemFile(part: string, own: PickedFile | undefined) {
  const listed = React.useContext(FileContext)
  const file = own ?? listed
  if (!file) {
    throw new Error(
      `${part} must be used inside <FileInputList>, or be given a file.`
    )
  }
  return file
}

// The remove buttons on screen, by file, so a removal can move focus to the next one.
const removers = new WeakMap<object, Map<string, Part>>()

/**
 * The root: it holds the files, and calls `pick` to add more.
 * @experimental
 */
function FileInput({
  value,
  defaultValue,
  onValueChange,
  onReject,
  accept,
  multiple,
  maxFiles,
  maxSize,
  minSize,
  validate,
  required,
  disabled,
  announcement,
  controller,
  pick,
  debug,
  ...props
}: FileInputOptions & ViewProps<FileInputState>) {
  const options = {
    value,
    defaultValue,
    onValueChange,
    onReject,
    accept,
    multiple,
    maxFiles,
    maxSize,
    minSize,
    validate,
    required,
    disabled,
    announcement,
    controller,
    pick,
    debug,
  }
  const handle = usePrimitive(fileInput, options as never)
  useControllerEntry(controller, handle)
  return usePart(handle, "root", {}, props as Record<string, unknown>, View)
}

const unconnectedState: FileInputState = {
  value: [],
  disabled: false,
  required: false,
  dragging: false,
}

/**
 * Calls the root's `pick`. Inside a Field, the field's label names it and a
 * press on the label calls `pick` too. Outside the file input, it connects
 * through `controller`.
 * @experimental
 */
function FileInputTrigger({
  controller,
  ...props
}: PressableProps<FileInputState> & { controller?: FileInputController }) {
  const handle = useControllerTarget(
    controller as never,
    useNearest(fileInput)
  )
  if (!handle) {
    const { render, ...rest } = props
    return renderElement(
      Pressable,
      { accessibilityRole: "button", ...rest },
      render as never,
      unconnectedState
    )
  }
  const part = <TriggerPart {...props} />
  return controller ? <HandleScope handle={handle}>{part}</HandleScope> : part
}

// Inside a Field, its label and the button's own text name it, as on the web.
function TriggerPart(props: PressableProps<FileInputState>) {
  const handle = useHandle(fileInput)
  const fallback = React.useId()
  const id = props.nativeID ?? fallback
  const field = React.useContext(FieldContext)
  const control = useFieldControl(
    { ...props, nativeID: id } as Record<string, unknown>,
    () => handle.api.open()
  )
  const named = field && !props["aria-label"] && !props["aria-labelledby"]
  useText(
    named ? id : undefined,
    typeof props.children === "function"
      ? undefined
      : plainText(props.children, true)
  )
  return usePart(
    fileInput,
    "trigger",
    {},
    named
      ? { ...control, "aria-labelledby": `${control["aria-labelledby"]} ${id}` }
      : control,
    Pressable
  )
}

/**
 * A `View` for the trigger and its surroundings. React Native has no file
 * drops or pastes, so it never shows `dragging`.
 * @experimental
 */
function FileInputDropzone(props: ViewProps<FileInputState>) {
  return usePart(
    fileInput,
    "dropzone",
    {},
    props as Record<string, unknown>,
    View
  )
}

/**
 * The files, as a list. Its children render once for each file, so put a
 * FileInputItem in it.
 * @experimental
 */
function FileInputList({
  children,
  ...props
}: Omit<ViewProps<FileInputState>, "children"> & {
  children?: React.ReactNode
}) {
  const items = (state: FileInputState) =>
    state.value.map((file) => (
      <FileContext.Provider key={fileKey(file)} value={file}>
        {children}
      </FileContext.Provider>
    ))
  return usePart(
    fileInput,
    "list",
    {},
    { ...props, children: items } as Record<string, unknown>,
    View
  )
}

/**
 * One file. Its render state has the file, for its name, size and preview.
 * @experimental
 */
function FileInputItem({
  file: own,
  ...props
}: ViewProps<FileInputItemState> & Partial<FileInputItemProps>) {
  const file = useItemFile("FileInputItem", own)
  const element = usePart(
    fileInput,
    "item",
    { file: file as unknown as File, value: fileKey(file) },
    props as Record<string, unknown>,
    View
  )
  return <FileContext.Provider value={file}>{element}</FileContext.Provider>
}

/**
 * Removes its item's file, or the `file` it's given, and moves focus to the
 * next file's remove button, else the one before, else the trigger. It's
 * named "Remove <file name>" unless you name it.
 * @experimental
 */
function FileInputItemRemove({
  file: own,
  ...props
}: PressableProps<FileInputItemRemoveState> & Partial<FileInputItemProps>) {
  const file = useItemFile("FileInputItemRemove", own)
  const handle = useHandle(fileInput)
  const key = fileKey(file)
  const slotProps = { file: file as unknown as File, value: key }
  const partRef = React.useRef<Part>(null)
  React.useLayoutEffect(() => {
    const part = partRef.current!
    let shown = removers.get(handle.api)
    if (!shown) {
      removers.set(handle.api, (shown = new Map()))
    }
    shown.set(key, part)
    return () => {
      if (shown.get(key) === part) {
        shown.delete(key)
      }
    }
  }, [handle, key])
  return usePressedPart(
    fileInput,
    "item-remove",
    slotProps,
    props as Record<string, unknown>,
    Pressable,
    (part) => {
      partRef.current = part
      return () => {
        const files = handle.api.getValue()
        const index = files.indexOf(slotProps.file)
        const neighbour = files[index + 1] ?? files[index - 1]
        press(part, slotProps)?.()
        const moveFocus = () => {
          if (handle.api.getValue().includes(slotProps.file)) {
            return
          }
          const next = neighbour && removers.get(handle.api)?.get(fileKey(neighbour))
          if (next) {
            nativeHost()?.focus(next)
          } else {
            handle.api.focus()
          }
        }
        queueMicrotask(moveFocus)
      }
    }
  )
}

export { formatFileSize } from "@ui-sdk/core/file-input"
export type {
  FileInputItemRemoveState,
  FileInputPrimitive,
  FileInputValueChangeReason,
  FileLike,
  FileRejection,
  FileRejectionReason,
  FileRules,
} from "@ui-sdk/core/file-input"

export {
  createFileInputController,
  FileInput,
  type FileInputChange,
  type FileInputChangeOptions,
  type FileInputController,
  FileInputDropzone,
  FileInputItem,
  type FileInputItemProps,
  type FileInputItemState,
  FileInputList,
  type FileInputOptions,
  type FileInputPickOptions,
  type FileInputState,
  FileInputTrigger,
  type PickedFile,
  FileInputItemRemove,
}
