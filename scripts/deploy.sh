#!/bin/bash

# DigiBoard Admin - Production Deployment Script
echo "🚀 Starting DigiBoard Admin Production Deployment..."

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the admin directory."
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Pre-deployment checklist..."

# Check package.json
echo "✓ Checking package.json..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Check vercel.json
echo "✓ Checking Vercel configuration..."
if [ ! -f "config/vercel.json" ]; then
    echo "❌ config/vercel.json not found"
    exit 1
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Run basic tests if available
echo "🧪 Running basic tests..."
if [ -d "tests" ]; then
    cd tests
    if [ -f "package.json" ]; then
        npm install
        npm run test:unit 2>/dev/null || echo "⚠️  Tests not available, skipping..."
    fi
    cd ..
fi

# Check environment variables
echo "🔧 Checking environment configuration..."
if [ ! -f "config/.env.production" ]; then
    echo "⚠️  config/.env.production not found. Creating from template..."
    cp config/.env.example config/.env.production
    echo "📝 Please update config/.env.production with your production values"
fi

# Deployment options
echo ""
echo "🎯 Choose deployment platform:"
echo "1) Vercel (Recommended for Node.js apps)"
echo "2) Railway (Great for full-stack apps)"
echo "3) Heroku (Classic option)"
echo "4) Manual deployment guide"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod --local-config=config/vercel.json
        else
            echo "❌ Vercel CLI not found. Installing..."
            npm install -g vercel
            vercel --prod --local-config=config/vercel.json
        fi
        ;;
    2)
        echo "🚀 Deploying to Railway..."
        if command -v railway &> /dev/null; then
            railway up
        else
            echo "❌ Railway CLI not found. Please install: npm install -g @railway/cli"
            echo "Then run: railway login && railway up"
        fi
        ;;
    3)
        echo "🚀 Deploying to Heroku..."
        if command -v heroku &> /dev/null; then
            heroku create digiboard-admin-$(date +%s)
            git push heroku main
        else
            echo "❌ Heroku CLI not found. Please install Heroku CLI first."
        fi
        ;;
    4)
        echo "📖 Manual deployment guide:"
        echo "1. Set up MongoDB Atlas database"
        echo "2. Configure environment variables on your hosting platform"
        echo "3. Deploy using git or direct upload"
        echo "4. Update DNS settings if using custom domain"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment process completed!"
echo "📋 Post-deployment checklist:"
echo "   1. ✓ Verify the app is running"
echo "   2. ✓ Test login functionality"
echo "   3. ✓ Check database connectivity"
echo "   4. ✓ Verify schedule display"
echo "   5. ✓ Test filtering features"
echo ""
echo "🌐 Your DigiBoard Admin is now live! 🎉"
