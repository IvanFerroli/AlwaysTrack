#!/usr/bin/env bash
# Sync canonical Olympus agent definitions into ~/.zcode/agents as REGULAR FILES.
#
# Why copies and not symlinks: ZCode's agent registry does not register
# symlinked agent files. Proven 2026-09-03 (fresh session sess_5eeb92f2):
# olympus-probe.md (regular file) registered; all 12 olympus-* symlinks were
# absent from the registry ("Agent type '…' not found") while their canonical
# frontmatter linted clean. See docs/operations/zcode-olympus-bridge.md §2/§7.
#
# Idempotent and drift-free: every run re-copies from the canonical sources in
# this repository and verifies byte-identical content.
#
# Note: the registry is snapshotted at session creation, so a (re)sync only
# takes effect in a NEW ZCode session.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO/.claude/agents"
DEST="${ZCODE_AGENTS_DIR:-$HOME/.zcode/agents}"

mkdir -p "$DEST"

count=0
for src in "$SRC"/olympus-*.md; do
  name="$(basename "$src")"
  stem="${name%.md}"
  dst="$DEST/$name"

  # Fail closed if the canonical file's frontmatter name diverges from its filename.
  declared="$(sed -n '2,/^---$/p' "$src" | sed -n 's/^name:[[:space:]]*//p' | head -1 | tr -d '[:space:]')"
  if [ "$declared" != "$stem" ]; then
    echo "FAIL: $src declares name '$declared' but filename is '$stem'" >&2
    exit 1
  fi

  # Replace whatever sits at the destination (symlink or stale copy) with a
  # fresh regular-file copy. rm only ever touches $dst, never $src.
  if [ -d "$dst" ]; then
    echo "FAIL: $dst is a directory; refusing to overwrite" >&2
    exit 1
  fi
  rm -f -- "$dst"
  cp -- "$src" "$dst"
  chmod 644 "$dst"

  if [ -L "$dst" ] || [ ! -f "$dst" ]; then
    echo "FAIL: $dst is not a regular file" >&2
    exit 1
  fi
  cmp -s -- "$src" "$dst" || { echo "FAIL: $dst differs from $src" >&2; exit 1; }

  count=$((count + 1))
done

echo "Synced $count Olympus agent definitions (regular files) into $DEST"
echo "Takes effect in the NEXT fresh ZCode session (registry is snapshotted at session creation)."
