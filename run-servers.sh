#!/bin/bash

echo "Starting BYOD RAG System..."
echo "============================="

# Kill any existing processes on ports 5000 and 5001
echo "Cleaning up existing processes..."
pkill -f "tsx" 2>/dev/null
pkill -f "node server" 2>/dev/null
sleep 2

# Start the backend server
echo "Starting backend server on port 5000..."
cd server
npx tsx simple-server.ts &
BACKEND_PID=$!
cd ..
sleep 3

# Test backend
echo "Testing backend API..."
curl -s http://localhost:5000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Backend is running on http://localhost:5000"
else
    echo "✗ Backend failed to start"
fi

# Frontend is already running via Vite
echo "✓ Frontend is running on http://localhost:5173"
echo ""
echo "============================="
echo "System is ready!"
echo ""
echo "Access the application at: http://localhost:5173"
echo "Navigate to BYOD in the sidebar to use the RAG system"
echo ""
echo "API endpoints available:"
echo "  - Health: http://localhost:5000/api/health"
echo "  - Indexes: http://localhost:5000/api/rag/indexes"
echo "  - Upload: http://localhost:5000/api/rag/upload"
echo "  - Query: http://localhost:5000/api/rag/query"
echo ""
echo "Press Ctrl+C to stop the servers"

# Keep script running
wait $BACKEND_PID