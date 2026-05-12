# Deploy the Notion proxy — 3-minute walkthrough

## Why this exists

Notion's REST API **does not allow browser-direct calls** (no CORS headers).
Every browser blocks the fetch with a CORS error, no matter how good the
token or how clean the URL. This is by design on Notion's side.

The fix is a tiny **Cloudflare Worker** that sits between the app and the
Notion API. It receives the request from the browser, adds the right CORS
headers, forwards it to Notion, and returns Notion's response. The Worker
**doesn't log, store, or inspect** the token — it's a pure pass-through.

Cloudflare's free tier covers 100 000 Worker requests per day, more than
this app will ever produce.

---

## Step-by-step (~3 minutes)

### 1. Open the Cloudflare dashboard

<https://dash.cloudflare.com>. Sign in (same account you used for Pages).

### 2. Create the Worker

- Left sidebar → **Workers & Pages**
- Click **Create application** → **Create Worker**
- Name it `easy-essay-notion-proxy` (or anything you prefer; the URL will
  match this name)
- Click **Deploy** (the placeholder hello-world is fine for now)

### 3. Replace the code

- Once deployed, click **Edit code** in the top-right
- In the editor, delete everything in `worker.js`
- Open this repo's [`cloudflare-worker/notion-proxy.js`](../cloudflare-worker/notion-proxy.js) and copy the entire file contents
- Paste into Cloudflare's editor
- Click **Deploy** (top-right)

### 4. Copy the URL

After deploy, you'll see your Worker's URL near the top — something like:

```
https://easy-essay-notion-proxy.cracksontheroad.workers.dev
```

Copy it.

### 5. Paste into Easy Essay

Open the live app at <https://www.sailedu.co/essay-writing-tool> (or wherever you've published it):

- **Setup wizard** — Step 2 → field **0. Notion proxy URL** → paste the Worker URL
- **OR Settings tab** → Notion Integration card → **Notion proxy URL** field → paste

That's it. The Notion **Test token** and **Verify page access** buttons should now work.

---

## Verify the proxy is alive

Open the Worker URL directly in your browser (just the URL with no path):

```
https://easy-essay-notion-proxy.YOUR-NAME.workers.dev
```

You should see a small JSON health response:

```json
{
  "ok": true,
  "service": "easy-essay-notion-proxy",
  "forwards": "https://api.notion.com",
  "paths": "/v1/*"
}
```

If you see that, the Worker is deployed correctly.

---

## Lock it down (optional — recommended for production)

By default the Worker accepts requests from **any origin** (`*`). For a
production deploy you can restrict it to just your domains. Edit the
`ALLOWED_ORIGINS` constant near the top of `notion-proxy.js`:

```js
const ALLOWED_ORIGINS = [
  "https://essay.sailedu.co",
  "https://www.sailedu.co",
  "https://cracksontheroad.github.io"
];
```

Re-deploy after editing.

---

## Updating the Worker later

Whenever this repo's `cloudflare-worker/notion-proxy.js` changes:

1. Open the Worker in Cloudflare → **Edit code**
2. Paste the new contents
3. Click **Deploy**

No DNS or app changes needed; the URL stays the same.

---

## Once `essay.sailedu.co` lands on Cloudflare Pages

After the CNAME propagates and we move the main app to Cloudflare Pages,
the proxy can live as a **Pages Function** on the same domain (e.g.
`https://essay.sailedu.co/api/notion/*`). That removes the separate Worker
and the cross-origin headers. We'll migrate at that point. The current
Worker setup is the bridge until then.

---

## Troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| `Notion proxy URL not set` | Field is empty in Settings | Paste the Worker URL and click Save |
| `Notion 401: …` | Token wrong or revoked | Re-copy from notion.so/profile/integrations |
| `Notion 404: object_not_found` on a page | Integration not shared with that page | In Notion: page → … → Connections → add your integration |
| `Notion 502 / Upstream fetch failed` | Worker can't reach Notion (rare) | Check the Worker's logs in Cloudflare dashboard |
| Browser console shows CORS error | Worker URL is wrong / Worker is down | Visit the Worker URL directly to confirm it's alive |
