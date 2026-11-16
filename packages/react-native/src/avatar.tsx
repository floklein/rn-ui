import {
  avatar,
  type AvatarFallbackProps,
  type AvatarOptions,
  type AvatarState,
} from "@ui-sdk/core/avatar"
import * as React from "react"
import {
  Image,
  Platform,
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
function Avatar({ onLoadingStatusChange, debug, ref, ...props }: AvatarProps) {
  const handle = usePrimitive(avatar, { onLoadingStatusChange, debug })
  React.useEffect(() => handle.api.internal.startDelay(), [handle])
  return usePart(handle, "root", {}, mergeProps(props, { ref }), View)
}

/**
 * An `Image`, kept out of sight and out of the accessibility tree until it
 * loads. Its `alt` names the avatar then, with the image role; an empty or
 * missing `alt` leaves it decorative.
 * @experimental
 */
function AvatarImage({ render, ref, alt, ...props }: AvatarImageProps) {
  const handle = useHandle(avatar)
  const key = props.src || props.srcSet || sourceKey(props.source)
  React.useLayoutEffect(() => {
    handle.api.internal.reportImageStatus(key ? "loading" : "error")
  }, [handle, key])
  // StrictMode and a remount unmount and mount again in the same task.
  const mounted = React.useRef(0)
  React.useLayoutEffect(() => {
    mounted.current++
    return () => {
      mounted.current--
      queueMicrotask(() => {
        if (!mounted.current) {
          handle.api.internal.reportImageStatus("idle")
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
        // `Image` makes itself accessible for any `alt`, and on Android an
        // accessible image is a Tab stop, which a web image never is.
        return renderElement(
          Image,
          mergeProps(
            {
              accessibilityRole: "image",
              accessibilityLabel: alt || undefined,
              accessible: loaded && !!alt && Platform.OS === "ios",
            },
            image,
            { ref },
            {
              style: loaded ? undefined : hiddenStyle,
              // Android loads a blank placeholder for an image with no source.
              onLoad: key
                ? () => handle.api.internal.reportImageStatus("loaded")
                : undefined,
              onError: key
                ? () => handle.api.internal.reportImageStatus("error")
                : undefined,
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
function AvatarFallback({ delay, ref, ...props }: AvatarFallbackPartProps) {
  return usePart(
    avatar,
    "fallback",
    { delay },
    mergeProps(props, { ref }),
    View
  )
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
