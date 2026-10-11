#!/usr/bin/env bash
# ==========================================================================
#  Key Step Productions — deploy to GitHub Pages
# --------------------------------------------------------------------------
#  usage:  bash _tools/deploy.sh <github-username> [repo-name]
#
#  Creates/uses a git repo in the site folder, commits everything and pushes
#  to GitHub. Then prints exactly what to click and which DNS records to add
#  for https://keystep.productions
#
#  Nothing here is destructive: it never force-pushes and never deletes files.
# ==========================================================================
set -euo pipefail

# never let git hang waiting for a password prompt in a script
export GIT_TERMINAL_PROMPT=0

DOMAIN="keystep.productions"
SITE="https://${DOMAIN}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ $# -lt 1 ]; then
  cat <<USAGE
usage: bash _tools/deploy.sh <github-username> [repo-name]

  <github-username>  your GitHub account name, e.g. keystep-productions-hk
  [repo-name]        repository name (default: keystep.productions)
USAGE
  exit 1
fi

USER="$1"
REPO="${2:-$DOMAIN}"
BRANCH="main"

command -v git >/dev/null 2>&1 || { echo "git is not installed."; exit 1; }

# ---------------------------------------------------------------- 1. repo ---
if [ ! -d .git ]; then
  echo "==> git init"
  git init -q -b "$BRANCH" 2>/dev/null || { git init -q; git checkout -q -b "$BRANCH"; }
fi

# a commit needs an identity; fall back to a GitHub noreply address
if ! git config user.email >/dev/null 2>&1; then
  git config user.name  "$USER"
  git config user.email "${USER}@users.noreply.github.com"
  echo "==> local git identity set to ${USER} <${USER}@users.noreply.github.com>"
fi

# --------------------------------------------------------------- 2. commit ---
git add -A
if git diff --cached --quiet; then
  echo "==> nothing new to commit"
else
  COUNT="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  git commit -q -m "Key Step Productions website — $(date '+%Y-%m-%d %H:%M')"
  echo "==> committed ${COUNT} file(s)"
fi

# -------------------------------------------------------------- 3. remote ----
REMOTE="https://github.com/${USER}/${REPO}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

# ----------------------------------------------------------------- 4. push ---
echo "==> pushing to ${REMOTE}"
if ! git push -u origin "$BRANCH"; then
  cat <<NOPUSH

--------------------------------------------------------------------
Push failed. That is almost always because the repository does not
exist yet, or git asked for credentials it does not have.

  1. Create an empty repo named "${REPO}" at https://github.com/new
     (public; do NOT add a README, .gitignore or licence)
  2. Re-run:  bash _tools/deploy.sh ${USER} ${REPO}
     (if git asks for a password, use a Personal Access Token from
      https://github.com/settings/tokens — "repo" scope — not your
      account password)
--------------------------------------------------------------------
NOPUSH
  exit 1
fi

# ---------------------------------------------------------------- 5. next ----
cat <<NEXT

============================================================
 Pushed. Now finish the switch-over (about 10 minutes):

 1. In the repo: Settings -> Pages
      Source .................. Deploy from a branch
      Branch .................. ${BRANCH}   / (root)
      Custom domain ........... ${DOMAIN}
      (do this BEFORE the DNS step below — GitHub asks to verify
       the domain first, which blocks domain takeovers)

 2. DNS records at your registrar (delete any default A/CNAME first):

      Type   Name   Value
      A      @      185.199.108.153
      A      @      185.199.109.153
      A      @      185.199.110.153
      A      @      185.199.111.153
      AAAA   @      2606:50c0:8000::153
      AAAA   @      2606:50c0:8001::153
      AAAA   @      2606:50c0:8002::153
      AAAA   @      2606:50c0:8003::153
      CNAME  www    ${USER}.github.io

    Do NOT add a wildcard (*) record.

 3. Wait for DNS (minutes to a few hours), then check:
      dig ${DOMAIN} +noall +answer -t A
      dig www.${DOMAIN} +nostats +nocomments +nocmd

 4. Back in Settings -> Pages: tick "Enforce HTTPS" once it becomes
    available (can take up to 24 hours after DNS is correct).

 5. Then open ${SITE} and confirm the padlock.
============================================================
NEXT
