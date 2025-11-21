#!/bin/bash

# Planit Frontend - Quick Start Script

echo "================================"
echo "  Planit Frontend Setup"
echo "================================"
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node_version=$(node --version)
echo "  Node version: $node_version"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
cd "$(dirname "$0")/client" || exit 1
npm install
echo ""

# Show next steps
echo "================================"
echo "  Setup Complete! 🎉"
echo "================================"
echo ""
echo "📋 To start development:"
echo "   cd client"
echo "   npm run dev"
echo ""
echo "🌐 Frontend will run on:"
echo "   http://localhost:5173"
echo ""
echo "⚠️  Make sure backend is also running:"
echo "   cd server"
echo "   npm run dev"
echo "   Backend should run on http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   - FRONTEND_GUIDE.md - Development guide"
echo "   - FRONTEND_UI.md - UI documentation"
echo "   - FRONTEND_IMPLEMENTATION.md - Implementation details"
echo ""
echo "================================"
