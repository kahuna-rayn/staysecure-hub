#!/bin/bash

# Build script for organisation management module
# This script handles the complete build process including TypeScript declarations

echo "🏗️  Building Organisation Management Module..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Copy UI components that are dependencies
echo "📦 Copying UI components..."
mkdir -p dist/components/ui
cp -r ../../components/ui/* dist/components/ui/ 2>/dev/null || echo "No UI components found to copy"

# Build with Vite
echo "⚡ Building with Vite..."
npm run build

# Generate TypeScript declarations manually if needed
echo "📝 Generating TypeScript declarations..."
npx tsc --declaration --declarationMap --emitDeclarationOnly --outDir dist

echo "✅ Build complete!"
echo "📂 Output directory: dist/"
echo "📋 Files generated:"
ls -la dist/