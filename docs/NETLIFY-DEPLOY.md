# Deploy to Netlify — single-platform, GitHub-connected

## What this gets you

Netlify hosts **both** the static app and the Notion proxy on the same
domain, on a single free plan. No DNS work, no separate Cloudflare
account, no Wix involvement. Auto-deploys whenever you push to GitHub.

After this:

- `https://your-site.netlify.app/` → the live app (or your custom subdomain)
- `https://your-site.netlify.app/api/notion/v1/*` → the Notion proxy
- The setup wizard auto-detects the built-in proxy and lights up "✓ Built-in proxy detected"
- Notion test/verify/bootstrap **just work** with no extra URL pasting

Total time: ~5 minutes (most of it Netlify auto-builds).

---

## Step-by-step

### 1. Sign in to Netlify with GitHub

- <https://app.netlify.com/signup>
- Choose **GitHub** as your sign-in provider (uses your `cracksontheroad` account)
- Grant Netlify read access to repos

### 2. Import the repo

- Click **Add new site** → **Import an existing project**
- Pick **Deploy with GitHub**
- Select **`cracksontheroad/easy-essay-app`**
- Branch: `main`
- **Leave build settings empty** — `netlify.toml` in the repo configures everything:
  - Build command: *(empty)*
  - Publish directory: `.`
  - Functions directory: `netlify/functions`
- Click **Deploy site**

Within ~30 seconds you'll see a green "Published" badge and a generated URL like:

```
https://stupendous-pavlova-1a2b3c.netlify.app
```

### 3. Test the proxy is alive

In a new browser tab:

```
https://your-netlify-url.netlify.app/api/notion/health
```

Expected response:

```json
{
  "ok": true,
  "service": "easy-essay-notion-proxy",
  "runtime": "netlify-function",
  "forwards": "https://api.notion.com",
  "paths": "/api/notion/v1/*"
}
```

If you see that JSON, the proxy is working. The setup wizard will auto-detect it.

### 4. Try the app

Open `https://your-netlify-url.netlify.app/` (the URL Netlify gave you).

The setup wizard opens automatically. Expand Step 2 — at the top you should
see a green banner: **"✓ Built-in proxy detected at /api/notion. No external
setup needed — proceed to Step 1."**

Paste:
1. Your Notion token → **Test token** (green tick)
2. Your Notion page URL → **Verify page access** (green tick)
3. **⊕ Create the 4 databases**

That's it. Notion integration is live.

### 5. (Optional) Connect a custom subdomain

When the Wix CNAME for `essay.sailedu.co` propagates, point it at Netlify
instead of Cloudflare Pages:

- Netlify dashboard → your site → **Domain management** → **Add custom domain**
- Enter `essay.sailedu.co`
- Netlify gives you a CNAME target (e.g. `something.netlify.app`)
- Update your Wix DNS to point `essay` → that CNAME target
- Wait for SSL provisioning (~5 min)

After that, `https://essay.sailedu.co/` serves the live app and
`https://essay.sailedu.co/api/notion/*` serves the proxy.

### 6. Update the Wix iframe (optional)

If you want the Wix page at `sailedu.co/essay-writing-tool` to point at
the new Netlify URL instead of `cracksontheroad.github.io`, change the
iframe `src` to the Netlify URL (or `essay.sailedu.co` once that resolves).

---

## What changed in the repo to make this work

| File | Purpose |
|---|---|
| `netlify/functions/notion-proxy.mjs` | The proxy function — Netlify auto-discovers it via the `path: "/api/notion/*"` export |
| `netlify.toml` | Build config, function directory, security + cache headers |
| `notion.js` | Probes `/api/notion/health` on load; uses same-origin proxy if available |
| `index.html` setup wizard | Hides the "external proxy URL" requirement once the built-in is detected |

The Cloudflare Worker files (`cloudflare-worker/notion-proxy.js`, `docs/CLOUDFLARE-WORKER-DEPLOY.md`) stay in the repo as an alternative — they're not needed if you go Netlify.

---

## Updating the app later

Every `git push` to `main` triggers a Netlify auto-deploy. Within ~60 seconds
the new version is live worldwide. Same flow as Cloudflare Pages.

---

## Costs

| | Cost |
|---|---|
| Netlify free tier | 100 GB bandwidth/month, 300 build-minutes/month, 125 000 function invocations/month |
| Custom domain | Already paid via Wix |
| Total | **$0/month** |

The function-invocation limit is per Notion API call — each push or pull
is 1–10 invocations. A class of 30 students writing 4 essays each over a
term would use maybe 5 000 invocations. We're orders of magnitude under
the free-tier limits.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/notion/health` returns 404 | Function didn't deploy | Netlify dashboard → Deploys → Functions tab — should show `notion-proxy`. If missing, redeploy. |
| Function deployed but proxy banner stays grey | `_probeSameOriginProxy` didn't finish before banner rendered | Refresh; the banner updates on a 500ms + 1500ms retry. |
| Notion test fails with `502 / Upstream fetch failed` | Notion outage (rare) | Try again in a minute, check status.notion.so |
| `401` from Notion | Token wrong | Re-copy from notion.so/profile/integrations |
| `404 / object_not_found` on Verify page | Integration not shared with that page | In Notion: page → … → Connections → add integration |
