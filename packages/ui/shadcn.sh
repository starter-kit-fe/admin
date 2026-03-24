#!/usr/bin/env bash
# Usage: pnpm shadcn [shadcn-cli-args...]
# Example: pnpm shadcn add button
#          pnpm shadcn add button --overwrite
#          pnpm shadcn add accordion alert badge --overwrite
#
# Runs shadcn CLI then rewrites @/ alias imports to relative paths.
# Reason: packages/ui is compiled by apps/web's Next.js, which maps @/ to
# apps/web/src/ — causing @/components/button to resolve incorrectly.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPONENTS_DIR="$SCRIPT_DIR/src/components"
HOOKS_DIR="$SCRIPT_DIR/src/hooks"

echo "▶ Running: pnpm dlx shadcn@latest $*"
pnpm dlx shadcn@latest "$@"

echo "▶ Fixing @/ alias imports..."

fix_imports() {
  local file="$1"

  # Double quotes: @/lib/utils  @/components/X  @/hooks/X
  sed -i '' \
    's|from "@/lib/utils"|from "../lib/utils"|g;
     s|from "@/components/\([^"]*\)"|from "./\1"|g;
     s|from "@/hooks/\([^"]*\)"|from "../hooks/\1"|g' \
    "$file"

  # Single quotes: @/lib/utils  @/components/X  @/hooks/X
  sed -i '' \
    "s|from '@/lib/utils'|from '../lib/utils'|g;
     s|from '@/components/\([^']*\)'|from './\1'|g;
     s|from '@/hooks/\([^']*\)'|from '../hooks/\1'|g" \
    "$file"
}

# Fix components
find "$COMPONENTS_DIR" -maxdepth 1 \( -name "*.tsx" -o -name "*.ts" \) | while read -r f; do
  fix_imports "$f"
done

# Fix hooks (in case any hook imports another hook or utils)
find "$HOOKS_DIR" -maxdepth 1 \( -name "*.tsx" -o -name "*.ts" \) | while read -r f; do
  fix_imports "$f"
done

echo "✓ Done"
