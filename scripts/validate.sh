#!/bin/bash

set -eu
set -o pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR=""


cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -r "$TEMP_DIR"
    fi
}


fail() {
    echo
    echo "FAIL — $1" >&2
    exit 1
}


step() {
    echo
    echo "==> $1"
}


require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        fail "outil requis absent : $1"
    fi
}


snapshot_protected_files() {
    output_file="$1"

    (
        cd "$PROJECT_DIR"
        find data assets/images -type f -print0 \
            | sort -z \
            | xargs -0 shasum -a 256
    ) > "$output_file"
}


trap cleanup EXIT HUP INT TERM

cd "$PROJECT_DIR"

echo "======================================"
echo "  Certification locale Chest0 Hub"
echo "======================================"

step "Prérequis"
for command_name in python3 deno git bash find sort xargs shasum; do
    require_command "$command_name"
    echo "PASS — $command_name"
done

TEMP_DIR="$(mktemp -d /tmp/chest0hub-validation.XXXXXX)"
snapshot_protected_files "$TEMP_DIR/protected-before.sha256"

step "Syntaxe Python"
python3 -B -c '
import ast
from pathlib import Path

root = Path.cwd()
paths = sorted(
    path for path in root.rglob("*.py")
    if ".git" not in path.parts
    and "backups" not in path.parts
)
for path in paths:
    ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
print(f"PASS — {len(paths)} fichier(s) Python")
'

step "Syntaxe shell"
while IFS= read -r shell_file; do
    bash -n "$shell_file"
    echo "PASS — $shell_file"
done < <(find . -type f -name '*.sh' \
    ! -path './.git/*' ! -path './backups/*' | sort)

step "Tests Python permanents"
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest \
    discover -s tests -p 'test_*.py' -v

step "Tests JavaScript/Deno permanents"
DENO_DIR="$TEMP_DIR/deno" deno test --no-config \
    --allow-read=sw.js,assets/js/data-engine.js \
    tests/test_data_engine.js tests/test_service_worker.js

step "État Git pertinent"
git diff --check
echo "PASS — git diff --check"
echo "Branche : $(git branch --show-current)"
echo "HEAD : $(git rev-parse HEAD)"
git status --branch --short

step "Intégrité des données et médias"
snapshot_protected_files "$TEMP_DIR/protected-after.sha256"
if ! cmp -s \
    "$TEMP_DIR/protected-before.sha256" \
    "$TEMP_DIR/protected-after.sha256"; then
    diff -u \
        "$TEMP_DIR/protected-before.sha256" \
        "$TEMP_DIR/protected-after.sha256" || true
    fail "les données ou médias ont changé pendant la campagne"
fi
echo "PASS — données/ et assets/images/ inchangés"

if find . -type f \( -name '*.pyc' -o -name '*.pyo' \) \
    ! -path './.git/*' | grep -q .; then
    fail "fichier Python compilé indésirable détecté"
fi
echo "PASS — aucun .pyc/.pyo dans le dépôt"

echo
echo "======================================"
echo "PASS — certification locale complète"
echo "Aucun push, commit ou déploiement effectué."
echo "======================================"
