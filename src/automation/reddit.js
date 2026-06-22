const { chromium } = require('playwright');
const { waitForRedditOTP } = require('./tempmail');

function generatePassword() {
    return 'Octa@' + Math.random().toString(36).substring(2, 10) + '!';
}

async function findVisibleButton(page, selectors) {
    for (const selector of selectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
            return btn;
        }
    }
    return null;
}

async function signupReddit(emailSession, showBrowser = true) {
    const { email, login, domain } = emailSession;
    const password = generatePassword();
    const username = login.substring(0, 15);

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

    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    try {
        console.log('Step 1: Loading Reddit Homepage...');
        await page.goto('https://www.reddit.com/', { waitUntil: 'networkidle', timeout: 60000 });

        console.log('Simulating organic user scrolling...');
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollBy(0, -200));
        await page.waitForTimeout(2000);

        console.log('Step 2: Locating Sign Up button...');
        const signUpButton = await findVisibleButton(page, [
            'a[href*="/signup"]',
            'a[href*="/register"]',
            'button:has-text("Sign Up")',
            'a:has-text("Sign Up")',
            'a:has-text("Get started")',
            '#login-link'
        ]);

        if (signUpButton) {
            await signUpButton.click();
            await page.waitForTimeout(3000);
        } else {
            console.log('Navigating directly to register page...');
            await page.goto('https://www.reddit.com/register/', { waitUntil: 'networkidle' });
        }

        console.log('Step 3: Entering email...');
        const emailInput = await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 15000 });
        await emailInput.click();
        for (const char of email) {
            await page.keyboard.type(char, { delay: Math.floor(Math.random() * 80) + 50 });
        }
        await page.waitForTimeout(1500);
        await page.keyboard.press('Enter');

        console.log('Step 4: Waiting for verification email...');
        await page.waitForTimeout(4000);

        const otpCode = await waitForRedditOTP(emailSession.token);
        console.log(`OTP received: ${otpCode}`);

        console.log('Step 5: Entering OTP code...');
        const otpInput = await page.waitForSelector(
            'input[id*="verification"], input[name*="code"], input[inputmode="numeric"]',
            { timeout: 15000 }
        ).catch(() => null);

        if (otpInput) {
            await otpInput.click();
            for (const char of otpCode) {
                await page.keyboard.type(char, { delay: 120 });
            }
            await page.waitForTimeout(1000);
            await page.keyboard.press('Enter');
        } else {
            const digitInputs = await page.locator('input[maxlength="1"]').all();
            if (digitInputs.length >= 6) {
                for (let i = 0; i < otpCode.length && i < digitInputs.length; i++) {
                    await digitInputs[i].fill(otpCode[i]);
                    await page.waitForTimeout(100);
                }
            } else {
                console.log('OTP fields not found via selectors, typing directly...');
                await page.keyboard.type(otpCode, { delay: 100 });
                await page.waitForTimeout(2000);
            }
        }

        await page.waitForTimeout(3000);

        console.log('Step 6: Setting username and password...');
        const usernameInput = await findVisibleButton(page, [
            'input[name="username"]',
            'input[id*="username"]'
        ]);
        if (usernameInput) {
            await usernameInput.click();
            await usernameInput.fill(username);
            await page.waitForTimeout(1000);
        }

        const passwordInput = await findVisibleButton(page, [
            'input[name="password"]',
            'input[id*="password"]',
            'input[type="password"]'
        ]);
        if (passwordInput) {
            await passwordInput.click();
            for (const char of password) {
                await page.keyboard.type(char, { delay: Math.floor(Math.random() * 60) + 40 });
            }
            await page.waitForTimeout(1000);
        }

        const submitBtn = await findVisibleButton(page, [
            'button[type="submit"]',
            'button:has-text("Create")',
            'button:has-text("Sign Up")',
            'button:has-text("Continue")'
        ]);
        if (submitBtn) {
            await submitBtn.click();
        } else {
            await page.keyboard.press('Enter');
        }

        await page.waitForTimeout(5000);

        const skipBtn = await findVisibleButton(page, [
            'button:has-text("Skip")',
            'button:has-text("Next")',
            'button:has-text("Not now")'
        ]);
        if (skipBtn) {
            await skipBtn.click();
            await page.waitForTimeout(2000);
        }

        console.log(`Account created: ${email} / ${password}`);
        await page.waitForTimeout(2000);

        return {
            success: true,
            email,
            password,
            username,
            message: `Account created: ${email}`
        };

    } catch (error) {
        console.error('Signup error:', error.message);
        await page.waitForTimeout(5000);
        return { success: false, error: error.message };
    } finally {
        try { await browser.close(); } catch (e) { }
    }
}

module.exports = { signupReddit };
