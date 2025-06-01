#!/bin/bash

# Create a temporary directory for GitHub upload
mkdir -p github-upload

# Copy all necessary files and directories
cp package.json package-lock.json tsconfig.json vite.config.ts github-upload/
cp tailwind.config.ts drizzle.config.ts components.json postcss.config.js github-upload/
cp .gitignore README.md DEPLOYMENT_GUIDE.md github-upload/

# Copy entire directories
cp -r client/ github-upload/
cp -r server/ github-upload/
cp -r shared/ github-upload/
cp -r attached_assets/ github-upload/

echo "Files prepared in 'github-upload' directory"
echo "Upload everything from the 'github-upload' folder to your GitHub repository"