import { expect, test } from "@playwright/test";

test.describe("Protocol & Network Explorer", () => {
  test("launches Protocol Explorer from Playground and scrubs sequence", async ({ page }) => {
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Click "All Labs" or look for launcher grid
    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    // Click "Launch Protocol Explorer"
    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify Protocol Explorer elements
    await expect(page.locator(".protocol-topology-canvas")).toBeVisible();
    await expect(page.locator(".protocol-sequence-container")).toBeVisible();
    await expect(page.locator(".protocol-packet-inspector")).toBeVisible();

    // Verify SVG topology map is rendered
    await expect(page.getByRole("img", { name: "Network Topology Map" })).toBeVisible();

    // Test Playback Controls: Step forward
    const stepNextBtn = page.getByRole("button", { name: /step forward/i });
    await expect(stepNextBtn).toBeVisible();
    await stepNextBtn.click();

    // Verify active step updated to Step 2
    await expect(page.locator(".protocol-sequence-container")).toContainText(/step 2 of/i);

    // Click a layer in the packet tree to inspect fields
    const packetTree = page.locator(".protocol-packet-inspector");
    await expect(packetTree).toBeVisible();

    // Click Hex Dump tab / ensure hex view is populated
    const hexTab = page.getByRole("button", { name: /hex dump/i });
    if (await hexTab.isVisible()) {
      await hexTab.click();
      await expect(page.locator(".protocol-hex-dump-container")).toBeVisible();
      await expect(page.locator(".protocol-hex-dump-container")).toContainText(/bytes total/i);
    }
  });

  test("switches to QUIC / HTTP/3 scenario and loads UDP transport sequence", async ({ page }) => {
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Select QUIC scenario
    const selector = page.getByRole("combobox", { name: /select protocol scenario/i });
    await expect(selector).toBeVisible();
    await selector.selectOption("quic-handshake");

    // Verify QUIC Initial step is rendered
    await expect(page.locator(".protocol-sequence-container")).toContainText(/QUIC Initial/i);
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/QUIC Long Header/i);

    // Switch to MQTT scenario
    await selector.selectOption("mqtt-telemetry");
    await expect(page.locator(".protocol-sequence-container")).toContainText(/CONNECT/i);
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/MQTT Control Packet/i);
  });

  test("runs smoothly on mobile viewport (390px) with zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Open Lab Launcher
    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    // Launch Protocol Explorer
    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify no horizontal document overflow
    const sizes = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(sizes.document, `document width ${sizes.document}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);
    expect(sizes.body, `body width ${sizes.body}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);

    // Switch between mobile tabs: Sequence -> Packet -> Hex
    await page.getByRole("button", { name: /packet tree/i }).click();
    await expect(page.locator(".protocol-packet-inspector")).toBeVisible();

    await page.getByRole("button", { name: /hex dump/i }).click();
    await expect(page.locator(".protocol-hex-dump-container")).toBeVisible();
  });

  test("navigates to dedicated /protocols section and renders lifeline swimlanes and Wireshark view", async ({ page }) => {
    await page.goto("/protocols", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Verify dedicated section title & topology map
    await expect(page.getByRole("heading", { name: "Protocol & Network Explorer" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Network Topology Map" })).toBeVisible();

    // Verify Lifeline swimlane columns are present
    const sequenceContainer = page.locator(".protocol-sequence-container");
    await expect(sequenceContainer).toBeVisible();
    await expect(sequenceContainer.getByText("Client Browser")).toBeVisible();
    await expect(sequenceContainer.getByText("Web Server (katalyst.dev)")).toBeVisible();

    // Switch to Wireshark table view
    const wiresharkBtn = page.getByRole("button", { name: /wireshark/i });
    await expect(wiresharkBtn).toBeVisible();
    await wiresharkBtn.click();

    // Verify Wireshark column headers
    await expect(page.getByRole("columnheader", { name: "Protocol" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Source" })).toBeVisible();

    // Switch back to Lifelines
    const lifelinesBtn = page.getByRole("button", { name: /lifelines/i });
    await expect(lifelinesBtn).toBeVisible();
    await lifelinesBtn.click();
    await expect(sequenceContainer.getByText("Client Browser")).toBeVisible();
  });

  test("maintains consistent Dark and Light mode surfaces and tokens on /protocols", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/protocols", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
    await expect(page.getByRole("img", { name: "Network Topology Map" })).toBeVisible();

    const toggleBtn = page.locator(".theme-quick-toggle");
    await expect(toggleBtn).toBeVisible();

    const getSurfaceStats = () =>
      page.evaluate(() => {
        const host = document.querySelector(".learning-protocols-host") as HTMLElement | null;
        const style = host ? getComputedStyle(host) : null;
        return {
          theme: document.documentElement.dataset.theme ?? "",
          bg: style?.backgroundColor ?? "",
          color: style?.color ?? "",
        };
      });

    // Click once to get into an explicit mode (light or dark), then toggle once more to check the opposite mode.
    await toggleBtn.click();
    const first = await getSurfaceStats();
    expect(["light", "dark"]).toContain(first.theme);

    await toggleBtn.click();
    const second = await getSurfaceStats();
    expect(["light", "dark"]).toContain(second.theme);
    expect(second.theme).not.toBe(first.theme);

    const parseRgbAvg = (rgb: string) => {
      const m = rgb.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
      return (m[0] + m[1] + m[2]) / 3;
    };

    const darkStats = first.theme === "dark" ? first : second;
    const lightStats = first.theme === "light" ? first : second;

    expect(parseRgbAvg(darkStats.bg), `Dark background too bright: ${darkStats.bg}`).toBeLessThan(70);
    expect(parseRgbAvg(darkStats.color), `Dark text too dim: ${darkStats.color}`).toBeGreaterThan(170);

    expect(parseRgbAvg(lightStats.bg), `Light background too dark: ${lightStats.bg}`).toBeGreaterThan(200);
    expect(parseRgbAvg(lightStats.color), `Light text too light: ${lightStats.color}`).toBeLessThan(80);

    expect(pageErrors).toEqual([]);
  });

  test("supports HTTPS/UDP/ICMP scenarios, directory filtering, and bidirectional Field <-> Hex sync", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/protocols", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    const selector = page.getByRole("combobox", { name: /select protocol scenario/i });
    await expect(selector).toBeVisible();

    // Switch to HTTPS Secure Exchange via scenario selector & verify animated lane + URL bar
    await selector.selectOption("https-exchange");
    await expect(page.locator(".protocol-sequence-container")).toContainText(/HTTPS|TLS/i);
    await expect(page.locator("svg.lab-network .pe-lane.is-active").first()).toBeAttached();
    const laneAnim = await page
      .locator("svg.lab-network .pe-lane.is-active")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(laneAnim).toContain("pe-lane-flow");
    await expect(page.locator("svg.lab-network .pe-url-bar")).toContainText("https://katalyst.dev");

    // Verify camera auto-focus control toggles cleanly
    const camToggle = page.getByRole("button", { name: /toggle camera auto-focus/i });
    await expect(camToggle).toBeVisible();
    await expect(camToggle).toHaveAttribute("aria-pressed", "false");
    await camToggle.click();
    await expect(camToggle).toHaveAttribute("aria-pressed", "true");
    await camToggle.click();
    await expect(camToggle).toHaveAttribute("aria-pressed", "false");

    // Switch to UDP and ICMP new scenarios
    await selector.selectOption("udp-datagram");
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/UDP/i);

    await selector.selectOption("icmp-ping");
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/ICMP/i);

    // Bidirectional Hex <-> Field sync in desktop Split view (ICMP Type is at byte 34)
    const hexContainer = page.locator(".protocol-hex-dump-container");
    const inspector = page.locator(".protocol-packet-inspector");
    await expect(hexContainer).toBeVisible();
    await expect(inspector).toBeVisible();

    const icmpTypeByte = hexContainer.locator('button[aria-label^="Byte 34:"]').first();
    await icmpTypeByte.click();
    await expect(icmpTypeByte).toHaveAttribute("aria-pressed", "true");
    await expect(inspector.locator('button[aria-pressed="true"]').first()).toContainText(/Type/);

    // Click a multi-byte field button (Checksum [36..37]) and confirm Checksum bytes 36 & 37 highlight
    const checksumFieldBtn = inspector.locator("button[aria-pressed]").filter({ hasText: "Checksum" }).first();
    await checksumFieldBtn.click();
    await expect(checksumFieldBtn).toHaveAttribute("aria-pressed", "true");
    await expect(hexContainer.locator('button[aria-label^="Byte 36:"]').first()).toHaveAttribute("aria-pressed", "true");
    await expect(hexContainer.locator('button[aria-label^="Byte 37:"]').first()).toHaveAttribute("aria-pressed", "true");
    await expect(icmpTypeByte).toHaveAttribute("aria-pressed", "false");

    // Verify playback speed selector includes 1.5x and center canvas toggles Network <-> Sequence
    const speedSelect = page.getByRole("combobox", { name: /playback speed/i });
    await expect(speedSelect).toBeVisible();
    await speedSelect.selectOption("1.5");
    await expect(speedSelect).toHaveValue("1.5");

    // Directory search & filter
    const directory = page.getByRole("complementary", { name: /protocol directory/i });
    await expect(directory).toBeVisible();
    const searchInput = directory.getByRole("searchbox", { name: /search protocols/i });
    await searchInput.fill("DNS");
    await expect(directory.getByText("DNS").first()).toBeVisible();
  });

  test("renders /protocols cleanly at 390px mobile in both Dark and Light modes with 8-byte hex rows", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/protocols", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    for (const togglePass of [0, 1]) {
      if (togglePass === 1) {
        await page.locator(".theme-quick-toggle").click();
      }
      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(overflow.doc, `Pass ${togglePass} doc overflow`).toBeLessThanOrEqual(overflow.viewport);
      expect(overflow.body, `Pass ${togglePass} body overflow`).toBeLessThanOrEqual(overflow.viewport);
    }

    const mobileNavBox = await page.getByRole("navigation", { name: "Mobile Navigation" }).boundingBox();
    expect(mobileNavBox?.height ?? 999, "Mobile nav should remain a crisp single row").toBeLessThan(65);

    await page.getByRole("button", { name: /hex dump/i }).click();
    const hexContainer = page.locator(".protocol-hex-dump-container");
    await expect(hexContainer).toBeVisible();
    // On mobile (<768px), each row shows at most 8 byte buttons
    const firstRowByteCount = await hexContainer.locator('button[aria-label^="Byte "]').first().evaluate((btn) => {
      const row = btn.closest("div.flex.items-center.gap-1");
      return row ? row.querySelectorAll("button").length : 0;
    });
    expect(firstRowByteCount).toBeLessThanOrEqual(8);
    expect(firstRowByteCount).toBeGreaterThan(0);
  });
});
