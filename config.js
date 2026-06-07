// YB Store — config.js v3
// Variable names match index.html, manages.html, shipper.html

const WORKER_URL = "https://yinboran-github-io.yinboran.workers.dev";

// Also expose as globals for any variation used across files
window.WORKER_URL   = WORKER_URL;
window.SCRIPT_URL   = WORKER_URL;   // fallback if any file uses SCRIPT_URL
window.API_URL      = WORKER_URL;   // fallback if any file uses API_URL

// Helper used by all pages
window.callAPI = function(fn, params = {}, method = "GET") {
  const url = new URL(WORKER_URL);
  url.searchParams.set("action", "gs");
  url.searchParams.set("fn", fn);

  if (method === "GET") {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return fetch(url.toString()).then(r => r.json());
  }

  return fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then(r => r.json());
};
