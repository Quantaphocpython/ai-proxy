const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

/**
 * Keep Alive Service to automatically self-ping when hosted on Render / free platforms
 * to prevent the container from sleeping due to inactivity.
 */
function initKeepAlive() {
  const isEnabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
  if (!isEnabled) {
    logger.info('[KeepAlive] Keep-alive service is disabled by KEEP_ALIVE_ENABLED=false.');
    return;
  }

  // Render automatically provides RENDER_EXTERNAL_URL (e.g. https://your-app.onrender.com)
  const targetUrl =
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.DOMAIN_SERVER && !process.env.DOMAIN_SERVER.includes('localhost') ? process.env.DOMAIN_SERVER : null) ||
    (process.env.DOMAIN_CLIENT && !process.env.DOMAIN_CLIENT.includes('localhost') ? process.env.DOMAIN_CLIENT : null);

  if (!targetUrl) {
    logger.info('[KeepAlive] No external URL detected. Set KEEP_ALIVE_URL or deploy on Render to activate self-pinging.');
    return;
  }

  const intervalMinutes = parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES, 10) || 10;
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
  const pingEndpoint = `${targetUrl.replace(/\/+$/, '')}/api/health`;

  logger.info(`[KeepAlive] Service activated! Will self-ping ${pingEndpoint} every ${intervalMinutes} minutes.`);

  // Initial ping 45s after startup to verify connectivity
  setTimeout(async () => {
    await sendPing(pingEndpoint);
  }, 45000);

  const intervalId = setInterval(async () => {
    await sendPing(pingEndpoint);
  }, intervalMs);

  if (intervalId.unref) {
    intervalId.unref();
  }
}

async function sendPing(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'LibreChat-KeepAlive-Worker/1.0',
      },
    });
    logger.info(`[KeepAlive] Self-ping successful (Status: ${response.status}) to ${url}`);
  } catch (err) {
    logger.warn(`[KeepAlive] Self-ping failed to ${url}: ${err.message}`);
  }
}

module.exports = {
  initKeepAlive,
};
