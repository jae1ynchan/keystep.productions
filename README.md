# Key Step Productions — website

A small, fast, dependency-free website for **Key Step Productions** — an independent AI video studio in Hong Kong (founded 2026) that **makes its own videos with AI and publishes them**.

> **Positioning note.** This is the studio's own channel, not a client-services shop. There is no pricing, no "hire us", no project-brief language, and no promise of work for other people. The site says: here is what we make, here is how we make it, here is where to watch it. Keep it that way when you edit the copy — if you ever start taking commissions, that deserves its own page.

Built as four plain HTML pages plus one stylesheet and three small JavaScript files. There is **no build step, no framework, no tracking, and no external requests** — you can open `index.html` straight from the folder, or drop the whole folder onto any web host.

---

## 1. Look at it right now

Double-click **`index.html`** (it opens in your browser), or serve the folder:

```bash
cd keystep-productions
python3 -m http.server 8000
# then open http://127.0.0.1:8000/
```

Pages:

| File | What it is | Nav label |
|---|---|---|
| `index.html` | Home — the channel: what we publish, how we make it, studio notes, where to watch | Home |
| `about.html` | About Us — story, values, founder note, timeline | About Us |
| `projects.html` | **Other Projects** — games / side projects hub | Other Projects |
| `contact.html` | Contact Us — feedback, collaborations, music, ideas | Contact Us |

---

## 2. Things to do before you publish

Everything you normally need to touch lives in **one file**: `assets/js/site-config.js`.

```js
contactEmail: "hello@keystep.productions",  // ← your domain; change the part before @ if you like
contactEmailReady: false,                   // ← flip to true once it really receives mail
instagram: "https://www.instagram.com/keystepproductions/",
youtube: "", tiktok: "",                    // ← paste a URL and the footer link appears
formEndpoint: "",                           // ← optional, see §5
domain: "keystep.productions",
siteUrl: "https://keystep.productions",
```

1. **Email address.** `hello@keystep.productions` is already wired through the contact page, the footer and the form's "open in email app" button. **But owning a domain does not create a mailbox** — until one exists, mail to that address bounces, so the contact page shows "our mailbox is still being set up — DM us on Instagram" instead of pushing email. Two free ways to make it real:
   * **Cloudflare Email Routing** (free, needs your DNS at Cloudflare) — forwards `hello@keystep.productions` to your Gmail.
   * **ImprovMX** (free, works with any registrar) — same idea: add two MX records and a forwarding address.
   Once test mail arrives in your inbox: set `contactEmailReady: true` and the "still being set up" note disappears everywhere by itself.
2. **Years.** If you are reading this after 2026, search for `2026` in `index.html`, `about.html`, `assets/js/i18n.js` and `assets/js/site-config.js` and update the copyright / founding lines.
3. **Claims.** The copy says videos go "from script to published inside a week" (`about.v2.d`) and that every finished video gets published (`notes.2.d`). Both are promises to your audience — soften them in `assets/js/i18n.js` if they stop being true.
4. **Publishing channels.** Instagram is the channel today. When you post to YouTube or TikTok, paste the URL into `youtube:` / `tiktok:` above and the links appear in every footer automatically (they stay hidden while blank).
5. **The founder paragraph** (`about.founder.p1` / `about.founder.p2`) is deliberately worded so it reads well to a school or university admissions reader without turning the studio site into a personal statement. Rewrite it in your own voice — it is the one paragraph that should sound exactly like you.
6. **Link previews — already done.** Every page now carries `<link rel="canonical">` and absolute `og:url` / `og:image` URLs pointing at `https://keystep.productions`, so WhatsApp, WeChat and LinkedIn will show the logo when someone shares a link. If you move to another domain, search for `keystep.productions` across the four pages, `404.html`, `sitemap.xml`, `robots.txt`, `CNAME` and `site-config.js`.

---

## 3. Editing words and translations

All text lives in **`assets/js/i18n.js`**, three languages deep:

* `en` — English
* `zh-Hant` — 繁體中文
* `zh-Hans` — 简体中文

Rules:

* Change **values only**, never the key on the left (`"home.h1"`, `"publish.1.t"`, …).
* Keep every key in every language — a check script lives in `_tools/verify.py` (see §6).
* The HTML also contains the English text inline, so the site still reads correctly with JavaScript switched off. If you change English copy, **change it in both places** (`i18n.js` *and* the HTML tag) — `_tools/verify.py` fails loudly if they drift apart.

Add a fourth language: copy the `en` block in `i18n.js`, translate the values, add the code to `LANG_NAMES` in `assets/js/main.js`, then add a button next to `data-lang="zh-Hans"` in each page's header. The switcher remembers the visitor's choice in `localStorage` and auto-detects Chinese browsers.

---

## 4. The logo

The supplied logo (deep navy `#0C1F62` on white) was trimmed and converted to transparent PNGs so it sits on any background:

| File | Use |
|---|---|
| `assets/img/logo-wordmark.png` | "KEYSTEP" alone — header |
| `assets/img/logo-lockup.png` | full lockup with "Productions" — footer |
| `assets/img/favicon.png` | navy tile with the white **K** — browser tab |
| `assets/img/logo-original.webp` | your original upload, kept untouched |

The footer shows the navy lockup recoloured to white with one line of CSS (`filter: brightness(0) invert(1)`), so there is only ever one file to replace.

---

## 5. The contact form

There is no mail server yet, and a static site cannot send mail by itself. So the form does something more useful than pretending:

1. The visitor fills it in, the page validates name / email / message.
2. It then shows the finished message in a box with four options:
   * **Copy message**
   * **Open in email app** — a `mailto:` link pre-addressed to `contactEmail`
   * **Copy & DM on Instagram** — copies the text and opens your Instagram
   * **Back to the form**

Nothing is lost, nothing bounces, and it works on the day you publish. This page is for feedback, collaborations, music and ideas — not for quoting jobs.

**When you want real submissions** (a proper inbox, no mail client needed): create a free form endpoint (Formspree, Basin, Netlify Forms, Zapier…) and paste the URL into `formEndpoint` in `site-config.js`. The form will then `POST` JSON (`name`, `email`, `phone`, `project`, `message`) and show an inline thank-you instead. No other code changes.

---

## 6. Verification tools

`_tools/verify.py` is the check used while building the site. It:

* runs `i18n.js` in Node and compares all three languages key by key;
* confirms every `data-i18n` key used in HTML exists, and that the inline English matches the dictionary;
* fails on missing local files (`href` / `src`), missing `alt` text, multiple `<h1>`s, hand-written `.reveal` classes;
* checks the stylesheet for unbalanced braces.

```bash
cd keystep-productions
python3 _tools/verify.py     # needs node on the PATH
```

---

## 7. Hosting on GitHub Pages (keystep.productions)

Everything the custom domain needs is already in the folder: `CNAME` (containing `keystep.productions`), `.nojekyll` (stops GitHub's Jekyll step from skipping `_tools/`), `robots.txt`, `sitemap.xml` and a branded `404.html`.

**One-command deploy**

```bash
bash _tools/deploy.sh <your-github-username> keystep.productions
```

It initialises the repo if needed, commits, sets the remote and pushes — then prints the settings and DNS records below. If the repository does not exist yet, create an empty one at github.com/new (no README, no .gitignore) and re-run.

**Then, in this order** — add the domain in GitHub *before* touching DNS, or someone else could claim your domain on GitHub Pages:

| # | Where | What |
|---|---|---|
| 1 | Repo → Settings → Pages | Source: *Deploy from a branch* · Branch: `main` · folder `/ (root)` |
| 2 | Repo → Settings → Pages → Custom domain | type `keystep.productions` → **Save** (this writes/refreshes the `CNAME` file for you) |
| 3 | Your registrar's DNS | add the records below; delete any default A/CNAME the registrar added |
| 4 | Repo → Settings → Pages | tick **Enforce HTTPS** once it becomes available (up to 24 h after DNS is correct) |
| 5 | Terminal | `dig keystep.productions +noall +answer -t A` should return the four GitHub IPs |

DNS records — these are GitHub's own published values for an apex domain:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `<your-github-username>.github.io` |

Do **not** add a wildcard (`*`) record — GitHub warns that it enables domain takeover. With the `www` CNAME in place, GitHub automatically redirects `www.keystep.productions` → `keystep.productions`.

**Email.** GitHub Pages serves web pages only; it cannot receive mail. Set up Cloudflare Email Routing or ImprovMX (§2 step 1), then flip `contactEmailReady` to `true`.

**Alternatives** — any static host works, because there is nothing to compile: drag the folder onto app.netlify.com/drop, or point Cloudflare Pages / Vercel at it (no build command, publish directory = the folder itself).

**Updating the live site** afterwards is just:

```bash
cd keystep-productions
git add -A && git commit -m "update" && git push
```

`projects/` contains copies of three of your games (`dino-runner.html`, `hulk-runner.html`, `fps-snake.html`) so the Other Projects page keeps working when the site is deployed on its own. If you host a game somewhere else instead, just change that card's `href` in `projects.html` to the full `https://…` address — the card is a plain link.

---

## 8. Structure

```
keystep-productions/
├── index.html                    home
├── about.html                    about us
├── projects.html                 other projects (games / side projects)
├── contact.html                  contact form
├── 404.html                      branded not-found page (absolute paths — needed for deep URLs)
├── CNAME                         keystep.productions — GitHub Pages custom domain
├── .nojekyll                     disables Jekyll so _tools/ is published as-is
├── robots.txt / sitemap.xml      search-engine plumbing for https://keystep.productions
├── assets/
│   ├── css/style.css             all styling (design tokens at the top)
│   ├── js/site-config.js         ← the only file you must edit to go live
│   ├── js/i18n.js                all text, EN / 繁 / 简
│   ├── js/main.js                language switch, mobile nav, form, reveal
│   └── img/                      logo set + favicon
├── projects/                     the three playable games
└── _tools/
    ├── verify.py                 consistency + deployment checker
    └── deploy.sh                 one-command push to GitHub Pages
```

---

## 9. Accessibility & performance notes

* Skip link, single `<h1>` per page, landmarks (`header`/`main`/`footer`/`nav`), labelled form fields, `aria-current` on the active nav item, `aria-pressed` on the language buttons, `aria-live` on the form result.
* Honours `prefers-reduced-motion` — the animated hero pipeline stops, scroll reveals stop.
* Everything degrades: with JavaScript off you still get the full English site, working links and a fully readable contact page.
* No fonts, no images beyond the logo, no third-party scripts — the whole site is well under 500 KB including the games.
