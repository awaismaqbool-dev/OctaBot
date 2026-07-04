const BACKUP_APIS = [
    { url: 'https://api.mail.tm', name: 'mail.tm' },
    { url: 'https://api.mail.gw', name: 'mail.gw' },
];

let currentApiIndex = 0;

function getCurrentApi() {
    return BACKUP_APIS[currentApiIndex];
}

function rotateApi() {
    currentApiIndex = (currentApiIndex + 1) % BACKUP_APIS.length;
    console.log(`[TempMail] Rotating to API: ${getCurrentApi().name} (${getCurrentApi().url})`);
    return getCurrentApi();
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

async function getTempEmail() {
    for (let apiTry = 0; apiTry < BACKUP_APIS.length; apiTry++) {
        const api = getCurrentApi();
        try {
            console.log(`[TempMail] Using API: ${api.name} (${api.url})`);

            const domainsRes = await fetchWithTimeout(`${api.url}/domains?page=1`);
            const domainsData = await domainsRes.json();
            const domain = domainsData['hydra:member'][0].domain;

            const randomString = Math.random().toString(36).substring(2, 10);
            const email = `${randomString}@${domain}`;
            const password = 'Temp@' + Math.random().toString(36).substring(2, 8) + '!';

            const accountRes = await fetchWithTimeout(`${api.url}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: email, password })
            });

            if (!accountRes.ok) {
                const errText = await accountRes.text();
                throw new Error(`Account creation failed: ${errText}`);
            }

            const tokenRes = await fetchWithTimeout(`${api.url}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: email, password })
            });

            const tokenData = await tokenRes.json();
            const token = tokenData.token;

            console.log(`[TempMail] Created: ${email} (via ${api.name})`);

            return {
                email,
                login: randomString,
                domain,
                password,
                token,
                apiUrl: api.url
            };
        } catch (error) {
            console.error(`[TempMail] API ${api.name} failed: ${error.message}`);
            rotateApi();
        }
    }

    throw new Error('All temp mail APIs exhausted');
}

async function waitForRedditOTP(emailSession, maxAttempts = 24) {
    const { token } = emailSession;
    console.log('[TempMail] Monitoring inbox for Reddit verification email...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`${emailSession.apiUrl}/messages`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                console.log(`[TempMail] API returned ${response.status}, rotating...`);
                rotateApi();
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            const messages = data['hydra:member'];

            if (messages && messages.length > 0) {
                const redditMail = messages.find(msg =>
                    msg.from.address.toLowerCase().includes('reddit') ||
                    msg.subject.toLowerCase().includes('verify') ||
                    msg.subject.toLowerCase().includes('code')
                );

                if (redditMail) {
                    console.log(`[TempMail] Reddit email found: "${redditMail.subject}"`);

                    const subjectMatch = redditMail.subject?.match(/\b(\d{6})\b/);
                    if (subjectMatch && subjectMatch[1] !== '000000') {
                        console.log(`[TempMail] Extracted OTP from subject: ${subjectMatch[1]}`);
                        return subjectMatch[1];
                    }

                    console.log('[TempMail] Fetching full message body...');
                    const messageId = redditMail.id;
                    const detailRes = await fetch(`${emailSession.apiUrl}/messages/${messageId}`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const mailData = await detailRes.json();
                    const mailText = mailData.text || '';
                    const mailHtml = mailData.html || '';
                    const combinedBody = mailText + ' ' + mailHtml;

                    const allCodes = combinedBody.match(/\b(\d{6})\b/g) || [];
                    const validCode = allCodes.find(c => c !== '000000');

                    if (validCode) {
                        console.log(`[TempMail] Extracted OTP: ${validCode}`);
                        return validCode;
                    }
                }
            }
        } catch (error) {
            console.error(`[TempMail] Attempt ${attempt} warning:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`[TempMail] Inbox check ${attempt}/${maxAttempts}...`);
    }

    throw new Error('OTP_TIMEOUT: Reddit verification email not received. Domain likely blocked.');
}

module.exports = { getTempEmail, waitForRedditOTP, rotateApi, getCurrentApi };
