const { chromium } = require("playwright");

function generatePassword() {
  return "User@" + Math.random().toString(36).substring(2, 10) + "!";
}

async function signupAutomationExercise(
  emailSession,
  showBrowser = true,
  retryCount = 0,
  proxyConfig = null,
) {
  const { email, login } = emailSession;
  const password = generatePassword();
  const username = login;

  // Aap ke purane stealth arguments jo security bypass karte hain
  const launchArgs = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certificate-errors",
    "--disable-extensions",
    "--disable-features=IsolateOrigins,site-per-process",
    "--disable-web-security",
    "--disable-features=BlockInsecurePrivateNetworkRequests",
  ];

  const browser = await chromium.launch({
    headless: !showBrowser,
    args: launchArgs,
    proxy: proxyConfig ? { server: proxyConfig.server } : undefined,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-US",
    languages: ["en-US", "en"],
    timezoneId: "Asia/Karachi",
  });

  const page = await context.newPage();

  // Webdriver fingerprint ko hide karne ke liye script injection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    Object.defineProperty(navigator, "platform", { get: () => "Win32" });
  });

  try {
    console.log(
      "Step 1: Navigating to Automation Exercise Login/Signup Page...",
    );
    // Changed 'networkidle' to 'load' to avoid third-party ad socket drops crashing the script
    await page.goto("https://automationexercise.com/login", {
      waitUntil: "load",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);

    console.log("Step 2: Submitting Initial Name and Temporary Email...");
    await page.waitForSelector('input[data-qa="signup-name"]', {
      timeout: 15000,
    });
    await page.fill('input[data-qa="signup-name"]', username);
    await page.fill('input[data-qa="signup-email"]', email);
    await page.click('button[data-qa="signup-button"]');

    console.log("Step 3: Waiting for Detailed Profile Form...");
    await page.waitForSelector("#id_gender1", { timeout: 15000 });

    // Radio button Title
    await page.click("#id_gender1");

    // Password
    await page.fill('input[data-qa="password"]', password);

    // Date of Birth Dropdowns
    await page.selectOption('select[data-qa="days"]', "15");
    await page.selectOption('select[data-qa="months"]', "5");
    await page.selectOption('select[data-qa="years"]', "1995");

    // Address Details Form
    await page.fill('input[data-qa="first_name"]', "Awais");
    await page.fill('input[data-qa="last_name"]', "Maqool");
    await page.fill('input[data-qa="address"]', "House 123, Street 5");
    await page.selectOption('select[data-qa="country"]', "United States");
    await page.fill('input[data-qa="state"]', "Punjab");
    await page.fill('input[data-qa="city"]', "Faisalabad");
    await page.fill('input[data-qa="zipcode"]', "38000");
    await page.fill('input[data-qa="mobile_number"]', "03001234567");

    console.log("Step 4: Submitting Complete Form to Create Account...");
    await page.click('button[data-qa="create-account"]');

    await page.waitForSelector('b:has-text("Account Created!")', {
      timeout: 15000,
    });
    console.log(
      `Account Created Successfully on Platform: ${email} / ${password}`,
    );

    return {
      success: true,
      email,
      password,
      username,
      message: `Account created completely: ${email}`,
    };
  } catch (error) {
    console.error("Signup Workflow Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    try {
      await browser.close();
    } catch (e) {}
  }
}

module.exports = { signupAutomationExercise };
