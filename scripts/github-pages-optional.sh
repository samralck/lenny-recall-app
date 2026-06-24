#!/usr/bin/env bash
set -euo pipefail

echo "This optional script assumes you already installed and signed in to GitHub CLI."
echo "For novice setup, use the browser instructions in SETUP_GUIDE.md instead."

REPO_NAME="lenny-recall-app"

git init
git add .
git commit -m "Initial Lenny Recall app"
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
gh repo edit --enable-pages

echo "Now open your repository Settings > Pages and confirm it is publishing from main/root."
