// requirements
const express = require('express');
const fs = require('fs');
const axios = require('axios');

// application
const app = express();
const port = 4563; // you can change it as you wish.

// DO NOT CHANGE THEM!
const ipLicenseMap = {};
const frameWork = "framework-dev"

// configuration
const configRaw = fs.readFileSync('frameworkConfig.json');
const config = JSON.parse(configRaw);

// configuration -> values
const enableDiscordWebhooks = config.ENABLE_DISCORD_WEBHOOKS;
const discordWebhookLink = config.DISCORD_WEBHOOK_LINK;

// generatin' a unique license code according to the request from user.
function generateLicense() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

app.get('/', (req, res) => {
    // getting client ip
    const clientIP = req.ip;

    if (ipLicenseMap[clientIP]) {
        const previousPin = ipLicenseMap[clientIP];
        const errorMessage = {
            error: 'You have previously requested to generate a PIN.',
            pin: previousPin,
            providedBy: frameWork
        };

        res.status(403).json(errorMessage);
        sendWebhookMessage(JSON.stringify(errorMessage)); // send webhook if its enabled.
        return;
    }

    const licenseCode = generateLicense();

    ipLicenseMap[clientIP] = licenseCode;

    setTimeout(() => {
        delete ipLicenseMap[clientIP];
        console.log(`[Framework] ${clientIP} deleted from the license map.`);
    }, 5 * 60 * 1000); // the timeout is cleared after 5 mins.

    const successMessage = {
        pin: licenseCode,
        providedBy: frameWork
    };

    res.json(successMessage);
    sendWebhookMessage(JSON.stringify(successMessage)); // send webhook if its enabled.
});

app.listen(port, () => {
    console.log(`[Framework] Framework License is running at http://localhost:${port}`);

    if (enableDiscordWebhooks) {
        console.log(`[Framework] Discord Webhooks are enabled. Webhook Link: ${discordWebhookLink}`);
    } else {
        console.log('[Framework] Discord Webhooks are disabled.');
    }
});

function sendWebhookMessage(message) {
    if (enableDiscordWebhooks) {
        axios.post(discordWebhookLink, {
            content: message,
        })
        .then(response => {
            console.log("[Framework] Webhook message received.");
        })
        .catch(error => {
            console.error("[Framework] Error sending webhook message.");
        });
    } // you can also add else {} here to send log for skippin' message.
}
