// YB Store — config.js v3
// Updated Worker URL: yinboran.workers.dev

window.YB_CONFIG = {
  WORKER_URL: "https://yinboran-github-io.yinboran.workers.dev",

  ENABLE_KHQR: true,
  ENABLE_COD: true,
  DELIVERY_FEE: 2.5,

  // Universal API helper
  // GET:  YB_CONFIG.get("getPublicProducts", { category: "phone" })
  // POST: YB_CONFIG.post("submitOrder", { name: "...", ... })

  get(fn, params = {}) {
    const url = new URL(this.WORKER_URL);
    url.searchParams.set("action", "gs");
    url.searchParams.set("fn", fn);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return fetch(url.toString()).then(r => r.json());
  },

  post(fn, body = {}) {
    const url = new URL(this.WORKER_URL);
    url.searchParams.set("action", "gs");
    url.searchParams.set("fn", fn);
    return fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json());
  },
};
