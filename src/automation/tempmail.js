// tempmail.js
const MAIL_API = 'https://api.mail.tm';

async function getTempEmail() {
    try {
        const domainsRes = await fetch(`${MAIL_API}/domains?page=1`);
        const domainsData = await domainsRes.json();
        const domain = domainsData['hydra:member'][0].domain;

        const randomString = Math.random().toString(36).substring(2, 10);
        const email = `${randomString}@${domain}`;
        const password = 'Temp@' + Math.random().toString(36).substring(2, 8) + '!';

        const accountRes = await fetch(`${MAIL_API}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password })
        });

        if (!accountRes.ok) {
            const errText = await accountRes.text();
            throw new Error(`Account creation failed: ${errText}`);
        }

        const tokenRes = await fetch(`${MAIL_API}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password })
        });

        const tokenData = await tokenRes.json();
        const token = tokenData.token;

        console.log(`[TempMail] Created: ${email}`);

        return {
            email,
            login: randomString,
            domain,
            password,
            token
        };
    } catch (error) {
        console.error('[TempMail] Error creating email:', error.message);
        throw error;
    }
}

// FIXED: mail.tm API ke standards ke mutabiq OTP verification system
async function waitForRedditOTP(token, maxAttempts = 24) {
    // token parameter ab mandatory hai kyunki mail.tm bina auth ke inbox nahi dikhata
    console.log("📨 [TempMail] Monitoring mail.tm inbox for Reddit verification email...");

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`${MAIL_API}/messages`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            const messages = data['hydra:member'];

            if (messages && messages.length > 0) {
                // Reddit se aayi hui email search karein
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

                    console.log(`[TempMail] Fetching full message body...`);
                    const messageId = redditMail.id;
                    const detailRes = await fetch(`${MAIL_API}/messages/${messageId}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
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
            console.error(`[TempMail] Monitoring attempt ${attempt} warning:`, error.message);
        }

        // 5 seconds delay before next operational sequence
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`⏱️ Inbox check sync state: ${attempt}/${maxAttempts}...`);
    }

    throw new Error('Timeout: Reddit validation token not received inside mail.tm repository.');
}

module.exports = { getTempEmail, waitForRedditOTP };