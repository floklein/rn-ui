import {
  imageCropper,
  type ImageCropperHandleProps,
  type ImageCropperHandleState,
  type ImageCropperOptions,
  type ImageCropperPrimitive,
  type ImageCropperState,
} from "@ui-sdk/core/image-cropper"
import { imageCropperNative, nativeImageCropper } from "@ui-sdk/core/native"
import { partState } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import { idle, mergeProps, withState } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ImageCropperParts = Parts<
  ImageCropperPrimitive,
  {
    grid: typeof View
    handle: typeof View
    rotate: typeof Pressable
    flip: typeof Pressable
  }
>

const parts: ImageCropperParts = createParts(imageCropper, {
  grid: View,
  handle: View,
  rotate: Pressable,
  flip: Pressable,
})

/**
 * The state `ImageCropper` and `ImageCropperViewport` hand their style, class
 * name, children and `render`.
 * @experimental
 */
type ImageCropperViewportState = ImageCropperState & {
  /** The image's width over its height as it shows, turned, for a viewport's `aspectRatio`; undefined until it loads. The web's `--image-cropper-aspect-ratio`. */
  imageAspectRatio: number | undefined
}

/**
 * The state `ImageCropperZoom` hands its style, class name, children and `render`.
 * @experimental
 */
type ImageCropperZoomState = ImageCropperState & {
  /** Where the zoom sits along the track, from 0 to 100, for a thumb's place. */
  zoomPosition: number
}

type Cropper = ReturnType<typeof nativeImageCropper>

const croppers = new WeakMap<object, Cropper>()

function cropperOf(api: PrimitiveHandle<ImageCropperPrimitive>["api"]) {
  let cropper = croppers.get(api)
  if (!cropper) {
    cropper = nativeImageCropper(api)
    croppers.set(api, cropper)
  }
  return cropper
}

// The slots' state leaves out the image's size, which the instance's holds.
const withRatio =
  (handle: PrimitiveHandle<ImageCropperPrimitive>) =>
  (_state: ImageCropperState) => ({
    imageAspectRatio: cropperOf(handle.api).aspectRatio(handle.state),
  })

/**
 * The root: a group around the image and its controls, busy until the image loads.
 * @experimental
 */
function ImageCropper({
  src,
  crop,
  defaultCrop,
  onCropChange,
  onCropCommit,
  mode,
  aspectRatio,
  shape,
  minWidth,
  minHeight,
  maxZoom,
  disabled,
  controller,
  debug,
  ...props
}: ImageCropperOptions & PartProps<typeof View, ImageCropperViewportState>) {
  const handle = usePrimitive(
    imageCropper,
    {
      src,
      crop,
      defaultCrop,
      onCropChange,
      onCropCommit,
      mode,
      aspectRatio,
      shape,
      minWidth,
      minHeight,
      maxZoom,
      disabled,
      controller,
      debug,
    },
    imageCropperNative
  )
  return usePart(
    handle,
    "root",
    {},
    {
      ...props,
      ...withState<ImageCropperState, { imageAspectRatio: number | undefined }>(
        props,
        withRatio(handle)
      ),
    } as Record<string, unknown>,
    View
  )
}

/**
 * The area the image shows in. Give it a size, or an `aspectRatio` from its
 * state's `imageAspectRatio`; its padding keeps the image off its edges. In
 * a frame, one finger pans the image and two pinch it.
 * @experimental
 */
function ImageCropperViewport({
  children,
  ...props
}: PartProps<typeof View, ImageCropperViewportState>) {
  const handle = useHandle(imageCropper)
  const cropper = cropperOf(handle.api)
  const measure = (event: LayoutChangeEvent) =>
    cropper.measure(event.nativeEvent.layout)
  const content = (inside: React.ReactNode) => (
    <View style={styles.content} onLayout={measure}>
      {inside}
    </View>
  )
  return usePart(
    imageCropper,
    "viewport",
    {},
    mergeProps(
      { style: styles.viewport },
      {
        ...props,
        ...withState<
          ImageCropperState,
          { imageAspectRatio: number | undefined }
        >(props, withRatio(handle)),
        children:
          typeof children === "function"
            ? (state: ImageCropperViewportState, interaction: never) =>
                content(children(state, interaction))
            : content(children),
      }
    ) as Record<string, unknown>,
    View
  )
}

/**
 * The image, from the root's `src`, turned and flipped. Give it an `alt`.
 * The crop is in the pixels `Image` reports once it loads.
 * @experimental
 */
function ImageCropperImage({
  alt,
  ...props
}: Omit<PartProps<typeof Image, ImageCropperState>, "source">) {
  const handle = useHandle(imageCropper)
  const cropper = cropperOf(handle.api)
  const { src } = handle.state as { src: string | undefined }
  const placed = cropper.place(handle.state)
  return usePart(
    imageCropper,
    "image",
    {},
    mergeProps(
      {
        source: src ? { uri: src } : undefined,
        role: alt ? "img" : undefined,
        "aria-label": alt || undefined,
        resizeMode: placed ? "stretch" : "contain",
        style: placed ? [styles.placed, placed.image] : StyleSheet.absoluteFill,
        // The size onLoad reports is the bitmap decoded for the view, which
        // iOS, and Android for local files, shrink below the file's pixels.
        onLoad: () =>
          src &&
          Image.getSize(
            src,
            (width, height) => cropper.load({ width, height }),
            () => cropper.fail()
          ),
        onError: () => cropper.fail(),
      },
      props
    ) as Record<string, unknown>,
    Image
  )
}

/**
 * The crop, one adjustable element: in a box a finger drags it, and a screen
 * reader's increment and decrement move it. Its children, like the grid and
 * the handles, are drawn over it, beside its own element, so each stays
 * reachable by a screen reader.
 * @experimental
 */
function ImageCropperSelection({
  children,
  ...props
}: PartProps<typeof View, ImageCropperState>) {
  const handle = useHandle(imageCropper)
  const placed = cropperOf(handle.api).place(handle.state)
  const box = placed && [styles.placed, placed.selection]
  const selection = usePart(
    imageCropper,
    "selection",
    {},
    mergeProps({ accessible: true, style: box }, props) as Record<
      string,
      unknown
    >,
    View
  )
  if (!selection || !box) {
    return selection
  }
  const state = partState(
    handle.instance.part("selection", {}),
    {}
  ) as ImageCropperState
  return (
    <>
      {selection}
      <View pointerEvents="box-none" style={box}>
        {typeof children === "function" ? children(state, idle) : children}
      </View>
    </>
  )
}

/**
 * Lines across the selection in thirds, drawn by its children, laid over the
 * whole selection; its state's `dragging` shows them only during a drag.
 * @experimental
 */
function ImageCropperGrid(props: PartProps<typeof View, ImageCropperState>) {
  return (
    <parts.Grid
      {...(mergeProps(
        { style: StyleSheet.absoluteFill, pointerEvents: "none" },
        props
      ) as PartProps<typeof View, ImageCropperState>)}
    />
  )
}

/**
 * An edge or corner of the selection, by its `position`, one adjustable
 * element: in a box a finger drags it, and a screen reader's increment
 * grows the crop from it. Place it with a style from its state's `position`.
 * @experimental
 */
function ImageCropperHandle({
  position,
  ...props
}: PartProps<typeof View, ImageCropperHandleState> & ImageCropperHandleProps) {
  return (
    <parts.Handle
      position={position}
      {...(mergeProps({ accessible: true }, props) as PartProps<
        typeof View,
        ImageCropperHandleState
      >)}
    />
  )
}

/**
 * A track for the zoom, from 1 to `maxZoom`, one adjustable element: a touch
 * zooms there and a drag follows it, and a screen reader's increment and
 * decrement step it a tenth of the way. Place a thumb inside it from its
 * state's `zoomPosition`.
 * @experimental
 */
function ImageCropperZoom(
  props: PartProps<typeof View, ImageCropperZoomState>
) {
  const handle = useHandle(imageCropper)
  const cropper = cropperOf(handle.api)
  return usePart(
    imageCropper,
    "zoom",
    {},
    mergeProps(
      {
        accessible: true,
        "aria-valuenow": String(handle.api.getZoom()),
      },
      {
        ...props,
        ...withState<ImageCropperState, { zoomPosition: number }>(
          props,
          () => ({ zoomPosition: cropper.zoomPosition(handle.state) })
        ),
      }
    ) as Record<string, unknown>,
    View
  )
}

/**
 * A button that turns the image a quarter clockwise.
 * @experimental
 */
const ImageCropperRotate: ImageCropperParts["Rotate"] = parts.Rotate

/**
 * A button that mirrors the image, left to right or, with `direction="vertical"`, top to bottom.
 * @experimental
 */
const ImageCropperFlip: ImageCropperParts["Flip"] = parts.Flip

const styles = StyleSheet.create({
  viewport: { overflow: "hidden" },
  // The crop is physical, as on the web: right to left would swap left for start.
  content: { flex: 1, alignSelf: "stretch", direction: "ltr" },
  placed: { position: "absolute" },
})

export { createImageCropperController } from "@ui-sdk/core/image-cropper"
export type { ImageCropperViewportState, ImageCropperZoomState }
export type {
  ImageCrop,
  ImageCropperApi,
  ImageCropperChangeOptions,
  ImageCropperController,
  ImageCropperCropChangeDetails,
  ImageCropperCropChangeReason,
  ImageCropperCropCommitDetails,
  ImageCropperFlipDirection,
  ImageCropperFlipProps,
  ImageCropperHandlePosition,
  ImageCropperHandleProps,
  ImageCropperHandleState,
  ImageCropperMode,
  ImageCropperOptions,
  ImageCropperPrimitive,
  ImageCropperShape,
  ImageCropperState,
  ImageRotation,
} from "@ui-sdk/core/image-cropper"

export {
  ImageCropper,
  ImageCropperFlip,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRotate,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
}
