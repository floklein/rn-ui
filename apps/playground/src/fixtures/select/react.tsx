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
} from "@ui-sdk/react/select"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import * as React from "react"
import { createRoot } from "react-dom/client"
import { onItemsChange } from "tests/fixtures/items.ts"
import {
  changedItems,
  longItems,
  selectFixture as f,
  selectOptions,
  serializeForm,
} from "tests/fixtures/select.ts"

const controller = createSelectController<string, boolean>()

function Item({
  value,
  label,
  disabled,
}: {
  value: string
  label: string
  disabled?: boolean
}) {
  return (
    <SelectItem className="item" value={value} disabled={disabled}>
      <SelectItemText>{label}</SelectItemText>
      <SelectItemIndicator className="indicator">✓</SelectItemIndicator>
    </SelectItem>
  )
}

// The list's data, rendered like the composed list: items with their check, groups with their
// labels, and separators.
function DataItems({ items }: { items: ListData }) {
  return items.map((entry, index) => {
    if (typeof entry === "string") {
      return <Item key={entry} value={entry} label={entry} />
    }
    if ("value" in entry) {
      return <Item key={entry.value} {...entry} />
    }
    if (entry.type === "separator") {
      return (
        <SelectSeparator key={`separator-${index}`} className="separator" />
      )
    }
    return (
      <SelectGroup key={entry.label}>
        <SelectGroupLabel className="label">{entry.label}</SelectGroupLabel>
        <DataItems items={entry.items} />
      </SelectGroup>
    )
  })
}

// What the list holds: the items, grouped with ?grouped, each group with its own select-all option.
// Called rather than rendered as a component, so the items are among the
// select's children, where the server finds the selected one's label.
function renderItems({
  list,
  grouped,
  selectAll,
}: {
  list: { value: string; label: string; disabled?: boolean }[]
  grouped: boolean
  selectAll: boolean
}) {
  if (!grouped) {
    return list.map((item) => <Item key={item.value} {...item} />)
  }
  return f.groups.map((group, index) => (
    <React.Fragment key={group.label}>
      {index > 0 && <SelectSeparator className="separator" />}
      <SelectGroup>
        <SelectGroupLabel className="label">{group.label}</SelectGroupLabel>
        {selectAll && (
          <SelectSelectAll className="item">
            {f.selectAll} {group.label}
          </SelectSelectAll>
        )}
        {group.items.map((item) => (
          <Item key={item.value} {...item} />
        ))}
      </SelectGroup>
    </React.Fragment>
  ))
}

// ?wrapped renders the data list through a content part wrapped in a
// component of the app's own, as a styled layer does. The select renders it
// and no list of its own.
function StyledContent() {
  return <SelectContent className="popup list-popup" />
}

function Fixture({ data = false }: { data?: boolean }) {
  const wrapped = new URLSearchParams(location.search).has("wrapped")
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
  const [action, setAction] = React.useState("")
  const [submitted, setSubmitted] = React.useState("")
  const [list, setList] = React.useState<
    { value: string; label: string; disabled?: boolean }[]
  >(f.items)
  React.useEffect(() => onItemsChange(changedItems, setList), [])
  const items = long
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
  return (
    <div className="fixture">
      <button>Before</button>
      <form
        className="select-form"
        aria-label={f.formLabel}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(serializeForm(event.currentTarget))
        }}
      >
        <Wrap fieldset={fieldset}>
          {field && (
            <Field>
              <FieldLabel className="label">{f.label}</FieldLabel>
              <SelectTrigger className="trigger" controller={controller}>
                <SelectValue className="value" maxLabels={max} />
                <span aria-hidden="true">▾</span>
              </SelectTrigger>
            </Field>
          )}
          <Select<string, boolean>
            {...options}
            name={f.name}
            placeholder={f.placeholder}
            controller={controller}
            container={container}
            items={data || long || recent || wrapped ? items : undefined}
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
            {!field && (
              <>
                <SelectLabel className="label">{f.label}</SelectLabel>
                <SelectTrigger className="trigger">
                  <SelectValue className="value" maxLabels={max} />
                  <span aria-hidden="true">▾</span>
                </SelectTrigger>
              </>
            )}
            <SelectClear>{f.clear}</SelectClear>
            {wrapped ? (
              <StyledContent />
            ) : search ? (
              <SelectContent
                className="popup list-popup"
                alignItemWithTrigger={align}
              >
                <SelectInput className="input" aria-label={f.search} />
                <SelectEmpty className="empty">{f.empty}</SelectEmpty>
                <SelectList>
                  {(state) => (
                    <>
                      {selectAll && !grouped && (
                        <SelectSelectAll className="item">
                          {f.selectAll}
                        </SelectSelectAll>
                      )}
                      {data || long || recent ? (
                        <DataItems items={state.items as ListData} />
                      ) : (
                        renderItems({ list, grouped, selectAll })
                      )}
                    </>
                  )}
                </SelectList>
              </SelectContent>
            ) : data || long || recent ? (
              <SelectContent className="popup list-popup">
                {(state) => (
                  <>
                    {selectAll && (
                      <SelectSelectAll className="item">
                        {f.selectAll}
                      </SelectSelectAll>
                    )}
                    <DataItems items={state.items as ListData} />
                  </>
                )}
              </SelectContent>
            ) : (
              <SelectContent
                className="popup list-popup"
                alignItemWithTrigger={align}
              >
                {selectAll && !grouped && (
                  <SelectSelectAll className="item">
                    {f.selectAll}
                  </SelectSelectAll>
                )}
                {renderItems({ list, grouped, selectAll })}
              </SelectContent>
            )}
          </Select>
        </Wrap>
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
      <button>After</button>
      <output role="status" aria-label="Last action">
        {action}
      </output>
      <output role="status" aria-label="Submitted">
        {submitted}
      </output>
      <button onClick={() => controller.open()}>Open with controller</button>
    </div>
  )
}

function mount(root: HTMLElement) {
  createRoot(root).render(
    <React.StrictMode>
      <Fixture />
    </React.StrictMode>
  )
}

// A disabled fieldset around the control, with ?fieldset.
function Wrap({
  fieldset,
  children,
}: {
  fieldset: boolean
  children: React.ReactNode
}) {
  return fieldset ? <fieldset disabled>{children}</fieldset> : <>{children}</>
}

export { Fixture, mount }
