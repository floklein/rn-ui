import {
  pagination,
  type PaginationLinkProps,
  type PaginationLinkState,
  type PaginationPrimitive,
  type PaginationStepState,
} from "@ui-sdk/core/pagination"
import { Pressable, Text, View } from "react-native"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
} from "./use-primitive"

type PaginationParts = Parts<
  PaginationPrimitive,
  { root: typeof View; list: typeof View; item: typeof View }
>

const parts: PaginationParts = createParts(pagination, {
  root: View,
  list: View,
  item: View,
})

/**
 * A `View` around the page buttons. Name it with `aria-label`.
 * @experimental
 */
const Pagination: PaginationParts["Root"] = parts.Root

/**
 * The list of pages and steps, in a `View`. Its children can be a function of
 * the state, whose `items` are the pages to show.
 * @experimental
 */
const PaginationList: PaginationParts["List"] = parts.List

/**
 * One entry in the list, around a page, a step or an ellipsis.
 * @experimental
 */
const PaginationItem: PaginationParts["Item"] = parts.Item

/**
 * A page: a `Pressable` with the button role. The current one is selected.
 * Shows its number in a `Text` unless it has children.
 * @experimental
 */
function PaginationLink({
  page,
  children = <Text>{page}</Text>,
  ...props
}: PartProps<typeof Pressable, PaginationLinkState> & PaginationLinkProps) {
  // Links are told apart by their page.
  return usePart(
    pagination,
    "link",
    { page, id: String(page) },
    { ...(props as Record<string, unknown>), children },
    Pressable
  )
}

type StepProps = PartProps<typeof Pressable, PaginationStepState>

function useStep(
  name: "previous" | "next" | "first" | "last",
  props: StepProps
) {
  return usePart(
    pagination,
    name,
    {},
    props as Record<string, unknown>,
    Pressable
  )
}

/**
 * Goes to the previous page. Disabled on the first page, where screen readers
 * still reach it.
 * @experimental
 */
function PaginationPrevious(props: StepProps) {
  return useStep("previous", props)
}

/**
 * Goes to the next page. Disabled on the last page, where screen readers
 * still reach it.
 * @experimental
 */
function PaginationNext(props: StepProps) {
  return useStep("next", props)
}

/**
 * Goes to the first page. Disabled there.
 * @experimental
 */
function PaginationFirst(props: StepProps) {
  return useStep("first", props)
}

/**
 * Goes to the last page. Disabled there.
 * @experimental
 */
function PaginationLast(props: StepProps) {
  return useStep("last", props)
}

/**
 * A gap in the range: a `Text` screen readers skip, since the pages around it
 * say which pages there are. Shows "…" unless it has children.
 * @experimental
 */
function PaginationEllipsis({
  children = "…",
  ...props
}: PartProps<typeof Text>) {
  return usePart(
    pagination,
    "ellipsis",
    {},
    { ...(props as Record<string, unknown>), children },
    Text
  )
}

export {
  createPaginationController,
  paginationRange,
} from "@ui-sdk/core/pagination"
export type {
  PaginationChangeOptions,
  PaginationController,
  PaginationLinkProps,
  PaginationLinkState,
  PaginationOptions,
  PaginationPageChangeReason,
  PaginationPrimitive,
  PaginationRangeItem,
  PaginationRangeOptions,
  PaginationState,
  PaginationStepState,
} from "@ui-sdk/core/pagination"

export {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
}
