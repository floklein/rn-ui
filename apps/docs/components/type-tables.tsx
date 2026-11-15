import type { Framework } from "@/lib/frameworks"
import {
  controllerRows,
  reasonRows,
  stateRows,
  typeRows,
  type Row,
} from "@/lib/reference-rows"
import { partStateRows } from "@/lib/part-state"
import { Frame } from "./frame"

// API reference tables, from rows generated from the core's exported types.

// Turns `backticks` into code, the way the rest of the docs read.
function Text({ children }: { children: string }) {
  return children.split(/(`[^`]+`)/).map((part, index) =>
    part.startsWith("`") ? (
      <code
        key={index}
        className="rounded-md bg-foreground/[0.055] px-[0.3em] py-[0.1em] font-mono text-[0.875em] text-foreground"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  )
}

// One row per field: the name and its type on a line, what it does under them.
function Rows({ rows, label }: { rows: Row[]; label: string }) {
  return (
    <Frame variant="flat" className="my-6 overflow-hidden">
      <dl aria-label={label} className="divide-y divide-border/60 text-sm">
        {rows.map((row) => (
          <div key={row.name} className="flex flex-col gap-1.5 px-4 py-3">
            <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <code className="font-mono text-[14px] font-medium text-foreground sm:text-[13px]">
                {row.name}
              </code>
              {row.status === "experimental" && (
                <span className="rounded-md bg-foreground/[0.055] px-1.5 py-0.5 text-xs text-subtle">
                  Experimental
                </span>
              )}
              {row.type !== undefined && (
                <code className="min-w-0 font-mono text-xs break-words text-subtle">
                  {row.type}
                </code>
              )}
              {row.detail && (
                <span className="ms-auto text-xs text-subtle">
                  {row.detail}
                </span>
              )}
            </dt>
            {row.text && (
              <dd className="text-[17px] leading-relaxed text-foreground/75 sm:text-[14px]">
                <Text>{row.text}</Text>
              </dd>
            )}
            {row.example && (
              <dd className="text-[14px] text-subtle sm:text-[13px]">
                Example:{" "}
                <a
                  href={row.example.href}
                  className="text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground"
                >
                  {row.example.label}
                </a>
              </dd>
            )}
            {row.members?.length ? (
              <dd>
                <ul className="mt-1 flex flex-col gap-1.5 border-s border-border/70 ps-3 text-[14px] leading-relaxed sm:text-[13px]">
                  {row.members.map((member) => (
                    <li key={member.name}>
                      <code className="font-mono font-medium text-foreground">
                        {member.name}
                      </code>{" "}
                      <code className="font-mono text-xs break-words text-subtle">
                        {member.type}
                      </code>
                      {member.text && (
                        <span className="block text-foreground/70">
                          <Text>{member.text}</Text>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </Frame>
  )
}

/**
 * Props of an exported type, generated from its JSDoc. `events={false}` keeps
 * callbacks as they are in every framework, for options passed to a function,
 * like `toast()`'s.
 */
async function TypeTable(props: {
  path: string
  name: string
  framework?: Framework
  events?: boolean
  examples?: Record<string, string>
  type?: string
  types?: Record<string, string>
  descriptions?: Record<string, string>
}) {
  const tables = await typeRows(props)
  return tables.map((table) => (
    <Rows key={table.id} label={table.label} rows={table.rows} />
  ))
}

/** A part's render state: every field, its type and what it means. */
function StateTable(props: { path: string; name: string }) {
  return <Rows label={props.name} rows={stateRows(props)} />
}

/** The state fields one part's style functions receive on React Native. */
function PartStateTable(props: Parameters<typeof partStateRows>[0]) {
  return <Rows label={props.name} rows={partStateRows(props)} />
}

/** The reasons a callback can report, described from the shared vocabulary in core. */
function ReasonTable(props: { path: string; name: string }) {
  return <Rows label={props.name} rows={reasonRows(props)} />
}

/** A controller's methods, with their signatures and descriptions. */
function ControllerTable(props: { path: string; name: string }) {
  return <Rows label={props.name} rows={controllerRows(props)} />
}

export {
  ControllerTable,
  PartStateTable,
  ReasonTable,
  Rows,
  StateTable,
  Text,
  TypeTable,
}
