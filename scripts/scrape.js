const puppeteer = require('puppeteer');
const { apiKey, siteKey, targetUrl } = require('../config/config');
const { solveRecaptcha } = require('../utils/helpers');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
    await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9',
    });

    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        if (await page.$('iframe[src*="recaptcha"]')) {
            console.log("reCAPTCHA detected. Trying to solve it...");
            const recaptchaSolution = await solveRecaptcha(apiKey, siteKey, targetUrl);
            if (recaptchaSolution) {
                await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${recaptchaSolution}";`);
                await page.click('#recaptcha-demo-submit');
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            } else {
                console.log("Failed to solve reCAPTCHA.");
                await browser.close();
                return;
            }
        }

        for (let i = 0; i < 5; i++) {
            await page.mouse.move(Math.random() * 800, Math.random() * 600);
            await page.waitForTimeout(Math.random() * 2000 + 1000);
        }

        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
            await page.waitForTimeout(Math.random() * 2000 + 1000);
        }

        await page.waitForSelector('a');

        const links = await page.evaluate(() => {
            const anchorTags = document.querySelectorAll('a');
            return Array.from(anchorTags).map(anchor => anchor.href).filter(href => href);
        });

        console.log(`Found ${links.length} links:`);
        links.forEach(link => console.log(link));

        await browser.close();
    } catch (error) {
        console.error('Error fetching links:', error);
        await browser.close();
    }
})();
