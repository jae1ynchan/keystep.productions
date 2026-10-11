/* ==========================================================================
   Key Step Productions — SITE SETTINGS
   --------------------------------------------------------------------------
   >>> THIS IS THE ONLY FILE YOU NEED TO EDIT TO GO LIVE. <<<

   1. contactEmail  — put your real address here once the domain is ready,
                      then set contactEmailReady to true.
   2. instagram     — already correct.
   3. youtube/tiktok — optional extra publishing channels. Paste a URL and the
                      link appears in every footer; leave "" to keep it hidden.
   4. formEndpoint  — optional. Leave "" to use the "compose your own message"
                      flow (no server needed). Paste a Formspree / Basin / Zapier
                      URL here and the form will POST to it instead.
   ========================================================================== */
window.KSP_CONFIG = {

  /* --- email ------------------------------------------------------------ */
  contactEmail: "hello@keystep.productions",
  // false => the site shows "mailbox still being set up" and pushes Instagram
  // DMs first. Set to true once hello@keystep.productions actually receives mail.
  contactEmailReady: false,

  /* --- social ----------------------------------------------------------- */
  instagram: "https://www.instagram.com/keystepproductions/",
  instagramHandle: "@keystepproductions",

  /* --- other publishing channels (optional) ----------------------------- */
  // Paste a channel URL and its link appears in every footer automatically.
  // Leave "" and the link stays hidden — no other file needs editing.
  youtube: "",
  tiktok: "",

  /* --- optional form backend ------------------------------------------- */
  formEndpoint: "",

  /* --- company ---------------------------------------------------------- */
  domain: "keystep.productions",
  siteUrl: "https://keystep.productions",
  foundedYear: 2026,
  location: "Hong Kong"

};
