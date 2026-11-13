<script lang="ts">
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
  } from "@ui-sdk/svelte"
  import { onItemsChange } from "tests/fixtures/items.ts"
  import {
    changedItems,
    longItems,
    selectFixture as f,
    selectOptions,
    serializeForm,
  } from "tests/fixtures/select.ts"

  let { data = false }: { data?: boolean } = $props()

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
  const fromData = $derived(data || long || recent)
  let action = $state("")
  let submitted = $state("")
  let list = $state.raw<{ value: string; label: string; disabled?: boolean }[]>(
    f.items
  )
  // Items a spec swaps in. Only in the browser: the server has no document.
  $effect(() => onItemsChange(changedItems, (next) => (list = next)))
  const items = $derived(
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
        : list
  )
  // A data entry's key: its value, a group's label, or a separator's place.
  const keyOf = (entry: ListData[number], index: number) =>
    typeof entry === "string"
      ? entry
      : "value" in entry
        ? entry.value
        : entry.type === "group"
          ? `group-${entry.label ?? index}`
          : `separator-${index}`

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
  const listed = $derived<Listed[]>(
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
      : list.map((item) => ({ type: "item", key: item.value, ...item }))
  )

  function onValueChange(value: unknown, details: { cancel: () => void }) {
    if (cancel) {
      return details.cancel()
    }
    action = `value:${Array.isArray(value) ? value.join(",") : String(value)}`
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    submitted = serializeForm(event.target as HTMLFormElement)
  }
</script>

{#snippet item(value: string, label: string, disabled?: boolean)}
  <SelectItem class="item" {value} {disabled}>
    <SelectItemText>{label}</SelectItemText>
    <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
  </SelectItem>
{/snippet}

<!-- The list's data, rendered like the composed list: items with their check, groups with their labels, and separators. -->
{#snippet dataItems(entries: ListData)}
  {#each entries as entry, index (keyOf(entry, index))}
    {#if typeof entry === "string"}
      {@render item(entry, entry)}
    {:else if "value" in entry}
      {@render item(entry.value, entry.label, entry.disabled)}
    {:else if entry.type === "separator"}
      <SelectSeparator class="separator" />
    {:else}
      <SelectGroup>
        <SelectGroupLabel class="label">{entry.label}</SelectGroupLabel>
        {@render dataItems(entry.items)}
      </SelectGroup>
    {/if}
  {/each}
{/snippet}

{#snippet composed()}
  {#each listed as item (item.key)}
    {#if item.type === "separator"}
      <SelectSeparator class="separator" />
    {:else if item.type === "group"}
      <SelectGroup>
        <SelectGroupLabel class="label">{item.label}</SelectGroupLabel>
        {#if selectAll}<SelectSelectAll class="item"
            >{f.selectAll} {item.label}</SelectSelectAll
          >{/if}
        {#each item.items as child (child.value)}
          <SelectItem class="item" value={child.value}>
            <SelectItemText>{child.label}</SelectItemText>
            <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
          </SelectItem>
        {/each}
      </SelectGroup>
    {:else}
      <SelectItem class="item" value={item.value} disabled={item.disabled}>
        <SelectItemText>{item.label}</SelectItemText>
        <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
      </SelectItem>
    {/if}
  {/each}
{/snippet}

<div class="fixture">
  <button>Before</button>
  <form class="select-form" aria-label={f.formLabel} onsubmit={onSubmit}>
    <svelte:element
      this={fieldset ? "fieldset" : "div"}
      disabled={fieldset || undefined}
      style="display: contents"
    >
      {#if field}
        <Field>
          <FieldLabel class="label">{f.label}</FieldLabel>
          <SelectTrigger class="trigger" {controller}>
            <SelectValue class="value" maxLabels={max} />
            <span aria-hidden="true">▾</span>
          </SelectTrigger>
        </Field>
      {/if}
      <Select
        {...options}
        name={f.name}
        placeholder={f.placeholder}
        {controller}
        {container}
        items={fromData ? items : undefined}
        emptyItems={recent ? f.recent : undefined}
        {onValueChange}
      >
        {#if !field}
          <SelectLabel class="label">{f.label}</SelectLabel>
          <SelectTrigger class="trigger">
            <SelectValue class="value" maxLabels={max} />
            <span aria-hidden="true">▾</span>
          </SelectTrigger>
        {/if}
        <SelectClear>{f.clear}</SelectClear>
        {#if search}
          <SelectContent class="popup list-popup" alignItemWithTrigger={align}>
            <SelectInput class="input" aria-label={f.search} />
            <SelectEmpty class="empty">{f.empty}</SelectEmpty>
            <SelectList>
              {#snippet children(state)}
                {#if selectAll && !grouped}<SelectSelectAll class="item"
                    >{f.selectAll}</SelectSelectAll
                  >{/if}
                {#if fromData}
                  {@render dataItems(state.items as ListData)}
                {:else}
                  {@render composed()}
                {/if}
              {/snippet}
            </SelectList>
          </SelectContent>
        {:else if fromData}
          <SelectContent class="popup list-popup">
            {#snippet children(state)}
              {#if selectAll}<SelectSelectAll class="item"
                  >{f.selectAll}</SelectSelectAll
                >{/if}
              {@render dataItems(state.items as ListData)}
            {/snippet}
          </SelectContent>
        {:else if !fromData}
          <SelectContent class="popup list-popup" alignItemWithTrigger={align}>
            {#if selectAll && !grouped}<SelectSelectAll class="item"
                >{f.selectAll}</SelectSelectAll
              >{/if}
            {@render composed()}
          </SelectContent>
        {/if}
      </Select>
    </svelte:element>
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </form>
  <button>After</button>
  <output role="status" aria-label="Last action">{action}</output>
  <output role="status" aria-label="Submitted">{submitted}</output>
  <button onclick={() => controller.open()}>Open with controller</button>
</div>
