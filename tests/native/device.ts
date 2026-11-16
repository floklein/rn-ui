import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { after, before } from "node:test"
import { remote } from "webdriverio"

type Platform = "ios" | "android"

type Node = {
  role: string
  label: string
  checked?: boolean | "mixed"
  selected?: true
  expanded?: true
  enabled: boolean
  text?: string
  value?: string
  secure?: true
}

const platform: Platform =
  process.env.DEVICE_PLATFORM === "android" ? "android" : "ios"
const output =
  process.env.DEVICE_SPEC_OUTPUT ??
  path.join(import.meta.dirname, "../test-results/native")

// The first iOS session on a runner that just booted its simulator took up
// to 3m26s, past WebDriverAgent's and the client's defaults, and a 60-second
// gap between commands outlived the driver's (issue #29).
const limits = {
  wdaLaunch: 120_000,
  response: 300_000,
  newCommand: 300,
}

const capabilities =
  platform === "ios"
    ? {
        platformName: "iOS",
        "appium:automationName": "XCUITest",
        "appium:udid": process.env.SIMULATOR_UDID,
        "appium:simulatorDevicesSetPath": process.env.SIMULATOR_DEVICE_SET,
        "appium:app": process.env.APP_PATH,
        "appium:wdaLaunchTimeout": limits.wdaLaunch,
        "appium:newCommandTimeout": limits.newCommand,
        ...(process.env.WDA_PATH && {
          "appium:usePreinstalledWDA": true,
          "appium:prebuiltWDAPath": process.env.WDA_PATH,
        }),
        ...(process.env.CI && { "appium:isHeadless": true }),
        // Parallel iOS sessions on one machine each need their own port.
        ...(process.env.WDA_LOCAL_PORT && {
          "appium:wdaLocalPort": Number(process.env.WDA_LOCAL_PORT),
        }),
      }
    : {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:udid": process.env.ANDROID_SERIAL,
        "appium:app": process.env.APP_PATH,
        "appium:newCommandTimeout": limits.newCommand,
        // An emulator from simlock sits behind its own adb server.
        ...(process.env.ANDROID_ADB_SERVER_PORT && {
          "appium:adbPort": Number(process.env.ANDROID_ADB_SERVER_PORT),
        }),
        ...(process.env.UIAUTOMATOR2_PORT && {
          "appium:systemPort": Number(process.env.UIAUTOMATOR2_PORT),
        }),
      }

const roles: Record<string, string> = {
  XCUIElementTypeSwitch: "switch",
  XCUIElementTypeButton: "button",
  XCUIElementTypeLink: "link",
  XCUIElementTypeImage: "image",
  XCUIElementTypeStaticText: "text",
  XCUIElementTypeTextField: "textbox",
  XCUIElementTypeSecureTextField: "textbox",
  XCUIElementTypeTextView: "textbox",
  XCUIElementTypeOther: "group",
  "android.widget.Switch": "switch",
  "android.widget.CheckBox": "checkbox",
  "android.widget.RadioButton": "radio",
  "android.widget.Button": "button",
  "android.widget.ImageView": "image",
  "android.widget.ToggleButton": "togglebutton",
  "android.widget.TextView": "text",
  "android.widget.EditText": "textbox",
  "android.view.ViewGroup": "group",
}

const pressedValues: Record<string, boolean> = {
  checked: true,
  unchecked: false,
}

const byId = (id: string) =>
  platform === "ios" ? `~${id}` : `android=new UiSelector().resourceId("${id}")`

// UiAutomator only finds what's on screen, so a screen low in the list is
// scrolled to first.
const scrolledTo = (id: string) =>
  `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().resourceId("${id}"))`

function attributes(tag: string) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      value
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&#10;", "\n")
        .replaceAll("&amp;", "&"),
    ])
  )
}

const idOf = (attrs: Record<string, string>) =>
  platform === "ios"
    ? attrs.name
    : attrs["resource-id"]?.replace(/^.*:id\//, "")

const checkedOf = (value: string) =>
  value === "mixed" ? "mixed" : value === "checked"

// Android has no mixed state: React Native appends it to the description.
const androidMixed = ", mixed"

const radioValue = /^radio button, /

const androidChecked = (attrs: Record<string, string>) =>
  attrs["content-desc"]?.endsWith(androidMixed)
    ? "mixed"
    : attrs.checked === "true"
      ? "checked"
      : "unchecked"

/** The OS's accessibility tree, as each element's role, label and state, keyed by test ID. */
function parseTree(source: string) {
  const nodes = new Map<string, Node>()
  for (const [, type, tag] of source.matchAll(/<([\w.]+)\s([^>]*?)\/?>/g)) {
    const attrs = attributes(tag)
    // Both list controls no screen reader or key reaches, like a read-only
    // rating's radios: UiAutomator by importance, XCUITest by `accessible`.
    const unreached =
      platform === "android"
        ? type === "android.widget.RadioButton" &&
          attrs["a11y-important"] === "false" &&
          attrs.focusable === "false"
        : attrs.accessible === "false" && radioValue.test(attrs.value ?? "")
    if (unreached) {
      continue
    }
    const id = idOf(attrs)
    // iOS has no checkbox element: React Native puts the role in the value.
    const checkbox =
      platform === "ios" && /^checkbox, /.test(attrs.value ?? "")
        ? attrs.value.slice("checkbox, ".length)
        : undefined
    // Nor a radio: the value starts "radio button".
    const radio =
      platform === "ios" && radioValue.test(attrs.value ?? "")
        ? attrs.value.replace(radioValue, "")
        : undefined
    const role = checkbox ? "checkbox" : radio ? "radio" : (roles[type] ?? type)
    const node: Node = {
      role,
      label: (platform === "ios" ? attrs.label : attrs["content-desc"]) ?? "",
      enabled: attrs.enabled === "true",
    }
    if (role === "radio") {
      node.checked =
        platform === "ios" ? radio === "checked" : attrs.checked === "true"
    }
    if (role === "switch" || role === "togglebutton") {
      node.checked =
        platform === "ios" ? attrs.value === "1" : attrs.checked === "true"
    }
    if (role === "checkbox") {
      node.checked = checkedOf(checkbox ?? androidChecked(attrs))
      if (node.checked === "mixed" && platform === "android") {
        node.label = node.label.slice(0, -androidMixed.length)
      }
    }
    // React Native gives iOS no toggle trait: a toggle button is a button
    // whose value starts with "checked" or "unchecked" (English simulators).
    const pressed = attrs.value?.split(", ")[0] ?? ""
    if (platform === "ios" && role === "button" && pressed in pressedValues) {
      node.checked = pressedValues[pressed]
    }
    if (role === "text") {
      node.text = platform === "ios" ? attrs.label : attrs.text
    }
    if (role === "textbox") {
      node.value = (platform === "ios" ? attrs.value : attrs.text) ?? ""
      const secure =
        platform === "ios"
          ? type === "XCUIElementTypeSecureTextField"
          : attrs.password === "true"
      if (secure) {
        node.secure = true
      }
    }
    // React Native's iOS value says "expanded", and nothing while collapsed.
    if (platform === "ios" && attrs.value?.split(", ").includes("expanded")) {
      node.expanded = true
    }
    const selected =
      platform === "ios"
        ? (attrs.traits ?? "").split(", ").includes("Selected")
        : attrs.selected === "true"
    if (selected) {
      node.selected = true
    }
    nodes.set(id && !nodes.has(id) ? id : `#${nodes.size}`, node)
  }
  return nodes
}

/**
 * Opens one Appium session for the spec file, on the app's screen list, and
 * closes it after the file's last test.
 */
function useDevice(name: string) {
  let driver: WebdriverIO.Browser
  const device = {
    platform,
    get driver() {
      return driver
    },
    async tree() {
      return parseTree(await driver.getPageSource())
    },
    async node(id: string) {
      const node = (await device.tree()).get(id)
      if (!node) {
        throw new Error(`No element with the test ID ${id} in the tree.`)
      }
      return node
    },
    /** Waits until `check` passes on the tree, failing with its last error. */
    async expectTree(check: (tree: Map<string, Node>) => void, timeout = 5000) {
      const deadline = Date.now() + timeout
      for (;;) {
        try {
          check(await device.tree())
          return
        } catch (error) {
          if (Date.now() > deadline) {
            throw error
          }
        }
        await new Promise((done) => setTimeout(done, 250))
      }
    },
    /** The element's size on screen, for a part whose state only shows in its style. */
    async size(id: string) {
      return driver.$(byId(id)).getSize()
    },
    /** The element's attributes as the OS reports them, for what `tree` leaves out. */
    async attributes(id: string) {
      for (const [, , tag] of (await driver.getPageSource()).matchAll(
        /<([\w.]+)\s([^>]*?)\/?>/g
      )) {
        const attrs = attributes(tag)
        if (idOf(attrs) === id) {
          return attrs
        }
      }
      throw new Error(`No element with the test ID ${id} in the tree.`)
    },
    async press(id: string) {
      await driver.$(byId(id)).click()
    },
    /** Presses the element named `label`, for a part that takes no test ID. */
    async pressNamed(label: string) {
      await driver
        .$(
          platform === "ios"
            ? `~${label}`
            : `android=new UiSelector().description("${label}")`
        )
        .click()
    },
    /** Taps the screen at a point, in the driver's units, for a part out of the accessibility tree. */
    async tapAt(x: number, y: number) {
      await driver
        .action("pointer", { parameters: { pointerType: "touch" } })
        .move({ x: Math.round(x), y: Math.round(y) })
        .down()
        .pause(50)
        .up()
        .perform()
    },
    /** The test ID of the element the OS's input focus is on, as a text field being edited. */
    async focused() {
      const active = await driver.getActiveElement()
      // XCUITest answers with an error object while nothing has focus.
      if ("error" in active) {
        return undefined
      }
      const element = await driver.$(active)
      return platform === "ios"
        ? element.getAttribute("name")
        : (await element.getAttribute("resource-id"))?.replace(/^.*:id\//, "")
    },
    /** Types into the element the OS's input focus is on. */
    async type(text: string) {
      await driver.keys(text.split(""))
    },
    async open(screen: string) {
      if (await driver.$(byId("back")).isExisting()) {
        await driver.$(byId("back")).click()
      }
      const item = driver.$(
        platform === "ios" ? byId(screen) : scrolledTo(screen)
      )
      await item.waitForExist({ timeout: 20_000 })
      await item.click()
      await driver.$(byId("back")).waitForExist({ timeout: 5000 })
    },
    async saveTree(state: string) {
      await mkdir(output, { recursive: true })
      await writeFile(
        path.join(output, `${platform}-${name}-${state}.xml`),
        await driver.getPageSource()
      )
    },
    /** Apple's accessibility audit of the screen; an empty list on Android, which has none. */
    async audit() {
      if (platform !== "ios") {
        return []
      }
      const issues = (await driver.execute(
        "mobile: performAccessibilityAudit",
        {}
      )) as {
        auditType: string
        compactDescription: string
        element?: string
      }[]
      return issues.map(
        (issue) =>
          `${issue.auditType}: ${issue.compactDescription}${issue.element ? ` (${issue.element})` : ""}`
      )
    },
  }

  before(async () => {
    driver = await remote({
      hostname: "127.0.0.1",
      port: Number(process.env.APPIUM_PORT ?? 4723),
      logLevel: "warn",
      connectionRetryTimeout: limits.response,
      connectionRetryCount: 0,
      capabilities,
    })
  })

  after(async () => {
    await driver?.deleteSession().catch((error) => console.error(error))
  })

  return device
}

export { type Node, useDevice }
