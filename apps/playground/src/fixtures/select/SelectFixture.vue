<script setup lang="ts">
import { createSelectController } from "@ui-sdk/core/select"
import {
  Field,
  FieldLabel,
  Select,
  SelectClear,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectList,
  SelectSelectAll,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type ListData,
} from "@ui-sdk/vue"
import { onItemsChange } from "tests/fixtures/items.ts"
import {
  changedItems,
  longItems,
  selectFixture as f,
  selectOptions,
  serializeForm,
} from "tests/fixtures/select.ts"
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type FunctionalComponent,
} from "vue"

const props = defineProps<{ data?: boolean }>()
const controller = createSelectController<string, boolean>()
const {
  fieldset,
  field,
  grouped,
  cancel,
  align,
  long,
  container,
  search,
  selectAll,
  recent,
  max,
  ...options
} = selectOptions()
// ?wrapped renders the data list through a content part wrapped in a
// component of the app's own, as a styled layer does. The select renders it
// and no list of its own.
const wrapped = new URLSearchParams(location.search).has("wrapped")
const StyledContent = defineComponent(
  () => () => h(SelectContent, { class: "popup list-popup" })
)
const fromData = props.data || long || recent || wrapped
const action = ref("")
const submitted = ref("")
const list = shallowRef<{ value: string; label: string; disabled?: boolean }[]>(
  f.items
)
// Items a spec swaps in. Only in the browser: the server has no document.
let stopItemChanges = () => {}
onMounted(
  () =>
    (stopItemChanges = onItemsChange(
      changedItems,
      (next) => (list.value = next)
    ))
)
onBeforeUnmount(() => stopItemChanges())
const items = computed(() =>
  long
    ? longItems()
    : grouped
      ? [
          {
            type: "group" as const,
            label: f.groups[0].label,
            items: f.groups[0].items,
          },
          { type: "separator" as const },
          {
            type: "group" as const,
            label: f.groups[1].label,
            items: f.groups[1].items,
          },
        ]
      : list.value
)

// The list's data, rendered like the composed list: items with their check, groups with their
// labels, and separators.
const DataItems: FunctionalComponent<{ items: ListData }> = ({ items }) =>
  items.map((entry, index) => {
    if (typeof entry === "string") {
      return dataItem(entry, entry)
    }
    if ("value" in entry) {
      return dataItem(entry.value, entry.label, entry.disabled)
    }
    if (entry.type === "separator") {
      return h(SelectSeparator, {
        key: `separator-${index}`,
        class: "separator",
      })
    }
    return h(SelectGroup, { key: entry.label }, () => [
      h(SelectGroupLabel, { class: "label" }, () => entry.label),
      h(DataItems, { items: entry.items }),
    ])
  })
const dataItem = (value: string, label: string, disabled?: boolean) =>
  h(SelectItem, { key: value, class: "item", value, disabled }, () => [
    h(SelectItemText, null, () => label),
    h(SelectItemIndicator, { class: "indicator" }, () => "✓"),
  ])

// What the composed list holds, in order: the items, or groups with a separator between.
type Listed =
  | {
      type: "item"
      key: string
      value: string
      label: string
      disabled?: boolean
    }
  | {
      type: "group"
      key: string
      label: string
      items: { value: string; label: string }[]
    }
  | { type: "separator"; key: string }
const listed = computed((): Listed[] =>
  grouped
    ? f.groups.flatMap((group, index): Listed[] => [
        ...(index
          ? [{ type: "separator" as const, key: `separator-${index}` }]
          : []),
        {
          type: "group",
          key: group.label,
          label: group.label,
          items: group.items,
        },
      ])
    : list.value.map((item) => ({ type: "item", key: item.value, ...item }))
)

function onValueChange(value: unknown, details: { cancel: () => void }) {
  if (cancel) {
    return details.cancel()
  }
  action.value = `value:${Array.isArray(value) ? value.join(",") : String(value)}`
}

function onSubmit(event: Event) {
  submitted.value = serializeForm(event.target as HTMLFormElement)
}
</script>

<template>
  <div class="fixture">
    <button>Before</button>
    <form
      class="select-form"
      :aria-label="f.formLabel"
      @submit.prevent="onSubmit"
    >
      <component
        :is="fieldset ? 'fieldset' : 'div'"
        :disabled="fieldset || undefined"
        style="display: contents"
      >
        <Field v-if="field">
          <FieldLabel class="label">{{ f.label }}</FieldLabel>
          <SelectTrigger class="trigger" :controller="controller">
            <SelectValue class="value" :max-labels="max" />
            <span aria-hidden="true">▾</span>
          </SelectTrigger>
        </Field>
        <Select
          v-bind="options"
          :name="f.name"
          :placeholder="f.placeholder"
          :controller="controller"
          :container="container"
          :items="fromData ? items : undefined"
          :empty-items="recent ? f.recent : undefined"
          @value-change="onValueChange"
        >
          <template v-if="!field">
            <SelectLabel class="label">{{ f.label }}</SelectLabel>
            <SelectTrigger class="trigger">
              <SelectValue class="value" :max-labels="max" />
              <span aria-hidden="true">▾</span>
            </SelectTrigger>
          </template>
          <SelectClear>{{ f.clear }}</SelectClear>
          <StyledContent v-if="wrapped" />
          <SelectContent
            v-else-if="search"
            class="popup list-popup"
            :align-item-with-trigger="align"
          >
            <SelectInput class="input" :aria-label="f.search" />
            <SelectEmpty class="empty">{{ f.empty }}</SelectEmpty>
            <SelectList v-slot="{ state }">
              <SelectSelectAll v-if="selectAll && !grouped" class="item">{{
                f.selectAll
              }}</SelectSelectAll>
              <DataItems v-if="fromData" :items="state.items as ListData" />
              <template v-else>
                <template v-for="item in listed" :key="item.key">
                  <SelectSeparator
                    v-if="item.type === 'separator'"
                    class="separator"
                  />
                  <SelectGroup v-else-if="item.type === 'group'">
                    <SelectGroupLabel class="label">{{
                      item.label
                    }}</SelectGroupLabel>
                    <SelectSelectAll v-if="selectAll" class="item"
                      >{{ f.selectAll }} {{ item.label }}</SelectSelectAll
                    >
                    <SelectItem
                      v-for="child in item.items"
                      :key="child.value"
                      class="item"
                      :value="child.value"
                    >
                      <SelectItemText>{{ child.label }}</SelectItemText>
                      <SelectItemIndicator class="indicator"
                        >✓</SelectItemIndicator
                      >
                    </SelectItem>
                  </SelectGroup>
                  <SelectItem
                    v-else
                    class="item"
                    :value="item.value"
                    :disabled="item.disabled"
                  >
                    <SelectItemText>{{ item.label }}</SelectItemText>
                    <SelectItemIndicator class="indicator"
                      >✓</SelectItemIndicator
                    >
                  </SelectItem>
                </template>
              </template>
            </SelectList>
          </SelectContent>
          <SelectContent
            v-else-if="fromData"
            v-slot="{ state }"
            class="popup list-popup"
          >
            <SelectSelectAll v-if="selectAll" class="item">{{
              f.selectAll
            }}</SelectSelectAll>
            <DataItems :items="state.items as ListData" />
          </SelectContent>
          <SelectContent
            v-else-if="!fromData"
            class="popup list-popup"
            :align-item-with-trigger="align"
          >
            <SelectSelectAll v-if="selectAll && !grouped" class="item">{{
              f.selectAll
            }}</SelectSelectAll>
            <template v-for="item in listed" :key="item.key">
              <SelectSeparator
                v-if="item.type === 'separator'"
                class="separator"
              />
              <SelectGroup v-else-if="item.type === 'group'">
                <SelectGroupLabel class="label">{{
                  item.label
                }}</SelectGroupLabel>
                <SelectSelectAll v-if="selectAll" class="item"
                  >{{ f.selectAll }} {{ item.label }}</SelectSelectAll
                >
                <SelectItem
                  v-for="child in item.items"
                  :key="child.value"
                  class="item"
                  :value="child.value"
                >
                  <SelectItemText>{{ child.label }}</SelectItemText>
                  <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
                </SelectItem>
              </SelectGroup>
              <SelectItem
                v-else
                class="item"
                :value="item.value"
                :disabled="item.disabled"
              >
                <SelectItemText>{{ item.label }}</SelectItemText>
                <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
              </SelectItem>
            </template>
          </SelectContent>
        </Select>
      </component>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
    <button>After</button>
    <output role="status" aria-label="Last action">{{ action }}</output>
    <output role="status" aria-label="Submitted">{{ submitted }}</output>
    <button @click="controller.open()">Open with controller</button>
  </div>
</template>
