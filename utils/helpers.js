const axios = require('axios');

// Function to solve reCAPTCHA using 2Captcha
async function solveRecaptcha(apiKey, siteKey, url) {
    try {
        const res = await axios.post('http://2captcha.com/in.php', {}, {
            params: {
                key: apiKey,
                method: 'userrecaptcha',
                googlekey: siteKey,
                pageurl: url
            }
        });

        if (res.data.includes('OK|')) {
            const captchaId = res.data.split('|')[1];
            console.log('Captcha ID:', captchaId);
            let captchaSolution;

            while (true) {
                const result = await axios.get('http://2captcha.com/res.php', {
                    params: {
                        key: apiKey,
                        action: 'get',
                        id: captchaId
                    }
                });

                if (result.data === 'CAPCHA_NOT_READY') {
                    console.log('Captcha not ready, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else if (result.data.includes('OK|')) {
                    captchaSolution = result.data.split('|')[1];
                    console.log('Captcha solved:', captchaSolution);
                    break;
                } else {
                    throw new Error('Captcha solving failed: ' + result.data);
                }
            }

            return captchaSolution;
        } else {
            throw new Error('Captcha request failed: ' + res.data);
        }
    } catch (err) {
        console.error('Error solving captcha:', err);
        return null;
    }
}

module.exports = {
    solveRecaptcha
};
