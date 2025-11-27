#!/bin/bash

# Planit - Full Stack Quick Start
# This script starts both backend and frontend servers

echo "================================"
echo "  Planit Full Stack Startup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "✓ Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "${RED}✗ npm not found. Please install npm.${NC}"
    exit 1
fi

echo "✓ Node $(node --version) and npm $(npm --version) found"
echo ""

# Get root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

echo "================================"
echo "  Installing Dependencies"
echo "================================"
echo ""

# Install backend dependencies
echo "📦 Backend dependencies..."
cd "$ROOT_DIR/server" || exit 1
npm install --silent
if [ $? -ne 0 ]; then
    echo "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi
echo "✓ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Frontend dependencies..."
cd "$ROOT_DIR/client" || exit 1
npm install --silent
if [ $? -ne 0 ]; then
    echo "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

echo "================================"
echo "  Starting Servers"
echo "================================"
echo ""

# Start backend
echo "${YELLOW}🚀 Starting backend on port 5000...${NC}"
cd "$ROOT_DIR/server" || exit 1
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "${YELLOW}🚀 Starting frontend on port 5173...${NC}"
cd "$ROOT_DIR/client" || exit 1
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "================================"
echo "${GREEN}✓ Servers Running!${NC}"
echo "================================"
echo ""
echo "📱 Frontend:"
echo "   ${GREEN}http://localhost:5173${NC}"
echo ""
echo "🔌 Backend API:"
echo "   ${GREEN}http://localhost:5000/api${NC}"
echo ""
echo "📚 Documentation:"
echo "   - FRONTEND_GUIDE.md"
echo "   - FRONTEND_UI.md"
echo "   - CONTRIBUTING.md"
echo ""
echo "${YELLOW}Logs:${NC}"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
