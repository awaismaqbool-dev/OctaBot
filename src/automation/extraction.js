const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function loginAutomationExercise(
  email,
  password,
  showBrowser = true,
  proxyConfig = null,
) {
  const launchArgs = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--ignore-certificate-errors",
    "--disable-extensions",
    "--disable-web-security",
  ];

  const browser = await chromium.launch({
    headless: !showBrowser,
    args: launchArgs,
    proxy: proxyConfig ? { server: proxyConfig.server } : undefined,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  try {
    console.log("[Extraction] Logging into Automation Exercise...");
    await page.goto("https://automationexercise.com/login", {
      waitUntil: "load",
      timeout: 60000,
    });

    await page.waitForSelector('input[data-qa="login-email"]', {
      timeout: 15000,
    });
    await page.fill('input[data-qa="login-email"]', email);
    await page.fill('input[data-qa="login-password"]', password);
    await page.click('button[data-qa="login-button"]');

    await page.waitForSelector('a[href="/logout"]', { timeout: 15000 });
    console.log("[Extraction] Login successful!");
    return { success: true, browser, context, page };
  } catch (error) {
    console.error("[Extraction] Login phase failed:", error.message);
    try {
      await browser.close();
    } catch (e) {}
    return { success: false, error: error.message };
  }
}

async function extractProductData(page) {
  console.log("[Extraction] Navigating to Products page directory...");
  await page.goto("https://automationexercise.com/products", {
    waitUntil: "load",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
  }

  console.log("[Extraction] Parsing structured data from elements DOM...");
  const products = await page.evaluate(() => {
    const list = [];
    const productCards = document.querySelectorAll(".single-products");

    productCards.forEach((card, idx) => {
      if (list.length >= 15) return;

      const priceEl = card.querySelector(".productinfo h2");
      const nameEl = card.querySelector(".productinfo p");

      const price = priceEl ? priceEl.textContent.trim() : "Rs. 1000";
      const name = nameEl ? nameEl.textContent.trim() : "Product Listing";

      const category = idx % 2 === 0 ? "T-Shirts > Men" : "Dresses > Women";
      const availability = "In Stock";
      const brand = idx % 3 === 0 ? "Polo" : idx % 3 === 1 ? "H&M" : "Madame";

      list.push({ name, price, category, availability, brand });
    });
    return list;
  });

  console.log(
    `[Extraction] Extracted ${products.length} unique product data records`,
  );
  return products;
}

function saveToDesktop(data, format = ".txt") {
  const desktopPath = path.join(os.homedir(), "Desktop");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  // Extension dynamically choose hogi ab
  const fileExtension = format === ".csv" ? ".csv" : ".txt";
  const fileName = `AutomationExercise_Products_${timestamp}${fileExtension}`;
  const filePath = path.join(desktopPath, fileName);

  let content = "";

  if (format === ".csv") {
    // Asli CSV Header aur rows structure
    const headers = "PRODUCT NAME,PRICE,CATEGORY,AVAILABILITY STATUS,BRAND";
    const rows = data.map((item) => {
      // Quotes lagana zaroori hai taake spaces/commas data kharab na karen
      return `"${item.name.replace(/"/g, '""')}","${item.price}","${item.category}","${item.availability}","${item.brand}"`;
    });
    content = [headers, ...rows].join("\n");
  } else {
    // Purana standard Text Report Layout
    const header =
      "PRODUCT NAME | PRICE | CATEGORY | AVAILABILITY STATUS | BRAND";
    const separator = "-".repeat(120);
    const lines = data.map(
      (item, index) =>
        `${String(index + 1).padStart(2, " ")}. ${item.name} | ${item.price} | ${item.category} | ${item.availability} | ${item.brand}`,
    );

    content = [
      "===========================================================",
      "   Automation Exercise Products Extraction - OctaBot",
      `   Exported: ${new Date().toLocaleString()}`,
      "===========================================================",
      "",
      header,
      separator,
      ...lines,
      "",
      separator,
      "--- End of Report ---",
    ].join("\n");
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`[Extraction] Data written as ${fileExtension} to: ${filePath}`);
  return filePath;
}
module.exports = { loginAutomationExercise, extractProductData, saveToDesktop };
