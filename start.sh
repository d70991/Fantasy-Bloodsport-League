#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Fantasy League Servers...${NC}\n"

# Kill any existing servers on ports 3001 and 8000
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start backend server
echo -e "${BLUE}Starting Backend Server (Port 3001)...${NC}"
cd server
npm install > /dev/null 2>&1
node index.js &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Give backend time to start
sleep 2

# Start frontend server
echo -e "${BLUE}Starting Frontend Server (Port 8000)...${NC}"
cd ..
python3 -m http.server 8000 > /dev/null 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Both servers are running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   Frontend:  ${BLUE}http://localhost:8000${NC}"
echo -e "   Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "   Health:    ${BLUE}http://localhost:3001/health${NC}\n"

echo -e "${BLUE}📋 Pages:${NC}"
echo -e "   Home:      ${BLUE}http://localhost:8000/index.html${NC}"
echo -e "   Teams:     ${BLUE}http://localhost:8000/pages/teams.html${NC}"
echo -e "   Matchups:  ${BLUE}http://localhost:8000/pages/matchups.html${NC}\n"

echo -e "${BLUE}🛑 To stop servers, press Ctrl+C${NC}"
echo -e "${BLUE}   Or run: kill $BACKEND_PID $FRONTEND_PID${NC}\n"

# Wait for Ctrl+C
wait
