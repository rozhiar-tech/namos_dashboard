#!/bin/bash
# Deployment script for Namos Dashboard
# Run this after pulling new code or if you encounter build issues

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Navigate to app directory (adjust if needed)
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning old build..."
rm -rf .next

echo "🔨 Building production bundle..."
NODE_ENV=production npm run build

echo "🛑 Stopping PM2 process..."
pm2 stop namos-dashboard 2>/dev/null || true

echo "▶️  Starting PM2 process..."
pm2 start npm --name "namos-dashboard" -- start

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Deployment complete!"
echo "📝 Check logs with: pm2 logs namos-dashboard"
echo "🌐 Test with: curl http://localhost:3002"

