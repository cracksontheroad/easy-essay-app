# Hosting setup — `essay.sailedu.co` on Cloudflare Pages

This is the one-time setup that gets the app deployed to a live URL. The
app itself is already production-ready — this guide just walks through
publishing it.

**Total time:** ~30 minutes, most of it waiting for DNS to propagate.

---

## What you'll end up with

- **`https://essay.sailedu.co`** — the live, production app, HTTPS, fast worldwide
- A GitHub repository holding the source code
- Auto-deploys: every time we update the app, `git push` ships the change worldwide within ~60 seconds
- Free forever — Cloudflare Pages and GitHub free tiers cover orders of magnitude more traffic than this will ever produce

---

## Step 1 · GitHub (~5 min)

If you already have a GitHub account, skip to 1.4.

1.1. Go to <https://github.com/signup>. Sign up with your email + a password.
1.2. Verify your email.
1.3. **(Optional)** Add 2-factor auth → Settings → Password and authentication.
1.4. Tell me your GitHub username. I'll create the repository named `easy-essay-app` under your account and push the entire current codebase to it. *(If you'd rather a private repo, that's fine — Cloudflare Pages supports private repos too.)*

---

## Step 2 · Cloudflare (~5 min)

2.1. Go to <https://dash.cloudflare.com/sign-up>. Use the same email as GitHub if you like, or a different one. Free plan.
2.2. Verify your email.
2.3. You should land on the Cloudflare dashboard. Note: **don't** add your `sailedu.co` domain to Cloudflare yet — Wix is managing it. We're using Cloudflare only for Pages hosting; DNS stays at Wix.
2.4. In the left sidebar click **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2.5. Authorize Cloudflare to read your GitHub. Select the `easy-essay-app` repo.
2.6. **Build settings** — leave everything blank / default. There is no build step. Specifically:
   - Build command: *(leave empty)*
   - Build output directory: `/`
   - Root directory: `/`
2.7. Click **Save and Deploy**. After ~30 seconds you'll get a temporary URL like `easy-essay-app.pages.dev`. **Copy this** — you'll see the app live there.

---

## Step 3 · Custom domain (`essay.sailedu.co`) (~10 min)

This is the only step where Wix and Cloudflare have to talk to each other.

### 3a. Add the custom domain in Cloudflare

3a.1. In your Cloudflare Pages project, click **Custom domains** → **Set up a custom domain**.
3a.2. Enter **`essay.sailedu.co`** and click **Continue**.
3a.3. Cloudflare will say "Add this CNAME record to your DNS provider" and give you a target like `easy-essay-app.pages.dev`. **Copy that target.**

### 3b. Add the CNAME at Wix

3b.1. In Wix → **Settings** → **Domains** → click `sailedu.co` → **Advanced** → **DNS records**.
3b.2. Click **Add Record** → choose **CNAME**.
3b.3. Fill in:
   - **Host name** (or "Name" / "Subdomain"): `essay`
   - **Points to** (or "Value" / "Target"): the `*.pages.dev` URL Cloudflare gave you in 3a.3
   - **TTL**: leave default (1 hour or 3600)
3b.4. Save.

### 3c. Wait for DNS + verify

3c.1. DNS propagation usually takes 5–30 minutes but can take up to a few hours.
3c.2. Back in Cloudflare Pages, the custom-domain row will show **"Verifying"** then **"Active"**.
3c.3. Once Active, visit **`https://essay.sailedu.co`** in a fresh browser tab. The app should load with a green padlock.

---

## Step 4 · Wix landing page (~5 min)

The marketing page at `sailedu.co/essay-writing-tool` that introduces the tool and links to it.

See `docs/WIX-LANDING-PAGE.md` for the exact HTML to paste into a Wix HTML Embed element on a new Wix page with the slug `essay-writing-tool`.

---

## Step 5 · Test on phone

5.1. Open `https://essay.sailedu.co` on your phone.
5.2. Tap your browser menu → **Add to Home Screen** (iOS Safari, Chrome Android).
5.3. The app installs with a custom icon (violet square + graduation cap). Launch it from the home screen — it opens like a native app, no browser chrome, works offline after first load.

---

## Updating the app later

Whenever we change the code:

1. I commit and push to GitHub.
2. Cloudflare Pages detects the push within ~5 seconds and deploys.
3. Within ~60 seconds the new version is live worldwide.
4. Students get the update automatically on their next visit (service worker refreshes the cache).

No manual deploys, no FTP, no Wix mucking around.

---

## Costs

| Service | Cost |
|---|---|
| GitHub | $0 |
| Cloudflare Pages | $0 |
| Domain (`sailedu.co`) | already paid via Wix |
| Total | **$0 / month** |

Free tiers cover us up to roughly 500 builds / month and 100,000 requests / day. We will never approach those limits with a curriculum-book audience.

---

## Things that might go wrong

- **CNAME pointing fails**: some hosts (older Wix configurations) can't CNAME a subdomain when the apex is also managed by them. If Wix's CNAME form rejects `essay`, the fallback is to point Wix's `essay` subdomain to Cloudflare's IP via an **A record** instead. Cloudflare provides the IP on the same setup screen.
- **HTTPS shows "not secure" for a few minutes**: Cloudflare provisions the certificate after DNS resolves. Refresh in 5–10 minutes.
- **Mainland China access**: Cloudflare Pages is generally accessible from mainland China. If a specific user reports it doesn't load there, the ZIP fallback we already ship is the workaround — `easy-essay-app-v2.6-students.zip` is sent as an email attachment, students unzip + run the included `start.sh` / `start.bat`.

---

## What I (Claude) need from you to start

Just two things:

1. Your **GitHub username** (or that you've created an account).
2. A green light to **add the CNAME record in Wix** when I tell you the target.

I'll do everything else — repo creation, push, Cloudflare project setup, PWA verification.
