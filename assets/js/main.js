/* ==========================================================================
   Key Step Productions — site behaviour
   Plain ES5-ish JavaScript. No frameworks, no build step, no tracking.
   Sections: 1 language  2 mobile nav  3 scroll reveal  4 contact form
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.KSP_CONFIG || {};
  var DICT = window.KSP_I18N || {};
  var LANG_NAMES = { "en": "English", "zh-Hant": "繁體中文", "zh-Hans": "简体中文" };
  var STORAGE_KEY = "ksp-lang";

  /* ======================================================================
     1. LANGUAGE
     ====================================================================== */
  function detectLang() {
    var saved = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && DICT[saved]) { return saved; }

    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (nav.indexOf("zh") === 0) {
      // zh-CN / zh-SG / hans => simplified, everything else => traditional
      if (nav.indexOf("hans") > -1 || nav.indexOf("cn") > -1 || nav.indexOf("sg") > -1) {
        return "zh-Hans";
      }
      return "zh-Hant";
    }
    return "en";
  }

  function t(lang, key) {
    var pack = DICT[lang] || DICT["en"] || {};
    if (typeof pack[key] === "string") { return pack[key]; }
    if (DICT["en"] && typeof DICT["en"][key] === "string") { return DICT["en"][key]; }
    return null;
  }

  function applyLang(lang) {
    if (!DICT[lang]) { lang = "en"; }

    document.documentElement.setAttribute("lang", lang);

    // text
    each(document.querySelectorAll("[data-i18n]"), function (el) {
      var v = t(lang, el.getAttribute("data-i18n"));
      if (v !== null) { el.textContent = v; }
    });

    // placeholders
    each(document.querySelectorAll("[data-i18n-ph]"), function (el) {
      var v = t(lang, el.getAttribute("data-i18n-ph"));
      if (v !== null) { el.setAttribute("placeholder", v); }
    });

    // aria-labels
    each(document.querySelectorAll("[data-i18n-label]"), function (el) {
      var v = t(lang, el.getAttribute("data-i18n-label"));
      if (v !== null) { el.setAttribute("aria-label", v); }
    });

    // page title
    var page = document.body ? document.body.getAttribute("data-page") : null;
    if (page) {
      var title = t(lang, "doc." + page);
      if (title) { document.title = title; }
    }

    // language buttons
    each(document.querySelectorAll("[data-lang]"), function (btn) {
      var on = btn.getAttribute("data-lang") === lang;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("title", LANG_NAMES[btn.getAttribute("data-lang")] || "");
    });

    // let the contact form rebuild its message in the right language
    if (window.KSP_FORM && window.KSP_FORM.refresh) { window.KSP_FORM.refresh(); }

    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function initLangSwitch() {
    each(document.querySelectorAll("[data-lang]"), function (btn) {
      btn.addEventListener("click", function () {
        applyLang(btn.getAttribute("data-lang"));
      });
    });
    applyLang(detectLang());
  }

  /* ======================================================================
     2. MOBILE NAV
     ====================================================================== */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("primary-nav-wrap");
    if (!toggle || !nav) { return; }

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    each(nav.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setOpen(false); }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) { setOpen(false); }
    });
  }

  /* ======================================================================
     3. SCROLL REVEAL  (class is added by JS, so no-JS visitors see everything)
     ====================================================================== */
  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) { return; }

    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Measure everything BEFORE touching classes: reading layout after adding
    // .reveal would force a style flush and start every element at opacity 0
    // (which is what makes screenshots and print previews look blank).
    var vh = window.innerHeight || 0;
    var onScreen = [];
    each(targets, function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < vh && box.bottom > 0) { onScreen.push(el); }
    });

    each(targets, function (el) { el.classList.add("reveal"); });

    if (still || !("IntersectionObserver" in window)) {
      each(targets, function (el) { el.classList.add("is-in"); });
      return;
    }

    // already-visible content appears immediately, with no fade
    each(onScreen, function (el) { el.classList.add("is-in"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    each(targets, function (el) {
      if (!el.classList.contains("is-in")) { io.observe(el); }
    });

    // safety net: anything on screen that the observer has not reported yet
    function sweep() {
      each(targets, function (el) {
        if (el.classList.contains("is-in")) { return; }
        var box = el.getBoundingClientRect();
        if (box.top < (window.innerHeight || 0) && box.bottom > 0) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }

    window.addEventListener("load", sweep);
    window.setTimeout(sweep, 800);

    // never print a page with invisible sections
    window.addEventListener("beforeprint", function () {
      each(targets, function (el) { el.classList.add("is-in"); });
    });
  }

  /* ======================================================================
     4. CONTACT FORM
     ====================================================================== */
  function initForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) { return; }

    var result = document.querySelector("[data-form-result]");
    var resultText = document.querySelector("[data-result-text]");
    var resultBody = document.querySelector("[data-result-body]");
    var mailLink = document.querySelector("[data-result-mail]");
    var copyBtn = document.querySelector("[data-result-copy]");
    var igBtn = document.querySelector("[data-result-ig]");
    var editBtn = document.querySelector("[data-result-edit]");
    var status = document.querySelector("[data-form-status]");
    var submitBtn = form.querySelector("[type=submit]");
    var submitLabel = submitBtn ? submitBtn.getAttribute("data-i18n") : null;
    var lastComposed = "";

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function field(name) { return form.querySelector("[name='" + name + "']"); }

    function showError(name, msgKey) {
      var el = field(name);
      var box = form.querySelector("[data-error-for='" + name + "']");
      var msg = t(document.documentElement.getAttribute("lang"), msgKey);
      if (el) { el.setAttribute("aria-invalid", "true"); }
      if (box) { box.textContent = msg || ""; box.hidden = false; }
    }

    function clearErrors() {
      each(form.querySelectorAll("[aria-invalid]"), function (el) {
        el.removeAttribute("aria-invalid");
      });
      each(form.querySelectorAll("[data-error-for]"), function (el) {
        el.textContent = "";
        el.hidden = true;
      });
    }

    function compose() {
      var lang = document.documentElement.getAttribute("lang") || "en";
      var name = (field("name") || {}).value || "";
      var email = (field("email") || {}).value || "";
      var phone = (field("phone") || {}).value || "";
      var typeEl = field("type");
      var type = typeEl && typeEl.selectedIndex > -1 ? typeEl.options[typeEl.selectedIndex].text : "";
      var message = (field("message") || {}).value || "";

      var subject = (type ? type + " — " : "") + name;
      var lines = ["Name: " + name, "Email: " + email];
      if (phone) { lines.push("Phone: " + phone); }
      if (type) { lines.push("About: " + type); }
      lines.push("", message, "",
        "— sent from keystep.productions (" + lang + ")");

      return { subject: subject, body: lines.join("\n") };
    }

    function mailtoHref(c) {
      return "mailto:" + (CFG.contactEmail || "") +
        "?subject=" + encodeURIComponent(c.subject) +
        "&body=" + encodeURIComponent(c.body);
    }

    function validate() {
      clearErrors();
      var ok = true;
      var nameEl = field("name"), emailEl = field("email"), msgEl = field("message");

      if (!nameEl.value.trim()) { showError("name", "contact.err.name"); ok = false; }
      if (!emailEl.value.trim()) {
        showError("email", "contact.err.email"); ok = false;
      } else if (!EMAIL_RE.test(emailEl.value.trim())) {
        showError("email", "contact.err.emailFormat"); ok = false;
      }
      if (!msgEl.value.trim()) { showError("message", "contact.err.message"); ok = false; }

      if (!ok) {
        var firstBad = form.querySelector("[aria-invalid]");
        if (firstBad) { firstBad.focus(); }
      }
      return ok;
    }

    function refresh() {
      if (result && !result.hidden && resultText && resultText.value) {
        var c = compose();
        resultText.value = c.body;
        lastComposed = c.body;
        if (mailLink) { mailLink.setAttribute("href", mailtoHref(c)); }
      }
    }

    function copyText(text, btn, doneKey) {
      var done = t(document.documentElement.getAttribute("lang"), doneKey) || "Copied";
      var original = btn.textContent;
      function flash() {
        btn.textContent = done;
        window.setTimeout(function () { btn.textContent = original; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash, function () { flash(); });
      } else if (resultText) {
        resultText.select();
        try { document.execCommand("copy"); } catch (e) {}
        flash();
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) { return; }

      var c = compose();
      lastComposed = c.body;

      // Optional real backend (Formspree, Basin, ...). Blank = manual flow.
      if (CFG.formEndpoint) {
        if (submitBtn) { submitBtn.disabled = true; }
        fetch(CFG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: field("name").value,
            email: field("email").value,
            phone: field("phone") ? field("phone").value : "",
            project: (field("type") || {}).value || "",
            message: field("message").value
          })
        }).then(function (r) {
          if (!r.ok) { throw new Error("bad status " + r.status); }
          form.hidden = true;
          if (result) { result.hidden = false; }
          if (resultText) { resultText.hidden = true; }
          if (resultBody) {
            resultBody.setAttribute("data-i18n", "contact.sent.body");
            resultBody.textContent = t(document.documentElement.getAttribute("lang"), "contact.sent.body") || "";
          }
          var h = result ? result.querySelector("h3") : null;
          if (h) {
            h.setAttribute("data-i18n", "contact.sent.title");
            h.textContent = t(document.documentElement.getAttribute("lang"), "contact.sent.title") || "";
          }
          if (result) { result.scrollIntoView({ behavior: "smooth", block: "center" }); }
        }).catch(function () {
          if (submitBtn) { submitBtn.disabled = false; }
          if (status) {
            status.textContent = t(document.documentElement.getAttribute("lang"), "contact.err.send") || "";
            status.hidden = false;
          }
        });
        return;
      }

      // No backend yet: hand the visitor a ready-made message to send.
      if (resultText) { resultText.value = c.body; resultText.hidden = false; }
      if (resultBody) {
        resultBody.setAttribute("data-i18n", "contact.result.body");
        resultBody.textContent = t(document.documentElement.getAttribute("lang"), "contact.result.body") || "";
      }
      var h2 = result ? result.querySelector("h3") : null;
      if (h2) {
        h2.setAttribute("data-i18n", "contact.result.title");
        h2.textContent = t(document.documentElement.getAttribute("lang"), "contact.result.title") || "";
      }
      if (mailLink) { mailLink.setAttribute("href", mailtoHref(c)); }
      if (result) {
        result.hidden = false;
        result.setAttribute("tabindex", "-1");
        try { result.focus({ preventScroll: true }); } catch (e) { result.focus(); }
        result.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyText(lastComposed, copyBtn, "contact.result.copied");
      });
    }

    if (igBtn) {
      igBtn.addEventListener("click", function () {
        copyText(lastComposed, igBtn, "contact.result.copied");
        window.open(CFG.instagram || "#", "_blank", "noopener");
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        if (result) { result.hidden = true; }
        var first = field("name");
        if (first) { first.focus(); }
      });
    }

    // live-clear an error as soon as the visitor fixes it
    each(form.querySelectorAll("input, textarea, select"), function (el) {
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true") {
          el.removeAttribute("aria-invalid");
          var box = form.querySelector("[data-error-for='" + el.getAttribute("name") + "']");
          if (box) { box.hidden = true; }
        }
      });
    });

    if (submitLabel && submitBtn) { submitBtn.setAttribute("data-i18n", submitLabel); }
    window.KSP_FORM = { refresh: refresh };
  }

  /* ======================================================================
     5. CONFIG INJECTION  (email / instagram links in one place)
     ====================================================================== */
  function initConfig() {
    each(document.querySelectorAll("[data-ig]"), function (el) {
      el.setAttribute("href", CFG.instagram || "#");
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });

    each(document.querySelectorAll("[data-ig-handle]"), function (el) {
      el.textContent = CFG.instagramHandle || "";
    });

    each(document.querySelectorAll("[data-email]"), function (el) {
      var addr = CFG.contactEmail || "";
      el.setAttribute("href", "mailto:" + addr);
      if (el.hasAttribute("data-email-text")) { el.textContent = addr; }
    });

    each(document.querySelectorAll("[data-email-text]"), function (el) {
      el.textContent = CFG.contactEmail || "";
    });

    // extra publishing channels (YouTube, TikTok, ...) — hidden until a URL is
    // filled in at the top of site-config.js
    each(document.querySelectorAll("[data-channel]"), function (el) {
      var url = CFG[el.getAttribute("data-channel")] || "";
      var link = el.querySelector("[data-channel-link]") || el;
      if (url) {
        link.setAttribute("href", url);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    // only show the "domain coming soon" note until the mailbox is live
    each(document.querySelectorAll("[data-pending]"), function (el) {
      el.hidden = !!CFG.contactEmailReady;
    });
  }

  /* ======================================================================
     helpers + boot
     ====================================================================== */
  function each(list, fn) {
    for (var i = 0; i < list.length; i++) { fn(list[i], i); }
  }

  function boot() {
    initConfig();
    initLangSwitch();
    initNav();
    initReveal();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
