const { chromium } = require('playwright');

async function getTempEmail() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://temp-mail.org/en/', { waitUntil: 'domcontentloaded', timeout: 60000 })

    // wait For email loading 
    await page.waitForSelector('#mail', { timeout: 60000 });

    // get email
    const email = await page.$eval('#mail', el => el.value);

    console.log('Email address:', email);
    return { browser, page, email };
}

module.exports = { getTempEmail };