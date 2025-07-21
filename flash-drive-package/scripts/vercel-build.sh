#!/bin/bash

# Clear any existing dist directory
rm -rf dist

# Build the project
npm run build

# Ensure proper file permissions
chmod -R 755 dist

echo "Build completed successfully!" 