const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function loginReddit(email, password, showBrowser = true, proxyConfig = null) {
    const opts = {
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
    };

    if (proxyConfig) {
        opts.proxy = { server: proxyConfig.server };
        if (proxyConfig.username) {
            opts.proxy.username = proxyConfig.username;
            opts.proxy.password = proxyConfig.password;
        }
    }

    const browser = await chromium.launch(opts);

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
        console.log('[Extraction] Logging into Reddit via old.reddit.com...');
        await page.goto('https://old.reddit.com/login', { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);

        const usernameField = await page.waitForSelector(
            'input[name="user"], input[name="username"], input[id*="loginUsername"]',
            { timeout: 10000 }
        );
        await usernameField.click();
        await usernameField.fill(email);

        const passwordField = await page.waitForSelector(
            'input[name="passwd"], input[name="password"], input[type="password"]',
            { timeout: 5000 }
        );
        await passwordField.click();
        await passwordField.fill(password);

        await page.waitForTimeout(1000);

        await page.keyboard.press('Enter');

        await page.waitForTimeout(5000);
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
    console.log('[Extraction] Fetching Reddit feed via JSON API...');

    const resp = await page.request.get('https://www.reddit.com/.json', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
    });

    if (!resp.ok()) {
        console.log('[Extraction] JSON API failed, trying DOM extraction...');
        return await extractFromDOM(page);
    }

    const json = await resp.json();
    const children = json.data?.children || [];

    if (children.length === 0) {
        console.log('[Extraction] JSON API returned no posts, trying DOM extraction...');
        return await extractFromDOM(page);
    }

    const posts = children.map(child => {
        const d = child.data;
        return {
            title: d.title || '',
            subreddit: 'r/' + (d.subreddit || ''),
            upvotes: String(d.ups ?? 0),
            comments: String(d.num_comments ?? 0) + ' comments',
            time: new Date(d.created_utc * 1000).toLocaleString()
        };
    });

    const seen = new Set();
    const unique = posts.filter(p => {
        if (seen.has(p.title)) return false;
        seen.add(p.title);
        return true;
    });

    console.log(`[Extraction] Extracted ${unique.length} posts`);
    return unique.slice(0, 15);
}

async function extractFromDOM(page) {
    console.log('[Extraction] Falling back to DOM extraction...');
    await page.goto('https://www.reddit.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    for (let i = 0; i < 6; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(1000);
    }

    const posts = await page.evaluate(() => {
        const items = [];
        const posts = document.querySelectorAll('shreddit-post');

        posts.forEach(post => {
            const titleEl = post.querySelector('[slot="title"], a[slot="title"]');
            const subEl = post.getAttribute('subreddit') || post.querySelector('[slot="subreddit"]')?.textContent;
            const upvotes = post.getAttribute('score') || post.querySelector('faceplate-number')?.getAttribute('number') || '0';
            const commentsEl = post.querySelector('a[href*="comments"]');
            const comments = commentsEl ? commentsEl.textContent.trim() : '0 comments';
            const timeEl = post.querySelector('time, time-ago');
            const time = timeEl ? (timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent.trim()) : '';

            const title = titleEl ? titleEl.textContent.trim() : null;
            const subreddit = subEl ? (subEl.startsWith('r/') ? subEl : 'r/' + subEl.trim()) : null;

            if (title && subreddit && !items.some(item => item.title === title)) {
                items.push({ title, subreddit, upvotes, comments, time });
            }
        });

        return items;
    });

    console.log(`[Extraction] Extracted ${posts.length} posts from DOM`);
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
