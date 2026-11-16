import { ratingNative } from "@ui-sdk/core/native"
import {
  rating,
  ratingItemValues,
  type RatingController,
  type RatingItemState,
  type RatingOptions,
  type RatingState,
} from "@ui-sdk/core/rating"
import * as React from "react"
import { Pressable, View } from "react-native"
import { carry } from "./carried-context"
import type { Interaction } from "./render-element"
import { type PartProps, usePart, usePrimitive } from "./use-primitive"

const ItemContext = carry(
  "RatingItem",
  React.createContext<{ index: number; step: number } | null>(null)
)

/**
 * A score picked from a row of stars, a radio per star or half star. Its
 * children render once per star. Read only, it's one image named by its
 * score. It takes part in no form, so it has no `name`.
 * @experimental
 */
function Rating({
  value,
  defaultValue,
  onValueChange,
  max = 5,
  step = 1,
  deselectable,
  disabled,
  readOnly,
  required,
  loop,
  getValueLabel,
  controller,
  debug,
  children,
  ...props
}: Omit<RatingOptions, "name" | "form"> &
  Omit<PartProps<typeof View, RatingState>, "children"> & {
    children?: React.ReactNode
  }) {
  const control = usePrimitive(
    rating,
    {
      value,
      defaultValue,
      onValueChange,
      max,
      step,
      deselectable,
      disabled,
      readOnly,
      required,
      loop,
      getValueLabel,
      controller: controller as RatingController | undefined,
      debug,
    },
    ratingNative
  )
  const stars = Array.from({ length: max }, (_, at) => (
    <ItemContext key={at} value={{ index: at + 1, step }}>
      {children ?? <RatingItem />}
    </ItemContext>
  ))
  return usePart(
    control,
    "root",
    {},
    { ...(props as Record<string, unknown>), children: stars },
    View
  )
}

function RatingRadio({
  value,
  part,
  parts,
}: {
  value: number
  part: number
  parts: number
}) {
  return usePart(
    rating,
    "radio",
    { value: String(value) },
    {
      style: {
        position: "absolute",
        top: 0,
        bottom: 0,
        start: `${(part / parts) * 100}%`,
        width: `${100 / parts}%`,
      },
    },
    Pressable
  )
}

/**
 * One star, a `View`. Put its icon inside: the state says how full it is,
 * and the radios that pick its score sit over it.
 * @experimental
 */
function RatingItem({
  children,
  ...props
}: PartProps<typeof View, RatingItemState>) {
  const item = React.useContext(ItemContext)
  if (!item) {
    throw new Error("RatingItem must be used inside <Rating>.")
  }
  const values = ratingItemValues(item.index, item.step)
  const radios = values.map((score, part) => (
    <RatingRadio key={score} value={score} part={part} parts={values.length} />
  ))
  return usePart(
    rating,
    "item",
    { index: item.index },
    {
      ...(props as Record<string, unknown>),
      children: (state: RatingItemState, interaction: Interaction) => (
        <>
          {typeof children === "function"
            ? children(state, interaction)
            : children}
          {radios}
        </>
      ),
    },
    View
  )
}

export { createRatingController } from "@ui-sdk/core/rating"
export type {
  RatingApi,
  RatingChangeOptions,
  RatingController,
  RatingItemProps,
  RatingItemState,
  RatingOptions,
  RatingPrimitive,
  RatingState,
  RatingValueChangeReason,
} from "@ui-sdk/core/rating"

export { Rating, RatingItem }
