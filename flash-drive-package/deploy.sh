#!/bin/bash

# Gas Cylinder Dashboard Deployment Script
# This script helps you deploy your application to GitHub and Vercel

set -e  # Exit on any error

echo "🚀 Gas Cylinder Dashboard Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking current directory..."
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_success "All prerequisites are met!"

# Step 1: Initialize Git repository
print_status "Step 1: Setting up Git repository..."

if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    print_warning "No remote origin found. You'll need to add it manually:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/gas-cylinder-dashboard.git"
    echo "Replace YOUR_USERNAME with your actual GitHub username"
    echo ""
    read -p "Press Enter after you've added the remote origin..."
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
npm run install:all
print_success "Dependencies installed"

# Step 3: Build the application
print_status "Step 3: Building the application..."
npm run build
print_success "Application built successfully"

# Step 4: Setup production database
print_status "Step 4: Setting up production database..."
cd backend
node scripts/setup-production.js
cd ..
print_success "Production database setup complete"

# Step 5: Add and commit files
print_status "Step 5: Committing changes..."
git add .
git commit -m "Initial deployment setup"
print_success "Changes committed"

# Step 6: Push to GitHub
print_status "Step 6: Pushing to GitHub..."
if git remote get-url origin &> /dev/null; then
    git push -u origin main
    print_success "Code pushed to GitHub"
else
    print_warning "Skipping push to GitHub (no remote origin configured)"
fi

# Step 7: Deploy to Vercel
print_status "Step 7: Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_status "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "You need to login to Vercel first."
    print_status "Running: vercel login"
    vercel login
fi

print_status "Deploying to Vercel..."
vercel --prod

print_success "Deployment completed!"

# Step 8: Build desktop application
print_status "Step 8: Building desktop application..."
cd electron
npm run dist:win
cd ..
print_success "Desktop application built"

echo ""
echo "🎉 Deployment Summary:"
echo "====================="
echo "✅ Git repository: Ready"
echo "✅ Dependencies: Installed"
echo "✅ Application: Built"
echo "✅ Database: Setup complete"
echo "✅ GitHub: Code pushed"
echo "✅ Vercel: Deployed"
echo "✅ Desktop: Built for Windows"
echo ""
echo "📋 Next Steps:"
echo "1. Access your web app at the Vercel URL provided above"
echo "2. Find your desktop app in: electron/dist/"
echo "3. Test the application with default credentials:"
echo "   - Admin: admin/admin123"
echo "   - Manager: manager/manager123"
echo "   - Operator: operator/operator123"
echo ""
echo "⚠️ IMPORTANT: Change default passwords after first login!"
echo ""
echo "🔧 For future deployments:"
echo "- Push changes: git push origin main"
echo "- Deploy web: vercel --prod"
echo "- Build desktop: cd electron && npm run dist:win"
echo ""
print_success "Deployment script completed successfully!" 