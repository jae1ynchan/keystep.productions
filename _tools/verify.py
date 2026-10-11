#!/usr/bin/env python3
"""Static checks for the Key Step Productions site.

    python3 _tools/verify.py          # needs `node` on the PATH

Checks: every language has every key, every key used in the HTML exists,
the inline English text matches the dictionary, local links/assets exist,
one <h1> per page, alt text on images, balanced CSS braces.
Exit code 0 = all good, 1 = something to fix.
"""
import html.parser, json, os, re, subprocess, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "about.html", "projects.html", "contact.html", "404.html"]
LANGS = ["en", "zh-Hant", "zh-Hans"]
problems = []
notes = []


def load_dict():
    """Run i18n.js in node and dump the dictionary as JSON."""
    js = (
        "global.window={};"
        "require('%s/assets/js/i18n.js');"
        "process.stdout.write(JSON.stringify(window.KSP_I18N));"
    ) % ROOT
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if out.returncode != 0:
        print("node failed:", out.stderr)
        sys.exit(1)
    return json.loads(out.stdout)


class Scanner(html.parser.HTMLParser):
    """Collect i18n keys, element text, and link/src targets."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.keys = {}        # key -> text content (first occurrence)
        self.ph = []          # placeholder keys
        self.labels = []
        self.refs = []        # (attr, value)
        self.stack = []
        self.buf = {}
        self.tags = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append(tag)
        for attr, val in attrs:
            if attr in ("href", "src"):
                self.refs.append((tag, attr, val))
        if "data-i18n" in a:
            self.stack.append(a["data-i18n"])
            self.buf[a["data-i18n"]] = ""
        if "data-i18n-ph" in a:
            self.ph.append(a["data-i18n-ph"])
        if "data-i18n-label" in a:
            self.labels.append(a["data-i18n-label"])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_data(self, data):
        for k in self.stack:
            self.buf[k] += data

    def handle_endtag(self, tag):
        if self.stack and tag in ("a", "h1", "h2", "h3", "h4", "p", "span", "li",
                                  "button", "label", "option", "div", "b"):
            k = self.stack.pop()
            text = re.sub(r"\s+", " ", self.buf.pop(k, "")).strip()
            self.keys.setdefault(k, text)


def main():
    d = load_dict()

    for lang in LANGS:
        if lang not in d:
            problems.append("language missing from i18n: %s" % lang)
    en = d.get("en", {})

    # 1. every language must define every key
    for key in en:
        for lang in LANGS:
            if key not in d[lang]:
                problems.append("key '%s' missing in %s" % (key, lang))
            elif not str(d[lang][key]).strip():
                problems.append("key '%s' is empty in %s" % (key, lang))
    for lang in LANGS:
        for key in d[lang]:
            if key not in en:
                problems.append("key '%s' in %s has no English original" % (key, lang))

    used = set()
    ref_count = [0]
    for page in PAGES:
        src = open(os.path.join(ROOT, page), encoding="utf-8").read()
        s = Scanner()
        s.feed(src)
        used |= set(s.keys) | set(s.ph) | set(s.labels)

        # 2. keys referenced by HTML must exist
        for k in list(s.keys) + s.ph + s.labels:
            if k not in en:
                problems.append("%s: unknown i18n key '%s'" % (page, k))

        # 3. the built-in English text must match the dictionary
        for k, text in s.keys.items():
            if k in en and text and text != en[k]:
                problems.append("%s: default text for '%s' differs\n    html: %s\n    en  : %s"
                                % (page, k, text, en[k]))

        # 4. local links / assets must exist
        ref_count[0] += len(s.refs)
        for tag, attr, val in s.refs:
            if not val or val.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:")):
                continue
            path = urllib.parse.urlparse(val).path
            if path.startswith("/"):
                # absolute URLs are served from the site root (404.html needs them)
                path = path.lstrip("/") or "index.html"
            target = os.path.join(ROOT, path)
            if not os.path.exists(target):
                problems.append("%s: <%s %s=\"%s\"> not found on disk" % (page, tag, attr, val))

        # 5. structure: single h1, one <main>, img alt present, title
        h1 = re.findall(r"<h1[\s>]", src)
        if len(h1) != 1:
            problems.append("%s: expected exactly 1 <h1>, found %d" % (page, len(h1)))
        if src.count("<main") != 1:
            problems.append("%s: expected exactly 1 <main>" % page)
        for m in re.finditer(r"<img\b[^>]*>", src):
            if "alt=" not in m.group(0):
                problems.append("%s: <img> without alt: %s" % (page, m.group(0)[:70]))
        if "<title>" not in src:
            problems.append("%s: no <title>" % page)
        for tag in ("html", "body"):
            if "<%s" % tag not in src:
                problems.append("%s: no <%s>" % (page, tag))
        # every page carries the same nav + footer
        for needle in ('id="primary-nav-wrap"', 'class="footer"', 'data-lang="zh-Hant"',
                       'data-lang="zh-Hans"', 'assets/js/main.js'):
            if needle not in src:
                problems.append("%s: missing %s" % (page, needle))
        # data-reveal only on elements (JS adds .reveal), never hand-written .reveal
        if 'class="reveal' in src or "class='reveal" in src:
            problems.append("%s: hand-written .reveal class (JS must add it)" % page)

    # keys that only JavaScript uses (placeholders, error messages, page titles)
    js_text = ""
    for name in sorted(os.listdir(os.path.join(ROOT, "assets/js"))):
        if name.endswith(".js"):
            js_text += open(os.path.join(ROOT, "assets/js", name), encoding="utf-8").read()
    for key in en:
        if ('"%s"' % key) in js_text:
            used.add(key)
    used |= set(k for k in en if k.startswith("doc."))

    # 6. unused keys (informational)
    for key in en:
        if key not in used and not key.startswith("doc."):
            notes.append("key not used by any page: %s" % key)

    # 7. deployment config (GitHub Pages + custom domain)
    DOMAIN = "keystep.productions"
    SITE = "https://" + DOMAIN
    URLS = {"index.html": SITE + "/", "about.html": SITE + "/about.html",
            "projects.html": SITE + "/projects.html", "contact.html": SITE + "/contact.html"}

    cname = os.path.join(ROOT, "CNAME")
    if not os.path.exists(cname):
        problems.append("CNAME file missing (needed for the GitHub Pages custom domain)")
    elif open(cname, encoding="utf-8").read().strip() != DOMAIN:
        problems.append("CNAME must contain exactly %s" % DOMAIN)

    if not os.path.exists(os.path.join(ROOT, ".nojekyll")):
        problems.append(".nojekyll missing (Jekyll would skip _tools/ and _-prefixed files)")

    for page, url in URLS.items():
        src = open(os.path.join(ROOT, page), encoding="utf-8").read()
        if '<link rel="canonical" href="%s">' % url not in src:
            problems.append("%s: canonical link missing or wrong (want %s)" % (page, url))
        if '<meta property="og:url" content="%s">' % url not in src:
            problems.append("%s: og:url missing or wrong (want %s)" % (page, url))
        if '<meta property="og:image" content="%s/assets/img/logo-lockup.png">' % SITE not in src:
            problems.append("%s: og:image must be an absolute %s URL" % (page, SITE))

    s404 = open(os.path.join(ROOT, "404.html"), encoding="utf-8").read()
    if 'name="robots" content="noindex"' not in s404:
        problems.append("404.html: should carry <meta name=\"robots\" content=\"noindex\">")
    if 'href="/assets/css/style.css"' not in s404:
        problems.append("404.html: asset paths must be absolute (/assets/...) for deep URLs")

    smap = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
    for page, url in URLS.items():
        if "<loc>%s</loc>" % url not in smap:
            problems.append("sitemap.xml: missing %s" % url)
    if "404.html" in smap:
        problems.append("sitemap.xml: the 404 page must not be listed")

    robots = open(os.path.join(ROOT, "robots.txt"), encoding="utf-8").read()
    if "Sitemap: %s/sitemap.xml" % SITE not in robots:
        problems.append("robots.txt: missing the sitemap line")

    cfg = open(os.path.join(ROOT, "assets/js/site-config.js"), encoding="utf-8").read()
    if "@" + DOMAIN not in cfg:
        problems.append("site-config.js: contactEmail should be on %s" % DOMAIN)
    if "keystepproductions.com" in cfg:
        problems.append("site-config.js: still references the old placeholder domain")

    # 8. css sanity
    css = open(os.path.join(ROOT, "assets/css/style.css"), encoding="utf-8").read()
    if css.count("{") != css.count("}"):
        problems.append("style.css: unbalanced braces (%d { vs %d })" % (css.count("{"), css.count("}")))
    for cls in ["hero", "reel", "masthead", "nav__list", "lang", "footer", "card__foot",
                "form-result", "info-list", "notice", "timeline", "band", "stats"]:
        if "." + cls not in css:
            problems.append("style.css: missing rule for .%s" % cls)

    print("pages checked      : %s" % ", ".join(PAGES))
    print("languages          : %s" % ", ".join("%s (%d keys)" % (l, len(d[l])) for l in LANGS))
    print("keys used in HTML  : %d / %d defined" % (len(used), len(en)))
    print("local links checked: %d" % ref_count[0])
    print("deployment         : CNAME, .nojekyll, robots.txt, sitemap.xml, canonical/OG URLs, 404")
    print()
    if notes:
        print("notes (%d):" % len(notes))
        for n in notes:
            print("  - " + n)
        print()
    if problems:
        print("PROBLEMS (%d):" % len(problems))
        for p in problems:
            print("  ! " + p)
        sys.exit(1)
    print("All checks passed.")


main()
