import { createSelectController } from "@ui-sdk/core/select"
import {
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
} from "@ui-sdk/solid/select"
import { Field, FieldLabel } from "@ui-sdk/solid/field"
import { render } from "@solidjs/web"
import type { JSX } from "@solidjs/web"
import { createEffect, createSignal, For, Show } from "solid-js"
import { onItemsChange } from "tests/fixtures/items.ts"
import {
  changedItems,
  longItems,
  selectFixture as f,
  selectOptions,
  serializeForm,
} from "tests/fixtures/select.ts"

const controller = createSelectController<string, boolean>()

type Item = { value: string; label: string; disabled?: boolean }

function Item(props: Item) {
  return (
    <SelectItem class="item" value={props.value} disabled={props.disabled}>
      <SelectItemText>{props.label}</SelectItemText>
      <SelectItemIndicator class="indicator">✓</SelectItemIndicator>
    </SelectItem>
  )
}

// The list's data, rendered like the composed list: items with their check, groups with their
// labels, and separators.
function DataItems(props: { items: ListData }) {
  return (
    <For each={props.items}>
      {(entry) => {
        if (typeof entry === "string") {
          return <Item value={entry} label={entry} />
        }
        if ("value" in entry) {
          return <Item {...entry} />
        }
        if (entry.type === "separator") {
          return <SelectSeparator class="separator" />
        }
        return (
          <SelectGroup>
            <SelectGroupLabel class="label">{entry.label}</SelectGroupLabel>
            <DataItems items={entry.items} />
          </SelectGroup>
        )
      }}
    </For>
  )
}

// What the list holds: the items, grouped with ?grouped, each group with its own select-all option.
function Items(props: { list: Item[]; grouped: boolean; selectAll: boolean }) {
  return (
    <Show
      when={props.grouped}
      fallback={
        // Keyed by value, so replaced items that stay keep their elements, like a React key.
        <For each={props.list} keyed={(item) => item.value}>
          {(item) => <Item {...item()} />}
        </For>
      }
    >
      <For each={f.groups}>
        {(group, index) => (
          <>
            <Show when={index() > 0}>
              <SelectSeparator class="separator" />
            </Show>
            <SelectGroup>
              <SelectGroupLabel class="label">{group.label}</SelectGroupLabel>
              <Show when={props.selectAll}>
                <SelectSelectAll class="item">
                  {f.selectAll} {group.label}
                </SelectSelectAll>
              </Show>
              <For each={group.items}>{(item) => <Item {...item} />}</For>
            </SelectGroup>
          </>
        )}
      </For>
    </Show>
  )
}

function Fixture(props: { data?: boolean }) {
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
  const [action, setAction] = createSignal("")
  const [submitted, setSubmitted] = createSignal("")
  const [list, setList] = createSignal<Item[]>(f.items)
  // Listens on the client only, in an effect: the server has no document.
  createEffect(
    () => 0,
    () => onItemsChange(changedItems, setList)
  )
  const data = () => props.data || long || recent
  const items = () =>
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
        : list()
  const composed = (): JSX.Element => (
    <Show
      when={data()}
      fallback={<Items list={list()} grouped={grouped} selectAll={selectAll} />}
    >
      <DataItems items={items()} />
    </Show>
  )
  return (
    <div class="fixture">
      <button>Before</button>
      <form
        class="select-form"
        aria-label={f.formLabel}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(serializeForm(event.currentTarget))
        }}
      >
        <Wrap fieldset={fieldset}>
          <Show when={field}>
            <Field>
              <FieldLabel class="label">{f.label}</FieldLabel>
              <SelectTrigger class="trigger" controller={controller}>
                <SelectValue class="value" maxLabels={max} />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
            </Field>
          </Show>
          <Select<string, boolean>
            {...options}
            name={f.name}
            placeholder={f.placeholder}
            controller={controller}
            container={container}
            items={data() ? items() : undefined}
            emptyItems={recent ? f.recent : undefined}
            onValueChange={(value, details) => {
              if (cancel) {
                return details.cancel()
              }
              setAction(
                `value:${Array.isArray(value) ? value.join(",") : String(value)}`
              )
            }}
          >
            <Show when={!field}>
              <SelectLabel class="label">{f.label}</SelectLabel>
              <SelectTrigger class="trigger">
                <SelectValue class="value" maxLabels={max} />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
            </Show>
            <SelectClear>{f.clear}</SelectClear>
            <Show
              when={search}
              fallback={
                <Show
                  when={data()}
                  fallback={
                    <SelectContent
                      class="popup list-popup"
                      alignItemWithTrigger={align}
                    >
                      <Show when={selectAll && !grouped}>
                        <SelectSelectAll class="item">
                          {f.selectAll}
                        </SelectSelectAll>
                      </Show>
                      <Items
                        list={list()}
                        grouped={grouped}
                        selectAll={selectAll}
                      />
                    </SelectContent>
                  }
                >
                  <SelectContent class="popup list-popup">
                    {(state) => (
                      <>
                        <Show when={selectAll}>
                          <SelectSelectAll class="item">
                            {f.selectAll}
                          </SelectSelectAll>
                        </Show>
                        <DataItems items={state.items as ListData} />
                      </>
                    )}
                  </SelectContent>
                </Show>
              }
            >
              <SelectContent
                class="popup list-popup"
                alignItemWithTrigger={align}
              >
                <SelectInput class="input" aria-label={f.search} />
                <SelectEmpty class="empty">{f.empty}</SelectEmpty>
                <SelectList>
                  {(state) => (
                    <>
                      <Show when={selectAll && !grouped}>
                        <SelectSelectAll class="item">
                          {f.selectAll}
                        </SelectSelectAll>
                      </Show>
                      <Show when={data()} fallback={composed()}>
                        <DataItems items={state.items as ListData} />
                      </Show>
                    </>
                  )}
                </SelectList>
              </SelectContent>
            </Show>
          </Select>
        </Wrap>
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
      <button>After</button>
      <output role="status" aria-label="Last action">
        {action()}
      </output>
      <output role="status" aria-label="Submitted">
        {submitted()}
      </output>
      <button onClick={() => controller.open()}>Open with controller</button>
    </div>
  )
}

function mount(root: HTMLElement) {
  render(() => <Fixture />, root)
}

// A disabled fieldset around the control, with ?fieldset.
function Wrap(props: { fieldset: boolean; children: JSX.Element }) {
  return (
    <Show when={props.fieldset} fallback={props.children}>
      <fieldset disabled>{props.children}</fieldset>
    </Show>
  )
}

export { Fixture, mount }
