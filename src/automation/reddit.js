// src/automation/reddit.js
const { chromium } = require('playwright');
const { waitForRedditOTP } = require('./tempmail');

/**
 * Advanced Automated Reddit Signup via Human Click Simulation.
 * @param {Object} emailSession - The object returned from getTempEmail()
 * @param {boolean} showBrowser - Toggle for headed/headless mode
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function signupReddit(emailSession, showBrowser = true) {
    const { email, login, domain } = emailSession;

    const browser = await chromium.launch({
        headless: !showBrowser,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--disable-extensions'
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        languages: ['en-US', 'en'],
        timezoneId: 'Asia/Karachi'
    });

    const page = await context.newPage();

    // Fingerprint masking injection
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    try {
        console.log('🚀 [Playwright] Step 1: Loading Reddit Homepage...');
        // Sab se pehle main page kholna hai
        await page.goto('https://www.reddit.com/', { waitUntil: 'networkidle', timeout: 60000 });

        // Thora scroll down karte hain taake human organic interaction mimic ho
        console.log('🔄 [Playwright] Simulating organic user scrolling...');
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollBy(0, -200));
        await page.waitForTimeout(2000);

        console.log('🎯 [Playwright] Step 2: Locating "Sign Up" button on UI...');

        // Reddit ke button selectors jo homepage par hote hain
        const signUpSelectors = [
            'a[href*="/signup"]',
            'a:has-text("Sign Up")',
            'button:has-text("Sign Up")',
            '#login-link' // Kuch layouts mein login page par hi signup hota hai
        ];

        let signUpButton = null;
        for (const selector of signUpSelectors) {
            if (await page.locator(selector).first().isVisible()) {
                signUpButton = page.locator(selector).first();
                break;
            }
        }

        if (signUpButton) {
            console.log('🖱️ [Playwright] Clicking Sign Up button organically...');
            await signUpButton.click();
        } else {
            console.log('⚠️ [Playwright] Button not found by text, triggering direct dynamic overlay fallback...');
            // Agar button na mile toh safe redirect link call karte hain
            await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle' });
            // Login page par aksar "Register" link hota hai
            const registerLink = page.locator('a:has-text("Sign up"), a[href*="/signup"]').first();
            await registerLink.waitFor({ timeout: 5000 });
            await registerLink.click();
        }

        // Wait for forms to render fully
        await page.waitForTimeout(4000);

        console.log('📝 [Playwright] Step 3: Scanning form fields...');
        const emailInputSelector = 'input[name="email"], input[type="email"], #reg-email';

        await page.waitForSelector(emailInputSelector, { timeout: 15000, state: 'visible' });
        console.log('🎯 [Playwright] Form detected! Entering email...');

        await page.focus(emailInputSelector);
        await page.click(emailInputSelector);

        // Human typing imitation loop
        for (const char of email) {
            await page.keyboard.type(char, { delay: Math.floor(Math.random() * 120) + 80 });
        }

        await page.waitForTimeout(2000);
        await page.keyboard.press('Enter');

        console.log('🔐 [Playwright] Step 4: Moving to credential creation layout...');
        await page.waitForTimeout(4000);

        // Baseline complete confirmation message for testing logs
        console.log(`✅ [Playwright] Signup pipeline simulated up to checkpoint for target: ${email}`);

        await page.waitForTimeout(4000);
        await browser.close();

        return { success: true, message: `Account setup triggered for ${email}` };

    } catch (error) {
        console.error('❌ [Playwright] Processing Exception:', error.message);

        // Crash hone se pehle thori dair browser khula rakhein taake aap screen dekh saken
        console.log('⚠️ [Playwright] Safety hold active. Inspecting browser state before termination...');
        await page.waitForTimeout(10000);

        try { await browser.close(); } catch (e) { }
        return { success: false, error: error.message };
    }
}

module.exports = { signupReddit };