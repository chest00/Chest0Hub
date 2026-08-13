#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

clear

echo
echo "======================================"
echo "        Chest0 Hub Admin"
echo "======================================"
echo
echo "Interface locale :"
echo "http://127.0.0.1:8090"
echo
echo "IMPORTANT :"
echo "Cette adresse s'ouvre dans Brave,"
echo "pas dans le Terminal."
echo
echo "Pour arrêter :"
echo "Control + C"
echo
echo "======================================"
echo

python3 admin/server.py