import {
  avatar,
  type AvatarFallbackProps,
  type AvatarOptions,
  type AvatarState,
} from "@ui-sdk/core/avatar"
import * as React from "react"
import {
  Image,
  View,
  type ImageSourcePropType,
  type ImageStyle,
} from "react-native"
import { mergeProps, renderElement, type Interaction } from "./render-element"
import {
  useHandle,
  usePart,
  usePrimitive,
  type PartProps,
} from "./use-primitive"

type AvatarProps = PartProps<typeof View, AvatarState> & AvatarOptions

type AvatarImageProps = PartProps<typeof Image, AvatarState>

type AvatarFallbackPartProps = PartProps<typeof View, AvatarState> &
  AvatarFallbackProps

// Mounted so it loads, but out of sight and out of the layout until then.
const hiddenStyle: ImageStyle = { position: "absolute", opacity: 0 }

// A source by what it loads, so a new object for the same image starts nothing.
function sourceKey(source: ImageSourcePropType | null | undefined) {
  const sources = Array.isArray(source) ? source : [source]
  return sources
    .map((entry) => (typeof entry === "number" ? String(entry) : entry?.uri))
    .filter(Boolean)
    .join(" ")
}

/**
 * The root: a box for the image and its fallback.
 * @experimental
 */
function Avatar({ onLoadingStatusChange, debug, ...props }: AvatarProps) {
  const handle = usePrimitive(avatar, { onLoadingStatusChange, debug })
  React.useEffect(() => handle.api.internal.startDelay(), [handle])
  return usePart(handle, "root", {}, props, View)
}

/**
 * An `Image`, kept out of sight and out of the accessibility tree until it
 * loads. Its `alt` names the avatar then, with the image role.
 * @experimental
 */
function AvatarImage({ render, ref, ...props }: AvatarImageProps) {
  const handle = useHandle(avatar)
  const key = props.src || sourceKey(props.source)
  React.useLayoutEffect(() => {
    handle.api.internal.imageStatus(key ? "loading" : "error")
  }, [handle, key])
  // StrictMode and a remount unmount and mount again in the same task.
  const mounted = React.useRef(0)
  React.useLayoutEffect(() => {
    mounted.current++
    return () => {
      mounted.current--
      queueMicrotask(() => {
        if (!mounted.current) {
          handle.api.internal.imageStatus("idle")
        }
      })
    }
  }, [handle])
  return usePart(
    avatar,
    "image",
    {},
    {
      ...props,
      render: (
        image: Record<string, any>,
        state: AvatarState,
        interaction: Interaction
      ) => {
        const loaded = state.loadingStatus === "loaded"
        return renderElement(
          Image,
          mergeProps(
            {
              accessibilityRole: "image",
              accessibilityLabel: props.alt,
            },
            image,
            { ref },
            {
              accessible: loaded,
              style: loaded ? undefined : hiddenStyle,
              onLoad: () => handle.api.internal.imageStatus("loaded"),
              onError: () => handle.api.internal.imageStatus("error"),
            }
          ),
          render,
          state,
          interaction
        )
      },
    },
    Image
  )
}

/**
 * Shown while there's no loaded image, after its `delay`.
 * @experimental
 */
function AvatarFallback({ delay, ...props }: AvatarFallbackPartProps) {
  return usePart(avatar, "fallback", { delay }, props, View)
}

export type {
  AvatarFallbackProps,
  AvatarLoadingStatus,
  AvatarLoadingStatusChangeReason,
  AvatarOptions,
  AvatarPrimitive,
  AvatarState,
} from "@ui-sdk/core/avatar"

export { Avatar, AvatarFallback, AvatarImage }
