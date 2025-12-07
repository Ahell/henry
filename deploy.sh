#!/bin/bash

# Henry Course Planner - Deployment Script

set -e

echo "🚀 Starting deployment process..."

# 1. Clean previous builds
echo "📦 Cleaning previous builds..."
npm run clean

# 2. Install dependencies
echo "📥 Installing dependencies..."
npm install

# 3. Build frontend
echo "🏗️  Building frontend..."
npm run build

# 4. Copy server files to dist
echo "📂 Preparing server files..."
mkdir -p dist/server
cp -r server/*.js dist/server/
cp server/package.json dist/server/
cp -r server/node_modules dist/server/ 2>/dev/null || true

# 5. Create production environment file
echo "⚙️  Creating production config..."
cat > dist/.env <<EOF
NODE_ENV=production
PORT=3001
EOF

echo "✅ Deployment build complete!"
echo ""
echo "📁 Deployment files are in: ./dist"
echo ""
echo "To deploy:"
echo "  1. Upload ./dist folder to your server"
echo "  2. Run: cd dist/server && npm install --production"
echo "  3. Run: node server.js"
echo ""
echo "Or use a process manager like PM2:"
echo "  pm2 start dist/server/server.js --name henry-api"
