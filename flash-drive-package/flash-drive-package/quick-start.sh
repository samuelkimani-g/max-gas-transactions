#!/bin/bash

echo "🚀 Gas Cylinder Dashboard - Quick Start"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install all dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your database credentials"
    echo "   Then run this script again"
    exit 1
fi

# Setup database
echo "🗄️  Setting up database..."
npm run db:setup

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Available commands:"
echo "  npm run dev          - Start frontend development server"
echo "  npm run backend:dev  - Start backend development server"
echo "  npm run dev:full     - Start both frontend and backend"
echo "  npm run desktop:dev  - Start desktop app development"
echo ""
echo "🌐 Web App: http://localhost:3000"
echo "🔧 API: http://localhost:5000"
echo ""
echo "📚 For more information, see DEPLOYMENT_GUIDE.md" 