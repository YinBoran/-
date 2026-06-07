// YB Store — config.js v2
// Update WORKER_URL below after redeploying Worker

window.YB_CONFIG = {
  WORKER_URL: "https://yinboran-github-io.boranyin24.workers.dev",

  // Telegram
  TG_BOT_TOKEN: "",        // set in Apps Script (server-side only)
  TG_ORDER_CHAT: "",       // your admin chat ID

  // Shipper Mini App
  SHIPPER_URL: "https://yinboran-github-io.boranyin24.workers.dev/shipper",

  // Feature flags
  ENABLE_KHQR: true,
  ENABLE_COD: true,
  DELIVERY_FEE: 2.5,       // USD

  // Helper
  api(action, payload = {}) {
    const url = `${this.WORKER_URL}?action=${action}`;
    if (Object.keys(payload).length === 0) {
      return fetch(url).then(r => r.json());
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    }).then(r => r.json());
  },
};
