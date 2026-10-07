#!/usr/bin/env bash
# Downloads the official HULOL TECH logo from the existing site, unmodified.
# Run once on your machine, from the repo root:  bash assets/logo/fetch-logo.sh
set -euo pipefail
mkdir -p public/icons
curl -fsSL "https://hulol-tech.vercel.app/icons/nav-logo.png" -o public/icons/nav-logo.png
echo "Saved public/icons/nav-logo.png"
file public/icons/nav-logo.png || true
