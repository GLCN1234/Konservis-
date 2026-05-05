#!/bin/bash
# ============================================================
# KONSERVIS DIGITAL TWIN — SETUP SCRIPT
# Run this once after unzipping: bash setup.sh
# ============================================================

echo ""
echo "  ██╗  ██╗ ██████╗ ███╗   ██╗███████╗███████╗██████╗ ██╗   ██╗██╗███████╗"
echo "  ██║ ██╔╝██╔═══██╗████╗  ██║██╔════╝██╔════╝██╔══██╗██║   ██║██║██╔════╝"
echo "  █████╔╝ ██║   ██║██╔██╗ ██║███████╗█████╗  ██████╔╝██║   ██║██║███████╗"
echo "  ██╔═██╗ ██║   ██║██║╚██╗██║╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║╚════██║"
echo "  ██║  ██╗╚██████╔╝██║ ╚████║███████║███████╗██║  ██║ ╚████╔╝ ██║███████║"
echo "  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝"
echo ""
echo "  The Operating System for Post-Harvest Processing in Africa"
echo "  Digital Twin v1.0 — Setting up..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+ first:"
  echo "   https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "❌ Node.js 16+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ All done! Starting Konservis Digital Twin..."
echo ""
echo "  → Opening at: http://localhost:3000"
echo ""
npm start
