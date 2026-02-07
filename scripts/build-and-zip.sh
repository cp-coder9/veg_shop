#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_NAME="${1:-veg_shop_dist.zip}"

cd "$ROOT_DIR"

npm run build

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/frontend-dist" "$TMP_DIR/backend-dist"

if [ -d "frontend/dist" ]; then
  cp -R "frontend/dist/." "$TMP_DIR/frontend-dist"
else
  echo "frontend/dist not found. Did the frontend build succeed?" >&2
  exit 1
fi

if [ -d "backend/dist" ]; then
  cp -R "backend/dist/." "$TMP_DIR/backend-dist"
else
  echo "backend/dist not found. Did the backend build succeed?" >&2
  exit 1
fi

(
  cd "$TMP_DIR"
  zip -r "$ROOT_DIR/$ZIP_NAME" frontend-dist backend-dist >/dev/null
)

echo "Created $ZIP_NAME"
