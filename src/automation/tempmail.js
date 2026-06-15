// src/automation/tempmail.js

/**
 * Generates a random temporary email address using 1secmail API.
 * @returns {Promise<{email: string, login: string, domain: string}>}
 */
async function getTempEmail() {
    try {
        // Ek random string generate karte hain username ke liye
        const randomString = Math.random().toString(36).substring(2, 10);

        // Qiott.com ya kzccv.com par Reddit asani se register karne deta hai
        const domain = 'qiott.com';
        const email = `${randomString}@${domain}`;

        console.log('--- [OctaBot API] Generated Email:', email);

        return {
            email: email,
            login: randomString,
            domain: domain
        };
    } catch (error) {
        console.error('Error generating email:', error);
        throw error;
    }
}

/**
 * Polls the 1secmail API to wait for Reddit's verification email and extracts the 6-digit OTP.
 * @param {string} login - The username part of the email
 * @param {string} domain - The domain part of the email
 * @param {number} maxAttempts - How many times to check (default 24 attempts = 2 minutes)
 * @returns {Promise<string>} The 6-digit OTP code
 */
async function waitForRedditOTP(login, domain, maxAttempts = 24) {
    const url = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;

    console.log("📨 [OctaBot API] Monitoring inbox for Reddit verification email...");

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url);
            const messages = await response.json();

            if (messages && messages.length > 0) {
                // Check karte hain agar Reddit se koi email aayi hai
                const redditMail = messages.find(msg =>
                    msg.from.toLowerCase().includes('reddit') ||
                    msg.subject.toLowerCase().includes('verify')
                );

                if (redditMail) {
                    console.log(`✨ [OctaBot API] Reddit Email Detected! Fetching Content...`);

                    const messageId = redditMail.id;
                    const contentUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`;

                    const contentResponse = await fetch(contentUrl);
                    const mailData = await contentResponse.json();
                    const mailBody = mailData.body; // Full HTML/Text content

                    // Regex use kar ke 6 digits ka numeric OTP code nikalte hain
                    const otpMatch = mailBody.match(/\b\d{6}\b/);

                    if (otpMatch) {
                        const otpCode = otpMatch[0];
                        console.log(`🔥 [OctaBot API] Extracted Reddit OTP: ${otpCode}`);
                        return otpCode;
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
        }

        // 5 second ka wait agli baar check karne se pehle
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`⏱️ Inbox check attempt ${attempt}/${maxAttempts}...`);
    }

    throw new Error("⏳ Timeout: Reddit verification email not received.");
}

module.exports = { getTempEmail, waitForRedditOTP };