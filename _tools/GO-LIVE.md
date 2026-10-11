# Go live on GitHub Pages — step by step

**Goal:** `https://keystep.productions` serving this folder, with the padlock, and `hello@keystep.productions` eventually landing in your inbox.

Time: about 20 minutes of clicking, plus waiting for DNS (minutes → a few hours).

Tick these off in order. Don't skip ahead: step 5 (adding the domain on GitHub) must happen **before** step 6 (DNS), or someone else could claim your domain on GitHub Pages.

---

## 0. What you need first

- [ ] A GitHub account — create one at **https://github.com/signup** if you don't have one
- [ ] Your GitHub **username** (the short name in your profile URL)
- [ ] Login for the registrar where you bought `keystep.productions`
- [ ] Terminal open (Spotlight → "Terminal")

---

## 1. Install the GitHub CLI

```bash
brew install gh
gh --version
```

Expect `gh version 2.x`. If Homebrew isn't installed, get the macOS installer from **https://cli.github.com**.

- [ ] `gh --version` prints a version

---

## 2. Log in (you keep the password — I never see it)

```bash
gh auth login
```

Answer the prompts like this:

| Prompt | Choose |
|---|---|
| What account do you want to log into? | **GitHub.com** |
| What is your preferred protocol for Git operations? | **HTTPS** |
| Authenticate Git with your GitHub credentials? | **Yes** |
| How would you like to authenticate GitHub CLI? | **Login with a web browser** |

It prints a one-time code (`XXXX-XXXX`), press **Enter**, your browser opens `github.com/login/device`, paste the code, click **Authorize**.

```bash
gh auth status
```

Expect `✓ Logged in to github.com account <your-username>`.

- [ ] `gh auth status` shows you're logged in

> **Tell me when this is done** and I can run steps 3, 4, 5, 7, 8 and 9 for you.

---

## 3. Create the repository and push the site

```bash
gh repo create keystep.productions --public
```

`--public` matters: GitHub Pages on a free account only serves public repositories.

```bash
cd /Users/jaelyn/Projects/keystep-productions
bash _tools/deploy.sh <your-username> keystep.productions
```

The script initialises git, commits all 24 files and pushes. Expect:

```
==> committed 24 file(s)
==> pushing to https://github.com/<you>/keystep.productions.git
```

- [ ] Repo exists at `https://github.com/<you>/keystep.productions`
- [ ] It contains `index.html`, `assets/`, `CNAME`, `404.html`

**Every future update** is then just:

```bash
cd /Users/jaelyn/Projects/keystep-productions
git add -A && git commit -m "update" && git push
```

---

## 4. Turn on Pages

On GitHub: **repo → Settings → Pages**

| Field | Value |
|---|---|
| Source | **Deploy from a branch** |
| Branch | **main** |
| Folder | **/ (root)** |

Click **Save**. After ~1 minute the page shows *"Your site is live at `https://<you>.github.io/keystep.productions/`"*.

Open that URL — the site should appear (English, working links). It's fine that it isn't on your domain yet.

- [ ] The `github.io` URL loads the site

---

## 5. Add the custom domain on GitHub (BEFORE touching DNS)

Still in **Settings → Pages**:

1. Under **Custom domain**, type `keystep.productions`
2. Click **Save**
3. GitHub will say *"DNS check in progress"* — expected, you haven't added the records yet
4. Ideally also click **Verify** next to it (Account settings → Pages → Add a domain). It gives you a `TXT` record named `_github-pages-challenge-<you>` — add that in step 6 too. Verifying blocks anyone else from claiming your domain.

- [ ] Custom domain saved (it says it will check DNS)
- [ ] Verification TXT record noted (optional but recommended)

---

## 6. Add the DNS records at your registrar

Log in where you bought the domain → **DNS** / **Manage DNS** / **Advanced DNS**.

1. **Delete** any existing `A` or `CNAME` records for `@` and `www`.
   *Keep* any `MX` or `TXT` records — those are for email.
2. Add these (these are GitHub's published values):

| Type | Name / Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `<your-username>.github.io` |

Notes:
- `@` may be shown as blank, or as `keystep.productions`, depending on the registrar — same thing.
- Do **not** add a wildcard (`*`) record.
- If your DNS is at **Cloudflare**, set these records to **DNS only** (grey cloud), not Proxied (orange) — the proxy breaks GitHub's verification.
- The `www` CNAME must point to `<your-username>.github.io` — no repo name on the end.

- [ ] Records added, old ones removed

---

## 7. Check that DNS is live

Wait a few minutes, then:

```bash
dig keystep.productions +noall +answer -t A
dig www.keystep.productions +nostats +nocomments +nocmd
```

The first should return the four `185.199.1xx.153` addresses. If it returns nothing, DNS hasn't propagated yet — try again in 15 minutes (it can take a few hours; GitHub allows up to 24).

Refresh **Settings → Pages**: the DNS check should now be green and read *"Your site is published at https://keystep.productions"*.

- [ ] `dig` returns the four GitHub IPs
- [ ] Pages shows the domain as verified

---

## 8. Turn on HTTPS

**Settings → Pages → Enforce HTTPS** — tick it.

It's greyed out until GitHub has issued the certificate, which can take up to 24 hours after DNS is correct. If it's unavailable, come back later and refresh.

- [ ] Enforce HTTPS is ticked

---

## 9. Confirm it's really live

```bash
curl -I https://keystep.productions
```

Expect `HTTP/2 200`. Then in a browser:

- [ ] `https://keystep.productions` loads with a padlock
- [ ] `https://www.keystep.productions` redirects to the apex domain
- [ ] The language switcher (EN / 繁 / 简) works
- [ ] A bogus URL like `https://keystep.productions/nope` shows the branded 404 page
- [ ] Sharing the link in WhatsApp/WeChat shows the logo preview

---

## 10. Email (separate from hosting — GitHub Pages cannot receive mail)

Pick one free forwarding service and point `hello@keystep.productions` at your Gmail:

- **ImprovMX** (https://improvmx.com) — works with any registrar. Add the domain, then add the MX records it gives you (`mx1.improvmx.com` priority 10, `mx2.improvmx.com` priority 20) plus its SPF `TXT` record, and set the alias `hello@keystep.productions → yourname@gmail.com`.
- **Cloudflare Email Routing** — free and excellent, but your DNS has to be hosted at Cloudflare.

Then test: send an email to `hello@keystep.productions` from a different address and confirm it arrives.

Once it does, the site should stop saying "our mailbox is still being set up":

```bash
cd /Users/jaelyn/Projects/keystep-productions
# in assets/js/site-config.js change: contactEmailReady: false  ->  true
git add -A && git commit -m "mailbox is live" && git push
```

- [ ] Test email arrives in your inbox
- [ ] `contactEmailReady: true` pushed (or ask me to do it)

---

## If something goes wrong

| Symptom | Cause / fix |
|---|---|
| `github.io` URL 404s | Pages source not set to `main` / `(root)`, or the push landed on another branch |
| Domain 404s but `github.io` works | DNS not propagated, a typo in the IPs, or Cloudflare proxy is on (set DNS only) |
| "Enforce HTTPS" greyed out | Certificate not issued yet — wait, up to 24 h |
| Browser says "connection is not private" | Same as above; don't tick Enforce HTTPS before the cert exists |
| `git push` asks for a password | Use step 2 (`gh auth login`), or paste a Personal Access Token as the password |
| Pages says the domain is "already taken" | It's configured on another repo/account — remove it there, or verify ownership |
| Site shows an old version | GitHub Pages/CDN caching — hard-refresh (Cmd+Shift+R), it clears in a minute or two |
| `deploy.sh` says the push failed | The repo doesn't exist yet — run `gh repo create keystep.productions --public` first |

Reference: [GitHub Docs — managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
