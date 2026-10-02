#!/bin/bash
# NexaLink Local Security & Quality Audit Runner
# Idempotent, safe, strictly read-only on product code.

set -e

echo "=== Running NexaLink Audit Suite ==="
node audit/scripts/run-static-checks.mjs

echo ""
echo "=== Audit complete. Status of working directory: ==="
git status --short
