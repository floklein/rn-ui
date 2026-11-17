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
  heading?: true
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
  adb: 120_000,
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
        // A loaded host's emulator answered adb past the driver's 20 s.
        "appium:adbExecTimeout": limits.adb,
        "appium:androidInstallTimeout": limits.adb,
        "appium:uiautomator2ServerInstallTimeout": limits.adb,
        "appium:uiautomator2ServerLaunchTimeout": limits.adb,
        "appium:appWaitDuration": limits.adb,
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
  XCUIElementTypeSlider: "slider",
  "android.widget.Switch": "switch",
  "android.widget.CheckBox": "checkbox",
  "android.widget.RadioButton": "radio",
  "android.widget.Button": "button",
  "android.widget.ImageView": "image",
  "android.widget.ToggleButton": "togglebutton",
  "android.widget.TextView": "text",
  "android.widget.EditText": "textbox",
  "android.view.ViewGroup": "group",
  "android.widget.SeekBar": "slider",
}

const pressedValues: Record<string, boolean> = {
  checked: true,
  unchecked: false,
}

const byId = (id: string) =>
  platform === "ios" ? `~${id}` : `android=new UiSelector().resourceId("${id}")`

// Android writes an accessibility value's text into the description after
// the name, like "Volume, 20".
const named = (label: string) =>
  platform === "ios"
    ? `~${label}`
    : `android=new UiSelector().descriptionMatches("\\Q${label}\\E(, .*)?")`

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

// Android's own views, like `android:id/content`, aren't test IDs.
const idOf = (attrs: Record<string, string>) =>
  platform === "ios"
    ? attrs.name
    : attrs["resource-id"]?.match(/^(?!android:)(?:.*:id\/)?(.+)$/)?.[1]

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
    // Nor a slider: an adjustable view has the Adjustable trait.
    const adjustable =
      platform === "ios" &&
      (attrs.traits ?? "").split(", ").includes("Adjustable")
    const role = checkbox
      ? "checkbox"
      : radio
        ? "radio"
        : adjustable
          ? "slider"
          : (roles[type] ?? type)
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
    if (role === "slider") {
      if (platform === "ios") {
        node.value = attrs.value ?? ""
      } else {
        const [label, ...value] = node.label.split(", ")
        node.label = label
        node.value = value.join(", ")
      }
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
    const heading =
      platform === "ios"
        ? (attrs.traits ?? "").split(", ").includes("Header")
        : attrs.heading === "true"
    if (heading) {
      node.heading = true
      // A header is a plain view on Android, so its text isn't read above.
      node.text ??= platform === "ios" ? attrs.label : attrs.text
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
    /** The element's box on screen, in the driver's units: points on iOS, pixels on Android. */
    async rect(id: string) {
      const element = driver.$(byId(id))
      return { ...(await element.getLocation()), ...(await element.getSize()) }
    },
    /** The box of the element named `label`, for a part that takes no test ID. */
    async rectNamed(label: string) {
      const element = driver.$(named(label))
      return { ...(await element.getLocation()), ...(await element.getSize()) }
    },
    /** A finger pressed at `from`, held `hold` ms, moved to `to` in steps, then lifted. */
    async drag(
      from: { x: number; y: number },
      to: { x: number; y: number },
      duration = 600,
      hold = 100
    ) {
      const steps = 6
      const finger = driver
        .action("pointer", { parameters: { pointerType: "touch" } })
        .move({ x: Math.round(from.x), y: Math.round(from.y) })
        .down()
        .pause(hold)
      for (let step = 1; step <= steps; step++) {
        finger.move({
          duration: Math.round(duration / steps),
          x: Math.round(from.x + ((to.x - from.x) * step) / steps),
          y: Math.round(from.y + ((to.y - from.y) * step) / steps),
        })
      }
      await finger.up().perform()
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
    /** Android's back button. */
    async back() {
      await driver.back()
    },
    /** Presses the element named `label`, for a part that takes no test ID. */
    async pressNamed(label: string) {
      await driver.$(named(label)).click()
    },
    /** Taps the screen at a point, in the driver's units, for a part out of the accessibility tree. Holds for `hold` ms. */
    async tapAt(x: number, y: number, hold = 50) {
      await driver
        .action("pointer", { parameters: { pointerType: "touch" } })
        .move({ x: Math.round(x), y: Math.round(y) })
        .down()
        .pause(hold)
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
    /** Saves a screenshot beside the saved trees, for a check a person reads. */
    async screenshot(state: string) {
      await mkdir(output, { recursive: true })
      await driver.saveScreenshot(
        path.join(output, `${platform}-${name}-${state}.png`)
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
