const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function loginReddit(email, password, showBrowser = true) {
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
    });

    try {
        console.log('[Extraction] Logging into Reddit...');
        await page.goto('https://www.reddit.com/login/', { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);

        const usernameField = await page.waitForSelector(
            'input[name="username"], input[id*="loginUsername"]',
            { timeout: 10000 }
        );
        await usernameField.click();
        await usernameField.fill(email);

        const passwordField = await page.waitForSelector(
            'input[name="password"], input[type="password"]',
            { timeout: 5000 }
        );
        await passwordField.click();
        await passwordField.fill(password);

        await page.waitForTimeout(1000);

        const loginButton = page.getByRole('button', { name: /log in/i, exact: false });
        await loginButton.waitFor({ state: 'visible', timeout: 10000 });
        await loginButton.click();

        await page.waitForURL('https://www.reddit.com/', { timeout: 30000 });
        await page.waitForTimeout(4000);

        console.log('[Extraction] Login successful!');
        return { success: true, browser, context, page };
    } catch (error) {
        console.error('[Extraction] Login failed:', error.message);
        try { await browser.close(); } catch (e) { }
        return { success: false, error: error.message };
    }
}

async function extractRedditData(page) {
    console.log('[Extraction] Navigating to Reddit feed for data extraction...');

    await page.goto('https://old.reddit.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('[Extraction] Scrolling to load posts...');
    for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(1200);
    }

    const posts = await page.evaluate(() => {
        const items = [];
        const things = document.querySelectorAll('.thing, .link');

        things.forEach(thing => {
            const titleEl = thing.querySelector('a.title');
            const subredditEl = thing.querySelector('a.subreddit, .subreddit');
            const scoreEl = thing.querySelector('.score.unvoted, .score.likes, .score');
            const commentsEl = thing.querySelector('a.comments');
            const timeEl = thing.querySelector('time');

            const title = titleEl ? titleEl.textContent.trim() : null;
            const subreddit = subredditEl ? subredditEl.textContent.trim() : null;
            const upvotes = scoreEl ? scoreEl.textContent.trim() : '0';
            const comments = commentsEl ? commentsEl.textContent.trim() : '0 comments';
            const time = timeEl ? (timeEl.getAttribute('title') || timeEl.textContent.trim()) : '';

            if (title && subreddit && !items.some(item => item.title === title)) {
                items.push({ title, subreddit, upvotes, comments, time });
            }
        });

        return items;
    });

    console.log(`[Extraction] Extracted ${posts.length} unique posts`);
    return posts.slice(0, 15);
}

function saveToDesktop(data) {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `Reddit_Extracted_Data_${timestamp}.txt`;
    const filePath = path.join(desktopPath, fileName);

    const header = 'TITLE | SUBREDDIT | UPVOTES | COMMENTS | TIME';
    const separator = '-'.repeat(130);
    const lines = data.map((post, index) => {
        const title = post.title.replace(/\n/g, ' ').trim();
        return `${String(index + 1).padStart(2, ' ')}. ${title} | ${post.subreddit} | ${post.upvotes} | ${post.comments} | ${post.time}`;
    });

    const content = [
        '===========================================================',
        '   Reddit Data Extraction - OctaBot',
        `   Exported: ${new Date().toLocaleString()}`,
        `   Total Posts: ${data.length}`,
        '   Columns: Title | Subreddit | Upvotes | Comments | Time',
        '===========================================================',
        '',
        header,
        separator,
        ...lines,
        '',
        separator,
        '--- End of Report ---'
    ].join('\n');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[Extraction] Data saved to: ${filePath}`);
    return filePath;
}

module.exports = { loginReddit, extractRedditData, saveToDesktop };
