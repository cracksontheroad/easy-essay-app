# Wix iframe embed — interim host

**Goal:** the app is live at `https://cracksontheroad.github.io/easy-essay-app/`
right now. To show it at `https://www.sailedu.co/essay-writing-tool` while we
wait for the `essay.sailedu.co` CNAME to propagate (up to 48 hours), embed it
inside a Wix page via an HTML iframe.

## Steps in Wix

1. **Editor → Pages → Add Page** (or open the existing `/essay-writing-tool` page if you've already created it).
2. **Name**: `Essay Writing Tool`. **URL slug**: `essay-writing-tool`.
3. **Settings for this page** → recommended:
   - Hide header / hide footer (so the app feels full-screen). Wix supports this per page.
   - SEO title: *"University Essay Writing Tool Kit — SAILedu"*
   - SEO description: *"Getting ready for university. ESL guide to AI Prompt Engineering and Academic writing for Chinese students."*
4. **Add element → Embed Code → Embed HTML / Custom Code → "+ Embed HTML"** (Wix calls this slightly different things in different editor versions; you're looking for the option that lets you paste raw HTML).
5. **Resize** the embed element to fill the page — drag the corners. Wix's HTML element usually starts small (300×200).
6. **Paste** the code block below into the embed's source editor.
7. **Save** + **Publish**.

## Embed code

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: #f8fafc; }
    .ee-wrap { position: absolute; inset: 0; }
    .ee-frame {
      width: 100%; height: 100%; border: 0;
      display: block; background: #f8fafc;
    }
    .ee-fallback {
      position: absolute; bottom: 12px; right: 12px;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 100px;
      padding: 6px 14px; font: 600 0.8rem -apple-system, system-ui, sans-serif;
      color: #6d28d9; text-decoration: none; box-shadow: 0 4px 12px rgba(15,23,42,0.08);
    }
    .ee-fallback:hover { background: #ede9fe; }
  </style>
</head>
<body>
  <div class="ee-wrap">
    <iframe class="ee-frame"
            src="https://cracksontheroad.github.io/easy-essay-app/"
            title="University Essay Writing Tool Kit"
            allow="clipboard-read; clipboard-write; fullscreen; web-share"
            referrerpolicy="no-referrer-when-downgrade"
            loading="eager"></iframe>
    <a class="ee-fallback" href="https://cracksontheroad.github.io/easy-essay-app/" target="_blank" rel="noopener">↗ Open in new tab</a>
  </div>
</body>
</html>
```

## What the iframe allows

The `allow=` attribute grants the embedded app the specific browser permissions it needs:

- **`clipboard-read; clipboard-write`** — for the "Copy draft" and "Copy declaration" buttons
- **`fullscreen`** — for the "click to enlarge" infographic behavior
- **`web-share`** — so the app can fire the native share sheet on mobile

Other features behave normally inside an iframe (Notion sync, AI API calls, localStorage).

## Caveats while running in this iframe

These limitations are **temporary** — they go away once we switch to `essay.sailedu.co`:

| Feature | Inside the iframe | On the future `essay.sailedu.co` |
|---|---|---|
| "Add to Home Screen" / PWA install | ❌ Browsers don't expose this for iframed content | ✅ Full PWA install |
| Service worker / offline cache | ❌ Service workers don't register on iframed pages | ✅ Works |
| Notion OAuth flow (if we add it later) | Requires popup window or top-window redirect | ✅ Works directly |
| Mobile UX | Slightly cramped (Wix's chrome on top) | ✅ Full screen |
| Everything else (writing, AI, Notion sync, exports, etc.) | ✅ Works | ✅ Works |

The "↗ Open in new tab" pill in the bottom-right of the iframe is a safety valve — students can pop out into a real browser tab for the best experience.

## Switchover when CNAME is live

When `essay.sailedu.co` starts resolving (within 48 hours), do two things:

1. Update the iframe's `src` from `https://cracksontheroad.github.io/easy-essay-app/` to `https://essay.sailedu.co/` (also update the fallback link).
2. **Or** replace the iframe with the marketing landing page from `docs/WIX-LANDING-PAGE.md` — that turns the Wix page into a proper marketing landing page with a big violet "Launch the tool →" button, and the actual app lives on its own subdomain where PWA install works cleanly.

The marketing-page-with-link approach is the better long-term setup; the iframe is appropriate as a temporary bridge.
