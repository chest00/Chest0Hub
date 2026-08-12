#!/bin/bash

set -e


PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

PORT=8080


cd "$PROJECT_DIR"


echo ""
echo "======================================"
echo "          Chest0 Hub"
echo "======================================"
echo ""
echo "Serveur local :"
echo "http://localhost:${PORT}"
echo ""
echo "Pour arrêter le serveur :"
echo "Control + C"
echo ""
echo "======================================"
echo ""


python3 -m http.server "$PORT"